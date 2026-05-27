import { bibleData } from './src/data/bibleData.js';

const anomalies = [];

for (const [publisherKey, publisherData] of Object.entries(bibleData)) {
  for (const item of publisherData.items) {
    const mm = item.mm;
    const size = item.size;
    let isAnomaly = false;
    let reason = '';

    if (!mm) continue;

    if (size.includes('특미니') && mm > 3.5) {
      isAnomaly = true; reason = '특미니인데 3.5 초과';
    } else if (size === '소' && mm > 4.5) {
      isAnomaly = true; reason = '소 사이즈인데 4.5 초과 (너무 큼)';
    } else if (size === '소' && mm < 2.0) {
      isAnomaly = true; reason = '소 사이즈인데 2.0 미만 (너무 작음)';
    } else if (size === '중' && mm > 5.0) {
      isAnomaly = true; reason = '중 사이즈인데 5.0 초과 (너무 큼)';
    } else if (size === '대' && mm < 3.8) {
      isAnomaly = true; reason = '대 사이즈인데 3.8 미만 (너무 작음)';
    } else if (size.includes('특대') && mm < 4.5) {
      isAnomaly = true; reason = '특대 사이즈인데 4.5 미만 (너무 작음)';
    } else if (size.includes('강대') && mm < 5.0) {
      isAnomaly = true; reason = '강대용인데 5.0 미만 (너무 작음)';
    }

    if (isAnomaly) {
      anomalies.push({
        publisher: publisherData.name,
        model: item.model,
        size: size,
        mm: mm,
        reason: reason
      });
    }
  }
}

console.log(JSON.stringify(anomalies, null, 2));
