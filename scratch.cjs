const LZString = require('lz-string');

const items = [
  'A_NKR82AB_특대합본/천연/자두',
  'A_큰글성경_소단본/천연/무지퍼/베이지',
  'A_큰글성경_특대합본/PU/지퍼/브라운',
  'W_큰글자 스터디성경_천연/블랙',
  'S_좋은성경_대합본/PU/지퍼'
];

const encode1 = (ids) => {
  const jsonStr = JSON.stringify(ids);
  return btoa(encodeURIComponent(jsonStr));
};

const encode2 = (ids) => {
  const joinedStr = ids.join('|');
  const bytes = new TextEncoder().encode(joinedStr);
  const binaryStr = Array.from(bytes).map(b => String.fromCharCode(b)).join('');
  return btoa(binaryStr).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const encodeLZ = (ids) => {
  return LZString.compressToEncodedURIComponent(ids.join('|'));
};

const encodeLZJson = (ids) => {
  return LZString.compressToEncodedURIComponent(JSON.stringify(ids));
};

console.log('Original JSON + URI + Base64 length:', encode1(items).length);
console.log('Pipe + UTF8 + Base64 length:', encode2(items).length);
console.log('LZString Pipe length:', encodeLZ(items).length);
console.log('LZString JSON length:', encodeLZJson(items).length);
