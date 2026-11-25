// 쇼핑몰(카페24) 현재 가격·품절 상태를 기본 데이터 위에 덮어쓴다.
// 상태 파일은 scripts/sync-cafe24.mjs 가 주기적으로 만든다.
// 파일을 못 읽으면 아무것도 바꾸지 않고 기본 데이터 그대로 보여 준다.
import { useEffect, useState } from 'react';

export const LIVE_STATUS_URL = import.meta.env?.VITE_LIVE_STATUS_URL
  || 'https://raw.githubusercontent.com/graceworkstudio/biblefont/live-data/status.json';

const productNoOf = (url = '') => {
  const q = url.match(/[?&]product_no=(\d+)/);
  if (q) return q[1];
  const s = url.match(/\/product\/[^/]+\/(\d+)\/(?:category|display)\//);
  return s ? s[1] : null;
};

// 순수 함수: (기본 데이터, 상태) → 화면에 쓸 데이터
export const applyLiveStatus = (base, status) => {
  const products = status && status.products;
  if (!products || typeof products !== 'object') return base;

  let total = 0;
  let kept = 0;
  const result = {};
  for (const pubKey of Object.keys(base)) {
    const pub = base[pubKey];
    const items = [];
    for (const item of pub.items) {
      const variants = [];
      for (const v of item.variants || []) {
        total++;
        const entry = products[productNoOf(v.url)];
        if (!entry) { variants.push(v); kept++; continue; } // 상태를 모르는 상품은 그대로
        const target = entry.moved || entry; // 같은 ISBN의 새 상품으로 옮겨진 경우
        if (!entry.moved && (entry.gone || entry.sold)) continue; // 품절·판매중단 → 숨김
        if (!target.price) { variants.push(v); kept++; continue; }
        kept++;
        variants.push({
          ...v,
          salePrice: target.price,
          originalPrice: target.retail && target.retail >= target.price ? target.retail : target.price,
          itemCode: target.itemCode || v.itemCode,
          ...(entry.moved ? { url: entry.moved.url, img: entry.moved.img || v.img } : {}),
        });
      }
      if (variants.length > 0) items.push({ ...item, variants });
    }
    result[pubKey] = { ...pub, items };
  }
  // 상태 파일이 잘못돼 대부분이 사라지는 경우를 막는다
  if (total > 0 && kept < total * 0.5) return base;
  return result;
};

export const useLiveBibleData = (base) => {
  const [data, setData] = useState(base);
  useEffect(() => {
    let cancelled = false;
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = setTimeout(() => controller && controller.abort(), 6000);
    fetch(LIVE_STATUS_URL, { cache: 'no-cache', signal: controller ? controller.signal : undefined })
      .then((res) => (res.ok ? res.json() : null))
      .then((status) => { if (!cancelled && status) setData(applyLiveStatus(base, status)); })
      .catch(() => { /* 기본 데이터 유지 */ })
      .finally(() => clearTimeout(timer));
    return () => { cancelled = true; clearTimeout(timer); };
  }, [base]);
  return data;
};

// 관심상품(브라우저에 저장된 것)의 가격·상품 연결도 최신으로 맞춘다
export const refreshCartItems = (cartItems, data) => {
  let changed = false;
  const next = cartItems.map((ci) => {
    const pub = data[ci.publisherKey];
    if (!pub) return ci;
    let variant = null;
    for (const item of pub.items) {
      if (item.model !== ci.model) continue;
      variant = (item.variants || []).find((v) => v.label === ci.variantLabel);
      if (variant) break;
    }
    if (!variant) return ci;
    if (ci.salePrice === variant.salePrice && ci.originalPrice === variant.originalPrice
      && (ci.itemCode || '') === (variant.itemCode || '') && ci.variantUrl === variant.url && ci.variantImg === variant.img) return ci;
    changed = true;
    return { ...ci, salePrice: variant.salePrice, originalPrice: variant.originalPrice, itemCode: variant.itemCode || '', variantUrl: variant.url, variantImg: variant.img };
  });
  return changed ? next : cartItems;
};
