const fs = require('fs');

const rawData = `
생명의말씀사 
NKR82WBU
옵션 1	특대합본/천연/지퍼/버건디	https://chhouse.cafe24.com/web/product/big/202405/d6bc8fae620dacbe20afbe01839e2543.jpg	https://chhouse.cafe24.com/product/detail.html?product_no=38865&cate_no=1350&display_group=1	89000	80100
옵션 2	특대합본/천연/지퍼/다크브라운	https://chhouse.cafe24.com/web/product/big/202405/acfa91221bd263674d64e18fee354927.jpg	https://chhouse.cafe24.com/product/detail.html?product_no=38864&cate_no=1350&display_group=1	89000	80100
옵션 3	특대합본/PU/지퍼/네이비	https://chhouse.cafe24.com/web/product/big/202405/680fe50278789998616932da1157271b.jpg	https://chhouse.cafe24.com/product/detail.html?product_no=39061&cate_no=1350&display_group=1	74000	66600
옵션 4	특대합본/PU/지퍼/브라운	https://chhouse.cafe24.com/web/product/big/202405/b0484d75a0014bb47fc92975d8e0d941.jpg	https://chhouse.cafe24.com/product/detail.html?product_no=39062&cate_no=1350&display_group=1	74000	66600

NKR72EWBU
옵션 1	대합본/천연/지퍼/다크네이비	https://chhouse.cafe24.com/web/product/big/202412/19231ef6cd16657e5fd93e353ec898ac.jpg	https://chhouse.cafe24.com/product/detail.html?product_no=51954&cate_no=1372&display_group=1	85000	76500
옵션 2	대합본/천연/지퍼/다크브라운	https://chhouse.cafe24.com/web/product/big/202412/a2f0ad30f7083447b82043039a939b5b.jpg	https://chhouse.cafe24.com/product/detail.html?product_no=51953&cate_no=1372&display_group=1	85000	76500
옵션 3	대합본/천연/지퍼/검정	https://chhouse.cafe24.com/web/product/big/202405/1af577de5972d7bf88cdc091175968c9.jpg	https://chhouse.cafe24.com/product/detail.html?product_no=44925&cate_no=1372&display_group=1	73000	65700
옵션 4	대합본/천연/지퍼/다크브라운	https://chhouse.cafe24.com/web/product/big/202404/9cddba4546ad6345e4cabebb9c4595db.jpg	https://chhouse.cafe24.com/product/detail.html?product_no=44924&cate_no=1372&display_group=1	73000	65700
옵션 5	대합본/천연/지퍼/버건디	https://chhouse.cafe24.com/web/product/big/202405/de0ac6e20221356e8cdb838df49bd789.jpg	https://chhouse.cafe24.com/product/detail.html?product_no=38404&cate_no=1372&display_group=1	73000	65700
옵션 6	대합본/PU/지퍼/브라운	https://chhouse.cafe24.com/web/product/big/202501/fc7eba1022f57d4fe8178fdb830e8db5.jpg	https://chhouse.cafe24.com/product/detail.html?product_no=52168&cate_no=1372&display_group=1	65000	58500
옵션 7	대합본/PU/지퍼/레드브라운	https://chhouse.cafe24.com/web/product/big/202501/f5cad44908e08b44cd8f3f54fa779308.jpg	https://chhouse.cafe24.com/product/detail.html?product_no=52167&cate_no=1372&display_group=1	65000	58500
옵션 8	대합본/PU/무지퍼/초코브라운	https://chhouse.cafe24.com/web/product/big/202412/47f775944fb7e3ebdf34921ef650632e.jpg	https://chhouse.cafe24.com/product/detail.html?product_no=51981&cate_no=1372&display_group=1	64000	57600
옵션 9	대합본/PU/무지퍼/초코브라운	https://chhouse.cafe24.com/web/product/big/202412/ceb6c6423390d3cff9a1d6aae8c2a583.jpg	https://chhouse.cafe24.com/product/detail.html?product_no=51982&cate_no=1372&display_group=1	64000	57600

NKR72EWXU
옵션 1	대합본/천연/지퍼/다크브라운	https://chhouse.kr/web/product/big/202404/302f4dac4d5bab4aafaa4ac3f72ddc34.jpg	https://chhouse.kr/product/detail.html?product_no=46601&cate_no=1372&display_group=1	78000	70200
옵션 2	대합본/천연/지퍼/버건디	https://chhouse.kr/web/product/big/202404/653ea1cba536bb7a260d6b87ebee481c.jpg	https://chhouse.kr/product/detail.html?product_no=46600&cate_no=1372&display_group=1	78000	70200
옵션 3	대합본/PU/지퍼/네이비	https://chhouse.kr/web/product/big/202406/4d6669c26cde3df3238db038f0595ede.jpg	https://chhouse.kr/product/detail.html?product_no=48550&cate_no=1372&display_group=1	65000	58500
옵션 4	대합본/PU/지퍼/초코브라운	https://chhouse.kr/web/product/big/202405/021aea99558b7ebf9725192424fd83b3.jpg	https://chhouse.kr/product/detail.html?product_no=48181&cate_no=1372&display_group=1	65000	58500
옵션 5	대합본/PU/무지퍼/검정	https://chhouse.kr/web/product/big/202405/a52d84e366e7c6be7acfa4bc66fa97c1.jpg	https://chhouse.kr/product/detail.html?product_no=46312&cate_no=1372&display_group=1	62000	55800
옵션 6	대합본/PU/무지퍼/브라운	https://chhouse.kr/web/product/big/202405/2e4650936eaf523b3a81e7741a2c0d49.jpg	https://chhouse.kr/product/detail.html?product_no=46311&cate_no=1372&display_group=1	62000	55800

NKR72WTU
옵션 1	중합본/천연/지퍼/버건디	https://chhouse.kr/web/product/big/202405/54bb996457ca70dcd57bc35207d8c0ef.jpg	https://chhouse.kr/product/detail.html?product_no=36947&cate_no=1371&display_group=1	60000	54000
옵션 2	중합본/천연/지퍼/다크브라운	https://chhouse.kr/web/product/big/202404/2cc00ba1ed7f3d166c9a129983beff1a.jpg	https://chhouse.kr/product/detail.html?product_no=36946&cate_no=1371&display_group=1	60000	54000
옵션 3	중합본/PU/지퍼/뉴다크네이비	https://chhouse.kr/web/product/big/202405/345ad9356e6ac07787cac52096285c64.jpg	https://chhouse.kr/product/detail.html?product_no=36044&cate_no=1371&display_group=1	56000	50400
옵션 4	중합본/PU/지퍼/뉴브라운	https://chhouse.kr/web/product/big/202405/304d72b90ab27f7d5ca3b60fad17e272.jpg	https://chhouse.kr/product/detail.html?product_no=36043&cate_no=1371&display_group=1	56000	50400
옵션 5	중합본/PU/지퍼/뉴그레이	https://chhouse.kr/web/product/big/202405/54c9f3511af3cbde7493bff682fdfa6f.jpg	https://chhouse.kr/product/detail.html?product_no=36045&cate_no=1371&display_group=1	56000	50400
옵션 6	중합본/PU/무지퍼/뉴다크브라운	https://chhouse.kr/web/product/big/202404/82d59828badee69deeae5b09dd4f2bdb.jpg	https://chhouse.kr/product/detail.html?product_no=36042&cate_no=1371&display_group=1	48000	43200
옵션 7	중합본/PU/무지퍼/뉴다크네이비	https://chhouse.kr/web/product/big/202404/9ddbacc3fcd00174b666267ede0b6fe6.jpg	https://chhouse.kr/product/detail.html?product_no=36041&cate_no=1371&display_group=1	48000	43200

NKR72WXU
옵션 1	중합본/천연/지퍼/다크브라운	https://chhouse.kr/web/product/big/202405/b606c95e2b924385613b691f21d1c4c4.jpg	https://chhouse.kr/product/detail.html?product_no=43574&cate_no=1371&display_group=1	66000	59400
옵션 2	중합본/천연/지퍼/버건디	https://chhouse.kr/web/product/big/202405/5d06bab0e89ad138695c292cd9bc7783.jpg	https://chhouse.kr/product/detail.html?product_no=43603&cate_no=1371&display_group=1	66000	59400
옵션 3	중합본/PU/지퍼/브라운	https://chhouse.kr/web/product/big/202408/df9ad6f83e9018babd5ba1f6ec116bb1.jpg	https://chhouse.kr/product/detail.html?product_no=49432&cate_no=1371&display_group=1	55000	49500
옵션 4	중합본/PU/지퍼/네이비	https://chhouse.kr/web/product/big/202408/c0fc361c861ba57cd39d454bc6addf30.jpg	https://chhouse.kr/product/detail.html?product_no=49433&cate_no=1371&display_group=1	55000	49500

NKR72WM
옵션 1	지갑식/중합본/브라운	https://chhouse.kr/web/product/big/202508/86655f3e91960e343a26350e2edb3846.jpg	https://chhouse.kr/product/detail.html?product_no=54639&cate_no=1371&display_group=1	53000	47700
옵션 2	지갑식/중합본/네이비	https://chhouse.kr/web/product/big/202508/3161942126fc5ea6461f3901b49820a9.jpg	https://chhouse.kr/product/detail.html?product_no=54638&cate_no=1371&display_group=1	53000	47700
옵션 3	지갑식/중합본/웜그레이	https://chhouse.kr/web/product/big/202508/da5103e47f52cfb4c0c782231e39947d.jpg	https://chhouse.kr/product/detail.html?product_no=54640&cate_no=1371&display_group=1	53000	47700

성서원
NKR83SB
옵션 1	특대합본/천연/지퍼/버건디	https://chhouse.kr/web/product/big/202408/82dce6def533662cca05ceb4c156e15e.jpg	https://chhouse.kr/product/detail.html?product_no=49469&cate_no=1451&display_group=1	88000	79200
옵션 2	특대합본/천연/지퍼/초코	https://chhouse.kr/web/product/big/202408/c52d1a41699f6308d00f41466a3c9bf6.jpg	https://chhouse.kr/product/detail.html?product_no=49468&cate_no=1451&display_group=1	88000	79200
옵션 3	특대합본/PU/지퍼/네이비	https://chhouse.kr/web/product/big/202604/75bfd0c2bfe140ade99809830be3c202.jpg	https://chhouse.kr/product/detail.html?product_no=57443&cate_no=1451&display_group=1	74000	66600
옵션 4	특대합본/PU/지퍼/브라운	https://chhouse.kr/web/product/big/202604/9d13ac2b4fc283d3f9c7b09eee4fa010.jpg	https://chhouse.kr/product/detail.html?product_no=57444&cate_no=1451&display_group=1	74000	66600
옵션 5	특대합본/PU/지퍼/버건디	https://chhouse.kr/web/product/big/202408/f86c7177d007aea89116e2f7e14f5cc6.jpg	https://chhouse.kr/product/detail.html?product_no=49466&cate_no=1451&display_group=1	73000	65700
옵션 6	특대합본/PU/지퍼/블루블랙	https://chhouse.kr/web/product/big/202408/990ae513a56675f928b762b9f58d5e62.jpg	https://chhouse.kr/product/detail.html?product_no=49467&cate_no=1451&display_group=1	73000	65700

NKR73ESB
옵션 1	대합본/천연/지퍼/블루블랙	https://chhouse.kr/web/product/big/202404/31220f9f72118e77b3a0692fde03d4c8.jpg	https://chhouse.kr/product/detail.html?product_no=46900&cate_no=1402&display_group=1	83000	74700
옵션 2	대합본/천연/지퍼/버건디	https://chhouse.kr/web/product/big/202404/dd78f77eb83fa5508ba78b446874411a.jpg	https://chhouse.kr/product/detail.html?product_no=46899&cate_no=1402&display_group=1	83000	74700
옵션 3	대합본/PU/지퍼/블루블랙	https://chhouse.kr/web/product/big/202404/26599b05b2eb86e0fd61525e19132b8c.jpg	https://chhouse.kr/product/detail.html?product_no=46898&cate_no=1402&display_group=1	68000	61200
옵션 4	대합본/PU/지퍼/버건디	https://chhouse.kr/web/product/big/202404/93ef315792ef9bf52093a52f0e722002.jpg	https://chhouse.kr/product/detail.html?product_no=46897&cate_no=1402&display_group=1	68000	61200

NKR73SB
옵션 1	중합본/천연/지퍼/버건디	https://chhouse.kr/web/product/big/202604/76064c0c36008673d8b0f529b6091dac.jpg	https://chhouse.kr/product/detail.html?product_no=47755&cate_no=1377&display_group=1	74000	66600
옵션 2	중합본/천연/지퍼/초코	https://chhouse.kr/web/product/big/202604/d923e64b547832a0ec69128d6aef1897.jpg	https://chhouse.kr/product/detail.html?product_no=47754&cate_no=1377&display_group=1	74000	66600
옵션 3	중합본/천연/지퍼/버건디	https://chhouse.kr/web/product/big/202405/2afc563ca80aec0f4740aae9dba31058.jpg	https://chhouse.kr/product/detail.html?product_no=45146&cate_no=1377&display_group=1	69000	62100
옵션 4	중합본/천연/지퍼/초코	https://chhouse.kr/web/product/big/202405/aec3bb8e167f9db20a3522fdb76cfd0e.jpg	https://chhouse.kr/product/detail.html?product_no=45145&cate_no=1377&display_group=1	69000	62100
옵션 5	중합본/PU/지퍼/네이비	https://chhouse.kr/web/product/big/202404/7ae9b6b9ed5b78b5e9710efdb81b7fac.jpg	https://chhouse.kr/product/detail.html?product_no=45144&cate_no=1377&display_group=1	60000	54000
옵션 6	중합본/PU/지퍼/초코	https://chhouse.kr/web/product/big/202404/593a6dd8824eae531919464b06e603b3.jpg	https://chhouse.kr/product/detail.html?product_no=45143&cate_no=1377&display_group=1	60000	54000
옵션 7	중합본/PU/무지퍼/초코	https://chhouse.kr/web/product/big/202505/9cc850d3aed44571a0b837ed5af5ef65.jpg	https://chhouse.kr/product/detail.html?product_no=53411&cate_no=1377&display_group=1	56000	50400

NKR73STH
옵션 1	중합본/천연/지퍼/검정	https://chhouse.kr/web/product/big/202405/aabc12869a410ad23d492534397d52e9.jpg	https://chhouse.kr/product/detail.html?product_no=18918&cate_no=1377&display_group=1	64000	57600
옵션 2	중합본/PU/지퍼/버건디	https://chhouse.kr/web/product/big/202405/5de0fcd9826647080cf1d9651354d713.jpg	https://chhouse.kr/product/detail.html?product_no=46134&cate_no=1377&display_group=1	51000	45900
옵션 3	중합본/PU/지퍼/블루블랙	https://chhouse.kr/web/product/big/202405/719726017e726e78bbf115493b1a8a39.jpg	https://chhouse.kr/product/detail.html?product_no=46133&cate_no=1377&display_group=1	51000	45900
옵션 4	중합본/PU/무지퍼/블루블랙	https://chhouse.kr/web/product/big/202509/bd9f1c18a875296462366ad78e60b696.jpg	https://chhouse.kr/product/detail.html?product_no=54781&cate_no=1377&display_group=1	46000	41400

대한기독교서회
NKR83BU
옵션 1	특대합본/천연/지퍼/블루블랙	https://chhouse.kr/web/product/big/202404/798e54d2d0c2bb1e649b7cff9129f05e.jpg	https://chhouse.kr/product/detail.html?product_no=38198&cate_no=1366&display_group=1	86000	77400
옵션 2	특대합본/천연/지퍼/다크브라운	https://chhouse.kr/web/product/big/202404/3b2171cd06d50f2fb603b039a570d4ff.jpg	https://chhouse.kr/product/detail.html?product_no=18288&cate_no=1366&display_group=1	86000	77400

NKR73BU
옵션 1	중합본/천연/지퍼/버건디	https://chhouse.kr/web/product/big/202405/f0ae81e70643d1f3f494c63078cf256c.jpg	https://chhouse.kr/product/detail.html?product_no=18285&cate_no=1353&display_group=1	75000	67500
옵션 2	중합본/천연/지퍼/블루블랙	https://chhouse.kr/web/product/big/202405/b5a1668be5dafc43a97bee8195f6c16a.jpg	https://chhouse.kr/product/detail.html?product_no=38136&cate_no=1353&display_group=1	75000	67500
옵션 3	중합본/PU/지퍼/다크브라운	https://chhouse.kr/web/product/big/202405/ccba522590d46e7724a5ca97abbdbdf2.jpg	https://chhouse.kr/product/detail.html?product_no=42809&cate_no=1353&display_group=1	61000	54900
옵션 4	중합본/PU/지퍼/블루블랙	https://chhouse.kr/web/product/big/202405/145b6f0dcdb4cfb8dc9dc2ba4e71551e.jpg	https://chhouse.kr/product/detail.html?product_no=42807&cate_no=1353&display_group=1	61000	54900

NKR73THU
옵션 1	중합본/천연/지퍼/딥버건디	https://chhouse.kr/web/product/big/202405/0cd420aad8f14bdc0dd37c6af061099a.jpg	https://chhouse.kr/product/detail.html?product_no=37960&cate_no=1353&display_group=1	60000	54000
옵션 2	중합본/천연/지퍼/카키그레이	https://chhouse.kr/web/product/big/202405/bf5c102577effc64962ca8ae0d9d0453.jpg	https://chhouse.kr/product/detail.html?product_no=42148&cate_no=1353&display_group=1	60000	54000
옵션 3	중합본/천연/지퍼/블루블랙	https://chhouse.kr/web/product/big/202405/f54461feb24e8fe8706b282c2fd274c3.jpg	https://chhouse.kr/product/detail.html?product_no=37959&cate_no=1353&display_group=1	60000	54000
옵션 4	중합본/PU/지퍼/블루블랙	https://chhouse.kr/web/product/big/202507/f279dcf2b1d96c3e7578b479270af86b.jpg	https://chhouse.kr/product/detail.html?product_no=54240&cate_no=1353&display_group=1	49000	44100
옵션 5	중합본/PU/지퍼/다크브라운	https://chhouse.kr/web/product/big/202507/d03278e260053fa67d67330d4bf196ad.jpg	https://chhouse.kr/product/detail.html?product_no=54241&cate_no=1353&display_group=1	49000	44100
옵션 6	중합본/PU/무지퍼/블루블랙	https://chhouse.kr/web/product/big/202507/b5f078893b67569d5a84e0733e3f316c.jpg	https://chhouse.kr/product/detail.html?product_no=54238&cate_no=1353&display_group=1	42500	38250
옵션 7	중합본/PU/무지퍼/다크브라운	https://chhouse.kr/web/product/big/202507/49f336e185f530daf9c1a239b29e326f.jpg	https://chhouse.kr/product/detail.html?product_no=54239&cate_no=1353&display_group=1	42500	38250

NKR63EXU
옵션 1	소합본/천연/지퍼/블루블랙	https://chhouse.kr/web/product/big/202404/2801c02922b067389801b5d6987870e0.jpg	https://chhouse.kr/product/detail.html?product_no=47031&cate_no=1408&display_group=1	59000	53100
옵션 2	소합본/천연/지퍼/버건디	https://chhouse.kr/web/product/big/202404/825afeea6a25b4c82404ff5a4839c70b.jpg	https://chhouse.kr/product/detail.html?product_no=47032&cate_no=1408&display_group=1	59000	53100
옵션 3	소합본/천연/지퍼/크림	https://chhouse.kr/web/product/big/202404/bc5f9e5b5c1aeddccac327052e6a0cb3.jpg	https://chhouse.kr/product/detail.html?product_no=47033&cate_no=1408&display_group=1	59000	53100
옵션 4	소합본/PU/지퍼/라벤더	https://chhouse.kr/web/product/big/202404/86b30fa2d7a58f8c19933e197f0aa7cf.jpg	https://chhouse.kr/product/detail.html?product_no=47034&cate_no=1408&display_group=1	47000	42300
옵션 5	소합본/PU/지퍼/인디고블루	https://chhouse.kr/web/product/big/202404/ed4114487f28caec6f6dee209bdc663a.jpg	https://chhouse.kr/product/detail.html?product_no=47030&cate_no=1408&display_group=1	47000	42300

NKR63ETHU
옵션 1	소합본/천연/지퍼/크림	https://chhouse.kr/web/product/big/202404/4a69a10db89a156dc47e79110ca210e3.jpg	https://chhouse.kr/product/detail.html?product_no=46924&cate_no=1408&display_group=1	53000	47700
옵션 2	소합본/천연/지펴/블루스카이	https://chhouse.kr/web/product/big/202404/e9e541dab8d02b9ba89fa5828bd191b2.jpg	https://chhouse.kr/product/detail.html?product_no=39850&cate_no=1408&display_group=1	53000	47700
옵션 3	소합본/천연/지펴/블루블랙	https://chhouse.kr/web/product/big/202404/1a54046cc98c69b09e9dda0e5ed6de82.jpg	https://chhouse.kr/product/detail.html?product_no=39851&cate_no=1408&display_group=1	53000	47700
옵션 4	소합본/PU/지퍼/트윙클골드	https://chhouse.kr/web/product/big/202405/6a62a58b228fd5229ba9ca1aeeb18bb5.jpg	https://chhouse.kr/product/detail.html?product_no=44077&cate_no=1408&display_group=1	37000	33300

두란노
NKR82DBU
옵션 1	특대합본/천연/지퍼/다크레드	https://chhouse.kr/web/product/big/202405/72635a39cd1fd0dfdec9ba65c3eaa93a.jpg	https://chhouse.kr/product/detail.html?product_no=43493&cate_no=1414&display_group=1	86000	77400
옵션 2	특대합본/천연/지퍼/다크초코	https://chhouse.kr/web/product/big/202405/255e925c7c78bc1e29a1f9f4a0c974a9.jpg	https://chhouse.kr/product/detail.html?product_no=43494&cate_no=1414&display_group=1	86000	77400
옵션 3	특대합본/천연/지퍼/다크블루	https://chhouse.kr/web/product/big/202405/45f58ebb7b0794cb0e5aeacbb67cdb21.jpg	https://chhouse.kr/product/detail.html?product_no=43495&cate_no=1414&display_group=1	86000	77400
옵션 4	특대합본/천연/무지퍼/다크초코	https://chhouse.kr/web/product/big/202404/eb889255b575f22f883ec814ef95a318.jpg	https://chhouse.kr/product/detail.html?product_no=46696&cate_no=1414&display_group=1	65000	58500
옵션 5	특대합본/천연/무지퍼/다크블루	https://chhouse.kr/web/product/big/202404/30ef086019aa9527661925d2c6ff2f57.jpg	https://chhouse.kr/product/detail.html?product_no=46697&cate_no=1414&display_group=1	65000	58500
옵션 6	특대합본/천연/무지퍼/다크레드	https://chhouse.kr/web/product/big/202504/64417043c2aa996ecddd4fd816453df8.jpg	https://chhouse.kr/product/detail.html?product_no=53172&cate_no=1414&display_group=1	65000	58500

NKR72EDBU
옵션 1	대합본/천연/지퍼/다크레드	https://chhouse.kr/web/product/big/202405/a7bb53e89cd7a65282a9a8cc2b28dc16.jpg	https://chhouse.kr/product/detail.html?product_no=44780&cate_no=1414&display_group=1	76000	68400
옵션 2	대합본/천연/지퍼/다크초코	https://chhouse.kr/web/product/big/202405/c86fe5aaba730310579f5ad973840aef.jpg	https://chhouse.kr/product/detail.html?product_no=44779&cate_no=1414&display_group=1	76000	68400
옵션 3	대합본/천연/지퍼/다크블루	https://chhouse.kr/web/product/big/202405/efe58eb5f9f2704bfb5de44730f8a17f.jpg	https://chhouse.kr/product/detail.html?product_no=44778&cate_no=1414&display_group=1	76000	68400

NKR72SDXU
옵션 1	중합본/천연/지퍼/다크레드	https://chhouse.kr/web/product/big/202405/09dab336417a0a1d0a18dfa168a94ab8.jpg	https://chhouse.kr/product/detail.html?product_no=42831&cate_no=1393&display_group=1	69000	62100
옵션 2	중합본/천연/지퍼/다크블루	https://chhouse.kr/web/product/big/202405/5df70e2d4da1b97033ed5d11f73db85c.jpg	https://chhouse.kr/product/detail.html?product_no=42832&cate_no=1393&display_group=1	69000	62100
옵션 3	중합본/천연/지퍼/다크초코	https://chhouse.kr/web/product/big/202405/c5c159602729bfea2c0f5cf9e853bd19.jpg	https://chhouse.kr/product/detail.html?product_no=42833&cate_no=1393&display_group=1	69000	62100
옵션 4	중합본/PU/무지퍼/황갈색	https://chhouse.kr/web/product/big/202510/36c070e443e0b676db0d32edc6b91093.jpg	https://chhouse.kr/product/detail.html?product_no=46384&cate_no=1393&display_group=1	50000	45000
옵션 5	중합본/PU/무지퍼/진갈색	https://chhouse.kr/web/product/big/202510/2342ce841353a7e3d8273f4eb37b50be.jpg	https://chhouse.kr/product/detail.html?product_no=46383&cate_no=1393&display_group=1	50000	45000
옵션 6	중합본/PU/무지퍼/연청색	https://chhouse.kr/web/product/big/202510/dddd1b2dd97536184beb32e79fa7eec0.jpg	https://chhouse.kr/product/detail.html?product_no=55548&cate_no=1393&display_group=1	50000	45000

NKR72TU
옵션 1	중합본/PU/지퍼/블루	https://chhouse.kr/web/product/big/202404/73b7d6b1dabaa98d9b351ef8f47651a2.jpg	https://chhouse.kr/product/detail.html?product_no=46693&cate_no=1393&display_group=1	45000	40500
옵션 2	중합본/PU/지퍼/브라운	https://chhouse.kr/web/product/big/202404/8f01def73e4083807139ea2941d122cc.jpg	https://chhouse.kr/product/detail.html?product_no=46694&cate_no=1393&display_group=1	45000	40500
옵션 3	중합본/PU/지퍼/와인	https://chhouse.kr/web/product/big/202404/65f8f70a7c08f812bcd31a760edf1762.jpg	https://chhouse.kr/product/detail.html?product_no=46692&cate_no=1393&display_group=1	45000	40500

NKR62EBU
옵션 1	소합본/천연/지퍼/다크레드	https://chhouse.kr/web/product/big/202506/2b635fd7d0ed706ced953c65336dcb15.jpg	https://chhouse.kr/product/detail.html?product_no=53956&cate_no=1394&display_group=1	62000	55800
옵션 2	소합본/천연/지퍼/스틸블루	https://chhouse.kr/web/product/big/202506/717c01aa98f1cb8fb8df9d4301a4c9f4.jpg	https://chhouse.kr/product/detail.html?product_no=53959&cate_no=1394&display_group=1	62000	55800
옵션 3	소합본/천연/지퍼/다크블루	https://chhouse.kr/web/product/big/202506/0fe42ff7f4b055e89ef956625fa2eddf.jpg	https://chhouse.kr/product/detail.html?product_no=53957&cate_no=1394&display_group=1	62000	55800
옵션 4	소합본/천연/지퍼/다크초코	https://chhouse.kr/web/product/big/202506/7c201b8d8d88f9f1f2abc1781ae41383.jpg	https://chhouse.kr/product/detail.html?product_no=53958&cate_no=1394&display_group=1	62000	55800
옵션 5	소합본/PU/지퍼/스카이블루	https://chhouse.kr/web/product/big/202504/8d1ef721f3ed1dfc16cee8dbde437c6b.jpg	https://chhouse.kr/product/detail.html?product_no=53319&cate_no=1394&display_group=1	52000	46800
옵션 6	소합본/PU/지퍼/민트그레이	https://chhouse.kr/web/product/big/202504/728ad6df58f20d8e750ec0c570f0e2e3.jpg	https://chhouse.kr/product/detail.html?product_no=53317&cate_no=1394&display_group=1	52000	46800
옵션 7	소합본/PU/지퍼/피치핑크	https://chhouse.kr/web/product/big/202504/8fd74850763fb68699f908b4bb132f30.jpg	https://chhouse.kr/product/detail.html?product_no=53320&cate_no=1394&display_group=1	52000	46800
옵션 8	소합본/PU/지퍼/베이지	https://chhouse.kr/web/product/big/202504/c3b9a4eb79d707e417f3675360bdb1c5.jpg	https://chhouse.kr/product/detail.html?product_no=53318&cate_no=1394&display_group=1	52000	46800

NKR62ETU
옵션 1	소합본/천연/지퍼/카카오브라운	https://chhouse.kr/web/product/big/202405/5154f9dfc277fc0064bd62ae33115f37.jpg	https://chhouse.kr/product/detail.html?product_no=43846&cate_no=1394&display_group=1	55000	49500
옵션 2	소합본/천연/지퍼/선셋레드	https://chhouse.kr/web/product/big/202405/e0a9ca319795628f98e4744bf4bb357a.jpg	https://chhouse.kr/product/detail.html?product_no=43845&cate_no=1394&display_group=1	55000	49500
옵션 3	소합본/천연/지퍼/미드나잇블루	https://chhouse.kr/web/product/big/202405/450c3650001539ee5cea71256899fd95.jpg	https://chhouse.kr/product/detail.html?product_no=43844&cate_no=1394&display_group=1	55000	49500

NKR62DXU
옵션 1	미니합본/PU/지퍼/블루	https://chhouse.kr/web/product/big/202405/c5d42a4b4ae52cf4291e55c30349af79.jpg	https://chhouse.kr/product/detail.html?product_no=44404&cate_no=1418&display_group=1	39000	35100
옵션 2	미니합본/PU/지퍼/퍼플	https://chhouse.kr/web/product/big/202405/b0e919ee43d15feb85bb385c28ebf16e.jpg	https://chhouse.kr/product/detail.html?product_no=44403&cate_no=1418&display_group=1	39000	35100
옵션 3	미니합본/PU/지퍼/레드	https://chhouse.kr/web/product/big/202405/0e1e56b559289773b518d1a554b232c1.jpg	https://chhouse.kr/product/detail.html?product_no=44405&cate_no=1418&display_group=1	39000	35100
옵션 4	미니합본/PU/지퍼/네이비	https://chhouse.kr/web/product/big/202405/3bb89e5d478b1eb095fb6a78c5a39be5.jpg	https://chhouse.kr/product/detail.html?product_no=44406&cate_no=1418&display_group=1	39000	35100

NKR42ETU
옵션 1	특초미니/PU/지퍼/베이지	https://chhouse.kr/web/product/big/202405/cb211a72d0e80436e4ba1a5a6c3ff672.jpg	https://chhouse.kr/product/detail.html?product_no=44629&cate_no=1392&display_group=1	34000	30600
옵션 2	특초미니/PU/지퍼/진청색	https://chhouse.kr/web/product/big/202405/e820589314c2f81864461f0a1fc40d4c.jpg	https://chhouse.kr/product/detail.html?product_no=44628&cate_no=1392&display_group=1	34000	30600
옵션 3	특초미니/PU/지퍼/펄청색	https://chhouse.kr/web/product/big/202405/f3415724fbd934459e18b7b31eed5202.jpg	https://chhouse.kr/product/detail.html?product_no=44627&cate_no=1392&display_group=1	34000	30600
옵션 4	특초미니/PU/지퍼/펄분홍	https://chhouse.kr/web/product/big/202405/b3c3f079c33ef1633b8f3d16788dedc3.jpg	https://chhouse.kr/product/detail.html?product_no=44626&cate_no=1392&display_group=1	34000	30600

`;

const lines = rawData.split('\n');
let currentPublisher = null;
let currentModel = null;
const parsedData = {};

const pubMap = {
  '생명의말씀사': 'W',
  '성서원': 'S',
  '대한기독교서회': 'C',
  '두란노': 'D'
};

const getMmForSize = (sizeStr) => {
  if (sizeStr.includes('특대')) return 4.6;
  if (sizeStr.includes('특중')) return 4.4;
  if (sizeStr.includes('대')) return 4.2;
  if (sizeStr.includes('중')) return 3.8;
  if (sizeStr.includes('소')) return 3.2;
  if (sizeStr.includes('특초미니')) return 2.4;
  if (sizeStr.includes('특미니')) return 2.6;
  if (sizeStr.includes('미니')) return 2.8;
  return 3.0; // default
};

for (const line of lines) {
  const t = line.trim();
  if (!t) continue;
  
  if (pubMap[t]) {
    currentPublisher = pubMap[t];
    if (!parsedData[currentPublisher]) parsedData[currentPublisher] = {};
    continue;
  }
  
  if (t.startsWith('NKR')) {
    currentModel = t;
    if (!parsedData[currentPublisher][currentModel]) {
      parsedData[currentPublisher][currentModel] = {
        model: currentModel,
        size: '',
        mm: 0,
        type: 'standard', // All NKR are standard
        variants: []
      };
    }
    continue;
  }
  
  if (t.startsWith('옵션')) {
    const parts = t.split('\t');
    if (parts.length >= 6) {
      const label = parts[1].trim();
      const img = parts[2].trim();
      const url = parts[3].trim();
      const originalPrice = parseInt(parts[4].replace(/,/g, ''), 10);
      const salePrice = parseInt(parts[5].replace(/,/g, ''), 10);
      
      const itemRef = parsedData[currentPublisher][currentModel];
      
      if (!itemRef.size) {
        // extract size from label (e.g. "특대합본" -> "특대")
        const match = label.match(/^(특초미니|특미니|미니|특대|특소|대|중|소)/);
        if (match) {
          itemRef.size = match[1];
          itemRef.mm = getMmForSize(itemRef.size);
        } else if (label.includes('지갑식/중합본')) {
          itemRef.size = '중';
          itemRef.mm = getMmForSize(itemRef.size);
        }
      }
      
      itemRef.variants.push({ label, img, url, originalPrice, salePrice });
    }
  }
}

const appContent = fs.readFileSync('src/App.jsx', 'utf8');
const match = appContent.match(/(const bibleData = )(\{[\s\S]*?\n\};)(\n\s*const customStudyOrder)/);
if (!match) {
  console.log('bibleData not found');
  process.exit(1);
}

const data = eval('(' + match[2].slice(0, -1) + ')');

// Merge parsedData into data
for (const pub in parsedData) {
  for (const model in parsedData[pub]) {
    const newItem = parsedData[pub][model];
    // check if it exists
    const existingIdx = data[pub].items.findIndex(i => i.model === model);
    if (existingIdx !== -1) {
      data[pub].items[existingIdx] = newItem;
    } else {
      data[pub].items.push(newItem);
    }
  }
}

const newObjStr = JSON.stringify(data, null, 2);
fs.writeFileSync('src/App.jsx', appContent.replace(match[2], newObjStr + ';'), 'utf8');
console.log('Successfully injected new missing standard models!');
