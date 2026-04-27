/**
 * nayin.mjs
 * ES6 wrapper for nayin.js (UMD module)
 */

import {
  NAYIN_WUXING, NAYIN_MAP, NAYIN_CHANGSHENG,
  CHANGSHENG_12, ZHI_INDEX, JI_XIONG, GAN_NAYIN
} from './constants.js';

function NayinCalculator() {}

NayinCalculator.prototype.getNayin = function(ganzhi) {
  for (const [nayin, gzStr] of Object.entries(NAYIN_MAP)) {
    for (let i = 0; i < gzStr.length; i += 2) {
      if (gzStr.substring(i, i + 2) === ganzhi) return nayin;
    }
  }
  return '未知';
};

NayinCalculator.prototype.getChangshengInfo = function(ganzhi, zhi) {
  const nayin = this.getNayin(ganzhi);
  const wuxing = NAYIN_WUXING[nayin] || '';
  const changshengStart = NAYIN_CHANGSHENG[wuxing] || '';
  if (!changshengStart || !zhi) return { nayin, wuxing, position: '未知', ji_xiong: '未知' };
  const startIndex = ZHI_INDEX[changshengStart] || 0;
  const zhiIndex = ZHI_INDEX[zhi] || 0;
  const positionIndex = (zhiIndex - startIndex + 12) % 12;
  const position = CHANGSHENG_12[positionIndex];
  const ji_xiong = JI_XIONG[position] || '未知';
  return { nayin, wuxing, position, ji_xiong };
};

NayinCalculator.prototype.getChangshengByGan = function(gan, zhi) {
  const nayin = GAN_NAYIN[gan] || '';
  const wuxing = NAYIN_WUXING[nayin] || '';
  const changshengStart = NAYIN_CHANGSHENG[wuxing] || '';
  if (!changshengStart || !zhi) return { nayin, wuxing, position: '未知', ji_xiong: '未知' };
  const startIndex = ZHI_INDEX[changshengStart] || 0;
  const zhiIndex = ZHI_INDEX[zhi] || 0;
  const positionIndex = (zhiIndex - startIndex + 12) % 12;
  const position = CHANGSHENG_12[positionIndex];
  const ji_xiong = JI_XIONG[position] || '未知';
  return { nayin, wuxing, position, ji_xiong };
};

NayinCalculator.prototype.getChangshengByNayin = function(nayin, zhi) {
  const wuxing = NAYIN_WUXING[nayin] || '';
  const changshengStart = NAYIN_CHANGSHENG[wuxing] || '';
  if (!changshengStart || !zhi) return { nayin, wuxing, position: '未知', ji_xiong: '未知', zhi };
  const startIndex = ZHI_INDEX[changshengStart] || 0;
  const zhiIndex = ZHI_INDEX[zhi] || 0;
  const positionIndex = (zhiIndex - startIndex + 12) % 12;
  const position = CHANGSHENG_12[positionIndex];
  const ji_xiong = JI_XIONG[position] || '未知';
  return { nayin, wuxing, position, ji_xiong, zhi };
};

NayinCalculator.prototype.calculatePillarChangsheng = function(year, month, day, hour) {
  return {
    year: this.getChangshengInfo(year, year[1]),
    month: this.getChangshengInfo(month, month[1]),
    day: this.getChangshengInfo(day, day[1]),
    hour: this.getChangshengInfo(hour, hour[1])
  };
};

NayinCalculator.prototype.calculateYearNayinChangsheng = function(yearGz, yearNayin, monthGz, dayGz, hourGz) {
  return {
    month_zhi: this.getChangshengByNayin(yearNayin, monthGz[1]),
    day_zhi: this.getChangshengByNayin(yearNayin, dayGz[1]),
    hour_zhi: this.getChangshengByNayin(yearNayin, hourGz[1])
  };
};

NayinCalculator.prototype.summarizeJiXiong = function(dict, keys, names) {
  const jiList = [];
  const pingList = [];
  const xiongList = [];
  for (const [key, name] of keys.zip(names)) {
    if (key in dict) {
      const ji_x = dict[key].ji_xiong;
      const pos = dict[key].position;
      if (ji_x === '吉') jiList.push(`${name}${pos}`);
      else if (ji_x === '平') pingList.push(`${name}${pos}`);
      else if (ji_x === '凶') xiongList.push(`${name}${pos}`);
    }
  }
  return { '四贵_吉': jiList, '四平_平': pingList, '四凶_凶': xiongList };
};

NayinCalculator.NAYIN_WUXING = NAYIN_WUXING;
NayinCalculator.CHANGSHENG_12 = CHANGSHENG_12;
NayinCalculator.JI_XIONG = JI_XIONG;

export default NayinCalculator;
