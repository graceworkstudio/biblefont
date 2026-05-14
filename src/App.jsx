import React, { useState, useEffect, useRef } from 'react';
import { Ruler, BookOpen, AlertCircle, X, Bell, ExternalLink, ShoppingCart, ShoppingBag, ChevronDown, ChevronRight, MessageCircle, Play, Gift } from 'lucide-react';
import BannerComponent from './BannerComponent';


const APP_VERSION = 'v2.5.4';
const UPDATE_NOTES = [
  "출판사 데이터(생명의말씀사, 대한기독교서회, 성서원, 두란노) 복구 완료",
  "영점 조절 및 출판사 선택 영역 배경색 모바일 최적화",
  "측정바 양쪽 막대 두께 조정(1px)으로 정밀도 개선",
  "모바일 실측/포인트 폰트 크기 최적화 (14px)",
  "전체적인 UI 톤앤매너 일관성 작업 (따뜻한 베이지/그레이 적용)"
];

const ENABLE_UI_UPDATE_MODAL = false;

/** 첫 화면 공감 카피(B안): 기능 설명 전 스크롤 상단 노출 */
const EMPATHY_PARENT_HEADLINE = '부모님 성경 선물 전에 꼭 확인해 보세요.';
const EMPATHY_BULLETS = [
  '성경 글씨가 너무 작아서 힘들다고 느낄 때',
  '사진만으로는 실제 글자 크기가 잘 감이 오지 않을 때',
  '부모님 눈에 맞는지, 선물 전에 화면에서 미리 맞춰보고 싶을 때',
];

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
    if (typeof gtag !== 'function') return;
    let pageTitle = '바이블줌 BibleZoom - 홈';
    let pagePath = '/';

    if (showBibleList) {
       pagePath = `/bible-list?tab=${activeTab}`;
       pageTitle = `바이블줌 BibleZoom - 성경 목록 (${activeTab} 탭)`;
    } else if (selectedItem) {
       pagePath = `/product-modal?model=${encodeURIComponent(selectedItem.model)}`;
       pageTitle = `바이블줌 BibleZoom - 상세 (${selectedItem.model})`;
    }

    gtag('event', 'page_view', {
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
            description: '앱 설치 없이 지금 바로 내 스마트폰에서 실제 글자 크기를 확인해 보세요! 👉 biblezoom.co.kr',
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

  const bibleData = {
  "A": {
    "name": "아가페",
    "items": [
      {
        "model": "NKR82AB",
        "size": "특대",
        "mm": 4.7,
        "type": "standard",
        "variants": [
          {
            "label": "특대합본/천연/자두",
            "img": "https://chhouse.cafe24.com/web/product/big/202409/8abc83b30eec79bac9f6f0daddea0683.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=49886&cate_no=1358&display_group=1",
            "originalPrice": 92000,
            "salePrice": 82800
          },
          {
            "label": "특대합본/천연/다크브라운",
            "img": "https://chhouse.cafe24.com/web/product/big/202409/6c6a3aff7031942f4cc78ff626ddee3c.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=49887&cate_no=1358&display_group=1",
            "originalPrice": 92000,
            "salePrice": 82800
          },
          {
            "label": "특대단본/천연/다크브라운",
            "img": "https://chhouse.cafe24.com/web/product/big/202512/81a74ffca27cd0b8a31341415342f722.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=56150&cate_no=1358&display_group=1",
            "originalPrice": 72000,
            "salePrice": 64800
          },
          {
            "label": "특대합본/PU/브라운",
            "img": "https://chhouse.cafe24.com/web/product/big/202404/250f2cc92b75b7a5448c0d41cd96d379.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=18102&cate_no=1358&display_group=1",
            "originalPrice": 72000,
            "salePrice": 64800
          },
          {
            "label": "특대합본/PU/다크브라운",
            "img": "https://chhouse.cafe24.com/web/product/big/202404/d1bc4280f5d8bbb1335538228abd31ed.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=18099&cate_no=1358&display_group=1",
            "originalPrice": 72000,
            "salePrice": 64800
          }
        ]
      },
      {
        "model": "NKR72EAB",
        "size": "대",
        "mm": 4.5,
        "type": "standard",
        "variants": [
          {
            "label": "대합본/천연/자주",
            "img": "https://chhouse.cafe24.com/web/product/big/202404/c00a556d3afcc3f38554f283a9d33165.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=40062&cate_no=1347&display_group=1",
            "originalPrice": 87000,
            "salePrice": 78300
          },
          {
            "label": "대합본/천연/다크브라운",
            "img": "https://chhouse.cafe24.com/web/product/big/202404/4bfb2a7c70a96e00493ab8e0f84e3ba2.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=40063&cate_no=1347&display_group=1",
            "originalPrice": 87000,
            "salePrice": 78300
          },
          {
            "label": "대단본/천연/다크브라운",
            "img": "https://chhouse.cafe24.com/web/product/big/202510/928038e08a9f46d6b8b7307207a858f0.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=55696&cate_no=1347&display_group=1",
            "originalPrice": 66000,
            "salePrice": 59400
          },
          {
            "label": "대합본/PU/모카브라운",
            "img": "https://chhouse.cafe24.com/web/product/big/202404/27b7b25781c62560b26147c9d2ddd6cd.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=36028&cate_no=1347&display_group=1",
            "originalPrice": 64000,
            "salePrice": 57600
          },
          {
            "label": "대단본/PU/브라운",
            "img": "https://chhouse.cafe24.com/web/product/big/202504/39a6fec7b021aed639759323bd894367.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=53191&cate_no=1347&display_group=1",
            "originalPrice": 55000,
            "salePrice": 49500
          }
        ]
      },
      {
        "model": "NKR72AB",
        "size": "중",
        "mm": 4.2,
        "type": "standard",
        "variants": [
          {
            "label": "중합본/천연/브라운",
            "img": "https://chhouse.cafe24.com/web/product/big/202509/80d5daa695f2c3b11c0a16ed82293226.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=54900&cate_no=1388&display_group=1",
            "originalPrice": 79000,
            "salePrice": 71100
          },
          {
            "label": "중합본/천연/자주",
            "img": "https://chhouse.cafe24.com/web/product/big/202410/1ef46375ece8dbc29422ae4abee8ace6.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=50939&cate_no=1388&display_group=1",
            "originalPrice": 74000,
            "salePrice": 66600
          },
          {
            "label": "중합본/천연/다크브라운",
            "img": "https://chhouse.cafe24.com/web/product/big/202410/81bc4f3867732455b507432d6ac9d623.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=50940&cate_no=1388&display_group=1",
            "originalPrice": 74000,
            "salePrice": 66600
          },
          {
            "label": "중단본/천연/다크브라운",
            "img": "https://chhouse.cafe24.com/web/product/big/202508/17198400d308e8e01a049b40d8e33dd4.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=54646&cate_no=1388&display_group=1",
            "originalPrice": 60000,
            "salePrice": 54000
          },
          {
            "label": "중합본/PU/모카브라운",
            "img": "https://chhouse.cafe24.com/web/product/big/202405/051e1d0e2809eb96feeaeb0e79a31bba.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=38587&cate_no=1388&display_group=1",
            "originalPrice": 59000,
            "salePrice": 53100
          },
          {
            "label": "중합본/PU/라벤더",
            "img": "https://chhouse.cafe24.com/web/product/big/202405/c99ba9613e71ac557fdb618d2333273f.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=38586&cate_no=1388&display_group=1",
            "originalPrice": 59000,
            "salePrice": 53100
          }
        ]
      },
      {
        "model": "NKR72EAM",
        "size": "대",
        "mm": 4,
        "type": "standard",
        "variants": [
          {
            "label": "대합본/천연/지퍼/투톤다크브라운",
            "img": "https://chhouse.cafe24.com/web/product/big/202404/b3590a01c90b390b1621c859f45051db.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=42355&cate_no=1347&display_group=1",
            "originalPrice": 81000,
            "salePrice": 72900
          },
          {
            "label": "대합본/천연/무지퍼/다크브라운",
            "img": "https://chhouse.cafe24.com/web/product/big/202404/45d8cf42f57975fd93ed2bab78b9f1ec.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=47739&cate_no=1347&display_group=1",
            "originalPrice": 75000,
            "salePrice": 67500
          },
          {
            "label": "대합본/PU/지퍼/다크브라운",
            "img": "https://chhouse.cafe24.com/web/product/big/202411/9ce9fde02849a52d5f3e04eb4f1abbb3.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=51203&cate_no=1347&display_group=1",
            "originalPrice": 67000,
            "salePrice": 60300
          }
        ]
      },
      {
        "model": "NKR62EAB",
        "size": "소",
        "mm": 3.6,
        "type": "standard",
        "variants": [
          {
            "label": "소합본/천연/지퍼레드",
            "img": "https://chhouse.cafe24.com/web/product/big/202504/aae777354a6b2ba2be1ae7cf15dc0b28.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=18930&cate_no=1381&display_group=1",
            "originalPrice": 65000,
            "salePrice": 58500
          },
          {
            "label": "소합본/천연/지퍼/다크브라운",
            "img": "https://chhouse.cafe24.com/web/product/big/202504/c4158fa1e1ada3f4f3549d3579f92377.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=18933&cate_no=1381&display_group=1",
            "originalPrice": 65000,
            "salePrice": 58500
          },
          {
            "label": "소합본/PU/지퍼/잉키블루",
            "img": "https://chhouse.cafe24.com/web/product/big/202410/37ec01bb8a878c5ff3808add46a90c83.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=35922&cate_no=1381&display_group=1",
            "originalPrice": 56000,
            "salePrice": 50400
          },
          {
            "label": "소합본/PU/지퍼/자주",
            "img": "https://chhouse.cafe24.com/web/product/big/202410/119616ac045ec89f9219f04b2ec66ab3.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=50860&cate_no=1381&display_group=1",
            "originalPrice": 56000,
            "salePrice": 50400
          }
        ]
      },
      {
        "model": "NKR72ATH",
        "size": "중",
        "mm": 3.5,
        "type": "standard",
        "variants": [
          {
            "label": "중합본/천연/지퍼/다크브라운",
            "img": "https://chhouse.kr/web/product/big/202405/169913c27e6e3fab103d46e51536596b.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=40149&cate_no=1388&display_group=1",
            "originalPrice": 58000,
            "salePrice": 52200
          }
        ]
      },
      {
        "model": "NKR62AM",
        "size": "특소",
        "mm": 3,
        "type": "standard",
        "variants": [
          {
            "label": "특소합본/천연/지퍼/다크블루",
            "img": "https://chhouse.cafe24.com/web/product/big/202406/f4822390a386ba36f623a825fbbac8b5.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=39067&cate_no=1464&display_group=1",
            "originalPrice": 59000,
            "salePrice": 53100
          },
          {
            "label": "특소합본/PU/지퍼/인디고블루",
            "img": "https://chhouse.cafe24.com/web/product/big/202405/eca08287fd5b796966b0b751af373689.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=38515&cate_no=1464&display_group=1",
            "originalPrice": 49000,
            "salePrice": 44100
          },
          {
            "label": "특소합본/PU/지퍼/인디핑크",
            "img": "https://chhouse.cafe24.com/web/product/big/202405/a412dcd8096bd3fe3df4e961e21dde62.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=38514&cate_no=1464&display_group=1",
            "originalPrice": 47000,
            "salePrice": 42300
          }
        ]
      },
      {
        "model": "NKR62AS",
        "size": "특소",
        "mm": 2.5,
        "type": "standard",
        "variants": [
          {
            "label": "특소합본/PU/지퍼/인디고블루",
            "img": "https://chhouse.cafe24.com/web/product/big/202405/1147deb80d14005ac295d792b4340bda.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=18333&cate_no=1381&display_group=1",
            "originalPrice": 40000,
            "salePrice": 36000
          },
          {
            "label": "특소합본/PU/지퍼/인디핑크",
            "img": "https://chhouse.cafe24.com/web/product/big/202405/f459d3c67e3763fdef783414cc7a782a.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=18330&cate_no=1381&display_group=1",
            "originalPrice": 40000,
            "salePrice": 36000
          }
        ]
      },
      {
        "model": "큰글자 굿모닝성경",
        "size": "대",
        "mm": 3.6,
        "type": "study",
        "variants": [
          {
            "label": "대합본/천연/지퍼/다크브라운",
            "img": "https://chhouse.kr/web/product/big/202408/aab3c095db3cc2e096eb63a449f9dbc1.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=49455&cate_no=1347&display_group=1",
            "originalPrice": 65000,
            "salePrice": 58500
          },
          {
            "label": "대합본/천연/무지퍼/브라운",
            "img": "https://chhouse.kr/web/product/big/202601/cdeabe94a2730136964b5c1bbbbd97c7.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=56514&cate_no=1347&display_group=1",
            "originalPrice": 58000,
            "salePrice": 52200
          },
          {
            "label": "대합본/PU/지퍼/잉키블루",
            "img": "https://chhouse.kr/web/product/big/202409/c8243ffbd8183d945e4910099e98c588.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=50399&cate_no=1347&display_group=1",
            "originalPrice": 51000,
            "salePrice": 45900
          },
          {
            "label": "대합본/PU/지퍼/브라운",
            "img": "https://chhouse.kr/web/product/big/202408/cc71ca925f8531ac4350ea4ca3e42e73.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=49454&cate_no=1347&display_group=1",
            "originalPrice": 51000,
            "salePrice": 45900
          },
          {
            "label": "대합본/PU/무지퍼/브라운",
            "img": "https://chhouse.kr/web/product/big/202504/f86d0d8f3ab2ce4f0e8b7f1346d1b3a9.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=53016&cate_no=1347&display_group=1",
            "originalPrice": 43000,
            "salePrice": 38700
          },
          {
            "label": "중합본/PU/무지퍼/브라운",
            "img": "https://chhouse.kr/web/product/big/202405/a950c25b8da04cc8dceeae38556e6020.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=44929&cate_no=1347&display_group=1",
            "originalPrice": 43000,
            "salePrice": 38700
          }
        ]
      },
      {
        "model": "큰글자 굿모닝성경",
        "size": "중",
        "mm": 3.3,
        "type": "study",
        "variants": [
          {
            "label": "중합본/천연/지퍼/리치브라운",
            "img": "https://chhouse.kr/web/product/big/202504/0b5ed7556ad434989e9a1c73083cb111.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=53015&cate_no=1388&display_group=1",
            "originalPrice": 59000,
            "salePrice": 53100
          },
          {
            "label": "중합본/천연/지퍼/잉키블루",
            "img": "https://chhouse.kr/web/product/big/202409/9547d826f33d8918190638353c4bc41c.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=47072&cate_no=1388&display_group=1",
            "originalPrice": 59000,
            "salePrice": 53100
          },
          {
            "label": "중합본/PU/지퍼/브라운",
            "img": "https://chhouse.kr/web/product/big/202404/01beb8e1c410a838cc67ec3a5cf91e61.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=38512&cate_no=1388&display_group=1",
            "originalPrice": 44000,
            "salePrice": 39600
          },
          {
            "label": "중합본/PU/지퍼/잉키블루",
            "img": "https://chhouse.kr/web/product/big/202409/e44f9d1fe738593b0491644fa8fcebfb.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=50237&cate_no=1388&display_group=1",
            "originalPrice": 44000,
            "salePrice": 39600
          },
          {
            "label": "중합본/PU/무지퍼/다크브라운",
            "img": "https://chhouse.kr/web/product/big/202404/7f44b9c2fa8b01f9bdcda535d934cc3c.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=47229&cate_no=1388&display_group=1",
            "originalPrice": 38000,
            "salePrice": 34200
          },
          {
            "label": "중단본/PU/지펴/올리브",
            "img": "https://chhouse.kr/web/product/big/202512/71e9b12e3fae6542c8d827fad020c684.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=56247&cate_no=1388&display_group=1",
            "originalPrice": 32000,
            "salePrice": 28800
          },
          {
            "label": "중단본/PU/무지퍼/네이비",
            "img": "https://chhouse.kr/web/product/big/202604/b4de277c2b05ca2d587f73ae81ad3d75.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=57421&cate_no=1388&display_group=1",
            "originalPrice": 30000,
            "salePrice": 27000
          }
        ]
      },
      {
        "model": "뉴슬림 굿모닝성경",
        "size": "특미니",
        "mm": 2.4,
        "type": "study",
        "variants": [
          {
            "label": "특미니/천연/합본/지퍼/버건디",
            "img": "https://chhouse.kr/web/product/big/202409/1dcd067a35e62e407b41c788450d5550.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=40912&cate_no=1409&display_group=1",
            "originalPrice": 44000,
            "salePrice": 39600
          },
          {
            "label": "특미니/천연/합본/지퍼/브라운",
            "img": "https://chhouse.kr/web/product/big/202409/eee69fed9c07ba1040203efd9892578c.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=45034&cate_no=1409&display_group=1",
            "originalPrice": 44000,
            "salePrice": 39600
          },
          {
            "label": "특미니/PU/합본/지퍼/인디고블루",
            "img": "https://chhouse.kr/web/product/big/202405/3bf6e8512ab2d6c649b4ea313b267cb1.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=39290&cate_no=1409&display_group=1",
            "originalPrice": 33000,
            "salePrice": 29700
          },
          {
            "label": "특미니/PU/합본/지퍼/인디핑크",
            "img": "https://chhouse.kr/web/product/big/202405/62bcff1b6d504e6ec2325ddbe5c4dcf7.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=39291&cate_no=1409&display_group=1",
            "originalPrice": 33000,
            "salePrice": 29700
          }
        ]
      },
      {
        "model": "뉴슬림 굿모닝성경",
        "size": "초미니",
        "mm": 2,
        "type": "study",
        "variants": [
          {
            "label": "초미니/천연/합본/지퍼/핑크",
            "img": "https://chhouse.kr/web/product/big/202602/5843b57bdeb141ab05d618b4f8b77f29.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=39570&cate_no=1420&display_group=1",
            "originalPrice": 36000,
            "salePrice": 32400
          },
          {
            "label": "초미니/천연/합본/지퍼/네이비",
            "img": "https://chhouse.kr/web/product/big/202602/9293dd53d22153c16b3f98a8019a6bde.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=39569&cate_no=1420&display_group=1",
            "originalPrice": 36000,
            "salePrice": 32400
          },
          {
            "label": "초미니/PU/합본/지퍼/민트",
            "img": "https://chhouse.kr/web/product/big/202404/2b41058a7b555b002a8f2f41cc6412bf.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=39568&cate_no=1420&display_group=1",
            "originalPrice": 33000,
            "salePrice": 29700
          },
          {
            "label": "초미니/PU/합본/지퍼/모카베이지",
            "img": "https://chhouse.kr/web/product/big/202404/db4b116a367565786e4a02cee9e04704.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=39567&cate_no=1420&display_group=1",
            "originalPrice": 33000,
            "salePrice": 29700
          }
        ]
      },
      {
        "model": "컬러성경",
        "size": "대",
        "mm": 4,
        "type": "study",
        "variants": [
          {
            "label": "대합본/천연/지퍼/블랙",
            "img": "https://chhouse.kr/web/product/big/202412/f6eda7d1f66161c6b30e97ce371ef4c5.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=52061&cate_no=1347&display_group=1",
            "originalPrice": 120000,
            "salePrice": 108000
          },
          {
            "label": "대합본/천연/지퍼/딥브라운",
            "img": "https://chhouse.kr/web/product/big/202412/788ac93553c90864e54b8874bf468a31.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=51837&cate_no=1347&display_group=1",
            "originalPrice": 98000,
            "salePrice": 88200
          }
        ]
      },
      {
        "model": "컬러성경",
        "size": "중",
        "mm": 3.3,
        "type": "study",
        "variants": [
          {
            "label": "중합본/천연/지퍼/자주",
            "img": "https://chhouse.kr/web/product/big/202404/f786ff08e043153438610102c6eefc20.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=19408&cate_no=1388&display_group=1",
            "originalPrice": 72000,
            "salePrice": 64800
          },
          {
            "label": "중합본/천연/지퍼/다크브라운",
            "img": "https://chhouse.kr/web/product/big/202404/3fc61b1f129fdbd7488ff467ba40c28b.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=19411&cate_no=1388&display_group=1",
            "originalPrice": 72000,
            "salePrice": 64800
          }
        ]
      },
      {
        "model": "예스 주석성경",
        "size": "대",
        "mm": 3.7,
        "type": "study",
        "variants": [
          {
            "label": "대합본/천연/지퍼/브라운",
            "img": "https://chhouse.kr/web/product/big/202404/ba9a437c33bc7990af1488a7131aef81.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=40859&cate_no=1347&display_group=1",
            "originalPrice": 66000,
            "salePrice": 59400
          },
          {
            "label": "대합본/천연/지퍼/자주",
            "img": "https://chhouse.kr/web/product/big/202404/4b609a5b2a1a73ced6c3ac20be913ee6.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=40860&cate_no=1347&display_group=1",
            "originalPrice": 66000,
            "salePrice": 59400
          },
          {
            "label": "대합본/PU/지퍼/자주",
            "img": "https://chhouse.kr/web/product/big/202405/21851f45bf29d270f6510c9fa0a1b1d2.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=18495&cate_no=1347&display_group=1",
            "originalPrice": 50000,
            "salePrice": 45000
          },
          {
            "label": "대합본/PU/지퍼/브라운",
            "img": "https://chhouse.kr/web/product/big/202405/6fabc4d1a68e9e9a22626f6ddea867bb.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=18498&cate_no=1347&display_group=1",
            "originalPrice": 50000,
            "salePrice": 45000
          }
        ]
      },
      {
        "model": "큰글성경",
        "size": "특대",
        "mm": 4.6,
        "type": "study",
        "variants": [
          {
            "label": "특대합본/천연/지퍼/다크브라운",
            "img": "https://chhouse.kr/web/product/big/202410/7896cf855debbbc0ea7a1d1fd46d89a6.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=50774&cate_no=1358&display_group=1",
            "originalPrice": 82000,
            "salePrice": 73800
          },
          {
            "label": "특대합본/천연/지퍼/자주",
            "img": "https://chhouse.kr/web/product/big/202410/c604b1881dc1e00ea0d1672d023061a9.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=50775&cate_no=1358&display_group=1",
            "originalPrice": 82000,
            "salePrice": 73800
          },
          {
            "label": "특대합본/천연/무지퍼/다크브라운",
            "img": "https://chhouse.kr/web/product/big/202506/9a248873ccfa1d39943d38a626ecdcdc.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=53975&cate_no=1358&display_group=1",
            "originalPrice": 75000,
            "salePrice": 67500
          },
          {
            "label": "특대합본/PU/지퍼/브라운",
            "img": "https://chhouse.kr/web/product/big/202604/b8aaafb5409a0dddc3837300bfed6efc.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=32487&cate_no=1358&display_group=1",
            "originalPrice": 65000,
            "salePrice": 58500
          },
          {
            "label": "특대합본/PU/지퍼/다크브라운",
            "img": "https://chhouse.kr/web/product/big/202604/ce3de01003785531b644fadc9600263a.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=32485&cate_no=1358&display_group=1",
            "originalPrice": 65000,
            "salePrice": 58500
          },
          {
            "label": "특대단본/PU/무지퍼/브라운",
            "img": "https://chhouse.kr/web/product/big/202506/e973f6746ba2b389fc1bb26785aaa483.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=54205&cate_no=1358&display_group=1",
            "originalPrice": 49000,
            "salePrice": 44100
          }
        ]
      },
      {
        "model": "큰글성경",
        "size": "대",
        "mm": 4.4,
        "type": "study",
        "variants": [
          {
            "label": "대합본/천연/지퍼/다크브라운",
            "img": "https://chhouse.kr/web/product/big/202405/ab5439a3d1aa9927cee7737e8f34067d.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=43586&cate_no=1347&display_group=1",
            "originalPrice": 77000,
            "salePrice": 69300
          },
          {
            "label": "대합본/천연/지퍼/자주",
            "img": "https://chhouse.kr/web/product/big/202405/78377a3b3b6ef018c735a46e42b7d1b6.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=45076&cate_no=1347&display_group=1",
            "originalPrice": 77000,
            "salePrice": 69300
          },
          {
            "label": "대합본/PU/지퍼/다크브라운",
            "img": "https://chhouse.kr/web/product/big/202604/88c5c7dd04a60bf7a3f52b21f27b705a.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=37243&cate_no=1347&display_group=1",
            "originalPrice": 59000,
            "salePrice": 53100
          },
          {
            "label": "대합본/PU/지퍼/브라운",
            "img": "https://chhouse.kr/web/product/big/202404/93d6cb3bcb59f5a025741d9b622255ce.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=18777&cate_no=1347&display_group=1",
            "originalPrice": 59000,
            "salePrice": 53100
          },
          {
            "label": "대합본/PU/무지퍼/브라운",
            "img": "https://chhouse.kr/web/product/big/202510/addd90399bb5cfd542e47ba29ff81fb2.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=55603&cate_no=1347&display_group=1",
            "originalPrice": 50000,
            "salePrice": 45000
          }
        ]
      },
      {
        "model": "큰글성경",
        "size": "중",
        "mm": 3.9,
        "type": "study",
        "variants": [
          {
            "label": "중합본/천연/지퍼/자주",
            "img": "https://chhouse.kr/web/product/big/202404/8696e7ae87ebe3510e208621a0f38536.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=46703&cate_no=1388&display_group=1",
            "originalPrice": 67000,
            "salePrice": 60300
          },
          {
            "label": "중합본/PU/지퍼/라벤더",
            "img": "https://chhouse.kr/web/product/big/202404/b616d43c2548dec16ac813791ea34800.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=18573&cate_no=1388&display_group=1",
            "originalPrice": 55000,
            "salePrice": 49500
          },
          {
            "label": "중합본/PU/지퍼/브라운",
            "img": "https://chhouse.kr/web/product/big/202404/d5f089f63fcd955cc90b037b6d319343.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=18576&cate_no=1388&display_group=1",
            "originalPrice": 55000,
            "salePrice": 49500
          },
          {
            "label": "중단본/PU/무지퍼/다크브라운",
            "img": "https://chhouse.kr/web/product/big/202507/61f9fd9cbb5d66245e96858fa05bb413.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=54283&cate_no=1388&display_group=1",
            "originalPrice": 49000,
            "salePrice": 44100
          }
        ]
      },
      {
        "model": "큰글성경",
        "size": "소",
        "mm": 3.4,
        "type": "study",
        "variants": [
          {
            "label": "소합본/천연/지퍼/레드",
            "img": "https://chhouse.cafe24.com/web/product/big/202409/4a3fd5cb8ecfd9ec9ded41e6407ff93e.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=47800&cate_no=1381&display_group=1",
            "originalPrice": 60000,
            "salePrice": 54000
          },
          {
            "label": "소합본/천연/지퍼/잉키블루",
            "img": "https://chhouse.cafe24.com/web/product/big/202409/1999a4168a9c6a592cd467d88a2ccd38.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=47799&cate_no=1381&display_group=1",
            "originalPrice": 60000,
            "salePrice": 54000
          },
          {
            "label": "소합본/PU/지퍼/네이비",
            "img": "https://chhouse.kr/web/product/big/202404/6c3214c41ddf0fc61092bdad2b8d389a.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=37787&cate_no=1381&display_group=1",
            "originalPrice": 50000,
            "salePrice": 45000
          },
          {
            "label": "소합본/PU/지퍼/핑크베이지",
            "img": "https://chhouse.kr/web/product/big/202407/4f4e9416c8239ed3d392ec4a6eef0fff.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=49042&cate_no=1381&display_group=1",
            "originalPrice": 50000,
            "salePrice": 45000
          },
          {
            "label": "소단본/천연/무지퍼/베이지",
            "img": "https://chhouse.kr/web/product/big/202404/55797812ad48f17ac58864312b59a156.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=38206&cate_no=1381&display_group=1",
            "originalPrice": 41000,
            "salePrice": 36900
          }
        ]
      },
      {
        "model": "큰글자 굿모닝성경",
        "size": "소",
        "mm": 2.9,
        "type": "study",
        "variants": [
          {
            "label": "소합본/PU/지퍼/피치베이지",
            "img": "https://chhouse.kr/web/product/big/202511/b838846f5a8d51481917add52d6f7400.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=55854&cate_no=1381&display_group=1",
            "originalPrice": 38000,
            "salePrice": 34200
          },
          {
            "label": "소합본/PU/지퍼/올리브",
            "img": "https://chhouse.kr/web/product/big/202511/a1c5fbb4fb65e2d67e79230696d28a0b.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=55853&cate_no=1381&display_group=1",
            "originalPrice": 38000,
            "salePrice": 34200
          },
          {
            "label": "소단본/PU/지퍼/그레이",
            "img": "https://chhouse.kr/web/product/big/202511/c63bd76c01c61b66ef2c6a03108413ad.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=55995&cate_no=1381&display_group=1",
            "originalPrice": 29000,
            "salePrice": 26100
          }
        ]
      },
      {
        "model": "뉴슬림 굿모닝성경",
        "size": "소",
        "mm": 2.6,
        "type": "study",
        "variants": [
          {
            "label": "소합본/PU/지퍼/아이보리",
            "img": "https://chhouse.kr/web/product/big/202505/a15479aa64a468a4bc043ca9b21d95ff.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=53655&cate_no=1381&display_group=1",
            "originalPrice": 35000,
            "salePrice": 31500
          },
          {
            "label": "소합본/PU/지퍼/네이비",
            "img": "https://chhouse.kr/web/product/big/202505/55970cea88fd01bfd4b4698feae7991a.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=53654&cate_no=1381&display_group=1",
            "originalPrice": 35000,
            "salePrice": 31500
          },
          {
            "label": "소단본/PU/지퍼/올리브",
            "img": "https://chhouse.kr/web/product/big/202505/fd92aefd20decc4cd1aa0258299b8371.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=53653&cate_no=1381&display_group=1",
            "originalPrice": 28000,
            "salePrice": 25200
          }
        ]
      }
    ]
  },
  "W": {
    "name": "생명의말씀사",
    "items": [
      {
        "model": "큰글자 스터디성경",
        "size": "대",
        "mm": 4.2,
        "type": "study",
        "variants": [
          {
            "label": "대합본/천연/지퍼/뉴다크브라운",
            "img": "https://chhouse.cafe24.com/web/product/big/202504/29e03364f251595758292afd3bb0e3bb.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=53022&cate_no=1372&display_group=1",
            "originalPrice": 68000,
            "salePrice": 61200
          },
          {
            "label": "대합본/천연/지퍼/뉴버건디",
            "img": "https://chhouse.cafe24.com/web/product/big/202504/651a8123e2eede49bf2620f20574b6cd.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=53023&cate_no=1372&display_group=1",
            "originalPrice": 68000,
            "salePrice": 61200
          },
          {
            "label": "대합본/PU/지퍼/다크브라운",
            "img": "https://chhouse.cafe24.com/web/product/big/202406/96e5787d088f897ab3d624634a395dc1.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=18492&cate_no=1372&display_group=1",
            "originalPrice": 56000,
            "salePrice": 50400
          }
        ]
      },
      {
        "model": "큰글자 스터디성경",
        "size": "중",
        "mm": 3.9,
        "type": "study",
        "variants": [
          {
            "label": "중합본/천연/지퍼/다크브라운",
            "img": "https://chhouse.cafe24.com/web/product/big/202409/d6a0714e7ab45f3d1652e351bd24b1f0.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=50086&cate_no=1371&display_group=1",
            "originalPrice": 78000,
            "salePrice": 70200
          },
          {
            "label": "중합본/PU/지퍼/다크네이비",
            "img": "https://chhouse.cafe24.com/web/product/big/202409/1ac63e48135a48688875453c9a28c929.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=50085&cate_no=1371&display_group=1",
            "originalPrice": 55000,
            "salePrice": 49500
          }
        ]
      },
      {
        "model": "슬림 스터디성경",
        "size": "소",
        "mm": 2.6,
        "type": "study",
        "variants": [
          {
            "label": "소합본/천연/지퍼/다크브라운",
            "img": "https://chhouse.cafe24.com/web/product/big/202411/b577b20e25030f4625e462020eb08ba4.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=51317&cate_no=1345&display_group=1",
            "originalPrice": 42000,
            "salePrice": 37800
          },
          {
            "label": "소합본/PU/밴드형/그린",
            "img": "https://chhouse.cafe24.com/web/product/big/202404/d33088e88ae1ea84b717e7a898b1ac55.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=42796&cate_no=1345&display_group=1",
            "originalPrice": 36000,
            "salePrice": 32400
          },
          {
            "label": "소합본/PU/밴드형/네이비",
            "img": "https://chhouse.cafe24.com/web/product/big/202404/9c0d9ca2f99d8ffef81a9b6e3b71d507.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=42795&cate_no=1345&display_group=1",
            "originalPrice": 36000,
            "salePrice": 32400
          }
        ]
      },
      {
        "model": "프리미엄 굿데이성경",
        "size": "대",
        "mm": 3.9,
        "type": "study",
        "variants": [
          {
            "label": "대합본/천연/지퍼/다크브라운",
            "img": "https://chhouse.cafe24.com/web/product/big/202501/5378bcf8416c0e8609f24bba6a4d42e3.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=18174&cate_no=1372&display_group=1",
            "originalPrice": 67000,
            "salePrice": 60300
          },
          {
            "label": "대합본/천연/지퍼/다크네이비",
            "img": "https://chhouse.cafe24.com/web/product/big/202501/55f6a0044745f3d68fd17689c271b8cf.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=52204&cate_no=1372&display_group=1",
            "originalPrice": 67000,
            "salePrice": 60300
          },
          {
            "label": "대합본/PU/지퍼/블랙",
            "img": "https://chhouse.cafe24.com/web/product/big/202405/01d65352b6e0ed2c0a0733ae09f38015.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=44462&cate_no=1372&display_group=1",
            "originalPrice": 63000,
            "salePrice": 56700
          },
          {
            "label": "대합본/PU/지퍼/다크네이비",
            "img": "https://chhouse.cafe24.com/web/product/big/202405/8c225d754a59a3e16f85f2e63d86cc35.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=44337&cate_no=1372&display_group=1",
            "originalPrice": 51000,
            "salePrice": 45900
          },
          {
            "label": "대합본/PU/지퍼/브라운",
            "img": "https://chhouse.cafe24.com/web/product/big/202405/fd4c68d48959eeb01077303ebc70348b.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=44336&cate_no=1372&display_group=1",
            "originalPrice": 51000,
            "salePrice": 45900
          }
        ]
      },
      {
        "model": "뉴빅슬림 굿데이성경",
        "size": "중",
        "mm": 3.5,
        "type": "study",
        "variants": [
          {
            "label": "중합본/천연/지퍼/뉴버건디",
            "img": "https://chhouse.cafe24.com/web/product/big/202405/f6e0e890f8035c9a4cfb6a3e053f546e.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=38862&cate_no=1371&display_group=1",
            "originalPrice": 57000,
            "salePrice": 51300
          },
          {
            "label": "중합본/천연/지퍼/뉴다크브라운",
            "img": "https://chhouse.cafe24.com/web/product/big/202405/b58e62b5aa0261bc589d6813e15815b9.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=38861&cate_no=1371&display_group=1",
            "originalPrice": 57000,
            "salePrice": 51300
          },
          {
            "label": "중합본/PU/지퍼/뉴브라운",
            "img": "https://chhouse.cafe24.com/web/product/big/202405/b504f15f35c8edf0ab540ae48f597e6a.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=38336&cate_no=1371&display_group=1",
            "originalPrice": 47000,
            "salePrice": 42300
          },
          {
            "label": "중합본/PU/지퍼/뉴네이비",
            "img": "https://chhouse.cafe24.com/web/product/big/202409/ae865f4cf05ad35f7355feb7d89c2e47.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=38335&cate_no=1371&display_group=1",
            "originalPrice": 47000,
            "salePrice": 42300
          }
        ]
      },
      {
        "model": "올 뉴 굿데이성경",
        "size": "초미니",
        "mm": 2.3,
        "type": "study",
        "variants": [
          {
            "label": "초미니합본/천연/지퍼/베이지",
            "img": "https://chhouse.cafe24.com/web/product/big/202406/3104124bc91cfde09c6280771876bd48.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=48705&cate_no=1387&display_group=1",
            "originalPrice": 38000,
            "salePrice": 34200
          },
          {
            "label": "초미니합본/PU/지퍼/뉴분홍",
            "img": "https://chhouse.cafe24.com/web/product/big/202406/45aaf593eeafcc47968b3e8a565e2bed.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=48706&cate_no=1387&display_group=1",
            "originalPrice": 32000,
            "salePrice": 28800
          },
          {
            "label": "초미니합본/PU/지퍼/뉴베이지",
            "img": "https://chhouse.cafe24.com/web/product/big/202406/34db1144e17138313786f36ec8178761.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=48704&cate_no=1387&display_group=1",
            "originalPrice": 32000,
            "salePrice": 28800
          },
          {
            "label": "초미니합본/PU/지퍼/뉴파랑",
            "img": "https://chhouse.kr/web/product/big/202406/3bedc900213eb974752f343cc216d4e3.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=48654&cate_no=1387&display_group=1",
            "originalPrice": 32000,
            "salePrice": 28800
          },
          {
            "label": "초미니합본/PU/지퍼/뉴하늘",
            "img": "https://chhouse.kr/web/product/big/202406/f0523e71e14e910b252777132ce5b49f.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=48655&cate_no=1387&display_group=1",
            "originalPrice": 32000,
            "salePrice": 28800
          }
        ]
      },
      {
        "model": "모던컬러성경",
        "size": "대",
        "mm": 4.1,
        "type": "study",
        "variants": [
          {
            "label": "대합본/천연/지퍼/다크브라운",
            "img": "https://chhouse.kr/web/product/big/202409/cba3646ac31b26551e7722af1145dee1.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=43362&cate_no=1372&display_group=1",
            "originalPrice": 76000,
            "salePrice": 68400
          },
          {
            "label": "대합본/천연/지퍼/베이지",
            "img": "https://chhouse.kr/web/product/big/202405/e39f311d5dfa726569a3e2aae5760664.jpg",
            "url": "http://chhouse.kr/product/detail.html?product_no=43361&cate_no=1372&display_group=1",
            "originalPrice": 76000,
            "salePrice": 68400
          },
          {
            "label": "대합본/PU/지퍼/브라운",
            "img": "https://chhouse.kr/web/product/big/202405/ad2efa4720bb949c8dc4a3e63c5afaad.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=43359&cate_no=1372&display_group=1",
            "originalPrice": 62000,
            "salePrice": 55800
          },
          {
            "label": "대합본/PU/지퍼/초코브라운",
            "img": "https://chhouse.kr/web/product/big/202405/288ff91cdba6a81af7bb4e0839e54842.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=43360&cate_no=1372&display_group=1",
            "originalPrice": 62000,
            "salePrice": 55800
          }
        ]
      },
      {
        "model": "모던컬러성경",
        "size": "중",
        "mm": 3.5,
        "type": "study",
        "variants": [
          {
            "label": "중합본/천연/지퍼/다크브라운",
            "img": "https://chhouse.kr/web/product/big/202405/97b5c7d29ac8fec2297efe7b201d8f82.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=45118&cate_no=1371&display_group=1",
            "originalPrice": 64000,
            "salePrice": 57600
          },
          {
            "label": "중합본/천연/지퍼/다크네이비",
            "img": "https://chhouse.kr/web/product/big/202405/793bacad25f0402ebf91fef66864c8ab.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=45119&cate_no=1371&display_group=1",
            "originalPrice": 64000,
            "salePrice": 57600
          },
          {
            "label": "중합본/PU/지퍼/브라운",
            "img": "https://chhouse.kr/web/product/big/202405/953e5ebb3b52e53a5ed368068d4fbe78.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=45116&cate_no=1371&display_group=1",
            "originalPrice": 45000,
            "salePrice": 40500
          },
          {
            "label": "중합본/PU/지퍼/블랙",
            "img": "https://chhouse.kr/web/product/big/202405/7a8785fed2754fe1dba4ca31be51c811.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=45117&cate_no=1371&display_group=1",
            "originalPrice": 45000,
            "salePrice": 40500
          }
        ]
      },
      {
        "model": "모던컬러성경",
        "size": "소",
        "mm": 3,
        "type": "study",
        "variants": [
          {
            "label": "소합본/천연/지퍼/다크브라운",
            "img": "https://chhouse.kr/web/product/big/202409/9cf962817da36912afa0b84f5f33f432.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=49873&cate_no=1345&display_group=1",
            "originalPrice": 54000,
            "salePrice": 48600
          },
          {
            "label": "소합본/천연/지퍼/다크네이비",
            "img": "https://chhouse.kr/web/product/big/202409/ac5b880e9c666ebd245efd9c9fa67e87.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=49874&cate_no=1345&display_group=1",
            "originalPrice": 54000,
            "salePrice": 48600
          },
          {
            "label": "소합본/PU/지퍼/브라운",
            "img": "https://chhouse.kr/web/product/big/202409/0ff2fc6e434e7492d902725acf4e7aa4.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=49872&cate_no=1345&display_group=1",
            "originalPrice": 44000,
            "salePrice": 39600
          },
          {
            "label": "소합본/PU/지퍼/블랙",
            "img": "https://chhouse.kr/web/product/big/202409/d30f1978ce22c6e9522f775f3a54eb73.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=49871&cate_no=1345&display_group=1",
            "originalPrice": 44000,
            "salePrice": 39600
          }
        ]
      },
      {
        "model": "베이직성경",
        "size": "중",
        "mm": 3.2,
        "type": "study",
        "variants": [
          {
            "label": "중합본/천연/지퍼/레드브라운",
            "img": "https://chhouse.kr/web/product/big/202603/1ec16262340d019c0fa9cc1d5acede2c.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=57193&cate_no=1371&display_group=1",
            "originalPrice": 54000,
            "salePrice": 48600
          },
          {
            "label": "중합본/천연/지퍼/브라운",
            "img": "https://chhouse.kr/web/product/big/202506/d8b2ed969fccd3622d764b72d90d2ccd.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=54071&cate_no=1371&display_group=1",
            "originalPrice": 52000,
            "salePrice": 46800
          },
          {
            "label": "중합본/PU/지퍼/그레이",
            "img": "https://chhouse.kr/web/product/big/202506/955fe9a0e44439f0859b2dede2bfab15.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=54068&cate_no=1371&display_group=1",
            "originalPrice": 42000,
            "salePrice": 37800
          },
          {
            "label": "중합본/PU/지퍼/네이비",
            "img": "https://chhouse.kr/web/product/big/202506/9889b58103692066fe0f204de3281c88.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=54069&cate_no=1371&display_group=1",
            "originalPrice": 42000,
            "salePrice": 37800
          },
          {
            "label": "중합본/PU/지퍼/베이지",
            "img": "https://chhouse.kr/web/product/big/202506/42d6312e2643ee1fe1f1678570f78d8f.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=54070&cate_no=1344&display_group=1",
            "originalPrice": 42000,
            "salePrice": 37800
          },
          {
            "label": "중단본/PU/무지퍼/웜그레이",
            "img": "https://chhouse.kr/web/product/big/202603/ec587f378dabd80c7bb8ecc06db1e5b5.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=57111&cate_no=1371&display_group=1",
            "originalPrice": 34000,
            "salePrice": 30600
          },
          {
            "label": "중단본/PU/무지퍼/베이지",
            "img": "https://chhouse.kr/web/product/big/202603/8309e14ed258cdb3e62989510c77f7de.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=57110&cate_no=1371&display_group=1",
            "originalPrice": 34000,
            "salePrice": 30600
          }
        ]
      },
      {
        "model": "베이직성경",
        "size": "소",
        "mm": 2.8,
        "type": "study",
        "variants": [
          {
            "label": "소합본/천연/지퍼/다크네이비",
            "img": "https://chhouse.kr/web/product/big/202510/4d618aaf472368a9e571ccbb90ad3f9b.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=55697&cate_no=1345&display_group=1",
            "originalPrice": 49000,
            "salePrice": 44100
          },
          {
            "label": "소합본/천연/지퍼/스카이블루",
            "img": "https://chhouse.kr/web/product/big/202510/5cbdf1f9a175e01186fa1345ee820769.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=55698&cate_no=1345&display_group=1",
            "originalPrice": 49000,
            "salePrice": 44100
          },
          {
            "label": "소합본/PU/지퍼/블랙",
            "img": "https://chhouse.kr/web/product/big/202510/5ebfe03e50977dfaf1bc34a90bd8d27a.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=55701&cate_no=1345&display_group=1",
            "originalPrice": 39000,
            "salePrice": 35100
          },
          {
            "label": "소합본/PU/지퍼/베이지",
            "img": "https://chhouse.kr/web/product/big/202510/ebc20e575f52100b604b8babb549c81b.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=55700&cate_no=1345&display_group=1",
            "originalPrice": 39000,
            "salePrice": 35100
          },
          {
            "label": "소단본/PU/지퍼/그레이",
            "img": "https://chhouse.kr/web/product/big/202510/64abe985dd05c8809066362dde89f2f8.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=55552&cate_no=1345&display_group=1",
            "originalPrice": 30000,
            "salePrice": 27000
          },
          {
            "label": "소단본/PU/지퍼/브라운",
            "img": "https://chhouse.kr/web/product/big/202510/0aa1462058fc550edc23186a2544c277.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=55553&cate_no=1345&display_group=1",
            "originalPrice": 30000,
            "salePrice": 27000
          }
        ]
      },
      {
        "model": "슬림성경",
        "size": "중",
        "mm": 3,
        "type": "study",
        "variants": [
          {
            "label": "중합본/천연/지퍼/뉴버건디",
            "img": "https://chhouse.kr/web/product/big/202410/b756e3b36e61e2e8ab8736dca376f89c.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=51148&cate_no=1371&display_group=1",
            "originalPrice": 48000,
            "salePrice": 43200
          },
          {
            "label": "중합본/PU/지퍼/뉴레드브라운",
            "img": "https://chhouse.kr/web/product/big/202411/b6a6e28fa9e8053c2169c675eaac1ee2.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=51316&cate_no=1371&display_group=1",
            "originalPrice": 38000,
            "salePrice": 34200
          },
          {
            "label": "중합본/PU/지퍼/뉴다크올리브",
            "img": "https://chhouse.kr/web/product/big/202411/46132b86a03c42d6e4600438c00a6134.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=51315&cate_no=1371&display_group=1",
            "originalPrice": 38000,
            "salePrice": 34200
          },
          {
            "label": "중합본/PU/지퍼/뉴네이비",
            "img": "https://chhouse.kr/web/product/big/202411/6cf9dbbc396339baa2a75c9d3a6d59e8.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=51314&cate_no=1371&display_group=1",
            "originalPrice": 38000,
            "salePrice": 34200
          }
        ]
      },
      {
        "model": "더바이블",
        "size": "중",
        "mm": 3.2,
        "type": "study",
        "variants": [
          {
            "label": "중합본/천연/지퍼/다크브라운",
            "img": "https://chhouse.kr/web/product/big/202404/6464154ffc6ebd5cb9c475129417bf01.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=18165&cate_no=1371&display_group=1",
            "originalPrice": 47000,
            "salePrice": 42300
          }
        ]
      },
      {
        "model": "더바이블",
        "size": "소",
        "mm": 2.8,
        "type": "study",
        "variants": [
          {
            "label": "소합본/천연/지퍼/베이지",
            "img": "https://chhouse.kr/web/product/big/202404/7ac80b9715a7e8568f38bc095a3b3b4a.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=42958&cate_no=1345&display_group=1",
            "originalPrice": 44000,
            "salePrice": 39600
          },
          {
            "label": "소합본/PU/지퍼/다크네이비",
            "img": "https://chhouse.kr/web/product/big/202404/d060dfbe39adb802a0f173d16b02a394.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=37706&cate_no=1345&display_group=1",
            "originalPrice": 35000,
            "salePrice": 31500
          },
          {
            "label": "소합본/PU/지퍼/브라운",
            "img": "https://chhouse.kr/web/product/big/202404/479cc0dc5da04ac49bc625a358c35956.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=37705&cate_no=1345&display_group=1",
            "originalPrice": 35000,
            "salePrice": 31500
          },
          {
            "label": "소합본/PU/지퍼/올리브그린",
            "img": "https://chhouse.kr/web/product/big/202404/42d83f68c9460385f4803d47271977e4.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=37704&cate_no=1345&display_group=1",
            "originalPrice": 35000,
            "salePrice": 31500
          }
        ]
      },
      {
        "model": "위드바이블",
        "size": "미니",
        "mm": 2.6,
        "type": "study",
        "variants": [
          {
            "label": "미니합본/PU/지퍼/교회",
            "img": "https://chhouse.kr/web/product/big/202602/a31f6317eaed5517661fc30c6ef7d583.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=56806&cate_no=1457&display_group=1",
            "originalPrice": 37000,
            "salePrice": 33300
          },
          {
            "label": "미니합본/PU/지퍼/책상",
            "img": "https://chhouse.kr/web/product/big/202602/dbc472f163e513dfe252f7bb3161912d.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=56807&cate_no=1457&display_group=1",
            "originalPrice": 37000,
            "salePrice": 33300
          },
          {
            "label": "미니합본/PU/지퍼/자전거",
            "img": "https://chhouse.kr/web/product/big/202602/cec5211a82a5dd53030f3342fa47c077.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=56808&cate_no=1457&display_group=1",
            "originalPrice": 37000,
            "salePrice": 33300
          },
          {
            "label": "미니합본/PU/지퍼/책",
            "img": "https://chhouse.kr/web/product/big/202408/46aedfad4bb22c157874526eb10b50e2.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=41018&cate_no=1457&display_group=1",
            "originalPrice": 35000,
            "salePrice": 31500
          },
          {
            "label": "미니합본/PU/지퍼/의자",
            "img": "https://chhouse.kr/web/product/big/202408/45c64dff893b6046f2df6ae1648218de.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=41017&cate_no=1457&display_group=1",
            "originalPrice": 35000,
            "salePrice": 31500
          },
          {
            "label": "미니합본/PU/지퍼/소년",
            "img": "https://chhouse.kr/web/product/big/202408/f8f8098568cac77909b45d3abaa30bf6.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=41016&cate_no=1457&display_group=1",
            "originalPrice": 35000,
            "salePrice": 31500
          },
          {
            "label": "미니합본/PU/지퍼/소녀",
            "img": "https://chhouse.kr/web/product/big/202408/856a0cb20f0e31b7e9f383ee5b93efaf.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=41015&cate_no=1457&display_group=1",
            "originalPrice": 35000,
            "salePrice": 31500
          }
        ]
      },
      {
        "model": "NKR82WBU",
        "size": "특대",
        "mm": 4.7,
        "type": "standard",
        "variants": [
          {
            "label": "특대합본/천연/지퍼/버건디",
            "img": "https://chhouse.cafe24.com/web/product/big/202405/d6bc8fae620dacbe20afbe01839e2543.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=38865&cate_no=1350&display_group=1",
            "originalPrice": 89000,
            "salePrice": 80100
          },
          {
            "label": "특대합본/천연/지퍼/다크브라운",
            "img": "https://chhouse.cafe24.com/web/product/big/202405/acfa91221bd263674d64e18fee354927.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=38864&cate_no=1350&display_group=1",
            "originalPrice": 89000,
            "salePrice": 80100
          },
          {
            "label": "특대합본/PU/지퍼/네이비",
            "img": "https://chhouse.cafe24.com/web/product/big/202405/680fe50278789998616932da1157271b.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=39061&cate_no=1350&display_group=1",
            "originalPrice": 74000,
            "salePrice": 66600
          },
          {
            "label": "특대합본/PU/지퍼/브라운",
            "img": "https://chhouse.cafe24.com/web/product/big/202405/b0484d75a0014bb47fc92975d8e0d941.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=39062&cate_no=1350&display_group=1",
            "originalPrice": 74000,
            "salePrice": 66600
          }
        ]
      },
      {
        "model": "NKR72EWBU",
        "size": "대",
        "mm": 4.5,
        "type": "standard",
        "variants": [
          {
            "label": "대합본/천연/지퍼/다크네이비",
            "img": "https://chhouse.cafe24.com/web/product/big/202412/19231ef6cd16657e5fd93e353ec898ac.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=51954&cate_no=1372&display_group=1",
            "originalPrice": 85000,
            "salePrice": 76500
          },
          {
            "label": "대합본/천연/지퍼/다크브라운",
            "img": "https://chhouse.cafe24.com/web/product/big/202412/a2f0ad30f7083447b82043039a939b5b.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=51953&cate_no=1372&display_group=1",
            "originalPrice": 85000,
            "salePrice": 76500
          },
          {
            "label": "대합본/천연/지퍼/검정",
            "img": "https://chhouse.cafe24.com/web/product/big/202405/1af577de5972d7bf88cdc091175968c9.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=44925&cate_no=1372&display_group=1",
            "originalPrice": 73000,
            "salePrice": 65700
          },
          {
            "label": "대합본/천연/지퍼/다크브라운",
            "img": "https://chhouse.cafe24.com/web/product/big/202404/9cddba4546ad6345e4cabebb9c4595db.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=44924&cate_no=1372&display_group=1",
            "originalPrice": 73000,
            "salePrice": 65700
          },
          {
            "label": "대합본/천연/지퍼/버건디",
            "img": "https://chhouse.cafe24.com/web/product/big/202405/de0ac6e20221356e8cdb838df49bd789.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=38404&cate_no=1372&display_group=1",
            "originalPrice": 73000,
            "salePrice": 65700
          },
          {
            "label": "대합본/PU/지퍼/브라운",
            "img": "https://chhouse.cafe24.com/web/product/big/202501/fc7eba1022f57d4fe8178fdb830e8db5.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=52168&cate_no=1372&display_group=1",
            "originalPrice": 65000,
            "salePrice": 58500
          },
          {
            "label": "대합본/PU/지퍼/레드브라운",
            "img": "https://chhouse.cafe24.com/web/product/big/202501/f5cad44908e08b44cd8f3f54fa779308.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=52167&cate_no=1372&display_group=1",
            "originalPrice": 65000,
            "salePrice": 58500
          },
          {
            "label": "대합본/PU/무지퍼/초코브라운",
            "img": "https://chhouse.cafe24.com/web/product/big/202412/47f775944fb7e3ebdf34921ef650632e.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=51981&cate_no=1372&display_group=1",
            "originalPrice": 64000,
            "salePrice": 57600
          },
          {
            "label": "대합본/PU/무지퍼/초코브라운",
            "img": "https://chhouse.cafe24.com/web/product/big/202412/ceb6c6423390d3cff9a1d6aae8c2a583.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=51982&cate_no=1372&display_group=1",
            "originalPrice": 64000,
            "salePrice": 57600
          }
        ]
      },
      {
        "model": "NKR72EWXU",
        "size": "대",
        "mm": 4,
        "type": "standard",
        "variants": [
          {
            "label": "대합본/천연/지퍼/다크브라운",
            "img": "https://chhouse.kr/web/product/big/202404/302f4dac4d5bab4aafaa4ac3f72ddc34.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=46601&cate_no=1372&display_group=1",
            "originalPrice": 78000,
            "salePrice": 70200
          },
          {
            "label": "대합본/천연/지퍼/버건디",
            "img": "https://chhouse.kr/web/product/big/202404/653ea1cba536bb7a260d6b87ebee481c.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=46600&cate_no=1372&display_group=1",
            "originalPrice": 78000,
            "salePrice": 70200
          },
          {
            "label": "대합본/PU/지퍼/네이비",
            "img": "https://chhouse.kr/web/product/big/202406/4d6669c26cde3df3238db038f0595ede.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=48550&cate_no=1372&display_group=1",
            "originalPrice": 65000,
            "salePrice": 58500
          },
          {
            "label": "대합본/PU/지퍼/초코브라운",
            "img": "https://chhouse.kr/web/product/big/202405/021aea99558b7ebf9725192424fd83b3.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=48181&cate_no=1372&display_group=1",
            "originalPrice": 65000,
            "salePrice": 58500
          },
          {
            "label": "대합본/PU/무지퍼/검정",
            "img": "https://chhouse.kr/web/product/big/202405/a52d84e366e7c6be7acfa4bc66fa97c1.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=46312&cate_no=1372&display_group=1",
            "originalPrice": 62000,
            "salePrice": 55800
          },
          {
            "label": "대합본/PU/무지퍼/브라운",
            "img": "https://chhouse.kr/web/product/big/202405/2e4650936eaf523b3a81e7741a2c0d49.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=46311&cate_no=1372&display_group=1",
            "originalPrice": 62000,
            "salePrice": 55800
          }
        ]
      },
      {
        "model": "NKR72WTU",
        "size": "중",
        "mm": 3.8,
        "type": "standard",
        "variants": [
          {
            "label": "중합본/천연/지퍼/버건디",
            "img": "https://chhouse.kr/web/product/big/202405/54bb996457ca70dcd57bc35207d8c0ef.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=36947&cate_no=1371&display_group=1",
            "originalPrice": 60000,
            "salePrice": 54000
          },
          {
            "label": "중합본/천연/지퍼/다크브라운",
            "img": "https://chhouse.kr/web/product/big/202404/2cc00ba1ed7f3d166c9a129983beff1a.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=36946&cate_no=1371&display_group=1",
            "originalPrice": 60000,
            "salePrice": 54000
          },
          {
            "label": "중합본/PU/지퍼/뉴다크네이비",
            "img": "https://chhouse.kr/web/product/big/202405/345ad9356e6ac07787cac52096285c64.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=36044&cate_no=1371&display_group=1",
            "originalPrice": 56000,
            "salePrice": 50400
          },
          {
            "label": "중합본/PU/지퍼/뉴브라운",
            "img": "https://chhouse.kr/web/product/big/202405/304d72b90ab27f7d5ca3b60fad17e272.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=36043&cate_no=1371&display_group=1",
            "originalPrice": 56000,
            "salePrice": 50400
          },
          {
            "label": "중합본/PU/지퍼/뉴그레이",
            "img": "https://chhouse.kr/web/product/big/202405/54c9f3511af3cbde7493bff682fdfa6f.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=36045&cate_no=1371&display_group=1",
            "originalPrice": 56000,
            "salePrice": 50400
          },
          {
            "label": "중합본/PU/무지퍼/뉴다크브라운",
            "img": "https://chhouse.kr/web/product/big/202404/82d59828badee69deeae5b09dd4f2bdb.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=36042&cate_no=1371&display_group=1",
            "originalPrice": 48000,
            "salePrice": 43200
          },
          {
            "label": "중합본/PU/무지퍼/뉴다크네이비",
            "img": "https://chhouse.kr/web/product/big/202404/9ddbacc3fcd00174b666267ede0b6fe6.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=36041&cate_no=1371&display_group=1",
            "originalPrice": 48000,
            "salePrice": 43200
          }
        ]
      },
      {
        "model": "NKR72WXU",
        "size": "중",
        "mm": 3.8,
        "type": "standard",
        "variants": [
          {
            "label": "중합본/천연/지퍼/다크브라운",
            "img": "https://chhouse.kr/web/product/big/202405/b606c95e2b924385613b691f21d1c4c4.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=43574&cate_no=1371&display_group=1",
            "originalPrice": 66000,
            "salePrice": 59400
          },
          {
            "label": "중합본/천연/지퍼/버건디",
            "img": "https://chhouse.kr/web/product/big/202405/5d06bab0e89ad138695c292cd9bc7783.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=43603&cate_no=1371&display_group=1",
            "originalPrice": 66000,
            "salePrice": 59400
          },
          {
            "label": "중합본/PU/지퍼/브라운",
            "img": "https://chhouse.kr/web/product/big/202408/df9ad6f83e9018babd5ba1f6ec116bb1.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=49432&cate_no=1371&display_group=1",
            "originalPrice": 55000,
            "salePrice": 49500
          },
          {
            "label": "중합본/PU/지퍼/네이비",
            "img": "https://chhouse.kr/web/product/big/202408/c0fc361c861ba57cd39d454bc6addf30.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=49433&cate_no=1371&display_group=1",
            "originalPrice": 55000,
            "salePrice": 49500
          }
        ]
      },
      {
        "model": "NKR72WM",
        "size": "중",
        "mm": 3.2,
        "type": "standard",
        "variants": [
          {
            "label": "지갑식/중합본/브라운",
            "img": "https://chhouse.kr/web/product/big/202508/86655f3e91960e343a26350e2edb3846.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=54639&cate_no=1371&display_group=1",
            "originalPrice": 53000,
            "salePrice": 47700
          },
          {
            "label": "지갑식/중합본/네이비",
            "img": "https://chhouse.kr/web/product/big/202508/3161942126fc5ea6461f3901b49820a9.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=54638&cate_no=1371&display_group=1",
            "originalPrice": 53000,
            "salePrice": 47700
          },
          {
            "label": "지갑식/중합본/웜그레이",
            "img": "https://chhouse.kr/web/product/big/202508/da5103e47f52cfb4c0c782231e39947d.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=54640&cate_no=1371&display_group=1",
            "originalPrice": 53000,
            "salePrice": 47700
          }
        ]
      },
      {
        "model": "NKR62EWBU",
        "size": "소",
        "mm": 3.5,
        "type": "standard",
        "variants": [
          {
            "label": "소합본/천연/지펴/베이지",
            "img": "https://chhouse.kr/web/product/big/202408/e299ac6a19506a0bdc0c7e96ac5cd872.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=42416&cate_no=1345&display_group=1",
            "originalPrice": 63000,
            "salePrice": 56700
          },
          {
            "label": "소합본/천연/지퍼/브라운",
            "img": "https://chhouse.kr/web/product/big/202408/363cbe193cba3214863f2946f6efd6e3.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=42417&cate_no=1345&display_group=1",
            "originalPrice": 63000,
            "salePrice": 56700
          },
          {
            "label": "소합본/PU/지퍼/라벤더",
            "img": "https://chhouse.kr/web/product/big/202404/b2dc4a05641577db0174142275e7f90e.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=42420&cate_no=1345&display_group=1",
            "originalPrice": 53000,
            "salePrice": 47700
          },
          {
            "label": "소합본/PU/지퍼/네이비",
            "img": "https://chhouse.kr/web/product/big/202404/e5765c56ec52c012ba20b9881613ccdc.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=42419&cate_no=1345&display_group=1",
            "originalPrice": 53000,
            "salePrice": 47700
          },
          {
            "label": "소합본/PU/지퍼/다크브라운",
            "img": "https://chhouse.kr/web/product/big/202404/b0da6c4c3f000e5263c9448ba455a449.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=42418&cate_no=1345&display_group=1",
            "originalPrice": 53000,
            "salePrice": 47700
          }
        ]
      },
      {
        "model": "NKR62EWTU",
        "size": "소",
        "mm": 3,
        "type": "standard",
        "variants": [
          {
            "label": "소합본/천연/지펴/핑크베이지",
            "img": "https://chhouse.kr/web/product/big/202404/4e8ad9e34f06e27fec7981b9514029b0.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=42903&cate_no=1345&display_group=1",
            "originalPrice": 54000,
            "salePrice": 48600
          },
          {
            "label": "소합본/천연/지퍼/스카이",
            "img": "https://chhouse.kr/web/product/big/202404/85c6eff42fa059837c7e354c863ea9b5.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=42904&cate_no=1345&display_group=1",
            "originalPrice": 54000,
            "salePrice": 48600
          },
          {
            "label": "소합본/PU/지퍼/라이트그레이",
            "img": "https://chhouse.kr/web/product/big/202404/aa193a7c64a065a80a121d6c8d36a44f.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=42902&cate_no=1345&display_group=1",
            "originalPrice": 46000,
            "salePrice": 41400
          },
          {
            "label": "소합본/PU/지퍼/네이비",
            "img": "https://chhouse.kr/web/product/big/202404/5dfb7b92d0414d0693dab692df0f6702.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=42900&cate_no=1345&display_group=1",
            "originalPrice": 46000,
            "salePrice": 41400
          },
          {
            "label": "소합본/PU/지퍼/라벤더",
            "img": "https://chhouse.kr/web/product/big/202404/02b8d732d96fc4ae255d6f5120c12338.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=42901&cate_no=1345&display_group=1",
            "originalPrice": 46000,
            "salePrice": 41400
          }
        ]
      },
      {
        "model": "NKR62WXU",
        "size": "미니",
        "mm": 2.8,
        "type": "standard",
        "variants": [
          {
            "label": "미니합본/천연/지갑식/블랙",
            "img": "https://chhouse.kr/web/product/big/202508/5ed6fb1dffd2b14fd84345a52f22eb51.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=54491&cate_no=1387&display_group=1",
            "originalPrice": 62000,
            "salePrice": 55800
          },
          {
            "label": "미니합본/천연/지갑식/다크베이지",
            "img": "https://chhouse.kr/web/product/big/202604/438df7337210c8a48c113c6d842552db.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=57323&cate_no=1387&display_group=1",
            "originalPrice": 62000,
            "salePrice": 55800
          },
          {
            "label": "미니합본/PU/지갑식/버건디",
            "img": "https://chhouse.kr/web/product/big/202508/0057874621654726209ab7b07c845620.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=54598&cate_no=1387&display_group=1",
            "originalPrice": 52000,
            "salePrice": 46800
          },
          {
            "label": "미니합본/PU/지갑식/베이지",
            "img": "https://chhouse.kr/web/product/big/202508/df48ca9dbf2f74c685fc1f340f996a00.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=54599&cate_no=1387&display_group=1",
            "originalPrice": 52000,
            "salePrice": 46800
          },
          {
            "label": "미니합본/PU/지갑식/그레이",
            "img": "https://chhouse.kr/web/product/big/202604/0d92e64fe8aadde61d05ef3bde91b0c7.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=57249&cate_no=1387&display_group=1",
            "originalPrice": 52000,
            "salePrice": 46800
          },
          {
            "label": "미니합본/PU/지퍼/카키그레이",
            "img": "https://chhouse.kr/web/product/big/202405/1b33484bfd78513aea1681a7af7b5a6c.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=45048&cate_no=1387&display_group=1",
            "originalPrice": 44000,
            "salePrice": 39600
          },
          {
            "label": "미니합본/PU/지퍼/블랙",
            "img": "https://chhouse.kr/web/product/big/202405/e504b287bdbedc7c1f1f04699ec5b60d.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=45047&cate_no=1387&display_group=1",
            "originalPrice": 44000,
            "salePrice": 39600
          }
        ]
      }
    ]
  },
  "S": {
    "name": "성서원",
    "items": [
      {
        "model": "주석큰성경",
        "size": "특대",
        "mm": 4.5,
        "type": "study",
        "variants": [
          {
            "label": "대합본/천연/지퍼/블루블랙",
            "img": "https://chhouse.kr/web/product/big/202404/f8ba8f095238eab73476d495df641273.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=47111&cate_no=1402&display_group=1",
            "originalPrice": 76000,
            "salePrice": 68400
          },
          {
            "label": "대합본/천연/지퍼/버건디",
            "img": "https://chhouse.kr/web/product/big/202404/4c23d0dcdc82d11541f0740bd4a9920c.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=47112&cate_no=1402&display_group=1",
            "originalPrice": 76000,
            "salePrice": 68400
          },
          {
            "label": "대합본/PU/지퍼/블루블랙",
            "img": "https://chhouse.kr/web/product/big/202404/6505bf8609f9d13de1b52e0c52274261.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=45063&cate_no=1402&display_group=1",
            "originalPrice": 57000,
            "salePrice": 51300
          },
          {
            "label": "대합본/PU/지퍼/초코",
            "img": "https://chhouse.kr/web/product/big/202404/897c95975486463289834674fca150ad.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=45064&cate_no=1402&display_group=1",
            "originalPrice": 57000,
            "salePrice": 51300
          }
        ]
      },
      {
        "model": "주석큰성경",
        "size": "중",
        "mm": 4,
        "type": "study",
        "variants": [
          {
            "label": "중합본/천연/지퍼/버건디",
            "img": "https://chhouse.kr/web/product/big/202405/92c31169ae4c3738f1b56cb5800807e9.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=48502&cate_no=1377&display_group=1",
            "originalPrice": 65000,
            "salePrice": 58500
          },
          {
            "label": "중합본/천연/지퍼/초코",
            "img": "https://chhouse.kr/web/product/big/202405/d35ccb24baf03e84969b2f9099fa30ec.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=48503&cate_no=1377&display_group=1",
            "originalPrice": 65000,
            "salePrice": 58500
          },
          {
            "label": "중합본/PU/지퍼/다크블루",
            "img": "https://chhouse.kr/web/product/big/202405/0cf30474fd6b0dd594af1cb55209e8a7.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=48500&cate_no=1377&display_group=1",
            "originalPrice": 51000,
            "salePrice": 45900
          },
          {
            "label": "중합본/PU/지퍼/버건디",
            "img": "https://chhouse.kr/web/product/big/202405/d91dc828ac4f8186ed2adfa6e05941b4.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=48501&cate_no=1377&display_group=1",
            "originalPrice": 51000,
            "salePrice": 45900
          }
        ]
      },
      {
        "model": "베스트성경",
        "size": "중",
        "mm": 3.5,
        "type": "study",
        "variants": [
          {
            "label": "중합본/천연/지퍼/검정",
            "img": "https://chhouse.kr/web/product/big/202404/8e357521086eef083fbdd74a0fec4183.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=18912&cate_no=1377&display_group=1",
            "originalPrice": 56000,
            "salePrice": 50400
          },
          {
            "label": "중합본/천연/지퍼/버건디",
            "img": "https://chhouse.kr/web/product/big/202404/2911ed06d37d06c8f661e584b8e64b82.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=45793&cate_no=1377&display_group=1",
            "originalPrice": 56000,
            "salePrice": 50400
          },
          {
            "label": "중합본/PU/지퍼/브라운",
            "img": "https://chhouse.kr/web/product/big/202405/31732e4579b5ea9d9202324da159fe4e.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=40258&cate_no=1377&display_group=1",
            "originalPrice": 45000,
            "salePrice": 40500
          },
          {
            "label": "중합본/PU/지퍼/블루그린",
            "img": "https://chhouse.kr/web/product/big/202405/d9487a382233552e53fb00b9e9164f92.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=40259&cate_no=1377&display_group=1",
            "originalPrice": 45000,
            "salePrice": 40500
          },
          {
            "label": "중합본/PU/무지퍼/비치용",
            "img": "https://chhouse.kr/web/product/big/202406/d0a539ab1f05623d1bf3802c088683fd.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=48746&cate_no=1377&display_group=1",
            "originalPrice": 40000,
            "salePrice": 36000
          },
          {
            "label": "중합본/PU/무지퍼/비치용 (카페24)",
            "img": "https://chhouse.cafe24.com/web/product/big/202406/43bf0679ab1fa44e4046f15419496b5e.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=48747&cate_no=1377&display_group=1",
            "originalPrice": 40000,
            "salePrice": 36000
          }
        ]
      },
      {
        "model": "베스트성경",
        "size": "특소",
        "mm": 2.9,
        "type": "study",
        "variants": [
          {
            "label": "특소합본/천연/지퍼/네이비",
            "img": "https://chhouse.kr/web/product/big/202512/873007386c5f9924ae14acddb2061d68.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=56199&cate_no=1413&display_group=1",
            "originalPrice": 50000,
            "salePrice": 45000
          },
          {
            "label": "특소합본/천연/지퍼/버건디",
            "img": "https://chhouse.kr/web/product/big/202512/873007386c5f9924ae14acddb2061d68.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=56199&cate_no=1413&display_group=1",
            "originalPrice": 50000,
            "salePrice": 45000
          },
          {
            "label": "특소합본/PU/지퍼/네이비",
            "img": "https://chhouse.kr/web/product/big/202404/6f929ab4187584489b8705df2caa079b.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=42503&cate_no=1413&display_group=1",
            "originalPrice": 35500,
            "salePrice": 31950
          },
          {
            "label": "특소합본/PU/지퍼/브라운",
            "img": "https://chhouse.kr/web/product/big/202404/5305b0ba360d696767fc6cd79a69d151.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=42504&cate_no=1413&display_group=1",
            "originalPrice": 35500,
            "salePrice": 31950
          }
        ]
      },
      {
        "model": "좋은성경",
        "size": "대",
        "mm": 3.7,
        "type": "study",
        "variants": [
          {
            "label": "대합본/천연/지퍼/버건디",
            "img": "https://chhouse.cafe24.com/web/product/big/202512/6906dd11f8d887093e55d06478688773.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=56195&cate_no=1402&display_group=1",
            "originalPrice": 71000,
            "salePrice": 63900
          },
          {
            "label": "대합본/천연/저퍼/네이비",
            "img": "https://chhouse.cafe24.com/web/product/big/202512/804d69f7ab860ac203c741c5916ff707.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=56196&cate_no=1402&display_group=1",
            "originalPrice": 71000,
            "salePrice": 63900
          },
          {
            "label": "대합본/PU/저퍼/그린",
            "img": "https://chhouse.cafe24.com/web/product/big/202512/5d3bd7cdaf9fc48f741a603e04b7241a.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=56194&cate_no=1402&display_group=1",
            "originalPrice": 55000,
            "salePrice": 49500
          },
          {
            "label": "대합본/PU/저퍼/초코",
            "img": "https://chhouse.cafe24.com/web/product/big/202512/46430e101a43624f9fda48aa9ce49923.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=56193&cate_no=1402&display_group=1",
            "originalPrice": 55000,
            "salePrice": 49500
          }
        ]
      },
      {
        "model": "좋은성경",
        "size": "특소",
        "mm": 2.9,
        "type": "study",
        "variants": [
          {
            "label": "소합본/천연/지퍼/버건디",
            "img": "https://chhouse.cafe24.com/web/product/big/202405/a616c2831a3ab073587981625d15d108.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=45833&cate_no=1413&display_group=1",
            "originalPrice": 58000,
            "salePrice": 52200
          },
          {
            "label": "소합본/천연/지퍼/네이비",
            "img": "https://chhouse.cafe24.com/web/product/big/202405/8362aea493376ef2aee1d7c48ae9bf6e.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=45832&cate_no=1413&display_group=1",
            "originalPrice": 58000,
            "salePrice": 52200
          }
        ]
      },
      {
        "model": "빅컬러성경",
        "size": "대",
        "mm": 4,
        "type": "study",
        "variants": [
          {
            "label": "대합본/천연/지퍼/초코",
            "img": "https://chhouse.cafe24.com/web/product/big/202404/7439805c449d9b7defadb242927743e4.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=47320&cate_no=1402&display_group=1",
            "originalPrice": 79000,
            "salePrice": 71100
          },
          {
            "label": "대합본/천연/지퍼/버건디",
            "img": "https://chhouse.cafe24.com/web/product/big/202404/293873478fbe765df5801ad67ab3298a.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=47319&cate_no=1402&display_group=1",
            "originalPrice": 79000,
            "salePrice": 71100
          },
          {
            "label": "대합본/PU/지퍼/블루블랙",
            "img": "https://chhouse.cafe24.com/web/product/big/202405/da92f9980ef3dd754a1cc23cb999f465.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=44723&cate_no=1402&display_group=1",
            "originalPrice": 62000,
            "salePrice": 55800
          },
          {
            "label": "대합본/PU/지퍼/카멜브라운",
            "img": "https://chhouse.cafe24.com/web/product/big/202405/35f99973e0236e115ebb04b77fd6cf5b.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=44722&cate_no=1402&display_group=1",
            "originalPrice": 62000,
            "salePrice": 55800
          }
        ]
      },
      {
        "model": "만나성경",
        "size": "특미니",
        "mm": 2.4,
        "type": "study",
        "variants": [
          {
            "label": "특미니합본/PU/지퍼/민트",
            "img": "https://chhouse.cafe24.com/web/product/big/202603/23d914ab3b8c910149dbaf7ef8afefcd.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=56934&cate_no=1400&display_group=1",
            "originalPrice": 28000,
            "salePrice": 25200
          },
          {
            "label": "특미니합본/PU/지퍼/베이지",
            "img": "https://chhouse.cafe24.com/web/product/big/202603/009766c938c2833fdca9ff4a0c043469.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=56933&cate_no=1400&display_group=1",
            "originalPrice": 28000,
            "salePrice": 25200
          },
          {
            "label": "특미니합본/PU/지퍼/군인",
            "img": "https://chhouse.cafe24.com/web/product/big/202506/99754c7b4bc27c49d84ead8d87bd24b7.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=54166&cate_no=1400&display_group=1",
            "originalPrice": 29000,
            "salePrice": 26100
          }
        ]
      },
      {
        "model": "NKR83SB",
        "size": "특대",
        "mm": 4.7,
        "type": "standard",
        "variants": [
          {
            "label": "특대합본/천연/지퍼/버건디",
            "img": "https://chhouse.kr/web/product/big/202408/82dce6def533662cca05ceb4c156e15e.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=49469&cate_no=1451&display_group=1",
            "originalPrice": 88000,
            "salePrice": 79200
          },
          {
            "label": "특대합본/천연/지퍼/초코",
            "img": "https://chhouse.kr/web/product/big/202408/c52d1a41699f6308d00f41466a3c9bf6.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=49468&cate_no=1451&display_group=1",
            "originalPrice": 88000,
            "salePrice": 79200
          },
          {
            "label": "특대합본/PU/지퍼/네이비",
            "img": "https://chhouse.kr/web/product/big/202604/75bfd0c2bfe140ade99809830be3c202.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=57443&cate_no=1451&display_group=1",
            "originalPrice": 74000,
            "salePrice": 66600
          },
          {
            "label": "특대합본/PU/지퍼/브라운",
            "img": "https://chhouse.kr/web/product/big/202604/9d13ac2b4fc283d3f9c7b09eee4fa010.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=57444&cate_no=1451&display_group=1",
            "originalPrice": 74000,
            "salePrice": 66600
          },
          {
            "label": "특대합본/PU/지퍼/버건디",
            "img": "https://chhouse.kr/web/product/big/202408/f86c7177d007aea89116e2f7e14f5cc6.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=49466&cate_no=1451&display_group=1",
            "originalPrice": 73000,
            "salePrice": 65700
          },
          {
            "label": "특대합본/PU/지퍼/블루블랙",
            "img": "https://chhouse.kr/web/product/big/202408/990ae513a56675f928b762b9f58d5e62.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=49467&cate_no=1451&display_group=1",
            "originalPrice": 73000,
            "salePrice": 65700
          }
        ]
      },
      {
        "model": "NKR73ESB",
        "size": "대",
        "mm": 4.4,
        "type": "standard",
        "variants": [
          {
            "label": "대합본/천연/지퍼/블루블랙",
            "img": "https://chhouse.kr/web/product/big/202404/31220f9f72118e77b3a0692fde03d4c8.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=46900&cate_no=1402&display_group=1",
            "originalPrice": 83000,
            "salePrice": 74700
          },
          {
            "label": "대합본/천연/지퍼/버건디",
            "img": "https://chhouse.kr/web/product/big/202404/dd78f77eb83fa5508ba78b446874411a.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=46899&cate_no=1402&display_group=1",
            "originalPrice": 83000,
            "salePrice": 74700
          },
          {
            "label": "대합본/PU/지퍼/블루블랙",
            "img": "https://chhouse.kr/web/product/big/202404/26599b05b2eb86e0fd61525e19132b8c.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=46898&cate_no=1402&display_group=1",
            "originalPrice": 68000,
            "salePrice": 61200
          },
          {
            "label": "대합본/PU/지퍼/버건디",
            "img": "https://chhouse.kr/web/product/big/202404/93ef315792ef9bf52093a52f0e722002.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=46897&cate_no=1402&display_group=1",
            "originalPrice": 68000,
            "salePrice": 61200
          }
        ]
      },
      {
        "model": "NKR73SB",
        "size": "중",
        "mm": 4,
        "type": "standard",
        "variants": [
          {
            "label": "중합본/천연/지퍼/버건디",
            "img": "https://chhouse.kr/web/product/big/202604/76064c0c36008673d8b0f529b6091dac.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=47755&cate_no=1377&display_group=1",
            "originalPrice": 74000,
            "salePrice": 66600
          },
          {
            "label": "중합본/천연/지퍼/초코",
            "img": "https://chhouse.kr/web/product/big/202604/d923e64b547832a0ec69128d6aef1897.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=47754&cate_no=1377&display_group=1",
            "originalPrice": 74000,
            "salePrice": 66600
          },
          {
            "label": "중합본/천연/지퍼/버건디",
            "img": "https://chhouse.kr/web/product/big/202405/2afc563ca80aec0f4740aae9dba31058.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=45146&cate_no=1377&display_group=1",
            "originalPrice": 69000,
            "salePrice": 62100
          },
          {
            "label": "중합본/천연/지퍼/초코",
            "img": "https://chhouse.kr/web/product/big/202405/aec3bb8e167f9db20a3522fdb76cfd0e.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=45145&cate_no=1377&display_group=1",
            "originalPrice": 69000,
            "salePrice": 62100
          },
          {
            "label": "중합본/PU/지퍼/네이비",
            "img": "https://chhouse.kr/web/product/big/202404/7ae9b6b9ed5b78b5e9710efdb81b7fac.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=45144&cate_no=1377&display_group=1",
            "originalPrice": 60000,
            "salePrice": 54000
          },
          {
            "label": "중합본/PU/지퍼/초코",
            "img": "https://chhouse.kr/web/product/big/202404/593a6dd8824eae531919464b06e603b3.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=45143&cate_no=1377&display_group=1",
            "originalPrice": 60000,
            "salePrice": 54000
          },
          {
            "label": "중합본/PU/무지퍼/초코",
            "img": "https://chhouse.kr/web/product/big/202505/9cc850d3aed44571a0b837ed5af5ef65.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=53411&cate_no=1377&display_group=1",
            "originalPrice": 56000,
            "salePrice": 50400
          }
        ]
      },
      {
        "model": "NKR73STH",
        "size": "중",
        "mm": 3.5,
        "type": "standard",
        "variants": [
          {
            "label": "중합본/천연/지퍼/검정",
            "img": "https://chhouse.kr/web/product/big/202405/aabc12869a410ad23d492534397d52e9.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=18918&cate_no=1377&display_group=1",
            "originalPrice": 64000,
            "salePrice": 57600
          },
          {
            "label": "중합본/PU/지퍼/버건디",
            "img": "https://chhouse.kr/web/product/big/202405/5de0fcd9826647080cf1d9651354d713.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=46134&cate_no=1377&display_group=1",
            "originalPrice": 51000,
            "salePrice": 45900
          },
          {
            "label": "중합본/PU/지퍼/블루블랙",
            "img": "https://chhouse.kr/web/product/big/202405/719726017e726e78bbf115493b1a8a39.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=46133&cate_no=1377&display_group=1",
            "originalPrice": 51000,
            "salePrice": 45900
          },
          {
            "label": "중합본/PU/무지퍼/블루블랙",
            "img": "https://chhouse.kr/web/product/big/202509/bd9f1c18a875296462366ad78e60b696.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=54781&cate_no=1377&display_group=1",
            "originalPrice": 46000,
            "salePrice": 41400
          }
        ]
      }
    ]
  },
  "C": {
    "name": "대한기독교서회",
    "items": [
      {
        "model": "프라임 주석 성경",
        "size": "대",
        "mm": 4.5,
        "type": "study",
        "variants": [
          {
            "label": "대합본/천연/지퍼/딥버건디",
            "img": "https://chhouse.kr/web/product/big/202405/9b9d47f0387eb2b2e9cd8ed041abfd8e.jpg",
            "url": "https://chhouse.kr/product/%ED%94%84%EB%9D%BC%EC%9E%84%EC%A3%BC%EC%84%9D%EC%84%B1%EA%B2%BD-%EB%8C%80%ED%95%A9%EB%B3%B8-%EA%B0%9C%EC%97%AD%EA%B0%9C%EC%A0%95-%EC%83%88%EC%B0%AC%EC%86%A1%EA%B0%80-%EC%A7%80%ED%8D%BC-%EC%83%89%EC%9D%B8-%EB%B2%84%EA%B1%B4%EB%94%94/57299/category/1380/display/1/",
            "originalPrice": 76000,
            "salePrice": 68400
          },
          {
            "label": "대합본/천연/지퍼/블루블랙",
            "img": "https://chhouse.kr/web/product/big/202405/29ec734e8f9987eeecb7f2cd5398997f.jpg",
            "url": "https://chhouse.kr/product/%ED%94%84%EB%9D%BC%EC%9E%84%EC%A3%BC%EC%84%9D%EC%84%B1%EA%B2%BD-%EB%8C%80%ED%95%A9%EB%B3%B8-%EA%B0%9C%EC%97%AD%EA%B0%9C%EC%A0%95-%EC%83%88%EC%B0%AC%EC%86%A1%EA%B0%80-%EC%A7%80%ED%8D%BC-%EC%83%89%EC%9D%B8-%EB%B8%94%EB%A3%A8%EB%B8%94%EB%9E%99/57298/category/1380/display/1/",
            "originalPrice": 76000,
            "salePrice": 68400
          },
          {
            "label": "대합본/PU/지퍼/블루블랙",
            "img": "https://chhouse.kr/web/product/big/202604/79f54e0efb8f7c62283e686c3a52d77a.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=57298&cate_no=1380&display_group=1",
            "originalPrice": 58000,
            "salePrice": 52200
          },
          {
            "label": "대합본/PU/지퍼/버건디",
            "img": "https://chhouse.kr/web/product/big/202604/7f0d306a4a650e6c5ff1b38885ceece3.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=57299&cate_no=1380&display_group=1",
            "originalPrice": 58000,
            "salePrice": 52200
          }
        ]
      },
      {
        "model": "프라임 주석 성경",
        "size": "중",
        "mm": 4.1,
        "type": "study",
        "variants": [
          {
            "label": "중합본/천연/지퍼/딥버건디",
            "img": "https://chhouse.kr/web/product/big/202405/b70006e470d472a17cfc1c4e5ce4dce5.jpg",
            "url": "https://chhouse.kr/product/%EC%B2%9C%EC%97%B0%EC%9A%B0%ED%94%BC-%ED%94%84%EB%9D%BC%EC%9E%84%EC%A3%BC%EC%84%9D%EC%84%B1%EA%B2%BD-%EB%8C%80%ED%95%A9%EB%B3%B8-%EA%B0%9C%EC%97%AD%EA%B0%9C%EC%A0%95-%EC%83%88%EC%B0%AC%EC%86%A1%EA%B0%80-%EC%A7%80%ED%8D%BC-%EC%83%89%EC%9D%B8-%EB%94%A5%EB%B2%84%EA%B1%B4%EB%94%94/40869/category/1380/display/1/",
            "originalPrice": 67000,
            "salePrice": 60300
          },
          {
            "label": "중합본/천연/지퍼/블루블랙",
            "img": "https://chhouse.kr/web/product/big/202405/be0cf4f68f15f31dc86a87673aa1b94d.jpg",
            "url": "https://chhouse.kr/product/%EC%B2%9C%EC%97%B0%EC%9A%B0%ED%94%BC-%ED%94%84%EB%9D%BC%EC%9E%84%EC%A3%BC%EC%84%9D%EC%84%B1%EA%B2%BD-%EB%8C%80%ED%95%A9%EB%B3%B8-%EA%B0%9C%EC%97%AD%EA%B0%9C%EC%A0%95-%EC%83%88%EC%B0%AC%EC%86%A1%EA%B0%80-%EC%A7%80%ED%8D%BC-%EC%83%89%EC%9D%B8-%EB%B8%94%EB%A3%A8%EB%B8%94%EB%9E%99/40868/category/1380/display/1/",
            "originalPrice": 67000,
            "salePrice": 60300
          },
          {
            "label": "중합본/PU/지퍼/다크브라운",
            "img": "https://chhouse.kr/web/product/big/202604/20a719ef566aadd90b4fd1acd3067542.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=57300&cate_no=1353&display_group=1",
            "originalPrice": 54000,
            "salePrice": 48600
          },
          {
            "label": "중합본/PU/지퍼/카키그레이",
            "img": "https://chhouse.kr/web/product/big/202405/827c19946d4c8e64ebbee65bc74aa7b1.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=40867&cate_no=1380&display_group=1",
            "originalPrice": 54000,
            "salePrice": 48600
          }
        ]
      },
      {
        "model": "취리히바이블",
        "size": "특대",
        "mm": 4,
        "type": "study",
        "variants": [
          {
            "label": "특대합본/천연/지퍼/블루블랙",
            "img": "https://chhouse.kr/web/product/big/202405/a01e296ec8e0baf3ab0da2383c49413b.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=37950&cate_no=1366&display_group=1",
            "originalPrice": 61000,
            "salePrice": 54900
          },
          {
            "label": "특대합본/천연/지퍼/다크브라운",
            "img": "https://chhouse.kr/web/product/big/202405/2601c80956f73e33f9c0afc2b6128887.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=37949&cate_no=1366&display_group=1",
            "originalPrice": 61000,
            "salePrice": 54900
          },
          {
            "label": "특대합본/PU/지퍼/버건디",
            "img": "https://chhouse.kr/web/product/big/202405/85d2f781eec3b92a28961296ea3aa56a.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=37954&cate_no=1366&display_group=1",
            "originalPrice": 49000,
            "salePrice": 44100
          },
          {
            "label": "특대합본/PU/지퍼/다크브라운",
            "img": "https://chhouse.kr/web/product/big/202405/923df645eaf9012a96038fa4880d6561.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=37953&cate_no=1366&display_group=1",
            "originalPrice": 49000,
            "salePrice": 44100
          },
          {
            "label": "특대합본/PU/지퍼/블루블랙",
            "img": "https://chhouse.kr/web/product/big/202405/944de7d65be586b91478fab2371cf90b.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=37955&cate_no=1366&display_group=1",
            "originalPrice": 49000,
            "salePrice": 44100
          }
        ]
      },
      {
        "model": "취리히바이블",
        "size": "특중",
        "mm": 3.5,
        "type": "study",
        "variants": [
          {
            "label": "특중합본/천연/지퍼/다크브라운",
            "img": "https://chhouse.kr/web/product/big/202405/8718503ccb1d866d222ddcc9d76ca736.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=37951&cate_no=1446&display_group=1",
            "originalPrice": 52000,
            "salePrice": 46800
          },
          {
            "label": "특중합본/천연/지퍼/블루블랙",
            "img": "https://chhouse.kr/web/product/big/202405/e06145f6e68da1493f4f214270e63bee.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=37952&cate_no=1446&display_group=1",
            "originalPrice": 52000,
            "salePrice": 46800
          },
          {
            "label": "특중합본/PU/지퍼/버건디",
            "img": "https://chhouse.kr/web/product/big/202405/2ac782c3e087b96888978f7777bd4f7e.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=37957&cate_no=1446&display_group=1",
            "originalPrice": 40000,
            "salePrice": 36000
          },
          {
            "label": "특중합본/PU/지퍼/다크브라운",
            "img": "https://chhouse.kr/web/product/big/202405/5bde018b939f8d74d02ed10de703620c.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=37956&cate_no=1446&display_group=1",
            "originalPrice": 40000,
            "salePrice": 36000
          },
          {
            "label": "특중합본/PU/지퍼/카키블랙",
            "img": "https://chhouse.kr/web/product/big/202405/72237e878d678a5bfc8804fa3e92ffbf.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=37958&cate_no=1446&display_group=1",
            "originalPrice": 40000,
            "salePrice": 36000
          }
        ]
      },
      {
        "model": "취리히바이블",
        "size": "소",
        "mm": 3,
        "type": "study",
        "variants": [
          {
            "label": "소합본/천연/지퍼/다크브라운",
            "img": "https://chhouse.kr/web/product/big/202405/4c2507346fbfa48739205ad529409957.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=38295&cate_no=1408&display_group=1",
            "originalPrice": 49000,
            "salePrice": 44100
          },
          {
            "label": "소합본/천연/지퍼/블루블랙",
            "img": "https://chhouse.kr/web/product/big/202405/bde44bd74f398c17563afdfaaf07037a.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=38296&cate_no=1408&display_group=1",
            "originalPrice": 49000,
            "salePrice": 44100
          },
          {
            "label": "소합본/PU/지퍼/다크브라운",
            "img": "https://chhouse.kr/web/product/big/202405/151d526a01c20d1e20e1d1a12ca49ab3.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=38297&cate_no=1408&display_group=1",
            "originalPrice": 37000,
            "salePrice": 33300
          },
          {
            "label": "소합본/PU/지퍼/레드",
            "img": "https://chhouse.kr/web/product/big/202405/11f3934693aa6dbfde03601380ea61d2.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=38298&cate_no=1408&display_group=1",
            "originalPrice": 37000,
            "salePrice": 33300
          },
          {
            "label": "소합본/PU/지퍼/모던브라운",
            "img": "https://chhouse.kr/web/product/big/202405/23d2b79457c2a64a8f95eeed48bc0895.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=38299&cate_no=1408&display_group=1",
            "originalPrice": 37000,
            "salePrice": 33300
          }
        ]
      },
      {
        "model": "포커스성경",
        "size": "특소",
        "mm": 2.6,
        "type": "study",
        "variants": [
          {
            "label": "특소합본/PU/지퍼/인디핑크",
            "img": "https://chhouse.kr/web/product/big/202604/441c573a7508a1d6d44d74d22e2616b8.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=57327&cate_no=1363&display_group=1",
            "originalPrice": 38000,
            "salePrice": 34200
          },
          {
            "label": "특소합본/PU/지퍼/인디고블루",
            "img": "https://chhouse.kr/web/product/big/202405/f451410530973703219274223000be22.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=45763&cate_no=1363&display_group=1",
            "originalPrice": 38000,
            "salePrice": 34200
          },
          {
            "label": "특소합본/PU/지퍼/민트",
            "img": "https://chhouse.kr/web/product/big/202405/76cf85ed78bed62b143cf549bacdb214.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=45764&cate_no=1363&display_group=1",
            "originalPrice": 38000,
            "salePrice": 34200
          }
        ]
      },
      {
        "model": "포커스성경",
        "size": "초미니",
        "mm": 2.1,
        "type": "study",
        "variants": [
          {
            "label": "초미니합본/PU/지퍼/민트",
            "img": "https://chhouse.kr/web/product/big/202604/a874032290a1e0d66e92636875b99ccc.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=57301&cate_no=1412&display_group=1",
            "originalPrice": 32000,
            "salePrice": 28800
          },
          {
            "label": "초미니합본/PU/지퍼/인디고블루",
            "img": "https://chhouse.kr/web/product/big/202405/df3d34c98d6fa6c26291d38382a4cbef.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=45767&cate_no=1412&display_group=1",
            "originalPrice": 32000,
            "salePrice": 28800
          },
          {
            "label": "초미니합본/PU/지퍼/로즈핑크",
            "img": "https://chhouse.kr/web/product/big/202405/43ed95643aa508e60ab19527066cab64.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=45768&cate_no=1412&display_group=1",
            "originalPrice": 32000,
            "salePrice": 28800
          }
        ]
      },
      {
        "model": "NKR83TU",
        "size": "특대",
        "mm": 4.2,
        "type": "standard",
        "variants": [
          {
            "label": "특대합본/천연/지퍼/블루블랙",
            "img": "https://chhouse.kr/web/product/big/202405/26c8c8fffa5ad1bc00a16b4fe709f303.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=43118&cate_no=1366&display_group=1",
            "originalPrice": 70000,
            "salePrice": 63000
          },
          {
            "label": "특대합본/천연/지퍼/버건디",
            "img": "https://chhouse.kr/web/product/big/202405/d44be0b0fb0d7825db617fbbebe11918.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=43119&cate_no=1366&display_group=1",
            "originalPrice": 70000,
            "salePrice": 63000
          },
          {
            "label": "특대합본/PU/지퍼/모카브라운",
            "img": "https://chhouse.kr/web/product/big/202405/fc3f077da1cbaa9a3e0fcfacd51e6a22.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=43121&cate_no=1366&display_group=1",
            "originalPrice": 55000,
            "salePrice": 49500
          },
          {
            "label": "특대합본/PU/지퍼/다크브라운",
            "img": "https://chhouse.kr/web/product/big/202405/ec4574ff093f30754031d246f8457be7.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=43120&cate_no=1366&display_group=1",
            "originalPrice": 55000,
            "salePrice": 49500
          }
        ]
      },
      {
        "model": "NKR73EBU",
        "size": "대",
        "mm": 4.6,
        "type": "standard",
        "variants": [
          {
            "label": "대합본/천연/지퍼/블루블랙",
            "img": "https://chhouse.kr/web/product/big/202404/7593d868ac88fb2999cd688e72408d51.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=46840&cate_no=1380&display_group=1",
            "originalPrice": 83000,
            "salePrice": 74700
          },
          {
            "label": "대합본/천연/지퍼/버건디",
            "img": "https://chhouse.kr/web/product/big/202404/e18f4f0af7d05ed5016f55c50b2a6e30.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=46761&cate_no=1380&display_group=1",
            "originalPrice": 83000,
            "salePrice": 74700
          },
          {
            "label": "대합본/PU/지퍼/버건디",
            "img": "https://chhouse.kr/web/product/big/202405/fefeaa86a6b98715ef3102ae3d8c0759.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=42703&cate_no=1380&display_group=1",
            "originalPrice": 67000,
            "salePrice": 60300
          },
          {
            "label": "대합본/PU/지퍼/블루블랙",
            "img": "https://chhouse.kr/web/product/big/202405/24ba1fb05f18c33ae82bc64445ab8325.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=42702&cate_no=1380&display_group=1",
            "originalPrice": 67000,
            "salePrice": 60300
          }
        ]
      },
      {
        "model": "NKR83BU",
        "size": "특대",
        "mm": 4.9,
        "type": "standard",
        "variants": [
          {
            "label": "특대합본/천연/지퍼/블루블랙",
            "img": "https://chhouse.kr/web/product/big/202404/798e54d2d0c2bb1e649b7cff9129f05e.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=38198&cate_no=1366&display_group=1",
            "originalPrice": 86000,
            "salePrice": 77400
          },
          {
            "label": "특대합본/천연/지퍼/다크브라운",
            "img": "https://chhouse.kr/web/product/big/202404/3b2171cd06d50f2fb603b039a570d4ff.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=18288&cate_no=1366&display_group=1",
            "originalPrice": 86000,
            "salePrice": 77400
          }
        ]
      },
      {
        "model": "NKR73BU",
        "size": "중",
        "mm": 4.4,
        "type": "standard",
        "variants": [
          {
            "label": "중합본/천연/지퍼/버건디",
            "img": "https://chhouse.kr/web/product/big/202405/f0ae81e70643d1f3f494c63078cf256c.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=18285&cate_no=1353&display_group=1",
            "originalPrice": 75000,
            "salePrice": 67500
          },
          {
            "label": "중합본/천연/지퍼/블루블랙",
            "img": "https://chhouse.kr/web/product/big/202405/b5a1668be5dafc43a97bee8195f6c16a.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=38136&cate_no=1353&display_group=1",
            "originalPrice": 75000,
            "salePrice": 67500
          },
          {
            "label": "중합본/PU/지퍼/다크브라운",
            "img": "https://chhouse.kr/web/product/big/202405/ccba522590d46e7724a5ca97abbdbdf2.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=42809&cate_no=1353&display_group=1",
            "originalPrice": 61000,
            "salePrice": 54900
          },
          {
            "label": "중합본/PU/지퍼/블루블랙",
            "img": "https://chhouse.kr/web/product/big/202405/145b6f0dcdb4cfb8dc9dc2ba4e71551e.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=42807&cate_no=1353&display_group=1",
            "originalPrice": 61000,
            "salePrice": 54900
          }
        ]
      },
      {
        "model": "NKR73THU",
        "size": "중",
        "mm": 3.6,
        "type": "standard",
        "variants": [
          {
            "label": "중합본/천연/지퍼/딥버건디",
            "img": "https://chhouse.kr/web/product/big/202405/0cd420aad8f14bdc0dd37c6af061099a.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=37960&cate_no=1353&display_group=1",
            "originalPrice": 60000,
            "salePrice": 54000
          },
          {
            "label": "중합본/천연/지퍼/카키그레이",
            "img": "https://chhouse.kr/web/product/big/202405/bf5c102577effc64962ca8ae0d9d0453.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=42148&cate_no=1353&display_group=1",
            "originalPrice": 60000,
            "salePrice": 54000
          },
          {
            "label": "중합본/천연/지퍼/블루블랙",
            "img": "https://chhouse.kr/web/product/big/202405/f54461feb24e8fe8706b282c2fd274c3.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=37959&cate_no=1353&display_group=1",
            "originalPrice": 60000,
            "salePrice": 54000
          },
          {
            "label": "중합본/PU/지퍼/블루블랙",
            "img": "https://chhouse.kr/web/product/big/202507/f279dcf2b1d96c3e7578b479270af86b.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=54240&cate_no=1353&display_group=1",
            "originalPrice": 49000,
            "salePrice": 44100
          },
          {
            "label": "중합본/PU/지퍼/다크브라운",
            "img": "https://chhouse.kr/web/product/big/202507/d03278e260053fa67d67330d4bf196ad.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=54241&cate_no=1353&display_group=1",
            "originalPrice": 49000,
            "salePrice": 44100
          },
          {
            "label": "중합본/PU/무지퍼/블루블랙",
            "img": "https://chhouse.kr/web/product/big/202507/b5f078893b67569d5a84e0733e3f316c.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=54238&cate_no=1353&display_group=1",
            "originalPrice": 42500,
            "salePrice": 38250
          },
          {
            "label": "중합본/PU/무지퍼/다크브라운",
            "img": "https://chhouse.kr/web/product/big/202507/49f336e185f530daf9c1a239b29e326f.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=54239&cate_no=1353&display_group=1",
            "originalPrice": 42500,
            "salePrice": 38250
          }
        ]
      },
      {
        "model": "NKR63EXU",
        "size": "소",
        "mm": 3.5,
        "type": "standard",
        "variants": [
          {
            "label": "소합본/천연/지퍼/블루블랙",
            "img": "https://chhouse.kr/web/product/big/202404/2801c02922b067389801b5d6987870e0.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=47031&cate_no=1408&display_group=1",
            "originalPrice": 59000,
            "salePrice": 53100
          },
          {
            "label": "소합본/천연/지퍼/버건디",
            "img": "https://chhouse.kr/web/product/big/202404/825afeea6a25b4c82404ff5a4839c70b.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=47032&cate_no=1408&display_group=1",
            "originalPrice": 59000,
            "salePrice": 53100
          },
          {
            "label": "소합본/천연/지퍼/크림",
            "img": "https://chhouse.kr/web/product/big/202404/bc5f9e5b5c1aeddccac327052e6a0cb3.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=47033&cate_no=1408&display_group=1",
            "originalPrice": 59000,
            "salePrice": 53100
          },
          {
            "label": "소합본/PU/지퍼/라벤더",
            "img": "https://chhouse.kr/web/product/big/202404/86b30fa2d7a58f8c19933e197f0aa7cf.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=47034&cate_no=1408&display_group=1",
            "originalPrice": 47000,
            "salePrice": 42300
          },
          {
            "label": "소합본/PU/지퍼/인디고블루",
            "img": "https://chhouse.kr/web/product/big/202404/ed4114487f28caec6f6dee209bdc663a.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=47030&cate_no=1408&display_group=1",
            "originalPrice": 47000,
            "salePrice": 42300
          }
        ]
      },
      {
        "model": "NKR63ETHU",
        "size": "소",
        "mm": 3.1,
        "type": "standard",
        "variants": [
          {
            "label": "소합본/천연/지퍼/크림",
            "img": "https://chhouse.kr/web/product/big/202404/4a69a10db89a156dc47e79110ca210e3.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=46924&cate_no=1408&display_group=1",
            "originalPrice": 53000,
            "salePrice": 47700
          },
          {
            "label": "소합본/천연/지펴/블루스카이",
            "img": "https://chhouse.kr/web/product/big/202404/e9e541dab8d02b9ba89fa5828bd191b2.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=39850&cate_no=1408&display_group=1",
            "originalPrice": 53000,
            "salePrice": 47700
          },
          {
            "label": "소합본/천연/지펴/블루블랙",
            "img": "https://chhouse.kr/web/product/big/202404/1a54046cc98c69b09e9dda0e5ed6de82.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=39851&cate_no=1408&display_group=1",
            "originalPrice": 53000,
            "salePrice": 47700
          },
          {
            "label": "소합본/PU/지퍼/트윙클골드",
            "img": "https://chhouse.kr/web/product/big/202405/6a62a58b228fd5229ba9ca1aeeb18bb5.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=44077&cate_no=1408&display_group=1",
            "originalPrice": 37000,
            "salePrice": 33300
          }
        ]
      }
    ]
  },
  "D": {
    "name": "두란노",
    "items": [
      {
        "model": "비전성경",
        "size": "중",
        "mm": 3.2,
        "type": "study",
        "variants": [
          {
            "label": "중합본/PU/지퍼/황갈색",
            "img": "https://chhouse.cafe24.com/web/product/big/202405/c318b200d83cb98d5f73d07f4cb4e062.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=42829&cate_no=1393&display_group=1",
            "originalPrice": 40000,
            "salePrice": 36000
          },
          {
            "label": "중합본/PU/지퍼/진갈색",
            "img": "https://chhouse.cafe24.com/web/product/big/202405/65eda45ae5171c3f264a832dc4999afb.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=42828&cate_no=1393&display_group=1",
            "originalPrice": 40000,
            "salePrice": 36000
          },
          {
            "label": "중합본/PU/지퍼/진청색",
            "img": "https://chhouse.cafe24.com/web/product/big/202405/5102004daef0073a8b7e6f39b73788ad.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=42830&cate_no=1393&display_group=1",
            "originalPrice": 40000,
            "salePrice": 36000
          }
        ]
      },
      {
        "model": "비전성경",
        "size": "특미니",
        "mm": 2.4,
        "type": "study",
        "variants": [
          {
            "label": "특미니합본/PU/지퍼/모카무스",
            "img": "https://chhouse.cafe24.com/web/product/big/202601/6d017950082a1e5fefa0272510dc4952.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=56538&cate_no=1452&display_group=1",
            "originalPrice": 32000,
            "salePrice": 28800
          },
          {
            "label": "특미니합본/PU/지퍼/네이비",
            "img": "https://chhouse.cafe24.com/web/product/big/202601/35fe15c583b4245561a6108244a9c818.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=56537&cate_no=1452&display_group=1",
            "originalPrice": 32000,
            "salePrice": 28800
          },
          {
            "label": "특미니합본/PU/지퍼/베이지",
            "img": "https://chhouse.cafe24.com/web/product/big/202601/6fa323de1e49cf3d8ac20ab06ad3f153.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=56540&cate_no=1452&display_group=1",
            "originalPrice": 32000,
            "salePrice": 28800
          },
          {
            "label": "특미니합본/PU/지퍼/민트블루",
            "img": "https://chhouse.cafe24.com/web/product/big/202601/417964cc2e7dfaa691e6df48e7b9a984.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=56539&cate_no=1452&display_group=1",
            "originalPrice": 32000,
            "salePrice": 28800
          }
        ]
      },
      {
        "model": "비전성경",
        "size": "초미니",
        "mm": 2,
        "type": "study",
        "variants": [
          {
            "label": "초미니합본/PU/밴드형/샌드베이지",
            "img": "https://chhouse.cafe24.com/web/product/big/202602/8e4ae1f259c5f1b1a71a1e521fc85dff.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=56767&cate_no=1392&display_group=1",
            "originalPrice": 30000,
            "salePrice": 27000
          },
          {
            "label": "초미니합본/PU/밴드형/로즈핑크",
            "img": "https://chhouse.cafe24.com/web/product/big/202602/eed9eab338e331440d34892fa6b8c8d4.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=56766&cate_no=1392&display_group=1",
            "originalPrice": 30000,
            "salePrice": 27000
          },
          {
            "label": "초미니합본/PU/밴드형/라이트네이비",
            "img": "https://chhouse.cafe24.com/web/product/big/202602/dc8e0fddfacca0968b8fb2f31e553919.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=56765&cate_no=1392&display_group=1",
            "originalPrice": 30000,
            "salePrice": 27000
          },
          {
            "label": "초미니합본/PU/밴드형/다크그레이",
            "img": "https://chhouse.cafe24.com/web/product/big/202602/c23db938c221f219b36dc015a3025951.jpg",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=56764&cate_no=1392&display_group=1",
            "originalPrice": 30000,
            "salePrice": 27000
          }
        ]
      },
      {
        "model": "NKR82DBU",
        "size": "특대",
        "mm": 4.9,
        "type": "standard",
        "variants": [
          {
            "label": "특대합본/천연/지퍼/다크레드",
            "img": "https://chhouse.kr/web/product/big/202405/72635a39cd1fd0dfdec9ba65c3eaa93a.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=43493&cate_no=1414&display_group=1",
            "originalPrice": 86000,
            "salePrice": 77400
          },
          {
            "label": "특대합본/천연/지퍼/다크초코",
            "img": "https://chhouse.kr/web/product/big/202405/255e925c7c78bc1e29a1f9f4a0c974a9.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=43494&cate_no=1414&display_group=1",
            "originalPrice": 86000,
            "salePrice": 77400
          },
          {
            "label": "특대합본/천연/지퍼/다크블루",
            "img": "https://chhouse.kr/web/product/big/202405/45f58ebb7b0794cb0e5aeacbb67cdb21.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=43495&cate_no=1414&display_group=1",
            "originalPrice": 86000,
            "salePrice": 77400
          },
          {
            "label": "특대합본/천연/무지퍼/다크초코",
            "img": "https://chhouse.kr/web/product/big/202404/eb889255b575f22f883ec814ef95a318.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=46696&cate_no=1414&display_group=1",
            "originalPrice": 65000,
            "salePrice": 58500
          },
          {
            "label": "특대합본/천연/무지퍼/다크블루",
            "img": "https://chhouse.kr/web/product/big/202404/30ef086019aa9527661925d2c6ff2f57.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=46697&cate_no=1414&display_group=1",
            "originalPrice": 65000,
            "salePrice": 58500
          },
          {
            "label": "특대합본/천연/무지퍼/다크레드",
            "img": "https://chhouse.kr/web/product/big/202504/64417043c2aa996ecddd4fd816453df8.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=53172&cate_no=1414&display_group=1",
            "originalPrice": 65000,
            "salePrice": 58500
          }
        ]
      },
      {
        "model": "NKR72EDBU",
        "size": "대",
        "mm": 4.7,
        "type": "standard",
        "variants": [
          {
            "label": "대합본/천연/지퍼/다크레드",
            "img": "https://chhouse.kr/web/product/big/202405/a7bb53e89cd7a65282a9a8cc2b28dc16.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=44780&cate_no=1414&display_group=1",
            "originalPrice": 76000,
            "salePrice": 68400
          },
          {
            "label": "대합본/천연/지퍼/다크초코",
            "img": "https://chhouse.kr/web/product/big/202405/c86fe5aaba730310579f5ad973840aef.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=44779&cate_no=1414&display_group=1",
            "originalPrice": 76000,
            "salePrice": 68400
          },
          {
            "label": "대합본/천연/지퍼/다크블루",
            "img": "https://chhouse.kr/web/product/big/202405/efe58eb5f9f2704bfb5de44730f8a17f.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=44778&cate_no=1414&display_group=1",
            "originalPrice": 76000,
            "salePrice": 68400
          }
        ]
      },
      {
        "model": "NKR72SDXU",
        "size": "중",
        "mm": 4,
        "type": "standard",
        "variants": [
          {
            "label": "중합본/천연/지퍼/다크레드",
            "img": "https://chhouse.kr/web/product/big/202405/09dab336417a0a1d0a18dfa168a94ab8.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=42831&cate_no=1393&display_group=1",
            "originalPrice": 69000,
            "salePrice": 62100
          },
          {
            "label": "중합본/천연/지퍼/다크블루",
            "img": "https://chhouse.kr/web/product/big/202405/5df70e2d4da1b97033ed5d11f73db85c.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=42832&cate_no=1393&display_group=1",
            "originalPrice": 69000,
            "salePrice": 62100
          },
          {
            "label": "중합본/천연/지퍼/다크초코",
            "img": "https://chhouse.kr/web/product/big/202405/c5c159602729bfea2c0f5cf9e853bd19.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=42833&cate_no=1393&display_group=1",
            "originalPrice": 69000,
            "salePrice": 62100
          },
          {
            "label": "중합본/PU/무지퍼/황갈색",
            "img": "https://chhouse.kr/web/product/big/202510/36c070e443e0b676db0d32edc6b91093.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=46384&cate_no=1393&display_group=1",
            "originalPrice": 50000,
            "salePrice": 45000
          },
          {
            "label": "중합본/PU/무지퍼/진갈색",
            "img": "https://chhouse.kr/web/product/big/202510/2342ce841353a7e3d8273f4eb37b50be.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=46383&cate_no=1393&display_group=1",
            "originalPrice": 50000,
            "salePrice": 45000
          },
          {
            "label": "중합본/PU/무지퍼/연청색",
            "img": "https://chhouse.kr/web/product/big/202510/dddd1b2dd97536184beb32e79fa7eec0.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=55548&cate_no=1393&display_group=1",
            "originalPrice": 50000,
            "salePrice": 45000
          }
        ]
      },
      {
        "model": "NKR72TU",
        "size": "중",
        "mm": 3.6,
        "type": "standard",
        "variants": [
          {
            "label": "중합본/PU/지퍼/블루",
            "img": "https://chhouse.kr/web/product/big/202404/73b7d6b1dabaa98d9b351ef8f47651a2.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=46693&cate_no=1393&display_group=1",
            "originalPrice": 45000,
            "salePrice": 40500
          },
          {
            "label": "중합본/PU/지퍼/브라운",
            "img": "https://chhouse.kr/web/product/big/202404/8f01def73e4083807139ea2941d122cc.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=46694&cate_no=1393&display_group=1",
            "originalPrice": 45000,
            "salePrice": 40500
          },
          {
            "label": "중합본/PU/지퍼/와인",
            "img": "https://chhouse.kr/web/product/big/202404/65f8f70a7c08f812bcd31a760edf1762.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=46692&cate_no=1393&display_group=1",
            "originalPrice": 45000,
            "salePrice": 40500
          }
        ]
      },
      {
        "model": "NKR62EBU",
        "size": "소",
        "mm": 3.7,
        "type": "standard",
        "variants": [
          {
            "label": "소합본/천연/지퍼/다크레드",
            "img": "https://chhouse.kr/web/product/big/202506/2b635fd7d0ed706ced953c65336dcb15.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=53956&cate_no=1394&display_group=1",
            "originalPrice": 62000,
            "salePrice": 55800
          },
          {
            "label": "소합본/천연/지퍼/스틸블루",
            "img": "https://chhouse.kr/web/product/big/202506/717c01aa98f1cb8fb8df9d4301a4c9f4.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=53959&cate_no=1394&display_group=1",
            "originalPrice": 62000,
            "salePrice": 55800
          },
          {
            "label": "소합본/천연/지퍼/다크블루",
            "img": "https://chhouse.kr/web/product/big/202506/0fe42ff7f4b055e89ef956625fa2eddf.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=53957&cate_no=1394&display_group=1",
            "originalPrice": 62000,
            "salePrice": 55800
          },
          {
            "label": "소합본/천연/지퍼/다크초코",
            "img": "https://chhouse.kr/web/product/big/202506/7c201b8d8d88f9f1f2abc1781ae41383.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=53958&cate_no=1394&display_group=1",
            "originalPrice": 62000,
            "salePrice": 55800
          },
          {
            "label": "소합본/PU/지퍼/스카이블루",
            "img": "https://chhouse.kr/web/product/big/202504/8d1ef721f3ed1dfc16cee8dbde437c6b.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=53319&cate_no=1394&display_group=1",
            "originalPrice": 52000,
            "salePrice": 46800
          },
          {
            "label": "소합본/PU/지퍼/민트그레이",
            "img": "https://chhouse.kr/web/product/big/202504/728ad6df58f20d8e750ec0c570f0e2e3.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=53317&cate_no=1394&display_group=1",
            "originalPrice": 52000,
            "salePrice": 46800
          },
          {
            "label": "소합본/PU/지퍼/피치핑크",
            "img": "https://chhouse.kr/web/product/big/202504/8fd74850763fb68699f908b4bb132f30.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=53320&cate_no=1394&display_group=1",
            "originalPrice": 52000,
            "salePrice": 46800
          },
          {
            "label": "소합본/PU/지퍼/베이지",
            "img": "https://chhouse.kr/web/product/big/202504/c3b9a4eb79d707e417f3675360bdb1c5.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=53318&cate_no=1394&display_group=1",
            "originalPrice": 52000,
            "salePrice": 46800
          }
        ]
      },
      {
        "model": "NKR62ETU",
        "size": "소",
        "mm": 3.2,
        "type": "standard",
        "variants": [
          {
            "label": "소합본/천연/지퍼/카카오브라운",
            "img": "https://chhouse.kr/web/product/big/202405/5154f9dfc277fc0064bd62ae33115f37.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=43846&cate_no=1394&display_group=1",
            "originalPrice": 55000,
            "salePrice": 49500
          },
          {
            "label": "소합본/천연/지퍼/선셋레드",
            "img": "https://chhouse.kr/web/product/big/202405/e0a9ca319795628f98e4744bf4bb357a.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=43845&cate_no=1394&display_group=1",
            "originalPrice": 55000,
            "salePrice": 49500
          },
          {
            "label": "소합본/천연/지퍼/미드나잇블루",
            "img": "https://chhouse.kr/web/product/big/202405/450c3650001539ee5cea71256899fd95.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=43844&cate_no=1394&display_group=1",
            "originalPrice": 55000,
            "salePrice": 49500
          }
        ]
      },
      {
        "model": "NKR62DXU",
        "size": "미니",
        "mm": 3,
        "type": "standard",
        "variants": [
          {
            "label": "미니합본/PU/지퍼/블루",
            "img": "https://chhouse.kr/web/product/big/202405/c5d42a4b4ae52cf4291e55c30349af79.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=44404&cate_no=1418&display_group=1",
            "originalPrice": 39000,
            "salePrice": 35100
          },
          {
            "label": "미니합본/PU/지퍼/퍼플",
            "img": "https://chhouse.kr/web/product/big/202405/b0e919ee43d15feb85bb385c28ebf16e.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=44403&cate_no=1418&display_group=1",
            "originalPrice": 39000,
            "salePrice": 35100
          },
          {
            "label": "미니합본/PU/지퍼/레드",
            "img": "https://chhouse.kr/web/product/big/202405/0e1e56b559289773b518d1a554b232c1.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=44405&cate_no=1418&display_group=1",
            "originalPrice": 39000,
            "salePrice": 35100
          },
          {
            "label": "미니합본/PU/지퍼/네이비",
            "img": "https://chhouse.kr/web/product/big/202405/3bb89e5d478b1eb095fb6a78c5a39be5.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=44406&cate_no=1418&display_group=1",
            "originalPrice": 39000,
            "salePrice": 35100
          }
        ]
      },
      {
        "model": "NKR42ETU",
        "size": "특초미니",
        "mm": 2.5,
        "type": "standard",
        "variants": [
          {
            "label": "특초미니/PU/지퍼/베이지",
            "img": "https://chhouse.kr/web/product/big/202405/cb211a72d0e80436e4ba1a5a6c3ff672.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=44629&cate_no=1392&display_group=1",
            "originalPrice": 34000,
            "salePrice": 30600
          },
          {
            "label": "특초미니/PU/지퍼/진청색",
            "img": "https://chhouse.kr/web/product/big/202405/e820589314c2f81864461f0a1fc40d4c.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=44628&cate_no=1392&display_group=1",
            "originalPrice": 34000,
            "salePrice": 30600
          },
          {
            "label": "특초미니/PU/지퍼/펄청색",
            "img": "https://chhouse.kr/web/product/big/202405/f3415724fbd934459e18b7b31eed5202.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=44627&cate_no=1392&display_group=1",
            "originalPrice": 34000,
            "salePrice": 30600
          },
          {
            "label": "특초미니/PU/지퍼/펄분홍",
            "img": "https://chhouse.kr/web/product/big/202405/b3c3f079c33ef1633b8f3d16788dedc3.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=44626&cate_no=1392&display_group=1",
            "originalPrice": 34000,
            "salePrice": 30600
          }
        ]
      }
    ]
  },
  "L": {
    "name": "라스텔라",
    "items": [
      {
        "model": "라스텔라W NKR62ETHU",
        "size": "소",
        "mm": 3,
        "type": "standard",
        "variants": [
          {
            "label": "소단본/PU/지갑식/다크블루",
            "img": "https://chhouse.kr/web/product/big/202407/f3b1c3aae7df8bab6c7ce183a5685f8a.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=49261&cate_no=2346&display_group=1",
            "originalPrice": 43000,
            "salePrice": 38700
          },
          {
            "label": "소단본/PU/지갑식/머드그레이",
            "img": "https://chhouse.kr/web/product/big/202407/e6eff7b1672d9237112968aa4fde0c55.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=49260&cate_no=2346&display_group=1",
            "originalPrice": 43000,
            "salePrice": 38700
          },
          {
            "label": "소단본/PU/지갑식/코랄핑크",
            "img": "https://chhouse.kr/web/product/big/202407/0aa217959d8df281d02cba65b3930d34.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=49251&cate_no=2346&display_group=1",
            "originalPrice": 43000,
            "salePrice": 38700
          },
          {
            "label": "소단본/PU/지갑식/그린",
            "img": "https://chhouse.kr/web/product/big/202407/780e2ef942d15c0ef77076863ff3b20c.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=49250&cate_no=2346&display_group=1",
            "originalPrice": 43000,
            "salePrice": 38700
          },
          {
            "label": "소단본/PU/지갑식/보카시블랙",
            "img": "https://chhouse.kr/web/product/big/202407/319b25bdedb5c0a5d4f13d32f1d2e812.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=49249&cate_no=2346&display_group=1",
            "originalPrice": 43000,
            "salePrice": 38700
          }
        ]
      },
      {
        "model": "라스텔라B 그란데 NKR72LXU",
        "size": "중",
        "mm": 3.8,
        "type": "standard",
        "variants": [
          {
            "label": "중단본/PU/지퍼/다크그레이",
            "img": "https://chhouse.cafe24.com/web/product/big/202605/9a19b53adab63182ae0ec8e22e38ee03.png",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=57553&cate_no=2460&display_group=1",
            "originalPrice": 56000,
            "salePrice": 50400
          },
          {
            "label": "중단본/PU/지퍼/빈티지레드",
            "img": "https://chhouse.cafe24.com/web/product/big/202605/ebe5ea249bdefee4331bfc9ee86c6137.png",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=57552&cate_no=2460&display_group=1",
            "originalPrice": 56000,
            "salePrice": 50400
          },
          {
            "label": "중단본/PU/지퍼/네이비",
            "img": "https://chhouse.cafe24.com/web/product/big/202605/150f5442829a672906c0c8b3d449f8c9.png",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=57551&cate_no=2460&display_group=1",
            "originalPrice": 56000,
            "salePrice": 50400
          },
          {
            "label": "중단본/PU/지퍼/카멜브라운",
            "img": "https://chhouse.cafe24.com/web/product/big/202605/1c283b8c7279e7d675e4b2e248b9d2c8.png",
            "url": "https://chhouse.cafe24.com/product/detail.html?product_no=57550&cate_no=2460&display_group=1",
            "originalPrice": 56000,
            "salePrice": 50400
          }
        ]
      }
    ]
  }
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

  const filteredItems = [...bibleData[activeTab].items].filter(item => selectedType === 'all' || item.type === selectedType).sort((a, b) => {
    if (selectedType === 'study') {
      const orderA = getModelOrderIndex(activeTab, a.model || '');
      const orderB = getModelOrderIndex(activeTab, b.model || '');
      if (orderA !== orderB) return orderA - orderB;
      if (a.model !== b.model) return (a.model || '').localeCompare(b.model || '');
      return b.mm - a.mm; // Largest font size first for same model
    } else if (selectedType === 'standard') {
      // NKR 번호(앞 두 자리) 내림차순: 82 > 73 > 72 > 63 > 62 > 42
      const nkrA = getNKRSortKey(a.model);
      const nkrB = getNKRSortKey(b.model);
      if (nkrA !== nkrB) return nkrB - nkrA;
      // 같은 번호면 mm 내림차순
      return b.mm - a.mm;
    } else {
      // 'all' type: study는 먼저, standard는 NKR 번호 내림차순 → mm 내림차순
      if (a.type !== b.type) return a.type === 'study' ? -1 : 1;
      if (a.type === 'standard') {
        const nkrA = getNKRSortKey(a.model);
        const nkrB = getNKRSortKey(b.model);
        if (nkrA !== nkrB) return nkrB - nkrA;
        // 같은 번호면 mm 내림차순 (아래에서 b.mm - a.mm 공통 처리)
      } else {
        const orderA = getModelOrderIndex(activeTab, a.model || '');
        const orderB = getModelOrderIndex(activeTab, b.model || '');
        if (orderA !== orderB) return orderA - orderB;
        if (a.model !== b.model) return (a.model || '').localeCompare(b.model || '');
      }
      return b.mm - a.mm;
    }
  });

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
          <div
            className="mb-6 md:mb-8 rounded-2xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50/90 p-4 md:p-6 shadow-sm no-zoom"
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
                <ul className="space-y-2 text-gray-700 font-bold leading-relaxed text-[length:var(--font-hero-bullets)]">
                  {EMPATHY_BULLETS.map((line, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-orange-500 mt-0.5 shrink-0 select-none" aria-hidden>•</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-start">
            {/* 좌측 영역: 설명 및 조절 슬라이더 */}
            <div className="lg:col-span-1 flex flex-col">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 
                            className="font-black text-gray-900 leading-none tracking-tighter text-[length:var(--font-section-title)] mb-2"
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

                <p className="text-sm text-gray-700 mb-6 leading-relaxed font-bold instruction-text">
                    지갑 속 카드를 우측(또는 아래) 측정 영역의 좌측 상단 모서리에 바짝 붙여 올려놓으세요. 슬라이더를 움직여 화면의 네모칸과 실제 카드의 크기를 똑같이 맞춰주세요.
                </p>

                <div className="relative w-full h-4 bg-gray-200 rounded-full mb-8 mt-2">
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
                        className="absolute left-0 top-0 h-full bg-orange-400 rounded-full z-10 transition-all duration-75" 
                        style={{ width: `${((globalScale - 0.5) / (3.0 - 0.5)) * 100}%` }}
                    ></div>
                    <div 
                        className="absolute top-1/2 -translate-y-1/2 w-10 h-10 bg-orange-500 border-4 border-white rounded-full shadow-lg z-30 pointer-events-none transition-all duration-75"
                        style={{ left: `calc(${((globalScale - 0.5) / (3.0 - 0.5)) * 100}% - 20px)` }}
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
                <div className="bg-grid-pattern bg-white border-2 border-gray-200 rounded-2xl p-8 shadow-inner min-h-[400px] relative overflow-hidden flex items-start justify-start">

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

        <div className="bg-[#F5F4F0] border-b border-stone-200 px-4 py-4">
          <div className="text-[12px] md:text-xs font-bold text-stone-400 mb-2 px-1">출판사 선택 (옆으로 밀어보세요)</div>
          <div ref={tabsRef} className="flex overflow-x-auto no-scrollbar gap-2 pb-1 px-1 whitespace-nowrap scroll-smooth">
            {Object.keys(bibleData).map(key => (
              <button key={key} onClick={() => setActiveTab(key)} className={`flex-none px-4 py-1.5 md:px-6 md:py-2 rounded-full text-xs md:text-sm font-black border transition-all duration-200 ${activeTab === key ? "bg-yellow-400 text-slate-900 border-yellow-500 shadow-md transform scale-105" : "bg-white text-slate-400 border-stone-100 hover:border-stone-300 shadow-sm"}`}>{bibleData[key].name}</button>
            ))}
          </div>
        </div>

        <div className="bg-white border-b border-slate-100 py-4">
          <div className="text-center mb-3"><p className="text-[11px] md:text-[14px] font-black text-slate-400 uppercase tracking-widest">종류 및 용도</p></div>
          <div className="flex justify-center gap-2 md:gap-4 px-4">
            {['all', 'standard', 'study'].map(type => (
              <button key={type} onClick={() => setSelectedType(type)} className={`px-4 py-1.5 md:min-w-[100px] rounded-full text-xs md:text-sm font-black border transition-all duration-200 ${selectedType === type ? 'bg-orange-600 text-white border-orange-700 shadow-md scale-105' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'}`}>{type === 'all' ? '전체보기' : type === 'standard' ? '성경전서' : '해설/주석'}</button>
            ))}
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
                <tr><td colSpan={4} className="py-12 bg-white text-center text-slate-400 font-medium italic border-b border-slate-100">{selectedType === 'study' ? '준비 중인 데이터입니다.' : '해당 모델을 준비 중입니다.'}</td></tr>
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
                        <span className="text-[length:var(--font-list-model)] md:text-[length:var(--font-list-model-md)] font-black text-slate-800 whitespace-nowrap">{item.model}</span>
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
                        fontFamily: 'Nanum Myeongjo, serif', 
                        fontSize: `${(item.mm / 0.3528) * globalScale}pt`, 
                        fontWeight: item.mm > 4 ? '800' : '700' 
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
            <div className="space-y-1.5">
              <p className="text-sm md:text-base font-black text-slate-800">꼭 확인해 주세요!</p>
              <p className="text-[13px] md:text-[16px] leading-relaxed text-slate-700">본 수치는 직접 자로 측정하여 산출한 근사치입니다. 측정방법에 따라 오차가 있을 수 있습니다.</p>
            </div>
          </div>
        </div>
        
        <BannerComponent />

            </div>
          </div>
        )}

        <div className="p-8 bg-gray-50 border-t border-gray-100">
            <div className="text-center mb-8">
                <h3 className="text-xl font-black text-gray-800">지인들에게 전달해 주세요</h3>
                <p className="text-base font-bold text-gray-500 mt-2">링크 하나로 내 눈에 꼭 맞는 성경을 쉽게 찾을 수 있습니다.</p>
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
            </div>
        </div>

        <div className="p-8 pb-16 bg-white border-t border-gray-100 rounded-b-2xl no-zoom">
            <div className="text-center mb-5">
                <span className="bg-yellow-400 text-yellow-900 px-4 py-1.5 rounded-full text-[12px] md:text-[14px] font-black border border-yellow-500 shadow-sm">특허출원번호 10-2026-0076623</span>
            </div>
            <div className="flex justify-center mb-10">
                <img src="/chhouse-logo.png" alt="상록크리스챤하우스" className="h-16 md:h-20 object-contain opacity-90" />
            </div>
            
            <div className="max-w-2xl mx-auto bg-gray-50 border border-gray-100 rounded-3xl p-8 md:p-10 mb-12 text-center shadow-sm">
                <p className="text-orange-600 font-black text-sm md:text-base mb-8">성경책 단체 주문 및 상품 문의</p>
                
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-8 md:gap-0">
                    {/* Left: Contact info */}
                    <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 border border-gray-50">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M18 13V11C18 7.68629 15.3137 5 12 5C8.68629 5 6 7.68629 6 11V13M3 13V15C3 16.1046 3.89543 17 5 17H6M21 13V15C21 16.1046 20.1046 17 19 17H18M18 13V17H6V13M18 13H19C20.1046 13 21 12.1046 21 11V10C21 8.89543 20.1046 8 19 8H18M6 13H5C3.89543 13 3 12.1046 3 11V10C3 8.89543 3.89543 8 5 8H6" />
                            </svg>
                        </div>
                        <span className="text-gray-400 font-bold text-sm mb-2">고객센터</span>
                        <div className="flex flex-col gap-1">
                            <h4 className="text-2xl md:text-3xl font-black text-gray-800 tracking-tight">031-483-9152</h4>
                            <h4 className="text-2xl md:text-3xl font-black text-gray-800 tracking-tight">010-8870-8436</h4>
                        </div>
                    </div>

                    {/* Middle: Separator */}
                    <div className="hidden md:block h-28 w-[1px] bg-gray-200 mx-8"></div>

                    {/* Right: Operating hours */}
                    <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 border border-gray-50">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" />
                            </svg>
                        </div>
                        <span className="text-gray-400 font-bold text-sm mb-2">운영시간</span>
                        <div className="flex flex-col gap-1">
                            <h4 className="text-xl md:text-2xl font-black text-gray-800">월~토 10:00 ~ 18:00</h4>
                            <p className="text-gray-400 font-bold text-base md:text-lg">(주일은 휴무)</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="max-w-xl mx-auto pl-12 md:pl-20 pr-8">
                <div className="text-gray-400 font-bold text-[11px] md:text-[12px] text-left" style={{ lineHeight: '1.2' }}>
                    상호 : 상록크리스챤하우스(기독서점) <span className="mx-1 opacity-30">|</span> 대표 : 이정숙 <br />
                    사업자등록번호 : 243-27-01845 <span className="hidden md:inline mx-1 opacity-30">|</span> <br className="block md:hidden" />
                    통신판매업신고 : 2024-경기안산-1136 <br />
                    주소 : 경기도 안산시 단원구 광덕4로 220 (밀레니엄프라자) 3층 307호
                </div>
                
                <div className="mt-10 pt-8 border-t border-gray-50 text-center">
                    <p className="text-gray-300 text-[11px] md:text-xs font-bold uppercase tracking-widest">
                        Copyright © Christian House. All rights reserved.
                    </p>
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
                {(selectedItem.variants || fetchedVariants[selectedItem.model] || []).length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
                    {(selectedItem.variants || fetchedVariants[selectedItem.model]).map((v, vIdx) => (
                      <a key={vIdx} href={v.url} target="_blank" rel="noopener noreferrer" className="group flex flex-col space-y-2 md:space-y-3 transition-transform duration-300 ease-out hover:-translate-y-1">
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
                        <div className="bg-slate-100 text-slate-500 text-[length:var(--font-modal-btn)] md:text-[length:var(--font-modal-btn-md)] font-black py-2 md:py-3 rounded-lg md:rounded-xl text-center group-hover:bg-orange-600 group-hover:text-white transition-all">
                          상품 보러 가기
                        </div>
                      </a>
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
                {(hoverItem.variants || fetchedVariants[hoverItem.model] || []).length > 0 ? (
                  <div className="max-h-[500px] overflow-y-auto pretty-scrollbar pr-2">
                    <div className="grid grid-cols-2 gap-4">
                      {(hoverItem.variants || fetchedVariants[hoverItem.model]).map((v, vIdx) => (
                        <a key={vIdx} href={v.url} target="_blank" rel="noopener noreferrer" className="flex flex-col space-y-1 group/item">
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

    </div>
  </div>
  );
};

export default App;
