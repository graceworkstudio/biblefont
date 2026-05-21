import React, { useState, useEffect, useRef } from 'react';
import { Ruler, BookOpen, AlertCircle, X, Bell, ExternalLink, ShoppingCart, ShoppingBag, ChevronDown, ChevronRight, MessageCircle, Play, Gift, Share2 } from 'lucide-react';
import BannerComponent from './BannerComponent';
import { bibleData } from './data/bibleData';
import LZString from 'lz-string';
import { APP_VERSION, UPDATE_NOTES, ENABLE_UI_UPDATE_MODAL, EMPATHY_PARENT_HEADLINE, EMPATHY_BULLETS } from './constants/uiConstants';







// Base64 공유 데이터 인코딩/디코딩 헬퍼 함수
const encodeSharedItems = (items) => {
  const ids = items.map(item => item.uniqueId);
  const joinedStr = ids.join('|');
  // Use LZString to drastically compress the repeated Korean chars and IDs
  return LZString.compressToEncodedURIComponent(joinedStr);
};

const decodeSharedItems = (encodedStr) => {
  try {
    // 1. Try LZString first (v3 format)
    const decompressed = LZString.decompressFromEncodedURIComponent(encodedStr);
    if (decompressed) {
      if (decompressed.startsWith('[')) {
        return JSON.parse(decompressed);
      } else if (decompressed.includes('_')) {
        return decompressed.split('|').filter(id => id.trim() !== '');
      }
    }

    // 2. Try Pipe + UTF8 + Base64 (v2 format)
    let base64 = encodedStr.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    
    const binaryStr = atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    const decodedStr = new TextDecoder().decode(bytes);
    
    if (decodedStr.startsWith('[')) {
      return JSON.parse(decodedStr);
    } else if (decodedStr.includes('_')) {
      return decodedStr.split('|').filter(id => id.trim() !== '');
    }
    throw new Error('Fallback to v1');
  } catch (e) {
    // 3. Fallback to Original JSON + URI + Base64 (v1 format)
    try {
      const decodedJson = decodeURIComponent(atob(encodedStr));
      return JSON.parse(decodedJson);
    } catch (err) {
      console.error('Failed to decode shared items:', err);
      return [];
    }
  }
};

/** 첫 화면 공감 카피(B안): 기능 설명 전 스크롤 상단 노출 */



const App = () => {
  const [activeTab, setActiveTab] = useState('A');
  const [selectedType, setSelectedType] = useState('all');
  const [globalScale, setGlobalScale] = useState(1.5);
  const [showUpdateNotice, setShowUpdateNotice] = useState(false);
  const [showBibleList, setShowBibleList] = useState(false);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [uiSize, setUiSize] = useState('medium'); // small (original compact), medium (baseline), large
  const [hoverItem, setHoverItem] = useState(null);
  const hoverTimeoutRef = useRef(null);

  const [selectedItem, setSelectedItem] = useState(null);
  const [fetchedVariants, setFetchedVariants] = useState({});
  const [isLoadingVariants, setIsLoadingVariants] = useState({});
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
  const hideTimeoutRef = useRef(null);
  const tabsRef = useRef(null);
  const showTimeoutRef = useRef(null);
  const [isHoverActive, setIsHoverActive] = useState(false);

  // 장바구니 및 알림 관련 상태
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('biblezoom_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [toastMessage, setToastMessage] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const toastTimeoutRef = useRef(null);

  // 장바구니 선택 항목 관리 상태
  const [selectedCartIds, setSelectedCartIds] = useState([]);
  const [isCartSubmitting, setIsCartSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState({ current: 0, total: 0 });

  // 장바구니 변경 시 선택 목록 동기화 (새로운 추가 상품은 자동 선택)
  // Auto-resize iframe logic to remove double scrollbars
  useEffect(() => {
    // Only run if we are inside an iframe
    if (window.parent && window.parent !== window) {
      const resizeObserver = new ResizeObserver(() => {
        // Post the current body scrollHeight to the parent window
        window.parent.postMessage({ type: 'bz-resize', height: document.body.scrollHeight }, '*');
      });
      resizeObserver.observe(document.body);
      
      // Also trigger once on load
      window.parent.postMessage({ type: 'bz-resize', height: document.body.scrollHeight }, '*');
      
      return () => resizeObserver.disconnect();
    }
  }, []);

  useEffect(() => {
    setSelectedCartIds(prev => {
      const newIds = cartItems.map(i => i.uniqueId);
      const kept = prev.filter(id => newIds.includes(id));
      const added = newIds.filter(id => !prev.includes(id));
      return [...kept, ...added];
    });
  }, [cartItems]);

  // 개별 상품 선택/해제 토글
  const toggleSelectCartItem = (uniqueId) => {
    setSelectedCartIds(prev =>
      prev.includes(uniqueId)
        ? prev.filter(id => id !== uniqueId)
        : [...prev, uniqueId]
    );
  };

  // 전체 상품 선택/해제 토글
  const toggleSelectAllCart = () => {
    if (selectedCartIds.length === cartItems.length) {
      setSelectedCartIds([]);
    } else {
      setSelectedCartIds(cartItems.map(i => i.uniqueId));
    }
  };

  // 로컬스토리지 자동 저장 동기화
  useEffect(() => {
    localStorage.setItem('biblezoom_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // 토스트 메시지 팝업 트리거
  const showToast = (msg) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2200);
  };

  // 관심상품 담기 핸들러
  const addToCart = (variant, item) => {
    const uniqueId = `${item.publisherKey}_${item.model}_${variant.label}`;
    setCartItems(prev => {
      const exists = prev.find(i => i.uniqueId === uniqueId);
      if (exists) {
        showToast('🛒 이미 관심상품에 담겨 있는 상품입니다.');
        return prev;
      }
      showToast('🛒 관심상품에 상품을 담았습니다!');
      return [...prev, {
        uniqueId,
        publisherKey: item.publisherKey,
        publisherName: item.publisherName,
        model: item.model,
        size: item.size,
        variantLabel: variant.label,
        variantImg: variant.img,
        variantUrl: variant.url,
        originalPrice: variant.originalPrice,
        salePrice: variant.salePrice,
        quantity: 1
      }];
    });
  };

  // 관심상품 삭제 핸들러
  const removeFromCart = (uniqueId) => {
    setCartItems(prev => prev.filter(i => i.uniqueId !== uniqueId));
    showToast('🗑️ 관심상품에서 상품을 삭제했습니다.');
  };

  // 관심상품 전체 비우기 핸들러
  const clearCart = () => {
    setCartItems([]);
    showToast('🧹 관심상품을 모두 비웠습니다.');
  };

  // 화면 배율 조정 슬라이더 영역으로 스무스 스크롤 이동
  const scrollToCalibration = () => {
    setIsCompareOpen(false);
    setIsCartOpen(false);
    setTimeout(() => {
      const element = document.getElementById('calibration-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
  };

  // 개별 상품 바로구매 (SameSite 보안 이슈 회피용 Cafe24 surl/O 단일 바로구매 리다이렉트 - 새창 열기)
  const handleIndividualCheckout = (item) => {
    const matchProductNo = item.variantUrl.match(/[?&]product_no=(\d+)/);
    const productNo = matchProductNo ? matchProductNo[1] : null;

    if (productNo) {
      const domain = window.location.origin;

      showToast('🛒 주문서 페이지로 이동하고 있습니다. 잠시만 기다려 주세요...');

      // Cafe24 공식 바로구매(surl/O/상품번호) 고유 URL 생성
      const buyUrl = `${domain}/surl/O/${productNo}`;

      // 새창(_blank)으로 즉시 열기 (팝업 차단 회피를 위해 동기 실행)
      window.open(buyUrl, '_blank');

      // 관심 목록 드로어 닫기
      setIsCartOpen(false);

      // 장바구니 담기 진행률 모달 비활성화 (일괄 구매 버튼을 눌러 들어온 경우 스피너 닫기)
      setIsCartSubmitting(false);
    }
  };

  // 선택 상품 일괄 바로구매 & Cafe24 장바구니 연동 로직
  const handleBatchCheckout = async () => {
    const selectedItems = cartItems.filter(item => selectedCartIds.includes(item.uniqueId));
    if (selectedItems.length === 0) {
      showToast('⚠️ 구매할 상품을 먼저 선택해 주세요.');
      return;
    }

    setIsCartSubmitting(true);
    setSubmitProgress({ current: 0, total: selectedItems.length });

    // 1. 단일 상품 바로구매 케이스 (95%+ 주 사용 시나리오)
    // 최상위 창(Top-level / Parent)에서 직접 폼 전송을 실행하여 SameSite=Lax 세션 쿠키가 온전히 실려 전송되도록 처리합니다.
    if (selectedItems.length === 1) {
      const item = selectedItems[0];
      setSubmitProgress({ current: 1, total: 1 });
      handleIndividualCheckout(item);
      return;
    }

    // 2. 다중 상품 일괄 장바구니 담기 케이스 (순차 비동기 fetch 전송)
    // ※ 동일 도메인(Same-origin) 환경이므로 iframe 대신 fetch를 사용하여 안정적으로 데이터를 전송합니다.
    for (let i = 0; i < selectedItems.length; i++) {
      const item = selectedItems[i];
      setSubmitProgress(prev => ({ ...prev, current: i + 1 }));

      const matchProductNo = item.variantUrl.match(/[?&]product_no=(\d+)/);
      const matchCateNo = item.variantUrl.match(/[?&]cate_no=(\d+)/);
      const productNo = matchProductNo ? matchProductNo[1] : null;
      const cateNo = matchCateNo ? matchCateNo[1] : null;

      if (productNo) {
        try {
          // 1) Cafe24 상품 정보에서 item_code 또는 product_code 가져오기 (CORS 걱정 없는 동일 도메인 비동기 파싱)
          let itemCode = null;
          try {
            const detailRes = await fetch(`/product/detail.html?product_no=${productNo}`);
            if (detailRes.ok) {
              const detailHtml = await detailRes.text();
              
              // var item_code = '...'; 검색
              const itemCodeMatch = detailHtml.match(/var\s+item_code\s*=\s*['"]([^'"]+)['"]/);
              if (itemCodeMatch && itemCodeMatch[1]) {
                itemCode = itemCodeMatch[1];
              } else {
                // var product_code = '...'; 검색 후 000A 접미사
                const productCodeMatch = detailHtml.match(/var\s+product_code\s*=\s*['"]([^'"]+)['"]/);
                if (productCodeMatch && productCodeMatch[1]) {
                  itemCode = productCodeMatch[1] + '000A';
                }
              }
            }
          } catch (e) {
            console.error('Fetch detail HTML failed:', e);
          }

          // fallback 기본값 처리
          if (!itemCode) {
            itemCode = `P${productNo}000A`;
          }

          // 2) Cafe24 장바구니 담기 (Iframe 순차 전송)
          // Cafe24는 여러 개의 다른 상품(product_no)을 한 번에 담는 것을 기본 API로 지원하지 않으므로,
          // 각 상품마다 고유한 hidden iframe을 생성하여 순차적으로 form을 전송합니다.
          await new Promise((resolve) => {
            const iframeId = `hidden-cart-iframe-${productNo}-${Date.now()}`;
            const iframe = document.createElement('iframe');
            iframe.id = iframeId;
            iframe.name = iframeId;
            iframe.style.display = 'none';
            
            let isResolved = false;
            const finish = () => {
              if (!isResolved) {
                isResolved = true;
                setTimeout(() => {
                  if (document.body.contains(iframe)) document.body.removeChild(iframe);
                  resolve();
                }, 100);
              }
            };
            
            // Cafe24 장바구니 처리가 완료되어 iframe이 로드되면 다음 상품으로 넘어갑니다.
            iframe.onload = finish;
            // 만약 응답이 지연될 경우를 대비한 안전 장치 (최대 1.5초 대기)
            setTimeout(finish, 1500);
            
            document.body.appendChild(iframe);

            const form = document.createElement('form');
            form.method = 'POST';
            form.action = '/exec/front/order/basket/';
            form.target = iframeId;
            
            const params = {
              product_no: productNo,
              quantity: '1',
              basket_type: 'A0000',
              delvtype: 'A'
            };
            if (cateNo) params.cate_no = cateNo;

            Object.keys(params).forEach(key => {
              const input = document.createElement('input');
              input.type = 'hidden';
              input.name = key;
              input.value = params[key];
              form.appendChild(input);
            });
            
            // Cafe24 장바구니 핵심 필수 파라미터 (수량||품목코드)
            const selectedItemInput = document.createElement('input');
            selectedItemInput.type = 'hidden';
            selectedItemInput.name = 'selected_item[]';
            selectedItemInput.value = `1||${itemCode}`;
            form.appendChild(selectedItemInput);
            
            document.body.appendChild(form);
            form.submit();
            
            // 전송 후 form 요소만 즉시 제거 (iframe은 응답을 받아야 하므로 유지)
            setTimeout(() => { 
              if (document.body.contains(form)) document.body.removeChild(form); 
            }, 100);
          });

        } catch (err) {
          console.error(`Failed to add product ${productNo} to cart:`, err);
        }
      }
    }

    // 전송 완료 후 Cafe24 장바구니로 리다이렉트
    const finalDomain = window.location.origin;

    showToast('🛒 선택하신 상품들이 장바구니에 모두 담겼습니다! 이동합니다.');
    
    setTimeout(() => {
      setIsCartSubmitting(false);
      setIsCartOpen(false);

      const cartUrl = `${finalDomain}/order/basket.html`;
      if (window.parent && window.parent !== window) {
        window.parent.location.href = cartUrl;
      } else {
        window.location.href = cartUrl;
      }
    }, 1000);
  };


  // 6대 실시간 필터 상태 정의
  const [filters, setFilters] = useState({
    hymn: { master: true, options: { yes: true, no: true } },
    commentary: { master: true, options: { yes: true, no: true } },
    material: { master: true, options: { natural: true, pu: true, other: true } },
    portability: { master: true, options: { small: true, medium: true, large: true, pulpit: true } },
    fontSize: { master: true, options: { small: true, medium: true, senior: true } },
    publisher: { master: true, options: { agape: true, words: true, seong: true, christian: true, duranno: true, other: true } }
  });

  // 필터 초기화 함수
  const resetFilters = () => {
    setFilters({
      hymn: { master: true, options: { yes: true, no: true } },
      commentary: { master: true, options: { yes: true, no: true } },
      material: { master: true, options: { natural: true, pu: true, other: true } },
      portability: { master: true, options: { small: true, medium: true, large: true, pulpit: true } },
      fontSize: { master: true, options: { small: true, medium: true, senior: true } },
      publisher: { master: true, options: { agape: true, words: true, seong: true, christian: true, duranno: true, other: true } }
    });
  };

  // 마스터 체크박스 변경 토글러
  const toggleMaster = (category) => {
    setFilters(prev => {
      const nextCategory = { ...prev[category] };
      const nextMaster = !nextCategory.master;
      nextCategory.master = nextMaster;
      
      const nextOptions = { ...nextCategory.options };
      Object.keys(nextOptions).forEach(key => {
        nextOptions[key] = nextMaster;
      });
      nextCategory.options = nextOptions;
      
      return { ...prev, [category]: nextCategory };
    });
  };

  // 개별 옵션 체크박스 변경 토글러
  const toggleOption = (category, optionKey) => {
    setFilters(prev => {
      const nextCategory = { ...prev[category] };
      const nextOptions = { ...nextCategory.options, [optionKey]: !nextCategory.options[optionKey] };
      nextCategory.options = nextOptions;
      
      const allChecked = Object.values(nextOptions).every(val => val === true);
      nextCategory.master = allChecked;
      
      return { ...prev, [category]: nextCategory };
    });
  };

  const handleMouseEnter = (item, e) => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
    
    // 신규 아이템으로 진입 시 기존 팝업 즉시 초기화
    if (hoverItem && hoverItem.model !== item.model) {
      setIsHoverActive(false);
    }
    
    setHoverItem(item);
    setMousePos({ x: e.clientX, y: e.clientY });
    setPopupPos({ x: e.clientX, y: e.clientY });
    handleFetchVariants(item);

    showTimeoutRef.current = setTimeout(() => {
      setIsHoverActive(true);
    }, 300);
  };

  const handleMouseLeave = () => {
    if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      setIsHoverActive(false);
      setHoverItem(null);
    }, 400); // 0.4초 유예 시간
  };

  useEffect(() => {
    const lastVersion = localStorage.getItem('bible_font_version');
    if (ENABLE_UI_UPDATE_MODAL && lastVersion !== APP_VERSION) setShowUpdateNotice(true);
  }, []);

  // 카카오톡 SDK 초기화
  useEffect(() => {
    if (window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init('00968b7d370bf55e522e2671552c34a0');
    }
  }, []);

  // 구글 애널리틱스 SPA 화면 전환 추적
  useEffect(() => {
    if (typeof window.gtag !== 'function') return;
    let pageTitle = '바이블줌 BibleZoom - 홈';
    let pagePath = '/';

    if (showBibleList) {
       pagePath = `/bible-list?tab=${activeTab}`;
       pageTitle = `바이블줌 BibleZoom - 성경 목록 (${activeTab} 탭)`;
    } else if (selectedItem) {
       pagePath = `/product-modal?model=${encodeURIComponent(selectedItem.model)}`;
       pageTitle = `바이블줌 BibleZoom - 상세 (${selectedItem.model})`;
    }

    window.gtag('event', 'page_view', {
      page_title: pageTitle,
      page_location: window.location.href,
      page_path: pagePath,
    });
  }, [activeTab, showBibleList, selectedItem]);

  const closeUpdateNotice = () => {
    localStorage.setItem('bible_font_version', APP_VERSION);
    setShowUpdateNotice(false);
  };

  const handleKakaoShare = () => {
    if (window.Kakao && window.Kakao.isInitialized()) {
      try {
        window.Kakao.Share.sendDefault({
          objectType: 'feed',
          content: {
            title: '🔎 돋보기 없이 고르는 큰 글자 성경',
            description: '앱 설치 없이 지금 바로 내 스마트폰에서 실제 글자 크기를 확인해 보세요!',
            imageUrl: 'https://biblefont.web.app/biblezoom-kakao-share2.png',
            link: {
              mobileWebUrl: 'https://biblezoom.co.kr',
              webUrl: 'https://biblezoom.co.kr',
            },
          },
          buttons: [
            {
              title: '성경 폰트 크기 비교하기',
              link: {
                mobileWebUrl: 'https://biblezoom.co.kr',
                webUrl: 'https://biblezoom.co.kr',
              },
            },
          ],
        });
        if (typeof window.gtag === 'function') {
          window.gtag('event', 'share', { method: 'KakaoTalk', content_type: 'app' });
        }
      } catch (e) {
        console.error('Kakao share error:', e);
        alert('카카오톡 공유 중 오류가 발생했습니다: ' + e.message);
      }
    } else {
      alert('카카오톡 공유 기능을 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
    }
  };

  const handleSmsShare = async () => {
    const title = "[바이블줌] 돋보기 없이 고르는 큰 글자 성경";
    const text = "앱 설치 없이 내 폰에서 실제 글자 크기를 바로 확인해 보세요!";
    const url = "https://biblezoom.co.kr";
    const fullText = `${title}\n${text}\n${url}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: text,
          url: url,
        });
        if (typeof window.gtag === 'function') {
          window.gtag('event', 'share', { method: 'WebShare', content_type: 'app' });
        }
        return;
      } catch (error) {
        if (error.name === 'AbortError') return;
      }
    }

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const separator = isIOS ? '&' : '?';
    window.location.href = `sms:${separator}body=${encodeURIComponent(fullText)}`;
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'share', { method: 'SMS', content_type: 'app' });
    }
  };

  const handleFetchVariants = async (item) => {
    const modelName = item.model;
    if (item.variants || fetchedVariants[modelName] || isLoadingVariants[modelName]) return;
    setIsLoadingVariants(prev => ({ ...prev, [modelName]: true }));
    try {
      const res = await fetch(`/api/cafe24Products?keyword=${encodeURIComponent(modelName)}`);
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      setFetchedVariants(prev => ({ ...prev, [modelName]: data.products || [] }));
    } catch (error) {
      console.error(error);
      setFetchedVariants(prev => ({ ...prev, [modelName]: [] }));
    } finally {
      setIsLoadingVariants(prev => ({ ...prev, [modelName]: false }));
    }
  };

  const getFilteredVariants = (item) => {
    if (!item) return [];
    const sourceVariants = item.variants || fetchedVariants[item.model] || [];
    return sourceVariants.filter(variant => {
      const label = variant.label || variant.name || '';
      
      const hasHymn = label.includes('합본') || !label.includes('단본');
      const hymnMatch = hasHymn ? filters.hymn.options.yes : filters.hymn.options.no;
      
      const isNatural = label.includes('천연') || label.includes('가죽') && !label.includes('PU') && !label.includes('인조');
      const isPU = label.includes('PU') || label.includes('인조') || label.includes('레자') || label.includes('레더');
      const isOther = !isNatural && !isPU;
      
      let materialMatch = false;
      if (isNatural && filters.material.options.natural) materialMatch = true;
      if (isPU && filters.material.options.pu) materialMatch = true;
      if (isOther && filters.material.options.other) materialMatch = true;
      
      return hymnMatch && materialMatch;
    });
  };

  const handleItemClick = (item) => { setSelectedItem(item); handleFetchVariants(item); };
  const handleItemMouseEnter = (e, item) => {
    if (window.innerWidth < 768) return;
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    if (!selectedItem || selectedItem.model !== item.model) {
      setMousePos({ x: e.clientX + 30, y: Math.max(20, e.clientY - 30) });
    }
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => { setSelectedItem(item); handleFetchVariants(item); }, 300);
  };
  const handleItemMouseLeave = () => {
    if (window.innerWidth < 768) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => setSelectedItem(null), 300);
  };
  const handlePopupMouseEnter = () => { if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current); };
  const handlePopupMouseLeave = () => { hideTimeoutRef.current = setTimeout(() => setSelectedItem(null), 300); };

  const MM_TO_PT = 0.3528;
  const sizeOrder = ["특대", "대", "특중", "중", "소", "미니", "특소", "특미니", "초미니"];
  const formatPrice = (price) => new Intl.NumberFormat('ko-KR').format(price) + '원';
  const formatPt = (mm) => {
    const rawPt = mm / MM_TO_PT;
    const decimal = rawPt % 1;
    return Math.abs(decimal - 0.5) < 0.01 ? rawPt.toFixed(1) : Math.round(rawPt).toString();
  };
  const getFontWeight = (mm) => {
    const pt = mm / MM_TO_PT;
    return pt >= 13.0 ? '800' : pt >= 11.0 ? '700' : '400';
  };
  const getBaseSize = (sizeStr) => sizeStr.replace(/\(슬림\)/, "").trim();

  const getHoverPopupStyle = () => {
    if (typeof window === 'undefined') {
      return { display: 'none' };
    }

    const margin = 20; // 브라우저 창 테두리와 팝업 사이의 최소 여백
    const cursorGap = 20; // 마우스 커서와 팝업 사이의 띄우는 간격
    const popupWidth = 440; // 설정하신 팝업 너비
    const popupHeight = 520; // 설정하신 팝업 높이

    // 1. 기본 위치: 마우스 우측 하단
    let left = popupPos.x + cursorGap;
    let top = popupPos.y + cursorGap;

    // 2. 가로 위치 조정: 우측 공간이 부족하면 마우스 좌측으로 띄움
    if (left + popupWidth > window.innerWidth - margin) {
      left = popupPos.x - popupWidth - cursorGap;
      // 좌측으로 넘겨도 화면을 벗어나면 최소 여백에 맞춤
      if (left < margin) {
        left = margin;
      }
    }

    // 3. 세로 위치 조정: 하단 공간이 부족하면 마우스 상단으로 띄움 (원래 방식 복원)
    const availableBelow = window.innerHeight - popupPos.y - cursorGap;

    if (availableBelow < popupHeight + margin) {
      // 아래쪽 공간이 모자라면 마우스 커서 위쪽으로 팝업을 올립니다.
      top = popupPos.y - popupHeight - cursorGap;

      // 위로 올렸을 때 화면 상단을 벗어난다면 상단 여백에 맞춥니다.
      if (top < margin) {
        top = margin;
      }
    }

    return {
      left: `${left}px`,
      top: `${top}px`,
      position: 'fixed',
      zIndex: 9999
    };
  };




  const customStudyOrder = {
    'A': ['큰글성경', '큰글자 굿모닝성경', '뉴슬림 굿모닝성경', '컬러성경', '예스 주석성경'],
    'W': ['큰글자 스터디성경', '슬림 스터디성경', '프리미엄 굿데이성경', '뉴빅슬림 굿데이성경', '올 뉴 굿데이성경', '모던컬러성경'],
    'S': ['주석큰성경', '베스트성경', '좋은성경', '빅컬러성경'],
    'C': ['프라임 주석 성경', '취리히바이블', '포커스성경', '포커스 성경'],
    'D': ['비전성경']
  };

  const getModelOrderIndex = (tab, model) => {
    const orderList = customStudyOrder[tab] || [];
    // Handle NKR mapping if they meant 큰글성경
    if (model.includes('NKR')) return orderList.indexOf('큰글성경') !== -1 ? orderList.indexOf('큰글성경') : 999;
    const idx = orderList.findIndex(m => model.includes(m));
    return idx === -1 ? 999 : idx;
  };

  const getNKRSortKey = (model) => {
    const match = (model || '').match(/NKR(\d{2})/);
    return match ? parseInt(match[1], 10) : 0;
  };

  const filteredItems = Object.entries(bibleData).flatMap(([pubKey, pubValue]) => 
    pubValue.items.map(item => ({
      ...item,
      publisherKey: pubKey,
      publisherName: ['A', 'W', 'S', 'C', 'D'].includes(pubKey) ? pubValue.name : '기타'
    }))
  ).filter(item => {
    // 1. Commentary filter (해설유무)
    const matchesComm = (item.type === 'study' && filters.commentary.options.yes) || 
                        (item.type === 'standard' && filters.commentary.options.no);
    if (!matchesComm) return false;
    
    // 2. Portability filter (크기/휴대성)
    const sz = item.size || '';
    let matchesPort = false;
    if (['소', '미니', '특소', '특미니', '초미니', '특초미니'].includes(sz)) {
      matchesPort = filters.portability.options.small;
    } else if (['중', '특중'].includes(sz)) {
      matchesPort = filters.portability.options.medium;
    } else if (['대', '특대'].includes(sz)) {
      matchesPort = filters.portability.options.large;
    } else if (sz === '강대용') {
      matchesPort = filters.portability.options.pulpit;
    }
    if (!matchesPort) return false;
    
    // 3. Font Size filter (글씨크기)
    const mm = item.mm || 0;
    let matchesFont = false;
    if (mm < 3.0) {
      matchesFont = filters.fontSize.options.small;
    } else if (mm >= 3.0 && mm < 4.0) {
      matchesFont = filters.fontSize.options.medium;
    } else if (mm >= 4.0) {
      matchesFont = filters.fontSize.options.senior;
    }
    if (!matchesFont) return false;

    // 4. Publisher filter (출판사)
    const pub = item.publisherKey;
    let matchesPub = false;
    if (pub === 'A') {
      matchesPub = filters.publisher.options.agape;
    } else if (pub === 'W') {
      matchesPub = filters.publisher.options.words;
    } else if (pub === 'S') {
      matchesPub = filters.publisher.options.seong;
    } else if (pub === 'C') {
      matchesPub = filters.publisher.options.christian;
    } else if (pub === 'D') {
      matchesPub = filters.publisher.options.duranno;
    } else {
      matchesPub = filters.publisher.options.other;
    }
    if (!matchesPub) return false;
    
    // 4. Hymn & Material filters (찬송가 & 재질)
    const matchedVariants = (item.variants || []).filter(variant => {
      const label = variant.label || '';
      
      const hasHymn = label.includes('합본') || !label.includes('단본');
      const hymnMatch = hasHymn ? filters.hymn.options.yes : filters.hymn.options.no;
      
      const isNatural = label.includes('천연') || label.includes('가죽') && !label.includes('PU') && !label.includes('인조');
      const isPU = label.includes('PU') || label.includes('인조') || label.includes('레자') || label.includes('레더');
      const isOther = !isNatural && !isPU;
      
      let materialMatch = false;
      if (isNatural && filters.material.options.natural) materialMatch = true;
      if (isPU && filters.material.options.pu) materialMatch = true;
      if (isOther && filters.material.options.other) materialMatch = true;
      
      return hymnMatch && materialMatch;
    });
    
    item.filteredVariants = matchedVariants;
    return matchedVariants.length > 0;
  }).sort((a, b) => b.mm - a.mm);

  // 딥링크 기반 장바구니/관심상품 자동 복구 및 드로어 연동
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedParam = urlParams.get('share');
    if (sharedParam) {
      const sharedIds = decodeSharedItems(sharedParam);
      if (sharedIds.length > 0) {
        const loadedItems = [];
        sharedIds.forEach(id => {
          const parts = id.split('_');
          if (parts.length < 3) return;
          const publisherKey = parts[0];
          const model = parts[1];
          const label = parts.slice(2).join('_');

          const publisher = bibleData[publisherKey];
          if (!publisher) return;
          
          let item = null;
          let variant = null;
          const matchingItems = publisher.items.filter(i => i.model === model);
          for (const mItem of matchingItems) {
            const foundVariant = mItem.variants.find(v => v.label === label);
            if (foundVariant) {
              item = mItem;
              variant = foundVariant;
              break;
            }
          }
          if (!item || !variant) return;

          loadedItems.push({
            uniqueId: id,
            publisherKey,
            publisherName: publisher.name,
            model: item.model,
            size: item.size,
            variantLabel: variant.label,
            variantImg: variant.img,
            variantUrl: variant.url,
            originalPrice: variant.originalPrice,
            salePrice: variant.salePrice,
            quantity: 1
          });
        });

        if (loadedItems.length > 0) {
          setCartItems(prev => {
            const merged = [...prev];
            loadedItems.forEach(item => {
              if (!merged.some(i => i.uniqueId === item.uniqueId)) {
                merged.push(item);
              }
            });
            return merged;
          });

          // 복원된 상품들을 자동 체크 활성화
          setSelectedCartIds(prev => {
            const addedIds = loadedItems.map(i => i.uniqueId);
            return Array.from(new Set([...prev, ...addedIds]));
          });

          // 관심목록 드로어 오픈 및 토스트 웰컴 팝업
          setIsCartOpen(true);
          showToast(`🎁 추천받은 성경 ${loadedItems.length}개가 관심상품에 추가되었습니다!`);

          // 주소창을 깔끔하게 정리하여 새로고침 시 중복 방지
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    }
  }, [bibleData]);

  // 카카오톡 선택 상품 공유하기 기능 구현
  const handleKakaoCartShare = () => {
    if (!window.Kakao || !window.Kakao.isInitialized()) {
      alert('⚠️ 카카오톡 공유 모듈을 불러오지 못했습니다.\n일시적인 네트워크 불안정이거나 광고 차단 프로그램 때문일 수 있습니다. 잠시 후 다시 시도해 주세요.');
      return;
    }

    const selectedItems = cartItems.filter(item => selectedCartIds.includes(item.uniqueId));
    if (selectedItems.length === 0) {
      showToast('⚠️ 공유할 상품을 먼저 선택해 주세요.');
      return;
    }

    try {
      const shareCode = encodeSharedItems(selectedItems);
      const shareUrl = `https://biblezoom.co.kr/?share=${shareCode}`;

      let title = '';
      let description = '';
      let imageUrl = '';

      if (selectedItems.length === 1) {
        const item = selectedItems[0];
        title = `🎁 [바이블줌] 추천 성경`;
        description = `[${item.publisherName}] ${item.model} (${item.variantLabel})\n가격: ${item.salePrice.toLocaleString()}원\n\n지인이 정성껏 고른 큰 글자 성경을 지금 확인해 보세요!`;
        imageUrl = item.variantImg;
      } else {
        const sizeOrder = { '초대': 4, '대': 3, '중': 2, '소': 1 };
        const getScore = (sizeStr) => {
          if (!sizeStr) return 0;
          for (const key of Object.keys(sizeOrder)) {
            if (sizeStr.includes(key)) return sizeOrder[key];
          }
          return 0;
        };

        // 글씨 크기가 가장 큰 대표 상품 순으로 정렬하여 첫 번째 상품의 이미지를 대표 이미지로 선정
        const sortedItems = [...selectedItems].sort((a, b) => getScore(b.size) - getScore(a.size));
        const repItem = sortedItems[0];

        title = `🎁 [바이블줌] 추천 성경 목록 (${selectedItems.length}개)`;
        
        // 목록 정보 텍스트 빌드 (대표 상품이 가장 처음에 나오도록 정렬된 리스트 사용)
        const lines = sortedItems.slice(0, 3).map((item, idx) => 
          `${idx + 1}. [${item.publisherName}] ${item.model} (${item.variantLabel})`
        );
        let listText = lines.join('\n');
        if (selectedItems.length > 3) {
          listText += `\n외 ${selectedItems.length - 3}개의 성경`;
        }
        description = listText + `\n\n지인이 고른 맞춤형 성경 목록을 바로 확인해 보세요!`;
        imageUrl = repItem.variantImg;
      }

      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: title,
          description: description,
          imageUrl: imageUrl,
          link: {
            mobileWebUrl: shareUrl,
            webUrl: shareUrl,
          },
        },
        buttons: [
          {
            title: '성경 목록 바로 확인하기 🔍',
            link: {
              mobileWebUrl: shareUrl,
              webUrl: shareUrl,
            },
          },
        ],
      });

      if (typeof window.gtag === 'function') {
        window.gtag('event', 'share', { method: 'KakaoTalk', content_type: 'cart_items' });
      }
    } catch (e) {
      console.error('Kakao cart share error:', e);
      alert('카카오톡 공유 중 오류가 발생했습니다: ' + e.message);
    }
  };

  const handleCopyAppUrl = async () => {
    try {
      const text = "[바이블줌] 돋보기 없이 고르는 큰 글자 성경\n앱 설치 없이 내 폰에서 실제 글자 크기를 바로 확인해 보세요!\n\nhttps://biblezoom.co.kr";
      await navigator.clipboard.writeText(text);
      if (typeof window.showToast === 'function') {
        window.showToast('🔗 앱 링크가 복사되었습니다.');
      } else {
        alert('🔗 앱 링크가 복사되었습니다.');
      }
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'share', { method: 'CopyLink', content_type: 'app' });
      }
    } catch (e) {
      alert('링크 복사에 실패했습니다.');
    }
  };

  const handleCopyCartLink = async () => {
    const selectedItems = cartItems.filter(item => selectedCartIds.includes(item.uniqueId));
    if (selectedItems.length === 0) {
      alert('⚠️ 공유할 상품을 먼저 선택해 주세요.');
      return;
    }
    try {
      const shareCode = encodeSharedItems(selectedItems);
      const shareUrl = `https://biblezoom.co.kr/?share=${shareCode}`;
      
      let text = `🎁 [바이블줌] 추천 성경 목록\n\n`;
      const lines = selectedItems.slice(0, 3).map((item, idx) => 
        `${idx + 1}. [${item.publisherName}] ${item.model} (${item.variantLabel})`
      );
      text += lines.join('\n');
      if (selectedItems.length > 3) {
        text += `\n외 ${selectedItems.length - 3}개의 성경`;
      }
      text += `\n\n지인이 고른 맞춤형 성경을 아래 링크에서 바로 확인해 보세요!\n\n${shareUrl}`;

      await navigator.clipboard.writeText(text);
      if (typeof window.showToast === 'function') {
        window.showToast('🔗 선택한 성경 목록 링크가 복사되었습니다.');
      } else {
        alert('🔗 선택한 성경 목록 링크가 복사되었습니다.');
      }
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'share', { method: 'CopyLink', content_type: 'cart_items' });
      }
    } catch (e) {
      alert('링크 복사에 실패했습니다.');
    }
  };

  return (
    <div className={`min-h-screen bg-slate-50 p-1 md:p-8 text-slate-900 font-sans ui-font-zoom-${uiSize}`}>
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 relative">
        {showUpdateNotice && (
          <div className="fixed inset-0 z-[5000] bg-slate-900/60 backdrop-blur-sm flex items-start justify-center p-2 pt-4 md:pt-10">
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="bg-yellow-400 p-4 md:p-6 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-xl"><Bell className="text-yellow-500" size={24} /></div>
                  <div><h2 className="text-xl font-black text-slate-900 leading-tight">업데이트 안내</h2><p className="text-sm font-bold text-yellow-900/70">{APP_VERSION}</p></div>
                </div>
                <button onClick={closeUpdateNotice} className="p-2 hover:bg-yellow-500 rounded-full transition-colors"><X size={24} /></button>
              </div>
              <div className="p-8 space-y-6">
                <ul className="space-y-3">{UPDATE_NOTES.map((note, i) => (<li key={i} className="flex items-start gap-3 text-slate-700 font-bold"><span className="text-yellow-500 mt-1">●</span><span>{note}</span></li>))}</ul>
                <button onClick={closeUpdateNotice} className="w-full py-4 bg-slate-900 text-white text-lg font-black rounded-2xl hover:bg-slate-800 transition-all">확인했습니다</button>
              </div>
            </div>
          </div>
        )}

        {isCartSubmitting && (
          <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-md transition-opacity duration-300">
            <div className="bg-white border border-slate-100 p-8 rounded-3xl flex flex-col items-center max-w-sm w-full mx-4 shadow-2xl text-center">
              {/* Spinning Loader */}
              <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-6"></div>
              
              <h3 className="text-slate-900 text-lg font-black mb-2">장바구니 담는 중</h3>
              <p className="text-slate-500 text-sm mb-4">
                선택하신 성경을 쇼핑몰 장바구니에 안전하게 담고 있습니다. 잠시만 기다려 주세요.
              </p>
              
              {/* Progress Bar */}
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-2 border border-slate-200/50">
                <div 
                  className="bg-orange-500 h-full transition-all duration-300"
                  style={{ width: `${(submitProgress.current / submitProgress.total) * 100}%` }}
                ></div>
              </div>
              
              <span className="text-orange-600 font-black text-sm">
                {submitProgress.current} / {submitProgress.total} 완료
              </span>
            </div>
          </div>
        )}

        <div 
          className="bg-yellow-400 py-6 md:py-8 text-center text-slate-900 border-b border-yellow-500 relative rounded-t-2xl no-zoom"
        >
          <div className="absolute bottom-1 right-3 text-[11px] md:text-[13px] font-bold text-yellow-900/40 uppercase tracking-tight leading-none origin-bottom-right transform scale-[0.8] md:scale-[0.8]">Version {APP_VERSION}</div>
          <div className="absolute top-4 right-4 flex items-center gap-2 no-zoom">
            <span className="font-black text-yellow-900/40 uppercase hidden md:inline no-zoom text-[length:var(--font-version)] md:text-[length:var(--font-version-md)] transition-all">글자 크기</span>
            <div className="flex bg-white/30 p-1 rounded-lg backdrop-blur-sm no-zoom">
                {['small', 'medium', 'large'].map(size => (
                    <button 
                        key={size}
                        onClick={() => setUiSize(size)}
                        className={`px-1.5 md:px-2.5 py-1 ${uiSize === 'small' ? 'text-[12px] md:text-xs' : uiSize === 'large' ? 'text-[16px] md:text-base' : 'text-[14px] md:text-sm'} font-black rounded-md transition-all no-zoom ${uiSize === size ? 'bg-white text-orange-600 shadow-sm' : 'text-yellow-900/60 hover:text-yellow-900'}`}
                    >
                        {size === 'small' ? '작게' : size === 'medium' ? '보통' : '크게'}
                    </button>
                ))}
            </div>
          </div>
          <h1 
            style={{ fontFamily: 'Gowun Batang, serif' }} 
            className="flex flex-col items-center justify-center tracking-tight no-zoom px-20 md:px-0"
          >
            <span 
              className="font-black text-slate-900"
              style={{ fontSize: 'clamp(22px, 4.5vw, 34px)', lineHeight: '1.2' }}
            >
              바이블줌 <span style={{ fontSize: '0.6em', fontWeight: 700, opacity: 0.5, letterSpacing: '0.02em' }}>biblezoom</span>
            </span>
            <span 
              className="font-bold text-yellow-900/60"
              style={{ fontSize: 'clamp(12px, 2.5vw, 16px)', marginTop: '2px' }}
            >
              내 눈에 맞는 성경, 직접 비교해보세요.
            </span>
          </h1>
        </div>
        <div className="p-4 md:p-8">
          {/* 서비스 목적 안내 */}
          <div className="mb-10 mt-2 md:mt-4 text-center no-zoom px-4 md:px-8">
            <div className="inline-block px-4 py-1.5 bg-slate-100 rounded-full text-slate-500 text-[length:var(--font-tag)] font-bold mb-5 uppercase tracking-widest">
              WE SERVE
            </div>
            <p className="text-[length:var(--font-hero-bullets)] font-medium text-slate-700 tracking-tight leading-adaptive-purpose">
              본 서비스는 온라인에서 가늠하기 어려웠던 <span className="text-orange-600 font-black">성경책의 실제 글자 크기</span>를 <br className="hidden md:block" />
              내 스마트폰(PC) 화면에 그대로 재현하여, <br className="hidden md:block" />
              내 눈에 가장 편안한 성경을 고를 수 있도록 돕는 <span className="bg-yellow-200/50 px-1 rounded-sm">맞춤형 가이드</span>입니다.
            </p>
          </div>

          <div
            className="mb-12 md:mb-16 rounded-2xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50/90 p-4 md:p-6 shadow-sm no-zoom"
            role="region"
            aria-label="이 서비스가 도움이 되는 경우"
          >
            <div className="flex items-start gap-3 md:gap-4">
              <div className="flex-shrink-0 rounded-2xl bg-white p-2.5 md:p-3 border border-orange-200 shadow-sm">
                <Gift className="text-orange-600" size={26} strokeWidth={2.25} aria-hidden />
              </div>
              <div className="min-w-0 space-y-3">
                <p
                  className="font-black text-gray-900 leading-snug tracking-tight text-[length:var(--font-hero-headline)]"
                >
                  {EMPATHY_PARENT_HEADLINE}
                </p>
                <ul className="space-y-0 text-gray-700 font-bold text-[length:var(--font-hero-bullets)]">
                  {EMPATHY_BULLETS.map((line, i) => (
                    <li 
                      key={i} 
                      className="flex items-start gap-2 leading-adaptive-empathy"
                    >
                      <span className="text-orange-500 mt-1 shrink-0 select-none" aria-hidden>•</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div id="calibration-section" className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-start">
            {/* 좌측 영역: 설명 및 조절 슬라이더 */}
            <div className="lg:col-span-1 flex flex-col">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 
                            className="font-black text-gray-900 leading-none tracking-tighter text-[length:var(--font-section-title)]"
                            style={{ marginBottom: 'var(--spacing-section-subtitle)' }}
                        >
                            화면 배율 맞추기
                        </h2>
                        <p className="text-sm md:text-base text-gray-500 font-bold">사용 중인 기기에 맞게 조절하세요</p>
                    </div>
                    <div 
                        className="font-black text-orange-600 bg-white border-2 border-orange-400 px-2 rounded-full shadow-sm whitespace-nowrap leading-none flex items-center justify-center text-[length:var(--font-btn-circle)] pt-[3.5px] pb-[2.5px]"
                    >
                        {globalScale.toFixed(2)}배
                    </div>
                </div>

                <p className="text-gray-700 mb-6 font-bold instruction-text leading-adaptive-empathy" style={{ fontSize: 'var(--font-instruction-body)' }}>
                    지갑 속 카드를 우측(또는 아래) 측정 영역의 좌측 상단 모서리에 바짝 붙여 올려놓으세요. 슬라이더를 움직여 화면의 네모칸과 실제 카드의 크기를 똑같이 맞춰주세요.
                </p>

                <div className="relative w-full h-14 mb-8 mt-2 flex items-center">
                    {/* 비주얼 트랙 (실제 터치 영역과 별개로 보기 좋게 얇게 유지) */}
                    <div className="absolute w-full h-4 bg-gray-200 rounded-full"></div>
                    
                    <input 
                        type="range" 
                        min="0.5" 
                        max="3.0" 
                        step="0.01" 
                        value={globalScale} 
                        onChange={(e) => setGlobalScale(parseFloat(e.target.value))} 
                        className="orange-slider absolute top-0 left-0 w-full h-full opacity-0 z-20 cursor-pointer"
                    />
                    <div 
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-4 bg-orange-400 rounded-full z-10 transition-all duration-75" 
                        style={{ width: `${((globalScale - 0.5) / (3.0 - 0.5)) * 100}%` }}
                    ></div>
                    <div 
                        className="absolute top-1/2 -translate-y-1/2 w-14 h-14 bg-orange-500 border-4 border-white rounded-full shadow-lg z-30 pointer-events-none transition-all duration-75"
                        style={{ left: `calc(${((globalScale - 0.5) / (3.0 - 0.5)) * 100}% - 28px)` }}
                    ></div>
                </div>
                
                {/* 이용 방법 아코디언 (PC 전용: 슬라이더 아래 빈 공간 활용) */}
                <div className="hidden lg:block instruction-container mt-6">
                    <button 
                        onClick={() => setIsAccordionOpen(!isAccordionOpen)}
                        className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all hover:bg-orange-100 ${isAccordionOpen ? 'bg-orange-100 border-orange-300 rounded-b-none' : 'bg-orange-50 border-orange-200'}`}
                    >
                        <div className="flex items-center">
                            <div className="bg-white p-2 rounded-full mr-4 shadow-sm">
                                <AlertCircle className="text-orange-600" size={32} strokeWidth={3} />
                            </div>
                            <div>
                                <h3 
                                    className="font-black text-gray-900 leading-none tracking-tighter text-[length:var(--font-section-title)]"
                                >
                                    이용 방법이 궁금하신가요?
                                </h3>
                                <p className="text-sm font-bold text-gray-500 mt-0.5">본인 또는 부모님을 위한 측정 방법</p>
                            </div>
                        </div>
                        <ChevronDown className={`text-orange-500 transition-transform duration-300 ${isAccordionOpen ? 'rotate-180' : ''}`} size={32} strokeWidth={3} />
                    </button>
                    
                    <div className={`accordion-content border-x border-b border-orange-100 rounded-b-2xl bg-orange-50/30 ${isAccordionOpen ? 'open' : ''}`}>
                        <div className="p-6 space-y-6 instruction-container">
                            {/* 10초 이용 시범 영상 */}
                            <div className="bg-black aspect-video rounded-2xl overflow-hidden border-4 border-white shadow-inner relative mb-6">
                                <iframe 
                                    className="absolute top-0 left-0 w-full h-full"
                                    src="https://www.youtube.com/embed/5pwCf0FUXiQ?rel=0&modestbranding=1" 
                                    title="바이블줌 이용 방법" 
                                    frameBorder="0" 
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                    referrerPolicy="strict-origin-when-cross-origin" 
                                    allowFullScreen>
                                </iframe>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="flex-none w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center font-black text-xs mt-0.5 shadow-md">1</div>
                                <div>
                                    <p className="instruction-step-title font-black text-gray-800 text-base mb-0.5">본인의 눈에 맞게 측정할 때</p>
                                    <p className="instruction-step-body text-gray-600 font-bold text-xs leading-relaxed">
                                        스마트폰을 평소 성경을 보는 거리에 두고, 슬라이더를 조절하여 화면의 점선 네모칸을 실제 신용카드 크기와 똑같이 맞춰주세요.
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-start gap-3">
                                <div className="flex-none w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center font-black text-xs mt-0.5 shadow-md">2</div>
                                <div>
                                    <p className="instruction-step-title font-black text-gray-800 text-base mb-0.5">부모님 성경을 대신 골라드릴 때</p>
                                    <p className="instruction-step-body text-gray-600 font-bold text-xs leading-relaxed">
                                        부모님이 평소 보시는 성경책을 가져와서, 그 성경의 글자 크기와 화면에 나오는 글자 크기가 똑같아 보일 때까지 슬라이더를 조절해 보세요.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                </div>
            

            {/* 우측 영역: 카드 측정 박스 */}
            <div className="lg:col-span-1 flex flex-col">
                <div className="flex justify-start items-center mb-2 px-1">
                    <p className="text-sm font-black text-gray-400 uppercase">좌측 상단 고정</p>
                </div>
                <div className="bg-grid-pattern bg-white border-2 border-gray-200 rounded-2xl p-2 md:p-8 shadow-inner min-h-[400px] relative overflow-hidden flex items-start justify-start">

                    <div className="credit-card-dynamic bg-orange-50 border-[3px] border-dashed border-orange-400 relative rounded-xl z-10"
                         style={{ width: `${53.98 * globalScale}mm`, height: `${85.6 * globalScale}mm` }}>
                        
                        <div className="crosshair cross-tl absolute top-0 left-0"></div>
                        <div className="crosshair cross-tr absolute top-0 right-0"></div>
                        <div className="crosshair cross-bl absolute bottom-0 left-0"></div>
                        <div className="crosshair cross-br absolute bottom-0 right-0"></div>
                        
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-4">
                            <span className="text-orange-700 font-black text-lg md:text-xl leading-tight">
                                이곳에 카드<br/>
                                (신분증)를 대보세요
                            </span>
                            <span className="text-orange-600 font-bold text-base mt-3 leading-tight opacity-90">
                                측정시 카드 테두리에<br/>
                                점선이 보이도록 맞춰주세요
                            </span>
                        </div>
                    </div>

                </div>
            </div>

            {/* 하단 영역: 이용 방법 및 완료 버튼 (2단 그리드 아래에 전체 너비로 배치) */}
            <div className="lg:col-span-2 mt-4 px-2 md:px-6">
                {/* 이용 방법 아코디언 (모바일 전용: 슬라이더와 카드 영역 사이 간격 최소화 후 배치) */}
                <div className="lg:hidden instruction-container mt-4 mb-2">
                    <button 
                        onClick={() => setIsAccordionOpen(!isAccordionOpen)}
                        className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all hover:bg-orange-100 ${isAccordionOpen ? 'bg-orange-100 border-orange-300 rounded-b-none' : 'bg-orange-50 border-orange-200'}`}
                    >
                        <div className="flex items-center">
                            <div className="bg-white p-2 rounded-full mr-4 shadow-sm">
                                <AlertCircle className="text-orange-600" size={32} strokeWidth={3} />
                            </div>
                            <div>
                                <h3 
                                    className="font-black text-gray-900 leading-none tracking-tighter text-[length:var(--font-section-title)]"
                                >
                                    이용 방법이 궁금하신가요?
                                </h3>
                                <p className="text-sm font-bold text-gray-500 mt-0.5">본인 또는 부모님을 위한 측정 방법</p>
                            </div>
                        </div>
                        <ChevronDown className={`text-orange-500 transition-transform duration-300 ${isAccordionOpen ? 'rotate-180' : ''}`} size={32} strokeWidth={3} />
                    </button>
                    
                    <div className={`accordion-content border-x border-b border-orange-100 rounded-b-2xl bg-orange-50/30 ${isAccordionOpen ? 'open' : ''}`}>
                        <div className="p-6 space-y-6 instruction-container">
                            {/* 10초 이용 시범 영상 */}
                            <div className="bg-black aspect-video rounded-2xl overflow-hidden border-4 border-white shadow-inner relative mb-6">
                                <iframe 
                                    className="absolute top-0 left-0 w-full h-full"
                                    src="https://www.youtube.com/embed/5pwCf0FUXiQ?rel=0&modestbranding=1" 
                                    title="바이블줌 이용 방법" 
                                    frameBorder="0" 
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                    referrerPolicy="strict-origin-when-cross-origin" 
                                    allowFullScreen>
                                </iframe>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="flex-none w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center font-black text-xs mt-0.5 shadow-md">1</div>
                                <div>
                                    <p className="instruction-step-title font-black text-gray-800 text-base mb-0.5">본인의 눈에 맞게 측정할 때</p>
                                    <p className="instruction-step-body text-gray-600 font-bold text-xs leading-relaxed">
                                        스마트폰을 평소 성경을 보는 거리에 두고, 슬라이더를 조절하여 화면의 점선 네모칸을 실제 신용카드 크기와 똑같이 맞춰주세요.
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-start gap-3">
                                <div className="flex-none w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center font-black text-xs mt-0.5 shadow-md">2</div>
                                <div>
                                    <p className="instruction-step-title font-black text-gray-800 text-base mb-0.5">부모님 성경을 대신 골라드릴 때</p>
                                    <p className="instruction-step-body text-gray-600 font-bold text-xs leading-relaxed">
                                        부모님이 평소 보시는 성경책을 가져와서, 그 성경의 글자 크기와 화면에 나오는 글자 크기가 똑같아 보일 때까지 슬라이더를 조절해 보세요.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>


                {/* 측정 완료 버튼 (이용 방법과 동일한 너비로 조정) */}
                <button 
                    onClick={() => {
                        setShowBibleList(true);
                        setTimeout(() => {
                            document.getElementById('bible-list-start')?.scrollIntoView({ behavior: 'smooth' });
                        }, 100);
                    }}
                    className="w-full mt-8 bg-orange-600 text-white font-black py-4 md:py-6 rounded-2xl shadow-xl hover:bg-orange-700 transform active:scale-[0.98] flex flex-row items-center justify-center gap-3 group transition-all"
                >
                    <span 
                        className="leading-none font-black tracking-tighter whitespace-nowrap text-[length:var(--font-btn-submit)]"
                    >
                        측정 완료하고 내 눈에 맞는 성경 보기
                    </span>
                    <ChevronRight className="group-hover:translate-x-1 transition-transform flex-shrink-0" size={uiSize === 'small' ? 24 : uiSize === 'medium' ? 32 : 36} strokeWidth={3} />
                </button>
            </div>
        </div>
    </div>

        <div id="bible-list-start"></div>

        {showBibleList && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">

        {/* 신규 5대 가로형 실시간 필터 격자 표 */}
        <div className="bg-slate-50 border-b border-slate-200 py-6 px-4">
          <div className="max-w-7xl mx-auto">
            {/* 필터 안내 헤더 */}
            <div className="flex justify-between items-center mb-4 px-1">
              <span className="font-black text-slate-800 flex items-center gap-2" style={{ fontSize: 'var(--font-section-title)' }}>
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                실시간 맞춤 필터 
                <span className="hidden sm:inline text-[11px] md:text-xs font-bold text-slate-400">
                  (마스터 체크로 전체 선택/해제 및 세부 개별 선택 가능)
                </span>
              </span>
              <button 
                onClick={resetFilters} 
                className="text-[11px] md:text-xs font-black text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-700 transition-colors shadow-sm cursor-pointer"
              >
                필터 초기화 🔄
              </button>
            </div>
            
            {/* 가로형 격자 표 필터 (모바일 스크롤 지원) */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm bg-white pretty-scrollbar">
              <table className="w-full border-collapse text-left min-w-[900px] table-fixed">
                <thead>
                  <tr className="bg-[#ebf2f7] border-b border-slate-200">
                    {/* 1. 찬송가유무 */}
                    <th className="px-4 py-3 border-r border-slate-200 w-1/6 select-none">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={filters.hymn.master} 
                          onChange={() => toggleMaster('hymn')} 
                          className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-400 cursor-pointer"
                        />
                        <span className="font-black text-slate-700" style={{ fontSize: 'var(--font-instruction-body)' }}>1. 찬송가유무</span>
                      </label>
                    </th>
                    {/* 2. 해설유무 */}
                    <th className="px-4 py-3 border-r border-slate-200 w-1/6 select-none">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={filters.commentary.master} 
                          onChange={() => toggleMaster('commentary')} 
                          className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-400 cursor-pointer"
                        />
                        <span className="font-black text-slate-700" style={{ fontSize: 'var(--font-instruction-body)' }}>2. 해설유무</span>
                      </label>
                    </th>
                    {/* 3. 재질 */}
                    <th className="px-4 py-3 border-r border-slate-200 w-1/6 select-none">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={filters.material.master} 
                          onChange={() => toggleMaster('material')} 
                          className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-400 cursor-pointer"
                        />
                        <span className="font-black text-slate-700" style={{ fontSize: 'var(--font-instruction-body)' }}>3. 재질</span>
                      </label>
                    </th>
                    {/* 4. 크기/휴대성 */}
                    <th className="px-4 py-3 border-r border-slate-200 w-1/6 select-none">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={filters.portability.master} 
                          onChange={() => toggleMaster('portability')} 
                          className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-400 cursor-pointer"
                        />
                        <span className="font-black text-slate-700" style={{ fontSize: 'var(--font-instruction-body)' }}>4. 크기/휴대성</span>
                      </label>
                    </th>
                    {/* 5. 글씨크기 */}
                    <th className="px-4 py-3 border-r border-slate-200 w-1/6 select-none">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={filters.fontSize.master} 
                          onChange={() => toggleMaster('fontSize')} 
                          className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-400 cursor-pointer"
                        />
                        <span className="font-black text-slate-700" style={{ fontSize: 'var(--font-instruction-body)' }}>5. 글씨크기</span>
                      </label>
                    </th>
                    {/* 6. 출판사 */}
                    <th className="px-4 py-3 w-1/6 select-none">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={filters.publisher.master} 
                          onChange={() => toggleMaster('publisher')} 
                          className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-400 cursor-pointer"
                        />
                        <span className="font-black text-slate-700" style={{ fontSize: 'var(--font-instruction-body)' }}>6. 출판사</span>
                      </label>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {/* 1. 찬송가유무 옵션들 */}
                    <td className={`px-4 py-4 border-r border-slate-200 align-top transition-opacity duration-200 ${!filters.hymn.master && Object.values(filters.hymn.options).every(v => !v) ? 'opacity-40' : 'opacity-100'}`}>
                      <div className="flex flex-col gap-2.5">
                        <label className="flex items-center gap-2 cursor-pointer select-none group">
                          <input 
                            type="checkbox" 
                            checked={filters.hymn.options.yes} 
                            onChange={() => toggleOption('hymn', 'yes')} 
                            className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-400 cursor-pointer transition-colors"
                          />
                          <span className="font-bold text-slate-600 group-hover:text-slate-800" style={{ fontSize: 'var(--font-hero-bullets)' }}>있음</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none group">
                          <input 
                            type="checkbox" 
                            checked={filters.hymn.options.no} 
                            onChange={() => toggleOption('hymn', 'no')} 
                            className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-400 cursor-pointer transition-colors"
                          />
                          <span className="font-bold text-slate-600 group-hover:text-slate-800" style={{ fontSize: 'var(--font-hero-bullets)' }}>없음</span>
                        </label>
                      </div>
                    </td>
                    
                    {/* 2. 해설유무 옵션들 */}
                    <td className={`px-4 py-4 border-r border-slate-200 align-top transition-opacity duration-200 ${!filters.commentary.master && Object.values(filters.commentary.options).every(v => !v) ? 'opacity-40' : 'opacity-100'}`}>
                      <div className="flex flex-col gap-2.5">
                        <label className="flex items-center gap-2 cursor-pointer select-none group">
                          <input 
                            type="checkbox" 
                            checked={filters.commentary.options.yes} 
                            onChange={() => toggleOption('commentary', 'yes')} 
                            className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-400 cursor-pointer transition-colors"
                          />
                          <span className="font-bold text-slate-600 group-hover:text-slate-800" style={{ fontSize: 'var(--font-hero-bullets)' }}>있음</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none group">
                          <input 
                            type="checkbox" 
                            checked={filters.commentary.options.no} 
                            onChange={() => toggleOption('commentary', 'no')} 
                            className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-400 cursor-pointer transition-colors"
                          />
                          <span className="font-bold text-slate-600 group-hover:text-slate-800" style={{ fontSize: 'var(--font-hero-bullets)' }}>없음</span>
                        </label>
                      </div>
                    </td>
                    
                    {/* 3. 재질 옵션들 */}
                    <td className={`px-4 py-4 border-r border-slate-200 align-top transition-opacity duration-200 ${!filters.material.master && Object.values(filters.material.options).every(v => !v) ? 'opacity-40' : 'opacity-100'}`}>
                      <div className="flex flex-col gap-2.5">
                        <label className="flex items-center gap-2 cursor-pointer select-none group">
                          <input 
                            type="checkbox" 
                            checked={filters.material.options.natural} 
                            onChange={() => toggleOption('material', 'natural')} 
                            className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-400 cursor-pointer transition-colors"
                          />
                          <span className="font-bold text-slate-600 group-hover:text-slate-800" style={{ fontSize: 'var(--font-hero-bullets)' }}>천연가죽</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none group">
                          <input 
                            type="checkbox" 
                            checked={filters.material.options.pu} 
                            onChange={() => toggleOption('material', 'pu')} 
                            className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-400 cursor-pointer transition-colors"
                          />
                          <span className="font-bold text-slate-600 group-hover:text-slate-800" style={{ fontSize: 'var(--font-hero-bullets)' }}>인조가죽(PU)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none group">
                          <input 
                            type="checkbox" 
                            checked={filters.material.options.other} 
                            onChange={() => toggleOption('material', 'other')} 
                            className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-400 cursor-pointer transition-colors"
                          />
                          <span className="font-bold text-slate-600 group-hover:text-slate-800" style={{ fontSize: 'var(--font-hero-bullets)' }}>기타</span>
                        </label>
                      </div>
                    </td>
                    
                    {/* 4. 크기/휴대성 옵션들 */}
                    <td className={`px-4 py-4 border-r border-slate-200 align-top transition-opacity duration-200 ${!filters.portability.master && Object.values(filters.portability.options).every(v => !v) ? 'opacity-40' : 'opacity-100'}`}>
                      <div className="flex flex-col gap-2.5">
                        <label className="flex items-center gap-2 cursor-pointer select-none group">
                          <input 
                            type="checkbox" 
                            checked={filters.portability.options.small} 
                            onChange={() => toggleOption('portability', 'small')} 
                            className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-400 cursor-pointer transition-colors"
                          />
                          <span className="font-bold text-slate-600 group-hover:text-slate-800" style={{ fontSize: 'var(--font-hero-bullets)' }}>소(미니/특소)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none group">
                          <input 
                            type="checkbox" 
                            checked={filters.portability.options.medium} 
                            onChange={() => toggleOption('portability', 'medium')} 
                            className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-400 cursor-pointer transition-colors"
                          />
                          <span className="font-bold text-slate-600 group-hover:text-slate-800" style={{ fontSize: 'var(--font-hero-bullets)' }}>중</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none group">
                          <input 
                            type="checkbox" 
                            checked={filters.portability.options.large} 
                            onChange={() => toggleOption('portability', 'large')} 
                            className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-400 cursor-pointer transition-colors"
                          />
                          <span className="font-bold text-slate-600 group-hover:text-slate-800" style={{ fontSize: 'var(--font-hero-bullets)' }}>대(대/특대)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none group">
                          <input 
                            type="checkbox" 
                            checked={filters.portability.options.pulpit} 
                            onChange={() => toggleOption('portability', 'pulpit')} 
                            className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-400 cursor-pointer transition-colors"
                          />
                          <span className="font-bold text-slate-600 group-hover:text-slate-800" style={{ fontSize: 'var(--font-hero-bullets)' }}>강대용</span>
                        </label>
                      </div>
                    </td>
                    
                    {/* 5. 글씨크기 옵션들 */}
                    <td className={`px-4 py-4 border-r border-slate-200 align-top transition-opacity duration-200 ${!filters.fontSize.master && Object.values(filters.fontSize.options).every(v => !v) ? 'opacity-40' : 'opacity-100'}`}>
                      <div className="flex flex-col gap-2.5">
                        <label className="flex items-center gap-2 cursor-pointer select-none group">
                          <input 
                            type="checkbox" 
                            checked={filters.fontSize.options.small} 
                            onChange={() => toggleOption('fontSize', 'small')} 
                            className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-400 cursor-pointer transition-colors"
                          />
                          <span className="font-bold text-slate-600 group-hover:text-slate-800" style={{ fontSize: 'var(--font-hero-bullets)' }}>작은글씨</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none group">
                          <input 
                            type="checkbox" 
                            checked={filters.fontSize.options.medium} 
                            onChange={() => toggleOption('fontSize', 'medium')} 
                            className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-400 cursor-pointer transition-colors"
                          />
                          <span className="font-bold text-slate-600 group-hover:text-slate-800" style={{ fontSize: 'var(--font-hero-bullets)' }}>중간글씨</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none group">
                          <input 
                            type="checkbox" 
                            checked={filters.fontSize.options.senior} 
                            onChange={() => toggleOption('fontSize', 'senior')} 
                            className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-400 cursor-pointer transition-colors"
                          />
                          <span className="font-bold text-slate-600 group-hover:text-slate-800" style={{ fontSize: 'var(--font-hero-bullets)' }}>어르신용(큰글씨)</span>
                        </label>
                      </div>
                    </td>

                    {/* 6. 출판사 옵션들 */}
                    <td className={`px-4 py-4 align-top transition-opacity duration-200 ${!filters.publisher.master && Object.values(filters.publisher.options).every(v => !v) ? 'opacity-40' : 'opacity-100'}`}>
                      <div className="flex flex-col gap-2.5">
                        <label className="flex items-center gap-2 cursor-pointer select-none group">
                          <input 
                            type="checkbox" 
                            checked={filters.publisher.options.agape} 
                            onChange={() => toggleOption('publisher', 'agape')} 
                            className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-400 cursor-pointer transition-colors"
                          />
                          <span className="font-bold text-slate-600 group-hover:text-slate-800" style={{ fontSize: 'var(--font-hero-bullets)' }}>아가페</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none group">
                          <input 
                            type="checkbox" 
                            checked={filters.publisher.options.words} 
                            onChange={() => toggleOption('publisher', 'words')} 
                            className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-400 cursor-pointer transition-colors"
                          />
                          <span className="font-bold text-slate-600 group-hover:text-slate-800" style={{ fontSize: 'var(--font-hero-bullets)' }}>생명의말씀사</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none group">
                          <input 
                            type="checkbox" 
                            checked={filters.publisher.options.seong} 
                            onChange={() => toggleOption('publisher', 'seong')} 
                            className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-400 cursor-pointer transition-colors"
                          />
                          <span className="font-bold text-slate-600 group-hover:text-slate-800" style={{ fontSize: 'var(--font-hero-bullets)' }}>성서원</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none group">
                          <input 
                            type="checkbox" 
                            checked={filters.publisher.options.christian} 
                            onChange={() => toggleOption('publisher', 'christian')} 
                            className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-400 cursor-pointer transition-colors"
                          />
                          <span className="font-bold text-slate-600 group-hover:text-slate-800" style={{ fontSize: 'var(--font-hero-bullets)' }}>대한기독교서회</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none group">
                          <input 
                            type="checkbox" 
                            checked={filters.publisher.options.duranno} 
                            onChange={() => toggleOption('publisher', 'duranno')} 
                            className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-400 cursor-pointer transition-colors"
                          />
                          <span className="font-bold text-slate-600 group-hover:text-slate-800" style={{ fontSize: 'var(--font-hero-bullets)' }}>두란노</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none group">
                          <input 
                            type="checkbox" 
                            checked={filters.publisher.options.other} 
                            onChange={() => toggleOption('publisher', 'other')} 
                            className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-400 cursor-pointer transition-colors"
                          />
                          <span className="font-bold text-slate-600 group-hover:text-slate-800" style={{ fontSize: 'var(--font-hero-bullets)' }}>기타</span>
                        </label>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            {/* 모바일 가로스크롤 안내 */}
            <div className="block md:hidden mt-2 text-center text-[10px] md:text-xs font-bold text-slate-400 select-none">
              ↔ 표를 좌우로 밀어서 모든 필터를 확인해 보세요.
            </div>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full border-collapse text-left min-w-max">
            <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-2 md:px-4 py-3 text-left text-[12px] md:text-xs font-black text-slate-400 uppercase bible-list-header whitespace-nowrap">모델명</th>
                  <th className="px-2 md:px-4 py-3 text-center text-[12px] md:text-xs font-black text-slate-400 uppercase bible-list-header whitespace-nowrap">판형</th>
                  <th className="px-2 md:px-4 py-3 text-center text-[12px] md:text-xs font-black text-slate-400 uppercase bible-list-header whitespace-nowrap">실측 / 포인트</th>
                  <th className="px-2 md:px-4 py-3 text-left text-[12px] md:text-xs font-black text-slate-400 uppercase bible-list-header">실제 서체 크기 (미리보기)</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-white">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 bg-white text-center text-slate-400 border-b border-slate-100">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <AlertCircle size={40} className="text-slate-300" />
                      <p className="text-sm md:text-base font-black text-slate-700">선택하신 조건에 매칭되는 성경 제품이 없습니다.</p>
                      <p className="text-[11px] md:text-xs font-bold text-slate-400">필터 조건들을 조금 더 넓히거나 오른쪽 상단의 '필터 초기화'를 클릭해 주세요.</p>
                      <a 
                        href="https://pf.kakao.com/_cxdzxin/chat" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={() => {
                          if (window.gtag) {
                            window.gtag('event', 'click_consultation', { method: 'KakaoTalk', channel: '크리스챤하우스' });
                          }
                        }}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#FEE500] hover:bg-[#FEE500]/90 text-[#191919] font-black text-xs md:text-sm rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer border-0 mt-1.5"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 3c-4.97 0-9 3.185-9 7.11 0 2.502 1.637 4.708 4.148 5.922-.164.568-.595 2.054-.68 2.37-.107.4-.356 1.408.156 1.05.4-.28 1.833-1.258 2.56-1.782.89.248 1.83.38 2.816.38 4.97 0 9-3.185 9-7.11S16.97 3 12 3z"/>
                        </svg>
                        맞춤 성경 1:1 상담하기
                      </a>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => (
                  <tr 
                    key={idx} 
                    className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors group cursor-pointer" 
                    onClick={() => handleItemClick(item)}
                  >
                    <td 
                      className="px-2 md:px-4 py-4 min-w-[120px]"
                      onMouseEnter={(e) => { if (window.innerWidth > 1024) handleMouseEnter(item, e); }}
                      onMouseMove={(e) => { 
                        if (window.innerWidth > 1024 && !isHoverActive) {
                          setMousePos({ x: e.clientX, y: e.clientY });
                          setPopupPos({ x: e.clientX, y: e.clientY });
                        }
                      }}
                      onMouseLeave={handleMouseLeave}
                    >
                      <div className="flex flex-col">
                        <span className="text-[length:var(--font-list-model)] md:text-[length:var(--font-list-model-md)] font-black text-slate-800 whitespace-nowrap flex items-center">
                          <span className={`inline-block mr-2 px-1.5 py-0.5 rounded text-[10px] font-black tracking-tight leading-none ${
                            item.publisherKey === 'A' ? 'bg-purple-100 text-purple-700' :
                            item.publisherKey === 'W' ? 'bg-emerald-100 text-emerald-700' :
                            item.publisherKey === 'S' ? 'bg-sky-100 text-sky-700' :
                            item.publisherKey === 'C' ? 'bg-amber-100 text-amber-700' :
                            item.publisherKey === 'D' ? 'bg-rose-100 text-rose-700' :
                            'bg-indigo-100 text-indigo-700'
                          }`}>
                            {item.publisherName}
                          </span>
                          {item.model}
                        </span>
                        <div className="inline-flex items-center w-fit mt-1 px-1.5 py-0.5 bg-orange-100 rounded text-orange-700 text-[length:var(--font-tag)] font-black tracking-tighter transition-all"><span>상품보기</span></div>
                      </div>
                    </td>
                    <td className="px-2 md:px-4 py-4 text-center">
                      <span className={`inline-flex items-center justify-center min-w-[32px] md:min-w-[40px] px-2 py-1 md:py-1.5 rounded-full text-[12px] md:text-xs font-black shadow-sm bible-list-item-sub whitespace-nowrap ${item.size === '특대' ? 'bg-purple-100 text-purple-700' : item.size === '대' ? 'bg-blue-100 text-blue-700' : item.size === '중' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {item.size}
                      </span>
                    </td>
                    <td className="px-2 md:px-4 py-4 text-center">
                      <div className="flex flex-col items-center justify-center whitespace-nowrap -space-y-1.5">
                        <span className="text-sm md:text-base font-black text-slate-700 bible-list-item-main">{item.mm}mm</span>
                        <span className="text-[12px] md:text-xs font-bold text-orange-500 bible-list-item-sub">{formatPt(item.mm)}pt</span>
                      </div>
                    </td>
                    <td className="px-2 md:px-4 py-4">
                      <div style={{ 
                        fontFamily: "'Noto Serif KR', 'Batang', '바탕체', serif", 
                        fontSize: `${(item.mm / 0.3528) * globalScale}pt`, 
                        fontWeight: '600',
                        letterSpacing: '-0.1em'
                      }} className="text-slate-900 border-l-4 border-slate-200 pl-3 md:pl-5 py-1 leading-none whitespace-nowrap bible-preview-text">
                        태초에 하나님이 천지를 창조하시니라
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        <div className="p-6 md:p-8 bg-black/5 border-t border-stone-200">
          <div className="flex items-start gap-4 text-slate-600 leading-snug">
            <AlertCircle className="mt-0.5 shrink-0 text-slate-500" size={18} />
            <div className="">
              <p className="text-[13px] md:text-[16px] leading-relaxed font-black text-slate-800">본 수치는 직접 자로 측정하여 산출한 근사치로 측정방법에 따라 오차가 있을 수 있습니다.</p>
            </div>
          </div>
        </div>
        

            </div>
          </div>
        )}

        <div className="p-8 bg-gray-50 border-t border-gray-100">
            <div className="text-center mb-8">
                <h3 className="font-black text-gray-800" style={{ fontSize: 'var(--font-share-title)' }}>지인들에게 전달해 주세요</h3>
                <p className="font-bold text-gray-500 mt-2" style={{ fontSize: 'var(--font-share-desc)' }}>링크 하나로 내 눈에 꼭 맞는 성경을 쉽게 찾을 수 있습니다.</p>
            </div>
            
            <div className="flex justify-center space-x-10">
                <button 
                    onClick={handleKakaoShare} 
                    className="flex flex-col items-center group focus:outline-none"
                >
                    <div className="w-20 h-20 bg-[#FEE500] rounded-full flex items-center justify-center shadow-lg group-hover:bg-[#FADA0A] transition-all transform group-hover:scale-110">
                        <svg className="w-10 h-10 text-[#000000]" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 3c-5.523 0-10 3.475-10 7.761 0 2.766 1.83 5.185 4.566 6.471-.16.588-.582 2.146-.667 2.473-.105.412.143.407.306.301.129-.084 2.052-1.378 2.871-1.929C9.97 18.256 10.966 18.33 12 18.33c5.523 0 10-3.475 10-7.761C22 6.475 17.523 3 12 3z"/>
                        </svg>
                    </div>
                    <span className="text-base text-gray-700 font-black mt-3">카카오톡</span>
                </button>

                <button 
                    onClick={handleSmsShare} 
                    className="flex flex-col items-center group focus:outline-none"
                >
                    <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center shadow-lg group-hover:bg-blue-600 transition-all transform group-hover:scale-110">
                        <MessageCircle className="text-white" size={36} />
                    </div>
                    <span className="text-base text-gray-700 font-black mt-3">문자메시지</span>
                </button>

                <button 
                    onClick={handleCopyAppUrl} 
                    className="flex flex-col items-center group focus:outline-none"
                >
                    <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center shadow-lg group-hover:bg-slate-300 transition-all transform group-hover:scale-110">
                        <Share2 className="w-9 h-9 text-slate-700" strokeWidth={2.5} />
                    </div>
                    <span className="text-base text-gray-700 font-black mt-3">링크 복사</span>
                </button>
            </div>
        </div>

        <div className="p-8 pb-12 bg-white border-t border-gray-100 rounded-b-2xl no-zoom">
            <div className="flex flex-col items-center gap-4 mb-6">
                <div>
                    <span className="bg-yellow-400 text-yellow-900 px-4 py-1.5 rounded-full text-[12px] md:text-[14px] font-black border border-yellow-500 shadow-sm">특허출원번호 10-2026-0076623</span>
                </div>
                <div className="text-gray-300 font-bold text-[12px] md:text-xs tracking-[0.2em] uppercase mt-2">
                    POWERED by
                </div>
                <div className="flex justify-center">
                    <img src="/chhouse-logo.png" alt="상록크리스챤하우스" className="h-16 md:h-20 object-contain opacity-90" />
                </div>
            </div>
            
            <div className="max-w-2xl mx-auto bg-gray-50 border border-gray-100 rounded-3xl p-4 sm:p-5 md:p-6 mb-12 text-center shadow-sm">
                <p className="text-orange-600 font-black text-sm md:text-base mb-5">성경책 단체 주문 및 상품 문의</p>
                
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1 md:gap-0">
                    {/* Left: Contact info */}
                    <div className="flex flex-col items-center">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 md:mb-4 border border-gray-50">
                            <svg className="w-5 h-5 md:w-6 md:h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M18 13V11C18 7.68629 15.3137 5 12 5C8.68629 5 6 7.68629 6 11V13M3 13V15C3 16.1046 3.89543 17 5 17H6M21 13V15C21 16.1046 20.1046 17 19 17H18M18 13V17H6V13M18 13H19C20.1046 13 21 12.1046 21 11V10C21 8.89543 20.1046 8 19 8H18M6 13H5C3.89543 13 3 12.1046 3 11V10C3 8.89543 3.89543 8 5 8H6" />
                            </svg>
                        </div>
                        <span className="text-gray-400 font-bold text-[11px] md:text-sm mb-1 md:mb-2">고객센터</span>
                        <div className="flex flex-col gap-0.5 md:gap-1">
                            <h4 className="text-[13px] sm:text-base md:text-lg font-black text-gray-800 tracking-tight">031-483-9152</h4>
                            <h4 className="text-[13px] sm:text-base md:text-lg font-black text-gray-800 tracking-tight">010-8870-8436</h4>
                        </div>
                    </div>

                    {/* Middle: Separator */}
                    <div className="h-20 md:h-28 w-[1px] bg-gray-200 mx-1 md:mx-8"></div>

                    {/* Right: Operating hours */}
                    <div className="flex flex-col items-center">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 md:mb-4 border border-gray-50">
                            <svg className="w-5 h-5 md:w-6 md:h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" />
                            </svg>
                        </div>
                        <span className="text-gray-400 font-bold text-[11px] md:text-sm mb-1 md:mb-2">운영시간</span>
                        <div className="flex flex-col gap-0.5 md:gap-1">
                            <h4 className="text-[12px] sm:text-base md:text-lg font-black text-gray-800">월~토 10:00~18:00</h4>
                            <p className="text-gray-400 font-bold text-[11px] md:text-sm">(주일은 휴무)</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="max-w-xl mx-auto pl-12 md:pl-20 pr-8">
                <div className="text-gray-400 font-bold text-[11px] md:text-[12px] text-left leading-footer-info">
                    상호 : 크리스챤하우스(기독서점) <span className="mx-1 opacity-30">|</span> 대표 : 이정숙 <br />
                    사업자등록번호 : 243-27-01845 <span className="hidden md:inline mx-1 opacity-30">|</span> <br className="block md:hidden" />
                    통신판매업신고 : 2024-경기안산-1136 <br />
                    주소 : 경기도 안산시 단원구 광덕4로 220 (밀레니엄프라자) 3층 307호
                </div>
            </div>

            <div className="mt-10 pt-8 border-t border-gray-50 text-center">
                <div className="flex flex-wrap justify-center gap-1 text-gray-300 text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-widest leading-relaxed">
                    <span className="whitespace-nowrap">Copyright © Christian House.</span> 
                    <span className="whitespace-nowrap">All rights reserved.</span>
                </div>
            </div>
        </div>

        {selectedItem && (
          <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedItem(null)}>
            <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
              <div className="px-6 md:px-8 py-5 md:py-6 flex justify-between items-center border-b border-slate-100 bg-slate-50/50">
                <div>
                  <h3 className="text-lg md:text-xl font-black text-slate-900">{selectedItem.model} / {selectedItem.size} 상품 목록</h3>
                </div>
                <button onClick={() => setSelectedItem(null)} className="p-2 md:p-3 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all shadow-sm">
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-4 md:p-8 max-h-[70vh] overflow-y-auto pretty-scrollbar">
                {getFilteredVariants(selectedItem).length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
                    {getFilteredVariants(selectedItem).map((v, vIdx) => (
                      <div key={vIdx} className="group flex flex-col space-y-2 md:space-y-3 transition-transform duration-300 ease-out hover:-translate-y-1">
                        <a href={v.url} target="_blank" rel="noopener noreferrer" className="flex flex-col space-y-2 md:space-y-3">
                          <div className="aspect-square w-full rounded-xl md:rounded-2xl overflow-hidden border-2 border-slate-100 shadow-sm transition-shadow duration-300 ease-out hover:shadow-[0_22px_60px_rgba(15,23,42,0.12)] group-hover:border-orange-200 relative">
                            <img src={v.img} alt={v.label} className="w-full h-full object-cover transition-transform duration-300 ease-out hover:scale-[1.02]" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors"></div>
                          </div>
                          <div className="space-y-0">
                            <p className="text-[length:var(--font-modal-product)] md:text-[length:var(--font-modal-product-md)] font-black text-slate-800 leading-tight line-clamp-2 min-h-[28px] md:min-h-[34px]">{v.label}</p>
                            <div className="flex flex-row items-baseline gap-x-2 flex-nowrap whitespace-nowrap">
                              {v.salePrice && v.originalPrice && v.salePrice < v.originalPrice ? (
                                <>
                                  <div className="flex items-center gap-1.5 leading-none">
                                    <span className="text-[length:var(--font-price-orig)] md:text-[length:var(--font-price-orig-md)] text-slate-400 line-through">{formatPrice(v.originalPrice)}</span>
                                    <span className="text-[length:var(--font-price-orig)] md:text-[length:var(--font-price-orig-md)] text-red-500 font-black">{Math.round((v.originalPrice - v.salePrice) / v.originalPrice * 100)}% ↓</span>
                                  </div>
                                  <span className="text-[length:var(--font-price-sale)] md:text-[length:var(--font-price-sale-md)] text-orange-600 font-black">{formatPrice(v.salePrice)}</span>
                                </>
                              ) : (
                                <span className="text-[length:var(--font-price-sale)] md:text-[length:var(--font-price-sale-md)] text-orange-600 font-black">{formatPrice(v.salePrice || v.originalPrice)}</span>
                              )}
                            </div>
                          </div>
                        </a>
                        
                        <div className="grid grid-cols-2 gap-1.5 mt-auto pt-1">
                          <button 
                            onClick={() => addToCart(v, selectedItem)}
                            className="flex items-center justify-center bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-black py-2 md:py-2.5 rounded-lg md:rounded-xl text-center text-[10px] md:text-xs px-0.5 md:px-2 whitespace-nowrap tracking-tighter transition-all shadow-xs cursor-pointer w-full"
                          >
                            관심상품담기
                          </button>
                          <a 
                            href={v.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white font-black py-2 md:py-2.5 rounded-lg md:rounded-xl text-center text-[10px] md:text-xs px-0.5 md:px-2 whitespace-nowrap tracking-tighter transition-all shadow-xs cursor-pointer w-full"
                          >
                            바로구매
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 md:py-20 text-slate-400">
                    <AlertCircle size={48} className="mb-4 opacity-20" />
                    {isLoadingVariants[selectedItem.model] ? (
                      <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <p className="text-base md:text-lg font-bold">등록된 상품 정보가 없습니다.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PC 호버 팝업 (퀵 미리보기) */}
        {hoverItem && (
          <div 
            className={`fixed z-[9999] transition-all duration-300 ease-out ${isHoverActive ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
            onMouseEnter={() => { if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current); }}
            onMouseLeave={handleMouseLeave}
            style={getHoverPopupStyle()}
          >
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 p-5 w-[300px] md:w-[440px] max-h-[calc(100vh-80px)] overflow-hidden">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <span className="text-[15px] md:text-[17px] font-black text-slate-800 truncate">{hoverItem.model} / {hoverItem.size} 상품 목록</span>
                <span className="text-[11px] md:text-[12px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded uppercase tracking-wider">Quick Preview</span>
              </div>
              
              <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-160px)] pretty-scrollbar pr-2">
                {getFilteredVariants(hoverItem).length > 0 ? (
                  <div className="max-h-[500px] overflow-y-auto pretty-scrollbar pr-2">
                    <div className="grid grid-cols-2 gap-4">
                      {getFilteredVariants(hoverItem).map((v, vIdx) => (
                        <div key={vIdx} className="flex flex-col space-y-1.5 group/item">
                          <a href={v.url} target="_blank" rel="noopener noreferrer" className="flex flex-col space-y-1">
                            <div className="aspect-square w-full rounded-xl overflow-hidden border border-slate-100 bg-white shadow-sm transition-shadow duration-300 ease-out group-hover/item:border-orange-200 group-hover/item:shadow-[0_22px_60px_rgba(15,23,42,0.12)]">
                              <img src={v.img} alt="" className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover/item:scale-[1.02]" />
                            </div>
                            <p className="text-[length:var(--font-hover-product)] md:text-[length:var(--font-hover-product-md)] font-bold text-slate-600 line-clamp-2 leading-[1.2] mt-1 group-hover/item:text-orange-600 transition-colors">{v.label}</p>
                            <div className="flex flex-row items-baseline gap-x-2 whitespace-nowrap mt-0.5">
                              {v.salePrice && v.originalPrice && v.salePrice < v.originalPrice ? (
                                <>
                                  <div className="flex items-center gap-1 leading-none">
                                    <span className="text-[10px] md:text-[11px] text-slate-400 line-through">{formatPrice(v.originalPrice)}</span>
                                    <span className="text-[10px] md:text-[11px] text-red-500 font-bold">{Math.round((v.originalPrice - v.salePrice) / v.originalPrice * 100)}% ↓</span>
                                  </div>
                                  <p className="text-[14px] md:text-[16px] font-black text-orange-600 leading-none">{formatPrice(v.salePrice)}</p>
                                </>
                              ) : (
                                <p className="text-[14px] md:text-[16px] font-black text-orange-600 leading-none">{formatPrice(v.salePrice || v.originalPrice)}</p>
                              )}
                            </div>
                          </a>
                          
                          <div className="grid grid-cols-2 gap-1.5 mt-auto pt-1">
                            <button 
                              onClick={() => addToCart(v, hoverItem)}
                              className="flex items-center justify-center bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-1.5 rounded-lg text-[9px] md:text-[11px] px-0.5 md:px-2 whitespace-nowrap tracking-tighter transition-all cursor-pointer w-full"
                            >
                              관심상품담기
                            </button>
                            <a 
                              href={v.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white font-bold py-1.5 rounded-lg text-center text-[9px] md:text-[11px] px-0.5 md:px-2 whitespace-nowrap tracking-tighter transition-all cursor-pointer w-full"
                            >
                              바로구매
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                    {isLoadingVariants[hoverItem.model] ? (
                      <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <p className="text-sm font-bold">상품 정보를 불러올 수 없습니다.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 1. 토스트 피드백 알림 */}
        {toastMessage && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[10000] bg-slate-900/90 text-white font-black text-xs md:text-sm px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 border border-slate-700 backdrop-blur-sm animate-toast-slide">
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 2. 우측 하단 고품격 플로팅 장바구니 버튼 */}
        {cartItems.length > 0 && (
          <button 
            onClick={() => setIsCartOpen(true)}
            className="fixed bottom-6 right-6 z-[4900] bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-full shadow-[0_8px_30px_rgba(249,115,22,0.4)] transition-all hover:scale-105 duration-300 ease-out flex items-center justify-center cursor-pointer group hover:rotate-2"
          >
            <ShoppingCart size={24} className="group-hover:scale-110 transition-transform duration-300" />
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-pulse-badge">
              {cartItems.length}
            </span>
          </button>
        )}

        {/* 3. 우측 슬라이딩 장바구니 Drawer (서랍) */}
        {isCartOpen && (
          <div className="fixed inset-0 z-[6000] flex justify-end bg-slate-900/40 backdrop-blur-xs animate-fade-in" onClick={() => setIsCartOpen(false)}>
            <div 
              className="bg-white w-full max-w-[420px] h-full shadow-2xl flex flex-col animate-slide-in-right"
              onClick={e => e.stopPropagation()}
            >
              {/* Drawer Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="text-orange-500" size={22} />
                  <h3 className="text-base md:text-lg font-black text-slate-800">관심 성경 목록</h3>
                  <span className="bg-orange-100 text-orange-600 text-xs font-black px-2 py-0.5 rounded-full">{cartItems.length}</span>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto pr-2 pl-6 py-6 pretty-scrollbar space-y-4">
                {cartItems.length > 0 ? (
                  <>
                    {/* 전체 선택 바 */}
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100 pr-4">
                      <label className={`flex items-center gap-2 font-black text-slate-600 cursor-pointer select-none transition-all duration-200 ${
                        uiSize === 'small' ? 'text-xs md:text-[13px]' :
                        uiSize === 'large' ? 'text-[14px] md:text-[15px]' :
                        'text-[13px] md:text-[14px]'
                      }`}>
                        <input 
                          type="checkbox"
                          checked={cartItems.length > 0 && selectedCartIds.length === cartItems.length}
                          onChange={toggleSelectAllCart}
                          className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                        />
                        전체 선택 ({selectedCartIds.length}/{cartItems.length})
                      </label>
                      {selectedCartIds.length > 0 && (
                        <button 
                          onClick={() => {
                            setCartItems(prev => prev.filter(i => !selectedCartIds.includes(i.uniqueId)));
                            showToast('🗑️ 선택한 상품들을 삭제했습니다.');
                          }}
                          className={`font-black text-red-500 hover:text-red-600 transition-all duration-200 ${
                            uiSize === 'small' ? 'text-[11px] md:text-[12px]' :
                            uiSize === 'large' ? 'text-[13px] md:text-[14px]' :
                            'text-[12px] md:text-[13px]'
                          }`}
                        >
                          선택 삭제
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      {cartItems.map((item) => (
                        <div key={item.uniqueId} className="flex items-center gap-3 border border-slate-100 p-4 rounded-2xl bg-white shadow-xs relative hover:border-slate-200 transition-all">
                          {/* 개별 선택 체크박스 */}
                          <div className="flex-shrink-0 flex items-center justify-center">
                            <input 
                              type="checkbox"
                              checked={selectedCartIds.includes(item.uniqueId)}
                              onChange={() => toggleSelectCartItem(item.uniqueId)}
                              className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                            />
                          </div>

                          {/* 상품 클릭 영역 (쇼핑몰 상세페이지 연결) */}
                          <a 
                            href={item.variantUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex-1 flex gap-3 min-w-0 pr-6 group/item cursor-pointer"
                          >
                            <div className={`rounded-xl overflow-hidden border border-slate-100 flex-shrink-0 bg-slate-50 group-hover/item:border-orange-200 transition-all duration-200 ${
                              uiSize === 'small' ? 'w-14 h-14' :
                              uiSize === 'large' ? 'w-20 h-20' :
                              'w-16 h-16'
                            }`}>
                              <img src={item.variantImg} alt="" className="w-full h-full object-cover group-hover/item:scale-[1.03] transition-transform duration-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-[8px] md:text-[9px] font-black text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded uppercase tracking-wider">{item.publisherName}</span>
                              <h4 className={`font-black text-slate-800 truncate mt-0.5 group-hover/item:text-orange-600 transition-colors ${
                                uiSize === 'small' ? 'text-xs md:text-[13px]' :
                                uiSize === 'large' ? 'text-[14px] md:text-[16px]' :
                                'text-[13px] md:text-[14px]'
                              }`}>{item.model}</h4>
                              <p className={`font-bold text-slate-400 mt-0.5 leading-none ${
                                uiSize === 'small' ? 'text-[10px]' :
                                uiSize === 'large' ? 'text-[12px] md:text-[13px]' :
                                'text-[11px]'
                              }`}>{item.variantLabel} / {item.size}</p>
                              <div className="flex items-baseline gap-1.5 mt-1.5">
                                <span className="text-xs font-black text-slate-800">{formatPrice(item.salePrice || item.originalPrice)}</span>
                                {item.salePrice < item.originalPrice && (
                                  <span className="text-[9px] text-slate-400 line-through">{formatPrice(item.originalPrice)}</span>
                                )}
                              </div>
                            </div>
                          </a>

                          {/* 개별 바로구매 버튼 */}
                          <button 
                            onClick={() => handleIndividualCheckout(item)}
                            className={`bg-orange-500 hover:bg-orange-600 text-white font-black rounded-lg transition-all flex items-center shrink-0 cursor-pointer border-0 shadow-xs shadow-orange-500/10 ${
                              uiSize === 'small' ? 'px-2 py-1 text-[9px] md:text-[10px]' :
                              uiSize === 'large' ? 'px-3 py-2 text-[11px] md:text-[13px]' :
                              'px-2.5 py-1.5 text-[10px] md:text-[11px]'
                            }`}
                            title="바로구매"
                          >
                            바로구매 🚀
                          </button>

                          {/* 개별 삭제 버튼 */}
                          <button 
                            onClick={() => removeFromCart(item.uniqueId)}
                            className="text-slate-300 hover:text-red-500 p-1 rounded-full transition-colors cursor-pointer flex-shrink-0"
                            title="삭제"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20 pr-4">
                    <ShoppingCart size={48} className="mb-4 opacity-20" />
                    <p className="text-sm font-bold">관심상품이 비어 있습니다.</p>
                    <p className="text-xs text-slate-400 mt-1">마음에 드는 성경을 관심상품에 담아보세요!</p>
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              {cartItems.length > 0 && (
                <div className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-4">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-bold text-slate-500">선택한 성경 총 합계</span>
                    <div className="text-right">
                      <span className="text-xl font-black text-orange-600">
                        {formatPrice(cartItems.filter(item => selectedCartIds.includes(item.uniqueId)).reduce((acc, curr) => acc + (curr.salePrice || curr.originalPrice), 0))}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {selectedCartIds.length >= 1 && (
                      <button 
                        onClick={() => setIsCompareOpen(true)}
                        className="w-full h-12 bg-slate-900 hover:bg-black text-white font-black rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer border-0 mb-1"
                      >
                        <Ruler className="w-4 h-4 text-orange-500 animate-pulse" />
                        선택상품 실물 폰트 크기 비교 🔍
                      </button>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={handleKakaoCartShare}
                        className="h-12 bg-[#FEE500] hover:bg-[#FDD835] text-[#191919] font-black rounded-xl text-[11px] md:text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer border-0"
                      >
                        <svg className="w-4 h-4 fill-current text-[#191919]" viewBox="0 0 24 24">
                          <path d="M12 3c-4.97 0-9 3.185-9 7.112 0 2.53 1.69 4.743 4.25 5.922-.16.59-.58 2.147-.66 2.476-.11.417.14.41.3.3.12-.08 1.94-1.32 2.71-1.854.78.217 1.62.336 2.4.336 4.97 0 9-3.185 9-7.112 0-3.927-4.03-7.112-9-7.112z"/>
                        </svg>
                        카톡 공유 💬
                      </button>
                      <button 
                        onClick={handleCopyCartLink}
                        className="h-12 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-xl text-[11px] md:text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer border border-slate-200"
                      >
                        <Share2 className="w-4 h-4" />
                        링크 복사 🔗
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <button 
                        onClick={clearCart}
                        className="h-12 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center"
                      >
                        전체 비우기
                      </button>
                      <button 
                        onClick={handleBatchCheckout}
                        className="col-span-2 h-12 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-xl text-xs transition-all shadow-md shadow-orange-500/10 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        선택 상품 바로구매 🚀
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 선택상품 실물 폰트 크기 비교 모달 */}
        {isCompareOpen && (
          <div className="fixed inset-0 z-[6000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-2 md:p-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-100 animate-in zoom-in-95 duration-200">
              
              {/* 모달 헤더 */}
              <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-lg md:text-xl font-black text-slate-800 flex items-center gap-2">
                    <Ruler className="text-orange-500 animate-bounce" size={22} />
                    선택상품 실물 글씨 크기 비교 🔍
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    현재 스마트폰/PC 화면 비율이 적용된 실제 글자 크기입니다. 화면에 직접 대고 비교해 보세요!
                  </p>
                </div>
                <button 
                  onClick={() => setIsCompareOpen(false)}
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer border-0 bg-transparent flex items-center justify-center"
                >
                  <X size={20} />
                </button>
              </div>

              {/* 모달 바디 (스크롤 영역) */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/30">
                
                {/* 캘리브레이션/화면조정 권장 안내 배너 */}
                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 md:p-5 flex flex-col gap-3 md:gap-4 items-center md:flex-row md:justify-between shadow-xs">
                  <div className="flex gap-3 items-start w-full">
                    <span className="text-xl md:text-2xl shrink-0 mt-0.5">💡</span>
                    <div className="text-[12px] md:text-[14px] text-slate-700 leading-relaxed font-bold">
                      <span className="font-black text-orange-600">[실물 크기 측정 안내] 기기마다 화면 크기가 달라 실제 폰트 크기가 약간 다르게 보일 수 있습니다.</span>
                      <br />
                      신용카드로 화면 비율을 한 번만 설정해주시면 실제 인쇄된 성경책과 100% 동일한 글씨 크기로 오차없이 완벽하게 비교하실 수 있습니다!
                    </div>
                  </div>
                  <button 
                    onClick={scrollToCalibration}
                    className="shrink-0 w-full md:w-auto text-[13px] md:text-[14px] font-black bg-orange-500 hover:bg-orange-600 text-white px-4 md:px-5 py-2.5 rounded-xl border-0 cursor-pointer transition-colors shadow-md mt-1 md:mt-0 whitespace-nowrap"
                  >
                    지금 화면 비율 조절하기 📏
                  </button>
                </div>

                {cartItems
                  .filter(item => selectedCartIds.includes(item.uniqueId))
                  .map(item => {
                    const originalBibleItem = bibleData[item.publisherKey]?.items.find(i => i.model === item.model && i.size === item.size);
                    const mm = originalBibleItem ? originalBibleItem.mm : 3.0;
                    
                    return (
                      <div 
                        key={item.uniqueId} 
                        className="flex flex-row items-center gap-2 md:gap-4 p-2.5 md:p-4 rounded-2xl border border-slate-200/60 bg-white shadow-sm transition-all hover:shadow-md w-full overflow-hidden"
                      >
                        {/* 성경 기본 정보 메타 영역 (모바일 고정 가로폭 우측으로 확장하여 시인성 향상) */}
                        <div className="w-[125px] md:w-[190px] shrink-0 flex flex-col gap-1 border-r border-slate-100 pr-2 md:pr-4">
                          <div className="flex items-center gap-1.5">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] md:text-[11px] font-black ${
                              item.publisherKey === 'A' ? 'bg-purple-100 text-purple-700' :
                              item.publisherKey === 'W' ? 'bg-emerald-100 text-emerald-700' :
                              item.publisherKey === 'S' ? 'bg-sky-100 text-sky-700' :
                              item.publisherKey === 'C' ? 'bg-amber-100 text-amber-700' :
                              'bg-rose-100 text-rose-700'
                            }`}>
                              {item.publisherName}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] md:text-[11px] font-black ${
                              item.size === '특대' ? 'bg-purple-50 text-purple-600' : 
                              item.size === '대' ? 'bg-blue-50 text-blue-600' : 
                              item.size === '중' ? 'bg-green-50 text-green-600' : 
                              'bg-orange-50 text-orange-600'
                            }`}>
                              {item.size}
                            </span>
                          </div>
                          <div className={`font-black text-slate-800 leading-tight truncate ${
                            uiSize === 'small' ? 'text-[13px] md:text-[14px]' :
                            uiSize === 'large' ? 'text-[15px] md:text-[17px]' :
                            'text-[14px] md:text-[15px]'
                          }`}>{item.model}</div>
                          <div className={`text-slate-500 truncate font-bold leading-none ${
                            uiSize === 'small' ? 'text-[11px]' :
                            uiSize === 'large' ? 'text-[13px] md:text-[14px]' :
                            'text-[12px]'
                          }`}>{item.variantLabel}</div>
                          <div className="flex items-baseline gap-1 mt-0.5">
                            <span className="text-[12px] md:text-[14px] font-black text-orange-500">{mm}mm</span>
                            <span className="text-[10px] md:text-[11px] text-slate-400 font-bold">({formatPt(mm)}pt)</span>
                          </div>
                        </div>

                        {/* 실물 폰트 크기 인쇄 시뮬레이터 (1단 가로 배치) */}
                        <div className="flex-1 bg-slate-50/75 rounded-xl md:rounded-2xl p-2 md:p-4 overflow-x-auto flex items-center min-h-[72px] md:min-h-[90px] border border-dashed border-slate-200 overflow-y-hidden">
                          <div 
                            style={{ 
                              fontFamily: "'Noto Serif KR', 'Batang', '바탕체', serif", 
                              fontSize: `${(mm / 0.3528) * globalScale}pt`, 
                              fontWeight: '600',
                              letterSpacing: '-0.1em',
                              whiteSpace: 'nowrap'
                            }} 
                            className="text-slate-900 leading-none pl-1 md:pl-2 select-none"
                          >
                            태초에 하나님이 천지를 창조하시니라
                          </div>
                        </div>
                      </div>
                    );
                  })
                }
              </div>

              {/* 모달 푸터 (구매 및 공유 버튼그룹) */}
              <div className="p-4 md:p-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
                <div className="text-xs text-slate-500 font-medium text-center sm:text-left">
                  비교 대상: <span className="font-black text-slate-700">{cartItems.filter(item => selectedCartIds.includes(item.uniqueId)).length}개</span>의 성경
                </div>
                
                <div className="flex w-full sm:w-auto items-center gap-2">
                  <button 
                    onClick={() => {
                      setIsCompareOpen(false);
                      handleKakaoCartShare();
                    }}
                    className="flex-1 sm:flex-initial h-12 bg-[#FEE500] hover:bg-[#FDD835] text-[#191919] font-black px-3 rounded-xl text-[11px] md:text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border-0 shadow-sm"
                  >
                    카톡 공유 💬
                  </button>
                  <button 
                    onClick={() => {
                      setIsCompareOpen(false);
                      handleCopyCartLink();
                    }}
                    className="flex-1 sm:flex-initial h-12 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black px-3 rounded-xl text-[11px] md:text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200 shadow-sm"
                  >
                    <Share2 className="w-4 h-4" />
                    링크 복사 🔗
                  </button>
                  <button 
                    onClick={() => {
                      setIsCompareOpen(false);
                      handleBatchCheckout();
                    }}
                    className="flex-[1.5] sm:flex-initial h-12 bg-orange-500 hover:bg-orange-600 text-white font-black px-4 rounded-xl text-xs md:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-orange-500/10"
                  >
                    바로구매 🚀
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

    </div>
  </div>
  );
};

export default App;
