import React from 'react';

const BannerComponent = () => {
  return (
    <a 
      href="https://chhouse.kr/product/search.html?banner_action=&keyword=%EC%A0%84%EB%8F%84%EB%B6%80%EC%B1%84" 
      target="_blank" 
      rel="noopener noreferrer" 
      className="relative block border-t border-slate-200 overflow-hidden cursor-pointer no-underline group rounded-b-2xl"
    >
      {/* 배경 수영장 물결 이미지 */}
      <div className="absolute inset-0 bg-cover bg-top transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: "url('https://chhouse.kr/file_data/chhouse/2026/05/07/514f06596b2c267204531cf44e4d1603.jpg')" }}></div>
      <div className="absolute inset-0 bg-blue-900/30 transition-colors duration-300 group-hover:bg-blue-900/20"></div>

      {/* 콘텐츠 영역 */}
      <div className="relative z-10 flex flex-row items-center gap-5 p-6 md:p-10">
        {/* 상품 이미지 */}
        <div className="w-1/3 md:w-1/3 flex justify-center">
          <img 
            src="https://chhouse.kr/web/product/big/202604/3fc704a7d513d27a4da92cdc48809f39.jpg" 
            alt="말씀 전도부채" 
            className="rounded-2xl shadow-lg max-h-[110px] md:max-h-[180px] object-cover ring-4 ring-white/20" 
          />
        </div>

        {/* 텍스트 정보 */}
        <div className="w-2/3 md:w-2/3 text-left space-y-1 md:space-y-3">
          {/* 태그: 데스크톱 전용 */}
          <div className="hidden md:inline-block px-3 py-1.5 bg-white text-blue-700 text-xs font-black rounded-full mb-1 shadow-md">전도 용품 추천</div>
          
          <h3 style={{ fontFamily: "'Gowun Batang', serif" }} className="text-[19px] md:text-2xl font-black text-white leading-tight drop-shadow-lg">
            우리 교회만의 감성 전도지,<br /> 말씀 캘리그라피 전도부채
          </h3>

          {/* 설명 문구: 데스크톱 전용 */}
          <p className="hidden md:block text-sm md:text-base font-bold text-blue-50 leading-relaxed drop-shadow-md">
            4가지 감성 디자인 | 교회명 맞춤 스티커 | 낱개부터 단체 대량 주문까지
          </p>

          {/* 하단 링크: 모바일/데스크톱 공통 (폰트 한단계 축소) */}
          <div className="flex items-center gap-1 text-yellow-300 font-black text-[14px] md:text-lg pt-1 md:pt-2 drop-shadow-md">
            다양한 전도부채 구경하기 
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="ml-1"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
          </div>
        </div>
      </div>
    </a>
  );
};

export default BannerComponent;
