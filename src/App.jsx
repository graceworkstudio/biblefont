import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  
  // iframe 스크롤 추적을 위한 고성능 ref 시스템
  const fixedRefs = useRef({ toast: null, cartBtn: null, drawer: null });

  const setFixedRef = useCallback((key) => {
    return (el) => {
      fixedRefs.current[key] = el;
      if (el && window.__updateIframePositions) {
        window.__updateIframePositions();
      }
    };
  }, []);

  useEffect(() => {
    if (window.parent !== window) {
      let isRunning = true;

      const updatePositions = () => {
        try {
          const frame = window.frameElement;
          if (!frame) return;

          const iframeRect = frame.getBoundingClientRect();
          const windowHeight = window.parent.innerHeight || window.innerHeight;
          
          // iframeRect.top 은 부모 뷰포트 상단 대비 iframe 상단의 위치 (스크롤 내릴수록 음수)
          // 뷰포트의 상단이 iframe 내에서 어디쯤인지 계산 (-iframeRect.top)
          let topOffset = -iframeRect.top;
          if (topOffset < 0) topOffset = 0;

          if (fixedRefs.current.toast) {
            fixedRefs.current.toast.style.position = 'absolute';
            fixedRefs.current.toast.style.top = `${topOffset + windowHeight - 120}px`;
            fixedRefs.current.toast.style.bottom = 'auto';
          }
          if (fixedRefs.current.cartBtn) {
            fixedRefs.current.cartBtn.style.position = 'absolute';
            fixedRefs.current.cartBtn.style.top = `${topOffset + windowHeight - 90}px`;
            fixedRefs.current.cartBtn.style.bottom = 'auto';
          }
          if (fixedRefs.current.drawer) {
            fixedRefs.current.drawer.style.position = 'absolute';
            fixedRefs.current.drawer.style.top = `${topOffset}px`;
            fixedRefs.current.drawer.style.height = `${windowHeight}px`;
            fixedRefs.current.drawer.style.bottom = 'auto';
          }
        } catch(e) {}
      };

      window.__updateIframePositions = updatePositions;

      // scroll 이벤트에 의존하지 않고 항상 프레임 단위로 추적 (어떤 부모 엘리먼트가 스크롤되든 완벽히 작동)
      const loop = () => {
        if (!isRunning) return;
        updatePositions();
        window.requestAnimationFrame(loop);
      };
      window.requestAnimationFrame(loop);

      return () => {
        isRunning = false;
        delete window.__updateIframePositions;
      };
    }
  }, []);

  // Auto-resize iframe logic to remove double scrollbars & fix parent logo link
  useEffect(() => {
    // Only run if we are inside an iframe
    if (window.parent && window.parent !== window) {
      const container = document.getElementById('bz-main-container');
      if (!container) return;

      const resizeObserver = new ResizeObserver((entries) => {
        // Measure the actual container's scrollHeight/offsetHeight instead of document.body
        // This prevents the infinite resizing feedback loop
        const height = entries[0].target.offsetHeight;
        window.parent.postMessage({ type: 'bz-resize', height: height + 50 }, '*');
      });
      resizeObserver.observe(container);
      
      // Also trigger once on load
      window.parent.postMessage({ type: 'bz-resize', height: container.offsetHeight + 50 }, '*');
      
      // [FIX] 부모 창의 쇼핑몰 로고(좌측 상단)가 현재 도메인(biblezoom.co.kr)으로 이동하는 문제 해결
      try {
        const parentLogo = window.parent.document.querySelector('.sidebar_logo a');
        if (parentLogo) {
          parentLogo.href = 'https://chhouse.kr/';
        }
      } catch (e) {
        // Cross-origin 등 접근 불가 시 조용히 무시
      }

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

  // 공통: Cafe24 장바구니 조용히 담기 (부모 창의 숨겨진 Form 전송 + Firebase 프록시로 item_code 추출)
  const quietlyAddToCart = async (item) => {
    return new Promise(async (resolve) => {
      const matchProductNo = item.variantUrl.match(/[?&]product_no=(\d+)/);
      const productNo = matchProductNo ? matchProductNo[1] : null;
      if (!productNo) return resolve();

      let domain = 'https://chhouse.kr';
      try {
        const parsed = new URL(item.variantUrl);
        domain = `${parsed.protocol}//${parsed.host}`;
      } catch (e) {}

      // Cafe24 장바구니 필수 파라미터인 item_code 추출
      // ⚠️ 브라우저 iframe에서 직접 chhouse.kr fetch 시 CORS 차단 → Firebase Functions 프록시 사용
      let itemCode = null;
      try {
        const proxyUrl = `https://biblefont.web.app/api/getItemCode?url=${encodeURIComponent(item.variantUrl)}`;
        const res = await fetch(proxyUrl);
        if (res.ok) {
          const json = await res.json();
          if (json.itemCode) {
            itemCode = json.itemCode;
          }
        }
      } catch (e) {
        console.error('Failed to fetch item_code via proxy', e);
      }

      // item_code를 못 가져온 경우 로그 출력 (장바구니 담기 실패 원인이 될 수 있음)
      if (!itemCode) {
        console.warn(`[BibleZoom] item_code not found for product_no=${productNo}, URL=${item.variantUrl}`);
      }

      try {
        if (window.parent && window.parent !== window && window.parent.document) {
          const iframeId = `bz-cart-iframe-${productNo}-${Date.now()}`;
          const iframe = window.parent.document.createElement('iframe');
          iframe.name = iframeId;
          iframe.style.display = 'none';
          window.parent.document.body.appendChild(iframe);

          const form = window.parent.document.createElement('form');
          form.method = 'POST';
          form.action = `${domain}/exec/front/order/basket/`;
          form.target = iframeId;

          const data = {
            product_no: productNo,
            quantity: 1,
            basket_type: 'A0000',
            delvtype: 'A',
            is_individual_buy: 'F'
          };

          // 핵심: Cafe24는 단일상품이라도 item_code가 포함된 selected_item[] 배열을 요구합니다.
          if (itemCode) {
            data['selected_item[]'] = `1||${itemCode}`;
          }

          for (const key in data) {
            const input = window.parent.document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = data[key];
            form.appendChild(input);
          }

          window.parent.document.body.appendChild(form);
          form.submit();

          setTimeout(() => {
            try {
              form.remove();
              iframe.remove();
            } catch(e) {}
            resolve();
          }, 800);
          return;
        }
      } catch (e) {
        console.error('Parent form append failed', e);
      }

      // Fallback
      resolve();
    });
  };

  // 개별 상품 바로구매 (깜빡임 글리치 방지를 위해 조용히 담고 리다이렉트)
  const handleIndividualCheckout = async (item) => {
    const matchProductNo = item.variantUrl.match(/[?&]product_no=(\d+)/);
    const productNo = matchProductNo ? matchProductNo[1] : null;

    if (productNo) {
      let domain = 'https://chhouse.kr';
      try {
        const parsed = new URL(item.variantUrl);
        domain = `${parsed.protocol}//${parsed.host}`;
      } catch (e) {}

      setIsCartSubmitting(true);
      await quietlyAddToCart(item);
      
      // 장바구니 담기 완료 후 페이지 이동
      setIsCartSubmitting(false);
      setIsCartOpen(false);
      const cartUrl = `${domain}/order/basket.html`;
      if (window.parent && window.parent !== window) {
        window.parent.location.href = cartUrl;
      } else {
        window.location.href = cartUrl;
      }
    } else {
      showToast('❌ 상품 정보를 찾을 수 없습니다.');
    }
  };

  // 다중 상품 일괄 구매 (루프를 돌며 개별 폼 전송)
  const handleBatchCheckout = async () => {
    const selectedItems = cartItems.filter(item => selectedCartIds.includes(item.uniqueId));
    if (selectedItems.length === 0) {
      showToast('⚠️ 선택된 성경이 없습니다.');
      return;
    }

    setIsCartSubmitting(true);
    showToast('🛒 여러 성경을 장바구니에 담고 있습니다. 잠시만 기다려 주세요...');

    let targetDomain = 'https://chhouse.kr';
    try {
      const parsed = new URL(selectedItems[0].variantUrl);
      targetDomain = `${parsed.protocol}//${parsed.host}`;
    } catch(e) {}

    // 선택된 상품들을 순차적으로 장바구니에 담기
    for (const item of selectedItems) {
      const matchProductNo = item.variantUrl.match(/[?&]product_no=(\d+)/);
      const productNo = matchProductNo ? matchProductNo[1] : null;

      if (productNo) {
        let domain = targetDomain;
        try {
          const parsed = new URL(item.variantUrl);
          domain = `${parsed.protocol}//${parsed.host}`;
        } catch(e) {}

        await quietlyAddToCart(item);
      }
    }

    setIsCartSubmitting(false);
    setIsCartOpen(false);

    // 모든 처리가 끝난 후 부모 창을 장바구니 페이지로 이동
    const cartUrl = `${targetDomain}/order/basket.html`;
    if (window.parent && window.parent !== window) {
      window.parent.location.href = cartUrl;
    } else {
      window.location.href = cartUrl;
    }
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
      const res = await fetch(`https://biblefont.web.app/api/cafe24Products?keyword=${encodeURIComponent(modelName)}`);
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
    <div id="bz-main-container" className={`bg-slate-50 p-1 md:p-8 text-slate-900 font-sans ui-font-zoom-${uiSize}`}>
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
                    <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgwAAADoCAYAAACDzLyyAAAACXBIWXMAAAsTAAALEwEAmpwYAAAK2GlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgOS4xLWMwMDIgNzkuYTZhNjM5NjhhLCAyMDI0LzAzLzA2LTExOjUyOjA1ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnRpZmY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vdGlmZi8xLjAvIiB4bWxuczpleGlmPSJodHRwOi8vbnMuYWRvYmUuY29tL2V4aWYvMS4wLyIgeG1wTU06RG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOjIzMGI0NWQwLTM2NjUtZGM0Zi04YmVmLTdmY2E5NDU3NDIzZiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDphMDE1NzFjYS1iNTg3LTQ2NjItOWYyNy0wZmYzZTVhNDJmNzkiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0iMEQ2RkJENTU4QTIwMjMzMENFQTQ3Q0UyMTA0ODlGNTEiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiB4bXA6Q3JlYXRlRGF0ZT0iMjAyNC0wNS0yNFQxODowNjoxNCswOTowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyNC0wOC0xNlQxNjo0NzoyMyswOTowMCIgeG1wOk1vZGlmeURhdGU9IjIwMjQtMDgtMTZUMTY6NDc6MjMrMDk6MDAiIHRpZmY6SW1hZ2VXaWR0aD0iMjQwIiB0aWZmOkltYWdlTGVuZ3RoPSIxMTEiIHRpZmY6UGhvdG9tZXRyaWNJbnRlcnByZXRhdGlvbj0iMiIgdGlmZjpTYW1wbGVzUGVyUGl4ZWw9IjMiIHRpZmY6WFJlc29sdXRpb249IjEvMSIgdGlmZjpZUmVzb2x1dGlvbj0iMS8xIiB0aWZmOlJlc29sdXRpb25Vbml0PSIxIiBleGlmOkV4aWZWZXJzaW9uPSIwMjMxIiBleGlmOkNvbG9yU3BhY2U9IjY1NTM1IiBleGlmOlBpeGVsWERpbWVuc2lvbj0iMjQwIiBleGlmOlBpeGVsWURpbWVuc2lvbj0iMTExIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6ZjAwNmI2NmItY2Q0Mi00Njc2LWIxNjYtZGNhOTFhNzMyZWU0IiBzdEV2dDp3aGVuPSIyMDI0LTA4LTE2VDE2OjM3OjQxKzA5OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgMjUuMTEgKE1hY2ludG9zaCkiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjViNjlkZTRhLTUxYzgtNGFkYi1iYTY1LTM5NzIwMTk1OGM5YSIgc3RFdnQ6d2hlbj0iMjAyNC0wOC0xNlQxNjozODo0OCswOTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDI1LjExIChNYWNpbnRvc2gpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjb252ZXJ0ZWQiIHN0RXZ0OnBhcmFtZXRlcnM9ImZyb20gaW1hZ2UvanBlZyB0byBpbWFnZS9wbmciLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImRlcml2ZWQiIHN0RXZ0OnBhcmFtZXRlcnM9ImNvbnZlcnRlZCBmcm9tIGltYWdlL2pwZWcgdG8gaW1hZ2UvcG5nIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDpmOWQ0YTJiZC05MzAwLTRlMTUtYmMwYi0yY2JlMmE5NTQ4NjciIHN0RXZ0OndoZW49IjIwMjQtMDgtMTZUMTY6Mzg6NDgrMDk6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyNS4xMSAoTWFjaW50b3NoKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6YTAxNTcxY2EtYjU4Ny00NjYyLTlmMjctMGZmM2U1YTQyZjc5IiBzdEV2dDp3aGVuPSIyMDI0LTA4LTE2VDE2OjQ3OjIzKzA5OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgMjUuMTEgKE1hY2ludG9zaCkiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjViNjlkZTRhLTUxYzgtNGFkYi1iYTY1LTM5NzIwMTk1OGM5YSIgc3RSZWY6ZG9jdW1lbnRJRD0iMEQ2RkJENTU4QTIwMjMzMENFQTQ3Q0UyMTA0ODlGNTEiIHN0UmVmOm9yaWdpbmFsRG9jdW1lbnRJRD0iMEQ2RkJENTU4QTIwMjMzMENFQTQ3Q0UyMTA0ODlGNTEiLz4gPHRpZmY6Qml0c1BlclNhbXBsZT4gPHJkZjpTZXE+IDxyZGY6bGk+ODwvcmRm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" alt="상록크리스챤하우스" className="h-16 md:h-20 object-contain opacity-90" />
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
                            target="_parent" 
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
                              target="_parent" 
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
          <div 
            ref={setFixedRef('toast')}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[10000] bg-slate-900/90 text-white font-black text-xs md:text-sm px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 border border-slate-700 backdrop-blur-sm animate-toast-slide"
          >
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 2. 우측 하단 고품격 플로팅 장바구니 버튼 */}
        {cartItems.length > 0 && (
          <button 
            ref={setFixedRef('cartBtn')}
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
          <div 
            ref={setFixedRef('drawer')}
            className="fixed inset-0 z-[6000] flex justify-end bg-slate-900/40 backdrop-blur-xs animate-fade-in" 
            onClick={() => setIsCartOpen(false)}
          >
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
