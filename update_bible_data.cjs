const fs = require('fs');

const newData = {
  A: {
    name: "아가페",
    items: [
      {
        model: "큰글자 굿모닝성경", size: "대", mm: 5.5, type: "study",
        variants: [
          { label: "대합본/천연/지퍼/다크브라운", img: "https://chhouse.kr/web/product/big/202408/aab3c095db3cc2e096eb63a449f9dbc1.jpg", url: "https://chhouse.kr/product/detail.html?product_no=49455&cate_no=1347&display_group=1", originalPrice: 65000, salePrice: 58500 },
          { label: "대합본/천연/무지퍼/브라운", img: "https://chhouse.kr/web/product/big/202601/cdeabe94a2730136964b5c1bbbbd97c7.jpg", url: "https://chhouse.kr/product/detail.html?product_no=56514&cate_no=1347&display_group=1", originalPrice: 58000, salePrice: 52200 },
          { label: "대합본/PU/지퍼/잉키블루", img: "https://chhouse.kr/web/product/big/202409/c8243ffbd8183d945e4910099e98c588.jpg", url: "https://chhouse.kr/product/detail.html?product_no=50399&cate_no=1347&display_group=1", originalPrice: 51000, salePrice: 45900 },
          { label: "대합본/PU/지퍼/브라운", img: "https://chhouse.kr/web/product/big/202408/cc71ca925f8531ac4350ea4ca3e42e73.jpg", url: "https://chhouse.kr/product/detail.html?product_no=49454&cate_no=1347&display_group=1", originalPrice: 51000, salePrice: 45900 },
          { label: "대합본/PU/무지퍼/브라운", img: "https://chhouse.kr/web/product/big/202504/f86d0d8f3ab2ce4f0e8b7f1346d1b3a9.jpg", url: "https://chhouse.kr/product/detail.html?product_no=53016&cate_no=1347&display_group=1", originalPrice: 43000, salePrice: 38700 },
          { label: "중합본/PU/무지퍼/브라운", img: "https://chhouse.kr/web/product/big/202405/a950c25b8da04cc8dceeae38556e6020.jpg", url: "https://chhouse.kr/product/detail.html?product_no=44929&cate_no=1347&display_group=1", originalPrice: 43000, salePrice: 38700 }
        ]
      },
      {
        model: "큰글자 굿모닝성경", size: "중", mm: 4.8, type: "study",
        variants: [
          { label: "중합본/천연/지퍼/리치브라운", img: "https://chhouse.kr/web/product/big/202504/0b5ed7556ad434989e9a1c73083cb111.jpg", url: "https://chhouse.kr/product/detail.html?product_no=53015&cate_no=1388&display_group=1", originalPrice: 59000, salePrice: 53100 },
          { label: "중합본/천연/지퍼/잉키블루", img: "https://chhouse.kr/web/product/big/202409/9547d826f33d8918190638353c4bc41c.jpg", url: "https://chhouse.kr/product/detail.html?product_no=47072&cate_no=1388&display_group=1", originalPrice: 59000, salePrice: 53100 },
          { label: "중합본/PU/지퍼/브라운", img: "https://chhouse.kr/web/product/big/202404/01beb8e1c410a838cc67ec3a5cf91e61.jpg", url: "https://chhouse.kr/product/detail.html?product_no=38512&cate_no=1388&display_group=1", originalPrice: 44000, salePrice: 39600 },
          { label: "중합본/PU/지퍼/잉키블루", img: "https://chhouse.kr/web/product/big/202409/e44f9d1fe738593b0491644fa8fcebfb.jpg", url: "https://chhouse.kr/product/detail.html?product_no=50237&cate_no=1388&display_group=1", originalPrice: 44000, salePrice: 39600 },
          { label: "중합본/PU/무지퍼/다크브라운", img: "https://chhouse.kr/web/product/big/202404/7f44b9c2fa8b01f9bdcda535d934cc3c.jpg", url: "https://chhouse.kr/product/detail.html?product_no=47229&cate_no=1388&display_group=1", originalPrice: 38000, salePrice: 34200 },
          { label: "중단본/PU/지펴/올리브", img: "https://chhouse.kr/web/product/big/202512/71e9b12e3fae6542c8d827fad020c684.jpg", url: "https://chhouse.kr/product/detail.html?product_no=56247&cate_no=1388&display_group=1", originalPrice: 32000, salePrice: 28800 },
          { label: "중단본/PU/무지퍼/네이비", img: "https://chhouse.kr/web/product/big/202604/b4de277c2b05ca2d587f73ae81ad3d75.jpg", url: "https://chhouse.kr/product/detail.html?product_no=57421&cate_no=1388&display_group=1", originalPrice: 30000, salePrice: 27000 }
        ]
      },
      {
        model: "뉴슬림 굿모닝성경", size: "특미니", mm: 3.5, type: "study",
        variants: [
          { label: "특미니/천연/합본/지퍼/버건디", img: "https://chhouse.kr/web/product/big/202409/1dcd067a35e62e407b41c788450d5550.jpg", url: "https://chhouse.kr/product/detail.html?product_no=40912&cate_no=1409&display_group=1", originalPrice: 44000, salePrice: 39600 },
          { label: "특미니/천연/합본/지퍼/브라운", img: "https://chhouse.kr/web/product/big/202409/eee69fed9c07ba1040203efd9892578c.jpg", url: "https://chhouse.kr/product/detail.html?product_no=45034&cate_no=1409&display_group=1", originalPrice: 44000, salePrice: 39600 },
          { label: "특미니/PU/합본/지퍼/인디고블루", img: "https://chhouse.kr/web/product/big/202405/3bf6e8512ab2d6c649b4ea313b267cb1.jpg", url: "https://chhouse.kr/product/detail.html?product_no=39290&cate_no=1409&display_group=1", originalPrice: 33000, salePrice: 29700 },
          { label: "특미니/PU/합본/지퍼/인디핑크", img: "https://chhouse.kr/web/product/big/202405/62bcff1b6d504e6ec2325ddbe5c4dcf7.jpg", url: "https://chhouse.kr/product/detail.html?product_no=39291&cate_no=1409&display_group=1", originalPrice: 33000, salePrice: 29700 }
        ]
      },
      {
        model: "뉴슬림 굿모닝성경", size: "초미니", mm: 3.2, type: "study",
        variants: [
          { label: "초미니/천연/합본/지퍼/핑크", img: "https://chhouse.kr/web/product/big/202602/5843b57bdeb141ab05d618b4f8b77f29.jpg", url: "https://chhouse.kr/product/detail.html?product_no=39570&cate_no=1420&display_group=1", originalPrice: 36000, salePrice: 32400 },
          { label: "초미니/천연/합본/지퍼/네이비", img: "https://chhouse.kr/web/product/big/202602/9293dd53d22153c16b3f98a8019a6bde.jpg", url: "https://chhouse.kr/product/detail.html?product_no=39569&cate_no=1420&display_group=1", originalPrice: 36000, salePrice: 32400 },
          { label: "초미니/PU/합본/지퍼/민트", img: "https://chhouse.kr/web/product/big/202404/2b41058a7b555b002a8f2f41cc6412bf.jpg", url: "https://chhouse.kr/product/detail.html?product_no=39568&cate_no=1420&display_group=1", originalPrice: 33000, salePrice: 29700 },
          { label: "초미니/PU/합본/지퍼/모카베이지", img: "https://chhouse.kr/web/product/big/202404/db4b116a367565786e4a02cee9e04704.jpg", url: "https://chhouse.kr/product/detail.html?product_no=39567&cate_no=1420&display_group=1", originalPrice: 33000, salePrice: 29700 }
        ]
      },
      {
        model: "컬러성경", size: "대", mm: 4.8, type: "study",
        variants: [
          { label: "대합본/천연/지퍼/블랙", img: "https://chhouse.kr/web/product/big/202412/f6eda7d1f66161c6b30e97ce371ef4c5.jpg", url: "https://chhouse.kr/product/detail.html?product_no=52061&cate_no=1347&display_group=1", originalPrice: 120000, salePrice: 108000 },
          { label: "대합본/천연/지퍼/딥브라운", img: "https://chhouse.kr/web/product/big/202412/788ac93553c90864e54b8874bf468a31.jpg", url: "https://chhouse.kr/product/detail.html?product_no=51837&cate_no=1347&display_group=1", originalPrice: 98000, salePrice: 88200 }
        ]
      },
      {
        model: "컬러성경", size: "중", mm: 4.5, type: "study",
        variants: [
          { label: "중합본/천연/지퍼/자주", img: "https://chhouse.kr/web/product/big/202404/f786ff08e043153438610102c6eefc20.jpg", url: "https://chhouse.kr/product/detail.html?product_no=19408&cate_no=1388&display_group=1", originalPrice: 72000, salePrice: 64800 },
          { label: "중합본/천연/지퍼/다크브라운", img: "https://chhouse.kr/web/product/big/202404/3fc61b1f129fdbd7488ff467ba40c28b.jpg", url: "https://chhouse.kr/product/detail.html?product_no=19411&cate_no=1388&display_group=1", originalPrice: 72000, salePrice: 64800 }
        ]
      },
      {
        model: "예스 주석성경", size: "대", mm: 4.5, type: "study",
        variants: [
          { label: "대합본/천연/지퍼/브라운", img: "https://chhouse.kr/web/product/big/202404/ba9a437c33bc7990af1488a7131aef81.jpg", url: "https://chhouse.kr/product/detail.html?product_no=40859&cate_no=1347&display_group=1", originalPrice: 66000, salePrice: 59400 },
          { label: "대합본/천연/지퍼/자주", img: "https://chhouse.kr/web/product/big/202404/4b609a5b2a1a73ced6c3ac20be913ee6.jpg", url: "https://chhouse.kr/product/detail.html?product_no=40860&cate_no=1347&display_group=1", originalPrice: 66000, salePrice: 59400 },
          { label: "대합본/PU/지퍼/자주", img: "https://chhouse.kr/web/product/big/202405/21851f45bf29d270f6510c9fa0a1b1d2.jpg", url: "https://chhouse.kr/product/detail.html?product_no=18495&cate_no=1347&display_group=1", originalPrice: 50000, salePrice: 45000 },
          { label: "대합본/PU/지퍼/브라운", img: "https://chhouse.kr/web/product/big/202405/6fabc4d1a68e9e9a22626f6ddea867bb.jpg", url: "https://chhouse.kr/product/detail.html?product_no=18498&cate_no=1347&display_group=1", originalPrice: 50000, salePrice: 45000 }
        ]
      }
    ]
  },
  W: {
    name: "생명의말씀사",
    items: [
      {
        model: "큰글자 스터디성경", size: "대", mm: 4.8, type: "study",
        variants: [
          { label: "대합본/천연/지퍼/뉴다크브라운", img: "https://chhouse.cafe24.com/web/product/big/202504/29e03364f251595758292afd3bb0e3bb.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=53022&cate_no=1372&display_group=1", originalPrice: 68000, salePrice: 61200 },
          { label: "대합본/천연/지퍼/뉴버건디", img: "https://chhouse.cafe24.com/web/product/big/202504/651a8123e2eede49bf2620f20574b6cd.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=53023&cate_no=1372&display_group=1", originalPrice: 68000, salePrice: 61200 },
          { label: "대합본/PU/지퍼/다크브라운", img: "https://chhouse.cafe24.com/web/product/big/202406/96e5787d088f897ab3d624634a395dc1.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=18492&cate_no=1372&display_group=1", originalPrice: 56000, salePrice: 50400 }
        ]
      },
      {
        model: "큰글자 스터디성경", size: "중", mm: 4.5, type: "study",
        variants: [
          { label: "중합본/천연/지퍼/다크브라운", img: "https://chhouse.cafe24.com/web/product/big/202409/d6a0714e7ab45f3d1652e351bd24b1f0.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=50086&cate_no=1371&display_group=1", originalPrice: 78000, salePrice: 70200 },
          { label: "중합본/PU/지퍼/다크네이비", img: "https://chhouse.cafe24.com/web/product/big/202409/1ac63e48135a48688875453c9a28c929.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=50085&cate_no=1371&display_group=1", originalPrice: 55000, salePrice: 49500 }
        ]
      },
      {
        model: "슬림 스터디성경", size: "소", mm: 4.1, type: "study",
        variants: [
          { label: "소합본/천연/지퍼/다크브라운", img: "https://chhouse.cafe24.com/web/product/big/202411/b577b20e25030f4625e462020eb08ba4.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=51317&cate_no=1345&display_group=1", originalPrice: 42000, salePrice: 37800 },
          { label: "소합본/PU/밴드형/그린", img: "https://chhouse.cafe24.com/web/product/big/202404/d33088e88ae1ea84b717e7a898b1ac55.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=42796&cate_no=1345&display_group=1", originalPrice: 36000, salePrice: 32400 },
          { label: "소합본/PU/밴드형/네이비", img: "https://chhouse.cafe24.com/web/product/big/202404/9c0d9ca2f99d8ffef81a9b6e3b71d507.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=42795&cate_no=1345&display_group=1", originalPrice: 36000, salePrice: 32400 }
        ]
      },
      {
        model: "프리미엄 굿데이성경", size: "대", mm: 4.5, type: "study",
        variants: [
          { label: "대합본/천연/지퍼/다크브라운", img: "https://chhouse.cafe24.com/web/product/big/202501/5378bcf8416c0e8609f24bba6a4d42e3.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=18174&cate_no=1372&display_group=1", originalPrice: 67000, salePrice: 60300 },
          { label: "대합본/천연/지퍼/다크네이비", img: "https://chhouse.cafe24.com/web/product/big/202501/55f6a0044745f3d68fd17689c271b8cf.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=52204&cate_no=1372&display_group=1", originalPrice: 67000, salePrice: 60300 },
          { label: "대합본/PU/지퍼/블랙", img: "https://chhouse.cafe24.com/web/product/big/202405/01d65352b6e0ed2c0a0733ae09f38015.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=44462&cate_no=1372&display_group=1", originalPrice: 63000, salePrice: 56700 },
          { label: "대합본/PU/지퍼/다크네이비", img: "https://chhouse.cafe24.com/web/product/big/202405/8c225d754a59a3e16f85f2e63d86cc35.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=44337&cate_no=1372&display_group=1", originalPrice: 51000, salePrice: 45900 },
          { label: "대합본/PU/지퍼/브라운", img: "https://chhouse.cafe24.com/web/product/big/202405/fd4c68d48959eeb01077303ebc70348b.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=44336&cate_no=1372&display_group=1", originalPrice: 51000, salePrice: 45900 }
        ]
      },
      {
        model: "뉴빅슬림 굿데이성경", size: "중", mm: 4.2, type: "study",
        variants: [
          { label: "중합본/천연/지퍼/뉴버건디", img: "https://chhouse.cafe24.com/web/product/big/202405/f6e0e890f8035c9a4cfb6a3e053f546e.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=38862&cate_no=1371&display_group=1", originalPrice: 57000, salePrice: 51300 },
          { label: "중합본/천연/지퍼/뉴다크브라운", img: "https://chhouse.cafe24.com/web/product/big/202405/b58e62b5aa0261bc589d6813e15815b9.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=38861&cate_no=1371&display_group=1", originalPrice: 57000, salePrice: 51300 },
          { label: "중합본/PU/지퍼/뉴브라운", img: "https://chhouse.cafe24.com/web/product/big/202405/b504f15f35c8edf0ab540ae48f597e6a.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=38336&cate_no=1371&display_group=1", originalPrice: 47000, salePrice: 42300 },
          { label: "중합본/PU/지퍼/뉴네이비", img: "https://chhouse.cafe24.com/web/product/big/202409/ae865f4cf05ad35f7355feb7d89c2e47.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=38335&cate_no=1371&display_group=1", originalPrice: 47000, salePrice: 42300 }
        ]
      },
      {
        model: "올 뉴 굿데이성경", size: "초미니", mm: 3.5, type: "study",
        variants: [
          { label: "초미니합본/천연/지퍼/베이지", img: "https://chhouse.cafe24.com/web/product/big/202406/3104124bc91cfde09c6280771876bd48.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=48705&cate_no=1387&display_group=1", originalPrice: 38000, salePrice: 34200 },
          { label: "초미니합본/PU/지퍼/뉴분홍", img: "https://chhouse.cafe24.com/web/product/big/202406/45aaf593eeafcc47968b3e8a565e2bed.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=48706&cate_no=1387&display_group=1", originalPrice: 32000, salePrice: 28800 },
          { label: "초미니합본/PU/지퍼/뉴베이지", img: "https://chhouse.cafe24.com/web/product/big/202406/34db1144e17138313786f36ec8178761.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=48704&cate_no=1387&display_group=1", originalPrice: 32000, salePrice: 28800 },
          { label: "초미니합본/PU/지퍼/뉴파랑", img: "https://chhouse.kr/web/product/big/202406/3bedc900213eb974752f343cc216d4e3.jpg", url: "https://chhouse.kr/product/detail.html?product_no=48654&cate_no=1387&display_group=1", originalPrice: 32000, salePrice: 28800 },
          { label: "초미니합본/PU/지퍼/뉴하늘", img: "https://chhouse.kr/web/product/big/202406/f0523e71e14e910b252777132ce5b49f.jpg", url: "https://chhouse.kr/product/detail.html?product_no=48655&cate_no=1387&display_group=1", originalPrice: 32000, salePrice: 28800 }
        ]
      },
      {
        model: "모던컬러성경", size: "대", mm: 4.8, type: "study",
        variants: [
          { label: "대합본/천연/지퍼/다크브라운", img: "https://chhouse.kr/web/product/big/202409/cba3646ac31b26551e7722af1145dee1.jpg", url: "https://chhouse.kr/product/detail.html?product_no=43362&cate_no=1372&display_group=1", originalPrice: 76000, salePrice: 68400 },
          { label: "대합본/천연/지퍼/베이지", img: "https://chhouse.kr/web/product/big/202405/e39f311d5dfa726569a3e2aae5760664.jpg", url: "http://chhouse.kr/product/detail.html?product_no=43361&cate_no=1372&display_group=1", originalPrice: 76000, salePrice: 68400 },
          { label: "대합본/PU/지퍼/브라운", img: "https://chhouse.kr/web/product/big/202405/ad2efa4720bb949c8dc4a3e63c5afaad.jpg", url: "https://chhouse.kr/product/detail.html?product_no=43359&cate_no=1372&display_group=1", originalPrice: 62000, salePrice: 55800 },
          { label: "대합본/PU/지퍼/초코브라운", img: "https://chhouse.kr/web/product/big/202405/288ff91cdba6a81af7bb4e0839e54842.jpg", url: "https://chhouse.kr/product/detail.html?product_no=43360&cate_no=1372&display_group=1", originalPrice: 62000, salePrice: 55800 }
        ]
      },
      {
        model: "모던컬러성경", size: "중", mm: 4.2, type: "study",
        variants: [
          { label: "중합본/천연/지퍼/다크브라운", img: "https://chhouse.kr/web/product/big/202405/97b5c7d29ac8fec2297efe7b201d8f82.jpg", url: "https://chhouse.kr/product/detail.html?product_no=45118&cate_no=1371&display_group=1", originalPrice: 64000, salePrice: 57600 },
          { label: "중합본/천연/지퍼/다크네이비", img: "https://chhouse.kr/web/product/big/202405/793bacad25f0402ebf91fef66864c8ab.jpg", url: "https://chhouse.kr/product/detail.html?product_no=45119&cate_no=1371&display_group=1", originalPrice: 64000, salePrice: 57600 },
          { label: "중합본/PU/지퍼/브라운", img: "https://chhouse.kr/web/product/big/202405/953e5ebb3b52e53a5ed368068d4fbe78.jpg", url: "https://chhouse.kr/product/detail.html?product_no=45116&cate_no=1371&display_group=1", originalPrice: 45000, salePrice: 40500 },
          { label: "중합본/PU/지퍼/블랙", img: "https://chhouse.kr/web/product/big/202405/7a8785fed2754fe1dba4ca31be51c811.jpg", url: "https://chhouse.kr/product/detail.html?product_no=45117&cate_no=1371&display_group=1", originalPrice: 45000, salePrice: 40500 }
        ]
      },
      {
        model: "모던컬러성경", size: "소", mm: 3.8, type: "study",
        variants: [
          { label: "소합본/천연/지퍼/다크브라운", img: "https://chhouse.kr/web/product/big/202409/9cf962817da36912afa0b84f5f33f432.jpg", url: "https://chhouse.kr/product/detail.html?product_no=49873&cate_no=1345&display_group=1", originalPrice: 54000, salePrice: 48600 },
          { label: "소합본/천연/지퍼/다크네이비", img: "https://chhouse.kr/web/product/big/202409/ac5b880e9c666ebd245efd9c9fa67e87.jpg", url: "https://chhouse.kr/product/detail.html?product_no=49874&cate_no=1345&display_group=1", originalPrice: 54000, salePrice: 48600 },
          { label: "소합본/PU/지퍼/브라운", img: "https://chhouse.kr/web/product/big/202409/0ff2fc6e434e7492d902725acf4e7aa4.jpg", url: "https://chhouse.kr/product/detail.html?product_no=49872&cate_no=1345&display_group=1", originalPrice: 44000, salePrice: 39600 },
          { label: "소합본/PU/지퍼/블랙", img: "https://chhouse.kr/web/product/big/202409/d30f1978ce22c6e9522f775f3a54eb73.jpg", url: "https://chhouse.kr/product/detail.html?product_no=49871&cate_no=1345&display_group=1", originalPrice: 44000, salePrice: 39600 }
        ]
      },
      {
        model: "베이직성경", size: "중", mm: 4.2, type: "study",
        variants: [
          { label: "중합본/천연/지퍼/레드브라운", img: "https://chhouse.kr/web/product/big/202603/1ec16262340d019c0fa9cc1d5acede2c.jpg", url: "https://chhouse.kr/product/detail.html?product_no=57193&cate_no=1371&display_group=1", originalPrice: 54000, salePrice: 48600 },
          { label: "중합본/천연/지퍼/브라운", img: "https://chhouse.kr/web/product/big/202506/d8b2ed969fccd3622d764b72d90d2ccd.jpg", url: "https://chhouse.kr/product/detail.html?product_no=54071&cate_no=1371&display_group=1", originalPrice: 52000, salePrice: 46800 },
          { label: "중합본/PU/지퍼/그레이", img: "https://chhouse.kr/web/product/big/202506/955fe9a0e44439f0859b2dede2bfab15.jpg", url: "https://chhouse.kr/product/detail.html?product_no=54068&cate_no=1371&display_group=1", originalPrice: 42000, salePrice: 37800 },
          { label: "중합본/PU/지퍼/네이비", img: "https://chhouse.kr/web/product/big/202506/9889b58103692066fe0f204de3281c88.jpg", url: "https://chhouse.kr/product/detail.html?product_no=54069&cate_no=1371&display_group=1", originalPrice: 42000, salePrice: 37800 },
          { label: "중합본/PU/지퍼/베이지", img: "https://chhouse.kr/web/product/big/202506/42d6312e2643ee1fe1f1678570f78d8f.jpg", url: "https://chhouse.kr/product/detail.html?product_no=54070&cate_no=1344&display_group=1", originalPrice: 42000, salePrice: 37800 },
          { label: "중단본/PU/무지퍼/웜그레이", img: "https://chhouse.kr/web/product/big/202603/ec587f378dabd80c7bb8ecc06db1e5b5.jpg", url: "https://chhouse.kr/product/detail.html?product_no=57111&cate_no=1371&display_group=1", originalPrice: 34000, salePrice: 30600 },
          { label: "중단본/PU/무지퍼/베이지", img: "https://chhouse.kr/web/product/big/202603/8309e14ed258cdb3e62989510c77f7de.jpg", url: "https://chhouse.kr/product/detail.html?product_no=57110&cate_no=1371&display_group=1", originalPrice: 34000, salePrice: 30600 }
        ]
      },
      {
        model: "베이직성경", size: "소", mm: 3.8, type: "study",
        variants: [
          { label: "소합본/천연/지퍼/다크네이비", img: "https://chhouse.kr/web/product/big/202510/4d618aaf472368a9e571ccbb90ad3f9b.jpg", url: "https://chhouse.kr/product/detail.html?product_no=55697&cate_no=1345&display_group=1", originalPrice: 49000, salePrice: 44100 },
          { label: "소합본/천연/지퍼/스카이블루", img: "https://chhouse.kr/web/product/big/202510/5cbdf1f9a175e01186fa1345ee820769.jpg", url: "https://chhouse.kr/product/detail.html?product_no=55698&cate_no=1345&display_group=1", originalPrice: 49000, salePrice: 44100 },
          { label: "소합본/PU/지퍼/블랙", img: "https://chhouse.kr/web/product/big/202510/5ebfe03e50977dfaf1bc34a90bd8d27a.jpg", url: "https://chhouse.kr/product/detail.html?product_no=55701&cate_no=1345&display_group=1", originalPrice: 39000, salePrice: 35100 },
          { label: "소합본/PU/지퍼/베이지", img: "https://chhouse.kr/web/product/big/202510/ebc20e575f52100b604b8babb549c81b.jpg", url: "https://chhouse.kr/product/detail.html?product_no=55700&cate_no=1345&display_group=1", originalPrice: 39000, salePrice: 35100 },
          { label: "소단본/PU/지퍼/그레이", img: "https://chhouse.kr/web/product/big/202510/64abe985dd05c8809066362dde89f2f8.jpg", url: "https://chhouse.kr/product/detail.html?product_no=55552&cate_no=1345&display_group=1", originalPrice: 30000, salePrice: 27000 },
          { label: "소단본/PU/지퍼/브라운", img: "https://chhouse.kr/web/product/big/202510/0aa1462058fc550edc23186a2544c277.jpg", url: "https://chhouse.kr/product/detail.html?product_no=55553&cate_no=1345&display_group=1", originalPrice: 30000, salePrice: 27000 }
        ]
      },
      {
        model: "슬림성경", size: "중", mm: 4.2, type: "study",
        variants: [
          { label: "중합본/천연/지퍼/뉴버건디", img: "https://chhouse.kr/web/product/big/202410/b756e3b36e61e2e8ab8736dca376f89c.jpg", url: "https://chhouse.kr/product/detail.html?product_no=51148&cate_no=1371&display_group=1", originalPrice: 48000, salePrice: 43200 },
          { label: "중합본/PU/지퍼/뉴레드브라운", img: "https://chhouse.kr/web/product/big/202411/b6a6e28fa9e8053c2169c675eaac1ee2.jpg", url: "https://chhouse.kr/product/detail.html?product_no=51316&cate_no=1371&display_group=1", originalPrice: 38000, salePrice: 34200 },
          { label: "중합본/PU/지퍼/뉴다크올리브", img: "https://chhouse.kr/web/product/big/202411/46132b86a03c42d6e4600438c00a6134.jpg", url: "https://chhouse.kr/product/detail.html?product_no=51315&cate_no=1371&display_group=1", originalPrice: 38000, salePrice: 34200 },
          { label: "중합본/PU/지퍼/뉴네이비", img: "https://chhouse.kr/web/product/big/202411/6cf9dbbc396339baa2a75c9d3a6d59e8.jpg", url: "https://chhouse.kr/product/detail.html?product_no=51314&cate_no=1371&display_group=1", originalPrice: 38000, salePrice: 34200 }
        ]
      },
      {
        model: "더바이블", size: "중", mm: 4.2, type: "study",
        variants: [
          { label: "중합본/천연/지퍼/다크브라운", img: "https://chhouse.kr/web/product/big/202404/6464154ffc6ebd5cb9c475129417bf01.jpg", url: "https://chhouse.kr/product/detail.html?product_no=18165&cate_no=1371&display_group=1", originalPrice: 47000, salePrice: 42300 }
        ]
      },
      {
        model: "더바이블", size: "소", mm: 3.8, type: "study",
        variants: [
          { label: "소합본/천연/지퍼/베이지", img: "https://chhouse.kr/web/product/big/202404/7ac80b9715a7e8568f38bc095a3b3b4a.jpg", url: "https://chhouse.kr/product/detail.html?product_no=42958&cate_no=1345&display_group=1", originalPrice: 44000, salePrice: 39600 },
          { label: "소합본/PU/지퍼/다크네이비", img: "https://chhouse.kr/web/product/big/202404/d060dfbe39adb802a0f173d16b02a394.jpg", url: "https://chhouse.kr/product/detail.html?product_no=37706&cate_no=1345&display_group=1", originalPrice: 35000, salePrice: 31500 },
          { label: "소합본/PU/지퍼/브라운", img: "https://chhouse.kr/web/product/big/202404/479cc0dc5da04ac49bc625a358c35956.jpg", url: "https://chhouse.kr/product/detail.html?product_no=37705&cate_no=1345&display_group=1", originalPrice: 35000, salePrice: 31500 },
          { label: "소합본/PU/지퍼/올리브그린", img: "https://chhouse.kr/web/product/big/202404/42d83f68c9460385f4803d47271977e4.jpg", url: "https://chhouse.kr/product/detail.html?product_no=37704&cate_no=1345&display_group=1", originalPrice: 35000, salePrice: 31500 }
        ]
      },
      {
        model: "위드바이블", size: "미니", mm: 3.5, type: "study",
        variants: [
          { label: "미니합본/PU/지퍼/교회", img: "https://chhouse.kr/web/product/big/202602/a31f6317eaed5517661fc30c6ef7d583.jpg", url: "https://chhouse.kr/product/detail.html?product_no=56806&cate_no=1457&display_group=1", originalPrice: 37000, salePrice: 33300 },
          { label: "미니합본/PU/지퍼/책상", img: "https://chhouse.kr/web/product/big/202602/dbc472f163e513dfe252f7bb3161912d.jpg", url: "https://chhouse.kr/product/detail.html?product_no=56807&cate_no=1457&display_group=1", originalPrice: 37000, salePrice: 33300 },
          { label: "미니합본/PU/지퍼/자전거", img: "https://chhouse.kr/web/product/big/202602/cec5211a82a5dd53030f3342fa47c077.jpg", url: "https://chhouse.kr/product/detail.html?product_no=56808&cate_no=1457&display_group=1", originalPrice: 37000, salePrice: 33300 },
          { label: "미니합본/PU/지퍼/책", img: "https://chhouse.kr/web/product/big/202408/46aedfad4bb22c157874526eb10b50e2.jpg", url: "https://chhouse.kr/product/detail.html?product_no=41018&cate_no=1457&display_group=1", originalPrice: 35000, salePrice: 31500 },
          { label: "미니합본/PU/지퍼/의자", img: "https://chhouse.kr/web/product/big/202408/45c64dff893b6046f2df6ae1648218de.jpg", url: "https://chhouse.kr/product/detail.html?product_no=41017&cate_no=1457&display_group=1", originalPrice: 35000, salePrice: 31500 },
          { label: "미니합본/PU/지퍼/소년", img: "https://chhouse.kr/web/product/big/202408/f8f8098568cac77909b45d3abaa30bf6.jpg", url: "https://chhouse.kr/product/detail.html?product_no=41016&cate_no=1457&display_group=1", originalPrice: 35000, salePrice: 31500 },
          { label: "미니합본/PU/지퍼/소녀", img: "https://chhouse.kr/web/product/big/202408/856a0cb20f0e31b7e9f383ee5b93efaf.jpg", url: "https://chhouse.kr/product/detail.html?product_no=41015&cate_no=1457&display_group=1", originalPrice: 35000, salePrice: 31500 }
        ]
      }
    ]
  },
  S: {
    name: "성서원",
    items: [
      {
        model: "주석큰성경", size: "특대", mm: 5.5, type: "study",
        variants: [
          { label: "대합본/천연/지퍼/블루블랙", img: "https://chhouse.kr/web/product/big/202404/f8ba8f095238eab73476d495df641273.jpg", url: "https://chhouse.kr/product/detail.html?product_no=47111&cate_no=1402&display_group=1", originalPrice: 76000, salePrice: 68400 },
          { label: "대합본/천연/지퍼/버건디", img: "https://chhouse.kr/web/product/big/202404/4c23d0dcdc82d11541f0740bd4a9920c.jpg", url: "https://chhouse.kr/product/detail.html?product_no=47112&cate_no=1402&display_group=1", originalPrice: 76000, salePrice: 68400 },
          { label: "대합본/PU/지퍼/블루블랙", img: "https://chhouse.kr/web/product/big/202404/6505bf8609f9d13de1b52e0c52274261.jpg", url: "https://chhouse.kr/product/detail.html?product_no=45063&cate_no=1402&display_group=1", originalPrice: 57000, salePrice: 51300 },
          { label: "대합본/PU/지퍼/초코", img: "https://chhouse.kr/web/product/big/202404/897c95975486463289834674fca150ad.jpg", url: "https://chhouse.kr/product/detail.html?product_no=45064&cate_no=1402&display_group=1", originalPrice: 57000, salePrice: 51300 }
        ]
      },
      {
        model: "주석큰성경", size: "중", mm: 4.8, type: "study",
        variants: [
          { label: "중합본/천연/지퍼/버건디", img: "https://chhouse.kr/web/product/big/202405/92c31169ae4c3738f1b56cb5800807e9.jpg", url: "https://chhouse.kr/product/detail.html?product_no=48502&cate_no=1377&display_group=1", originalPrice: 65000, salePrice: 58500 },
          { label: "중합본/천연/지퍼/초코", img: "https://chhouse.kr/web/product/big/202405/d35ccb24baf03e84969b2f9099fa30ec.jpg", url: "https://chhouse.kr/product/detail.html?product_no=48503&cate_no=1377&display_group=1", originalPrice: 65000, salePrice: 58500 },
          { label: "중합본/PU/지퍼/다크블루", img: "https://chhouse.kr/web/product/big/202405/0cf30474fd6b0dd594af1cb55209e8a7.jpg", url: "https://chhouse.kr/product/detail.html?product_no=48500&cate_no=1377&display_group=1", originalPrice: 51000, salePrice: 45900 },
          { label: "중합본/PU/지퍼/버건디", img: "https://chhouse.kr/web/product/big/202405/d91dc828ac4f8186ed2adfa6e05941b4.jpg", url: "https://chhouse.kr/product/detail.html?product_no=48501&cate_no=1377&display_group=1", originalPrice: 51000, salePrice: 45900 }
        ]
      },
      {
        model: "베스트성경", size: "중", mm: 4.5, type: "study",
        variants: [
          { label: "중합본/천연/지퍼/검정", img: "https://chhouse.kr/web/product/big/202404/8e357521086eef083fbdd74a0fec4183.jpg", url: "https://chhouse.kr/product/detail.html?product_no=18912&cate_no=1377&display_group=1", originalPrice: 56000, salePrice: 50400 },
          { label: "중합본/천연/지퍼/버건디", img: "https://chhouse.kr/web/product/big/202404/2911ed06d37d06c8f661e584b8e64b82.jpg", url: "https://chhouse.kr/product/detail.html?product_no=45793&cate_no=1377&display_group=1", originalPrice: 56000, salePrice: 50400 },
          { label: "중합본/PU/지퍼/브라운", img: "https://chhouse.kr/web/product/big/202405/31732e4579b5ea9d9202324da159fe4e.jpg", url: "https://chhouse.kr/product/detail.html?product_no=40258&cate_no=1377&display_group=1", originalPrice: 45000, salePrice: 40500 },
          { label: "중합본/PU/지퍼/블루그린", img: "https://chhouse.kr/product/detail.html?product_no=40259&cate_no=1377&display_group=1", url: "https://chhouse.kr/product/detail.html?product_no=40259&cate_no=1377&display_group=1", originalPrice: 45000, salePrice: 40500 },
          { label: "중합본/PU/무지퍼/비치용", img: "https://chhouse.kr/web/product/big/202406/d0a539ab1f05623d1bf3802c088683fd.jpg", url: "https://chhouse.kr/product/detail.html?product_no=48746&cate_no=1377&display_group=1", originalPrice: 40000, salePrice: 36000 },
          { label: "중합본/PU/무지퍼/비치용 (카페24)", img: "https://chhouse.cafe24.com/web/product/big/202406/43bf0679ab1fa44e4046f15419496b5e.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=48747&cate_no=1377&display_group=1", originalPrice: 40000, salePrice: 36000 }
        ]
      },
      {
        model: "베스트성경", size: "특소", mm: 3.5, type: "study",
        variants: [
          { label: "특소합본/천연/지퍼/네이비", img: "https://chhouse.kr/web/product/big/202512/873007386c5f9924ae14acddb2061d68.jpg", url: "https://chhouse.kr/product/detail.html?product_no=56199&cate_no=1413&display_group=1", originalPrice: 50000, salePrice: 45000 },
          { label: "특소합본/천연/지퍼/버건디", img: "https://chhouse.kr/web/product/big/202512/873007386c5f9924ae14acddb2061d68.jpg", url: "https://chhouse.kr/product/detail.html?product_no=56199&cate_no=1413&display_group=1", originalPrice: 50000, salePrice: 45000 },
          { label: "특소합본/PU/지퍼/네이비", img: "https://chhouse.kr/web/product/big/202404/6f929ab4187584489b8705df2caa079b.jpg", url: "https://chhouse.kr/product/detail.html?product_no=42503&cate_no=1413&display_group=1", originalPrice: 35500, salePrice: 31950 },
          { label: "특소합본/PU/지퍼/브라운", img: "https://chhouse.kr/web/product/big/202404/5305b0ba360d696767fc6cd79a69d151.jpg", url: "https://chhouse.kr/product/detail.html?product_no=42504&cate_no=1413&display_group=1", originalPrice: 35500, salePrice: 31950 }
        ]
      },
      {
        model: "좋은성경", size: "대", mm: 4.8, type: "study",
        variants: [
          { label: "대합본/천연/지퍼/버건디", img: "https://chhouse.cafe24.com/web/product/big/202512/6906dd11f8d887093e55d06478688773.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=56195&cate_no=1402&display_group=1", originalPrice: 71000, salePrice: 63900 },
          { label: "대합본/천연/저퍼/네이비", img: "https://chhouse.cafe24.com/web/product/big/202512/804d69f7ab860ac203c741c5916ff707.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=56196&cate_no=1402&display_group=1", originalPrice: 71000, salePrice: 63900 },
          { label: "대합본/PU/저퍼/그린", img: "https://chhouse.cafe24.com/web/product/big/202512/5d3bd7cdaf9fc48f741a603e04b7241a.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=56194&cate_no=1402&display_group=1", originalPrice: 55000, salePrice: 49500 },
          { label: "대합본/PU/저퍼/초코", img: "https://chhouse.cafe24.com/web/product/big/202512/46430e101a43624f9fda48aa9ce49923.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=56193&cate_no=1402&display_group=1", originalPrice: 55000, salePrice: 49500 }
        ]
      },
      {
        model: "좋은성경", size: "특소", mm: 3.5, type: "study",
        variants: [
          { label: "소합본/천연/지퍼/버건디", img: "https://chhouse.cafe24.com/web/product/big/202405/a616c2831a3ab073587981625d15d108.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=45833&cate_no=1413&display_group=1", originalPrice: 58000, salePrice: 52200 },
          { label: "소합본/천연/지퍼/네이비", img: "https://chhouse.cafe24.com/web/product/big/202405/8362aea493376ef2aee1d7c48ae9bf6e.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=45832&cate_no=1413&display_group=1", originalPrice: 58000, salePrice: 52200 }
        ]
      },
      {
        model: "빅컬러성경", size: "대", mm: 4.8, type: "study",
        variants: [
          { label: "대합본/천연/지퍼/초코", img: "https://chhouse.cafe24.com/web/product/big/202404/7439805c449d9b7defadb242927743e4.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=47320&cate_no=1402&display_group=1", originalPrice: 79000, salePrice: 71100 },
          { label: "대합본/천연/지퍼/버건디", img: "https://chhouse.cafe24.com/web/product/big/202404/293873478fbe765df5801ad67ab3298a.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=47319&cate_no=1402&display_group=1", originalPrice: 79000, salePrice: 71100 },
          { label: "대합본/PU/지퍼/블루블랙", img: "https://chhouse.cafe24.com/web/product/big/202405/da92f9980ef3dd754a1cc23cb999f465.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=44723&cate_no=1402&display_group=1", originalPrice: 62000, salePrice: 55800 },
          { label: "대합본/PU/지퍼/카멜브라운", img: "https://chhouse.cafe24.com/web/product/big/202405/35f99973e0236e115ebb04b77fd6cf5b.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=44722&cate_no=1402&display_group=1", originalPrice: 62000, salePrice: 55800 }
        ]
      },
      {
        model: "만나성경", size: "특미니", mm: 3.5, type: "study",
        variants: [
          { label: "특미니합본/PU/지퍼/민트", img: "https://chhouse.cafe24.com/web/product/big/202603/23d914ab3b8c910149dbaf7ef8afefcd.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=56934&cate_no=1400&display_group=1", originalPrice: 28000, salePrice: 25200 },
          { label: "특미니합본/PU/지퍼/베이지", img: "https://chhouse.cafe24.com/web/product/big/202603/009766c938c2833fdca9ff4a0c043469.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=56933&cate_no=1400&display_group=1", originalPrice: 28000, salePrice: 25200 },
          { label: "특미니합본/PU/지퍼/군인", img: "https://chhouse.cafe24.com/web/product/big/202506/99754c7b4bc27c49d84ead8d87bd24b7.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=54166&cate_no=1400&display_group=1", originalPrice: 29000, salePrice: 26100 }
        ]
      }
    ]
  },
  C: {
    name: "대한기독교서회",
    items: [
      {
        model: "프라임 주석 성경", size: "대", mm: 4.8, type: "study",
        variants: [
          { label: "대합본/PU/지퍼/블루블랙", img: "https://chhouse.kr/web/product/big/202604/79f54e0efb8f7c62283e686c3a52d77a.jpg", url: "https://chhouse.kr/product/detail.html?product_no=57298&cate_no=1380&display_group=1", originalPrice: 58000, salePrice: 52200 },
          { label: "대합본/PU/지퍼/버건디", img: "https://chhouse.kr/web/product/big/202604/7f0d306a4a650e6c5ff1b38885ceece3.jpg", url: "https://chhouse.kr/product/detail.html?product_no=57299&cate_no=1380&display_group=1", originalPrice: 58000, salePrice: 52200 }
        ]
      },
      {
        model: "프라임 주석 성경", size: "중", mm: 4.5, type: "study",
        variants: [
          { label: "중합본/PU/지퍼/다크브라운", img: "https://chhouse.kr/web/product/big/202604/20a719ef566aadd90b4fd1acd3067542.jpg", url: "https://chhouse.kr/product/detail.html?product_no=57300&cate_no=1353&display_group=1", originalPrice: 54000, salePrice: 48600 },
          { label: "중합본/PU/지퍼/카키그레이", img: "https://chhouse.kr/web/product/big/202405/827c19946d4c8e64ebbee65bc74aa7b1.jpg", url: "https://chhouse.kr/product/detail.html?product_no=40867&cate_no=1380&display_group=1", originalPrice: 54000, salePrice: 48600 }
        ]
      },
      {
        model: "취리히바이블", size: "특대", mm: 5.5, type: "study",
        variants: [
          { label: "특대합본/천연/지퍼/블루블랙", img: "https://chhouse.kr/web/product/big/202405/a01e296ec8e0baf3ab0da2383c49413b.jpg", url: "https://chhouse.kr/product/detail.html?product_no=37950&cate_no=1366&display_group=1", originalPrice: 61000, salePrice: 54900 },
          { label: "특대합본/천연/지퍼/다크브라운", img: "https://chhouse.kr/web/product/big/202405/2601c80956f73e33f9c0afc2b6128887.jpg", url: "https://chhouse.kr/product/detail.html?product_no=37949&cate_no=1366&display_group=1", originalPrice: 61000, salePrice: 54900 },
          { label: "특대합본/PU/지퍼/버건디", img: "https://chhouse.kr/web/product/big/202405/85d2f781eec3b92a28961296ea3aa56a.jpg", url: "https://chhouse.kr/product/detail.html?product_no=37954&cate_no=1366&display_group=1", originalPrice: 49000, salePrice: 44100 },
          { label: "특대합본/PU/지퍼/다크브라운", img: "https://chhouse.kr/web/product/big/202405/923df645eaf9012a96038fa4880d6561.jpg", url: "https://chhouse.kr/product/detail.html?product_no=37953&cate_no=1366&display_group=1", originalPrice: 49000, salePrice: 44100 },
          { label: "특대합본/PU/지퍼/블루블랙", img: "https://chhouse.kr/web/product/big/202405/944de7d65be586b91478fab2371cf90b.jpg", url: "https://chhouse.kr/product/detail.html?product_no=37955&cate_no=1366&display_group=1", originalPrice: 49000, salePrice: 44100 }
        ]
      },
      {
        model: "취리히바이블", size: "특중", mm: 4.8, type: "study",
        variants: [
          { label: "특중합본/천연/지퍼/다크브라운", img: "https://chhouse.kr/web/product/big/202405/8718503ccb1d866d222ddcc9d76ca736.jpg", url: "https://chhouse.kr/product/detail.html?product_no=37951&cate_no=1446&display_group=1", originalPrice: 52000, salePrice: 46800 },
          { label: "특중합본/천연/지퍼/블루블랙", img: "https://chhouse.kr/web/product/big/202405/e06145f6e68da1493f4f214270e63bee.jpg", url: "https://chhouse.kr/product/detail.html?product_no=37952&cate_no=1446&display_group=1", originalPrice: 52000, salePrice: 46800 },
          { label: "특중합본/PU/지퍼/버건디", img: "https://chhouse.kr/web/product/big/202405/2ac782c3e087b96888978f7777bd4f7e.jpg", url: "https://chhouse.kr/product/detail.html?product_no=37957&cate_no=1446&display_group=1", originalPrice: 40000, salePrice: 36000 },
          { label: "특중합본/PU/지퍼/다크브라운", img: "https://chhouse.kr/web/product/big/202405/5bde018b939f8d74d02ed10de703620c.jpg", url: "https://chhouse.kr/product/detail.html?product_no=37956&cate_no=1446&display_group=1", originalPrice: 40000, salePrice: 36000 },
          { label: "특중합본/PU/지퍼/카키블랙", img: "https://chhouse.kr/web/product/big/202405/72237e878d678a5bfc8804fa3e92ffbf.jpg", url: "https://chhouse.kr/product/detail.html?product_no=37958&cate_no=1446&display_group=1", originalPrice: 40000, salePrice: 36000 }
        ]
      },
      {
        model: "취리히바이블", size: "소", mm: 4.1, type: "study",
        variants: [
          { label: "소합본/천연/지퍼/다크브라운", img: "https://chhouse.kr/web/product/big/202405/4c2507346fbfa48739205ad529409957.jpg", url: "https://chhouse.kr/product/detail.html?product_no=38295&cate_no=1408&display_group=1", originalPrice: 49000, salePrice: 44100 },
          { label: "소합본/천연/지퍼/블루블랙", img: "https://chhouse.kr/web/product/big/202405/bde44bd74f398c17563afdfaaf07037a.jpg", url: "https://chhouse.kr/product/detail.html?product_no=38296&cate_no=1408&display_group=1", originalPrice: 49000, salePrice: 44100 },
          { label: "소합본/PU/지퍼/다크브라운", img: "https://chhouse.kr/web/product/big/202405/151d526a01c20d1e20e1d1a12ca49ab3.jpg", url: "https://chhouse.kr/product/detail.html?product_no=38297&cate_no=1408&display_group=1", originalPrice: 37000, salePrice: 33300 },
          { label: "소합본/PU/지퍼/레드", img: "https://chhouse.kr/web/product/big/202405/11f3934693aa6dbfde03601380ea61d2.jpg", url: "https://chhouse.kr/product/detail.html?product_no=38298&cate_no=1408&display_group=1", originalPrice: 37000, salePrice: 33300 },
          { label: "소합본/PU/지퍼/모던브라운", img: "https://chhouse.kr/web/product/big/202405/23d2b79457c2a64a8f95eeed48bc0895.jpg", url: "https://chhouse.kr/product/detail.html?product_no=38299&cate_no=1408&display_group=1", originalPrice: 37000, salePrice: 33300 }
        ]
      },
      {
        model: "포커스성경", size: "특소", mm: 3.5, type: "study",
        variants: [
          { label: "특소합본/PU/지퍼/인디핑크", img: "https://chhouse.kr/web/product/big/202604/441c573a7508a1d6d44d74d22e2616b8.jpg", url: "https://chhouse.kr/product/detail.html?product_no=57327&cate_no=1363&display_group=1", originalPrice: 38000, salePrice: 34200 },
          { label: "특소합본/PU/지퍼/인디고블루", img: "https://chhouse.kr/web/product/big/202405/f451410530973703219274223000be22.jpg", url: "https://chhouse.kr/product/detail.html?product_no=45763&cate_no=1363&display_group=1", originalPrice: 38000, salePrice: 34200 },
          { label: "특소합본/PU/지퍼/민트", img: "https://chhouse.kr/web/product/big/202405/76cf85ed78bed62b143cf549bacdb214.jpg", url: "https://chhouse.kr/product/detail.html?product_no=45764&cate_no=1363&display_group=1", originalPrice: 38000, salePrice: 34200 }
        ]
      },
      {
        model: "포커스성경", size: "초미니", mm: 3.2, type: "study",
        variants: [
          { label: "초미니합본/PU/지퍼/민트", img: "https://chhouse.kr/web/product/big/202604/a874032290a1e0d66e92636875b99ccc.jpg", url: "https://chhouse.kr/product/detail.html?product_no=57301&cate_no=1412&display_group=1", originalPrice: 32000, salePrice: 28800 },
          { label: "초미니합본/PU/지퍼/인디고블루", img: "https://chhouse.kr/web/product/big/202405/df3d34c98d6fa6c26291d38382a4cbef.jpg", url: "https://chhouse.kr/product/detail.html?product_no=45767&cate_no=1412&display_group=1", originalPrice: 32000, salePrice: 28800 },
          { label: "초미니합본/PU/지퍼/로즈핑크", img: "https://chhouse.kr/web/product/big/202405/43ed95643aa508e60ab19527066cab64.jpg", url: "https://chhouse.kr/product/detail.html?product_no=45768&cate_no=1412&display_group=1", originalPrice: 32000, salePrice: 28800 }
        ]
      }
    ]
  },
  D: {
    name: "두란노",
    items: [
      {
        model: "비전성경", size: "중", mm: 4.8, type: "study",
        variants: [
          { label: "중합본/PU/지퍼/황갈색", img: "https://chhouse.cafe24.com/web/product/big/202405/c318b200d83cb98d5f73d07f4cb4e062.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=42829&cate_no=1393&display_group=1", originalPrice: 40000, salePrice: 36000 },
          { label: "중합본/PU/지퍼/진갈색", img: "https://chhouse.cafe24.com/web/product/big/202405/65eda45ae5171c3f264a832dc4999afb.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=42828&cate_no=1393&display_group=1", originalPrice: 40000, salePrice: 36000 },
          { label: "중합본/PU/지퍼/진청색", img: "https://chhouse.cafe24.com/web/product/big/202405/5102004daef0073a8b7e6f39b73788ad.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=42830&cate_no=1393&display_group=1", originalPrice: 40000, salePrice: 36000 }
        ]
      },
      {
        model: "비전성경", size: "특미니", mm: 3.5, type: "study",
        variants: [
          { label: "특미니합본/PU/지퍼/모카무스", img: "https://chhouse.cafe24.com/web/product/big/202601/6d017950082a1e5fefa0272510dc4952.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=56538&cate_no=1452&display_group=1", originalPrice: 32000, salePrice: 28800 },
          { label: "특미니합본/PU/지퍼/네이비", img: "https://chhouse.cafe24.com/web/product/big/202601/35fe15c583b4245561a6108244a9c818.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=56537&cate_no=1452&display_group=1", originalPrice: 32000, salePrice: 28800 },
          { label: "특미니합본/PU/지퍼/베이지", img: "https://chhouse.cafe24.com/web/product/big/202601/6fa323de1e49cf3d8ac20ab06ad3f153.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=56540&cate_no=1452&display_group=1", originalPrice: 32000, salePrice: 28800 },
          { label: "특미니합본/PU/지퍼/민트블루", img: "https://chhouse.cafe24.com/web/product/big/202601/417964cc2e7dfaa691e6df48e7b9a984.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=56539&cate_no=1452&display_group=1", originalPrice: 32000, salePrice: 28800 }
        ]
      },
      {
        model: "비전성경", size: "초미니", mm: 3.2, type: "study",
        variants: [
          { label: "초미니합본/PU/밴드형/샌드베이지", img: "https://chhouse.cafe24.com/web/product/big/202602/8e4ae1f259c5f1b1a71a1e521fc85dff.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=56767&cate_no=1392&display_group=1", originalPrice: 30000, salePrice: 27000 },
          { label: "초미니합본/PU/밴드형/로즈핑크", img: "https://chhouse.cafe24.com/web/product/big/202602/eed9eab338e331440d34892fa6b8c8d4.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=56766&cate_no=1392&display_group=1", originalPrice: 30000, salePrice: 27000 },
          { label: "초미니합본/PU/밴드형/라이트네이비", img: "https://chhouse.cafe24.com/web/product/big/202602/dc8e0fddfacca0968b8fb2f31e553919.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=56765&cate_no=1392&display_group=1", originalPrice: 30000, salePrice: 27000 },
          { label: "초미니합본/PU/밴드형/다크그레이", img: "https://chhouse.cafe24.com/web/product/big/202602/c23db938c221f219b36dc015a3025951.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=56764&cate_no=1392&display_group=1", originalPrice: 30000, salePrice: 27000 }
        ]
      }
    ]
  }
};

const appPath = 'src/App.jsx';
let appContent = fs.readFileSync(appPath, 'utf8');

const startIdx = appContent.indexOf('const bibleData = {');
const endIdx = appContent.indexOf('  const filteredItems = ') - 2;
const bibleDataStr = appContent.substring(startIdx, endIdx);
let currentBibleData;
try {
  currentBibleData = new Function('return ' + bibleDataStr.replace('const bibleData = ', ''))();
} catch(e) {
  console.log(e);
}

const agapeStandard = currentBibleData.A.items.filter(i => i.type === 'standard');
const nkr72ath = agapeStandard.find(i => i.model === 'NKR72ATH');
if (nkr72ath) {
  nkr72ath.variants = nkr72ath.variants.slice(0, 1);
}
// Delete other standard items from agape except NKR72ATH first variant?
// User said: 아가페 NKR72ATH에서 처음에 있는 데이타만 남기고 나머지(결혼성경)는 모두 삭제해.
// Ah, it means ONLY NKR72ATH. What about other standard ones? 
// NKR82AB, NKR72EAB etc are also there. They said "아가페 NKR72ATH에서 처음에 있는 데이타만 남기고 나머지(결혼성경)는 모두 삭제해."
// It means INSIDE NKR72ATH, keep the first one, delete the rest (which are probably wedding bibles). So my logic `nkr72ath.variants.slice(0,1)` is correct.
newData.A.items = [...agapeStandard, ...newData.A.items];

const finalData = {
  A: newData.A,
  W: newData.W,
  S: newData.S,
  C: newData.C,
  D: newData.D,
  L: currentBibleData.L
};

const newStr = 'const bibleData = ' + JSON.stringify(finalData, null, 2) + ';\n';
appContent = appContent.replace(bibleDataStr, newStr);

fs.writeFileSync(appPath, appContent);
console.log('Successfully updated bibleData!');
