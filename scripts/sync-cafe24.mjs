#!/usr/bin/env node
// 바이블줌 ↔ 크리스챤하우스(카페24) 가격·품절 동기화
//
// 카페24 관리자 API 없이, 누구나 볼 수 있는 상품 페이지를 읽어서 만든다.
//   - 가격(판매가·소비자가), 품절 여부, 장바구니용 item_code, ISBN
//   - 같은 ISBN으로 새로 등록된(가격이 오른) 상품이 있으면 그쪽으로 따라간다
//
// 사용법
//   node scripts/sync-cafe24.mjs --out <폴더>            status.json 등 생성
//   node scripts/sync-cafe24.mjs --out <폴더> --write-base  bibleData.js 에도 반영(ISBN·가격·item_code)
//
// 결과물 (<폴더> 안)
//   status.json      앱이 읽는 파일. 상품번호별 현재 상태
//   missing.json     쇼핑몰 성경 카테고리에는 있는데 바이블줌에는 없는 상품
//   isbn-cache.json  바이블줌에 없는 상품의 ISBN 캐시(매번 다시 읽지 않으려고)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHOP = 'https://chhouse.kr';
const BIBLE_ROOT_CATE = 44; // 쇼핑몰 「성경」 최상위 카테고리
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const CONCURRENCY = 5;

const args = process.argv.slice(2);
const outDir = path.resolve(args.includes('--out') ? args[args.indexOf('--out') + 1] : path.join(ROOT, 'sync-out'));
const writeBase = args.includes('--write-base');

const num = (s) => (s == null ? null : parseInt(String(s).replace(/[^\d]/g, ''), 10) || null);
const readJson = (f, fallback) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return fallback; } };

export const productNoOf = (url) => {
  const q = url.match(/[?&]product_no=(\d+)/);
  if (q) return q[1];
  const s = url.match(/\/product\/[^/]+\/(\d+)\/(?:category|display)\//);
  return s ? s[1] : null;
};

async function get(url, tries = 3) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'ko-KR,ko;q=0.9' } });
      if (res.status === 404) return { status: 404, html: '' };
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { status: res.status, html: await res.text() };
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
    }
  }
  throw lastErr;
}

async function pool(items, worker) {
  let i = 0;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (i < items.length) await worker(items[i++]);
  }));
}

// 상품 상세 페이지 한 장 → 필요한 값만
async function fetchProduct(no) {
  const { status, html } = await get(`${SHOP}/product/detail.html?product_no=${no}`);
  if (status === 404) return { gone: true };
  const g = (re) => { const m = html.match(re); return m ? m[1] : null; };
  const price = num(g(/product_price = '(\d+)'/));
  if (!price) throw new Error('가격을 읽지 못함'); // 페이지 구조가 바뀐 경우: 숨기지 말고 실패로 처리
  const info = {};
  const tb = html.match(/도서명<\/td>[\s\S]{0,3000}?<\/table>/);
  if (tb) {
    const cells = ['도서명', ...[...tb[0].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1].replace(/<[^>]+>/g, '').trim())];
    for (let i = 0; i + 1 < cells.length; i += 2) info[cells[i]] = cells[i + 1];
  }
  const isbn = (g(/ISBN<\/td><td[^>]*>\s*([0-9Xx\- ]+)/) || '').replace(/[^0-9Xx]/g, '') || null;
  const retail = num(g(/id="span_product_price_custom"[^>]*>(?:<[^>]+>)*([\d,]+)/));
  return {
    isbn,
    price,
    retail: retail && retail >= price ? retail : price,
    sold: g(/is_soldout_icon = '([^']+)'/) === 'T' || /schema\.org\/(OutOfStock|SoldOut|Discontinued)/.test(html),
    itemCode: g(/item_code = '([^']+)'/),
    title: g(/og:title" content="([^"]*)/),
    img: g(/og:image" content="([^"]*)/),
    size: info['크기'] || null,
    pages: info['쪽수'] || null,
    publisher: info['저자/출판사'] || null,
  };
}

// 성경 카테고리 목록(품절은 목록에 안 나옴) → 판매 중인 상품번호 전체
async function fetchListing() {
  const cats = JSON.parse((await get(`${SHOP}/exec/front/Product/SubCategory`)).html);
  const by = Object.fromEntries(cats.map((c) => [c.cate_no, c]));
  const under = (c) => { for (let x = c; x; x = by[x.parent_cate_no]) if (x.cate_no === BIBLE_ROOT_CATE) return true; return false; };
  const pathOf = (c) => { const p = []; for (let x = c; x && x.cate_no !== BIBLE_ROOT_CATE; x = by[x.parent_cate_no]) p.unshift(x.name); return p.join(' > '); };
  const targets = cats.filter(under);
  const listed = {}; // no -> [카테고리 경로]
  let rootTotal = 0;
  await pool(targets, async (c) => {
    const got = new Set();
    for (let p = 1; p <= 200; p++) {
      const { html } = await get(`${SHOP}/product/list.html?cate_no=${c.cate_no}&page=${p}`);
      const total = num((html.match(/prdCount">[^<]*<strong>([\d,]+)/) || [])[1]) || 0;
      if (c.cate_no === BIBLE_ROOT_CATE) rootTotal = total;
      const before = got.size;
      for (const m of html.matchAll(/\/product\/[^"'\s]*?\/(\d+)\/category\/(\d+)\//g)) if (+m[2] === c.cate_no) got.add(m[1]);
      if (got.size === before || got.size >= total) break;
    }
    const label = pathOf(c);
    for (const no of got) {
      listed[no] = listed[no] || [];
      if (label) listed[no].push(label);
    }
  });
  // 가장 구체적인(깊은) 경로를 앞에
  for (const no in listed) listed[no].sort((a, b) => b.split(' > ').length - a.split(' > ').length);
  return { listed, rootTotal };
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const prev = readJson(path.join(outDir, 'status.json'), { products: {} });
  const isbnCache = readJson(path.join(outDir, 'isbn-cache.json'), {});

  const baseFile = path.join(ROOT, 'src/data/bibleData.js');
  const { bibleData } = await import(pathToFileURL(baseFile).href);
  const variants = [];
  for (const pub in bibleData) for (const item of bibleData[pub].items) for (const v of item.variants || []) {
    variants.push({ pub, pubName: bibleData[pub].name, item, v, no: productNoOf(v.url) });
  }
  const bzNos = [...new Set(variants.map((x) => x.no).filter(Boolean))];

  // 1) 바이블줌에 있는 상품: 매번 새로 읽는다
  const products = {};
  const failed = [];
  await pool(bzNos, async (no) => {
    try { products[no] = await fetchProduct(no); }
    catch (e) {
      failed.push(no);
      if (prev.products[no]) products[no] = prev.products[no]; // 일시적 오류면 직전 값 유지
    }
  });
  if (failed.length > bzNos.length * 0.1) {
    throw new Error(`상품 ${bzNos.length}개 중 ${failed.length}개를 읽지 못했습니다. 쇼핑몰 장애나 페이지 구조 변경일 수 있어 반영하지 않습니다.`);
  }

  // 2) 쇼핑몰 성경 카테고리 전체
  const { listed, rootTotal } = await fetchListing();
  const listedNos = Object.keys(listed);
  console.log(`성경 카테고리 목록: ${listedNos.length}개 읽음 (사이트 표시 전체 ${rootTotal})`);
  if (listedNos.length < 100 || (rootTotal && listedNos.length < rootTotal * 0.97)) {
    throw new Error(`성경 카테고리 목록을 ${listedNos.length}개만 읽었습니다(전체 ${rootTotal}). 반영하지 않습니다.`);
  }

  // 3) 바이블줌에 없는 상품: ISBN만 알면 되므로 캐시
  const bzSet = new Set(bzNos);
  const others = listedNos.filter((no) => !bzSet.has(no));
  const otherErrors = [];
  const todoOthers = others.filter((no) => !isbnCache[no]);
  await pool(todoOthers, async (no) => {
    try {
      const p = await fetchProduct(no);
      if (!p.gone) isbnCache[no] = { isbn: p.isbn, title: p.title, price: p.price, retail: p.retail, size: p.size, pages: p.pages, publisher: p.publisher };
    } catch (e) { otherErrors.push(`${no}: ${e.message}`); } // 다음 실행에서 다시 시도
  });
  if (otherErrors.length) console.log(`- 바이블줌에 없는 상품 ${todoOthers.length}개 중 ${otherErrors.length}개 읽기 실패 (예: ${otherErrors.slice(0, 3).join(' / ')})`);
  if (todoOthers.length > 20 && otherErrors.length > todoOthers.length * 0.3) {
    throw new Error(`바이블줌에 없는 상품 ${todoOthers.length}개 중 ${otherErrors.length}개를 읽지 못해 ISBN 연결을 믿을 수 없습니다. 반영하지 않습니다.`);
  }
  for (const no of Object.keys(isbnCache)) if (!listed[no]) delete isbnCache[no]; // 목록에서 사라진 상품은 캐시에서도 제거

  // 4) ISBN 추적: 같은 ISBN의 다른 판매 중 상품이 있고
  //    (a) 지금 상품이 품절·삭제됐거나 (b) 그쪽 가격이 더 높으면(인상) 그쪽으로 옮긴다
  const byIsbn = {};
  for (const no of others) { const c = isbnCache[no]; if (c?.isbn) (byIsbn[c.isbn] = byIsbn[c.isbn] || []).push(no); }
  const moves = [];
  for (const no of bzNos) {
    const cur = products[no];
    if (!cur) continue;
    delete cur.moved;
    const isbn = cur.isbn || prev.products[no]?.isbn; // 삭제된 상품은 직전에 알던 ISBN으로
    if (cur.gone && isbn) cur.isbn = isbn;
    const candidates = isbn ? byIsbn[isbn] || [] : [];
    if (!candidates.length) continue;
    const unavailable = cur.gone || cur.sold;
    let best = null;
    for (const cno of candidates.sort((a, b) => b - a)) { // 최근 등록 우선
      let fresh;
      try { fresh = await fetchProduct(cno); } catch { continue; }
      if (fresh.gone || fresh.sold || fresh.isbn !== isbn) continue;
      if (unavailable || fresh.price > cur.price) { best = { no: cno, ...fresh }; break; }
    }
    if (best) {
      cur.moved = { no: best.no, url: `${SHOP}/product/detail.html?product_no=${best.no}`, img: best.img, price: best.price, retail: best.retail, itemCode: best.itemCode, title: best.title };
      moves.push({ from: no, to: best.no, isbn, oldPrice: cur.price || null, newPrice: best.price, reason: unavailable ? '기존 상품 품절·삭제' : '가격 인상' });
    }
  }

  // 5) 저장
  const slim = {};
  for (const no of bzNos) {
    const p = products[no];
    if (!p) continue;
    slim[no] = p.gone
      ? { gone: true, ...(p.isbn ? { isbn: p.isbn } : {}), ...(p.moved ? { moved: p.moved } : {}) }
      : { isbn: p.isbn, price: p.price, retail: p.retail, sold: !!p.sold, itemCode: p.itemCode, ...(p.moved ? { moved: p.moved } : {}) };
  }
  const changed = JSON.stringify(slim) !== JSON.stringify(prev.products);
  const stale = !prev.updatedAt || Date.now() - Date.parse(prev.updatedAt) > 20 * 3600 * 1000;
  if (changed || stale) {
    // 바뀐 게 없어도 하루에 한 번은 시각을 새로 찍는다(동기화가 살아 있다는 표시)
    fs.writeFileSync(path.join(outDir, 'status.json'), JSON.stringify({ v: 1, updatedAt: new Date().toISOString(), products: slim }) + '\n');
  }
  fs.writeFileSync(path.join(outDir, 'isbn-cache.json'), JSON.stringify(isbnCache, null, 1) + '\n');

  const movedTo = new Set(moves.map((m) => m.to));
  const missing = others.filter((no) => isbnCache[no] && !movedTo.has(no)).map((no) => ({ no, category: listed[no][0] || '성경', ...isbnCache[no], url: `${SHOP}/product/detail.html?product_no=${no}` }));
  fs.writeFileSync(path.join(outDir, 'missing.json'), JSON.stringify(missing, null, 1) + '\n');

  // 6) 요약
  const priceChanges = [];
  let hidden = 0;
  for (const x of variants) {
    const p = slim[x.no];
    if (!p) continue;
    const t = p.moved || p;
    if (!p.moved && (p.gone || p.sold)) { hidden++; continue; }
    if (t.price !== x.v.salePrice) priceChanges.push(`${x.pubName} ${x.item.model} ${x.v.label}: ${x.v.salePrice} → ${t.price}`);
  }
  console.log(`바이블줌 상품 ${bzNos.length}개 확인 (읽기 실패 ${failed.length})`);
  console.log(`- 기본 데이터와 가격이 다른 것: ${priceChanges.length}`);
  console.log(`- 품절·삭제로 숨길 것: ${hidden}`);
  console.log(`- ISBN으로 새 상품에 연결: ${moves.length}`);
  for (const m of moves) console.log(`    ${m.from} → ${m.to} (ISBN ${m.isbn}, ${m.oldPrice} → ${m.newPrice}, ${m.reason})`);
  console.log(`쇼핑몰 성경 카테고리 판매 중 ${listedNos.length}개, 그중 바이블줌에 없는 것 ${missing.length}개`);
  console.log(changed ? 'status.json 갱신됨' : 'status.json 변화 없음');

  // 7) 기본 데이터(bibleData.js)에도 반영 — 동기화 파일을 못 읽을 때의 예비값
  if (writeBase) {
    for (const x of variants) {
      const p = slim[x.no];
      if (!p || p.gone) continue;
      if (p.isbn) x.v.isbn = p.isbn;
      if (p.itemCode) x.v.itemCode = p.itemCode;
      x.v.originalPrice = p.retail;
      x.v.salePrice = p.price;
    }
    fs.writeFileSync(baseFile, 'export const bibleData = ' + JSON.stringify(bibleData, null, 2) + ';\n');
    console.log('src/data/bibleData.js 에 ISBN·가격·item_code 반영함');
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error('동기화 실패:', e.message); process.exit(1); });
}
