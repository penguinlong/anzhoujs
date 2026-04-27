/**
 * lunar-wrapper.mjs
 * ES6 wrapper for lunar-javascript (CDN/local version)
 */

import {
  ZHI_LIST, GAN_LIST, HOUR_ZHI_MAP, HOUR_ZHI_NUM,
  NAYIN_WUXING, NAYIN_CHANGSHENG, CHANGSHENG_12, ZHI_INDEX, JI_XIONG,
  GAN_NAYIN, GAN_YINYANG, NAYIN_MAP
} from './constants.js';

function getSolar() {
  if (typeof window === 'undefined' || !window.Solar) {
    throw new Error('lunar-javascript library not loaded. Please ensure the script is included before this module.');
  }
  return window.Solar;
}

function getLunar() {
  if (typeof window === 'undefined' || !window.Lunar) {
    throw new Error('lunar-javascript library not loaded. Please ensure the script is included before this module.');
  }
  return window.Lunar;
}

function hourToZhi(hour) {
  for (const mapping of HOUR_ZHI_MAP) {
    if (mapping.start === 23 && hour >= 23) {
      return mapping.zhi;
    }
    if (mapping.start !== 23 && hour >= mapping.start && hour <= mapping.end) {
      return mapping.zhi;
    }
  }
  return '子';
}

function getHourZhiNumber(zhi) {
  return HOUR_ZHI_NUM[zhi] || 1;
}

function LunarCalendar() {
  this.lunarInstance = null;
  this.solarInstance = null;
}

LunarCalendar.prototype.solarToLunar = function(year, month, day, hour, minute) {
  hour = hour || 0;
  minute = minute || 0;
  const solar = getSolar().fromYmdHms(year, month, day, hour, minute, 0);
  this.solarInstance = solar;
  this.lunarInstance = solar.getLunar();
  return this.lunarInstance;
};

LunarCalendar.prototype.applyTrueSolarTime = function(longitude, hour, minute) {
  const standardLongitude = 120.0;
  const longitudeDiff = longitude - standardLongitude;
  const timeDiffMinutes = longitudeDiff * 4;
  let newHour = hour;
  let newMinute = minute + Math.floor(timeDiffMinutes);
  if (newMinute >= 60) {
    newHour += Math.floor(newMinute / 60);
    newMinute = newMinute % 60;
  } else if (newMinute < 0) {
    newHour -= 1;
    newMinute += 60;
  }
  if (newHour >= 24) {
    newHour -= 24;
  } else if (newHour < 0) {
    newHour += 24;
  }
  return { hour: newHour, minute: newMinute };
};

LunarCalendar.prototype.getBazi = function(year, month, day, hour, minute) {
  const lunar = this.solarToLunar(year, month, day, hour, minute);
  return {
    year: String(lunar.getYearInGanZhi()),
    month: String(lunar.getMonthInGanZhi()),
    day: String(lunar.getDayInGanZhi()),
    hour: String(lunar.getTimeInGanZhi())
  };
};

LunarCalendar.prototype.getYearNaYin = function() {
  if (!this.lunarInstance) return '';
  return String(this.lunarInstance.getYearNaYin());
};

LunarCalendar.prototype.getMonthNaYin = function() {
  if (!this.lunarInstance) return '';
  return String(this.lunarInstance.getMonthNaYin());
};

LunarCalendar.prototype.getDayNaYin = function() {
  if (!this.lunarInstance) return '';
  return String(this.lunarInstance.getDayNaYin());
};

LunarCalendar.prototype.getHourNaYin = function() {
  if (!this.lunarInstance) return '';
  return String(this.lunarInstance.getTimeNaYin());
};

LunarCalendar.prototype.getYearInGanZhi = function() {
  if (!this.lunarInstance) return '';
  return String(this.lunarInstance.getYearInGanZhi());
};

LunarCalendar.prototype.getMonthInGanZhi = function() {
  if (!this.lunarInstance) return '';
  return String(this.lunarInstance.getMonthInGanZhi());
};

LunarCalendar.prototype.getDayInGanZhi = function() {
  if (!this.lunarInstance) return '';
  return String(this.lunarInstance.getDayInGanZhi());
};

LunarCalendar.prototype.getTimeInGanZhi = function() {
  if (!this.lunarInstance) return '';
  return String(this.lunarInstance.getTimeInGanZhi());
};

LunarCalendar.prototype.getJieQiTable = function(year) {
  const table = {};
  const solar = getSolar().fromYmd(year, 1, 1);
  const lunar = solar.getLunar();
  const jqList = lunar.getJieQiList();
  if (!jqList) return table;
  for (let i = 0; i < jqList.length; i++) {
    const name = jqList[i];
    if (!name || typeof name !== 'string') continue;
    const jqLunar = lunar.getJieQi(name);
    if (!jqLunar) continue;
    const jqSolar = jqLunar.getSolar();
    table[name] = new Date(jqSolar.getYear(), jqSolar.getMonth() - 1, jqSolar.getDay());
  }
  return table;
};

LunarCalendar.prototype.getLunarInfo = function() {
  if (!this.lunarInstance) return null;
  const lunar = this.lunarInstance;
  const month = lunar.getMonth();
  return {
    year: lunar.getYear(),
    month: Math.abs(month),  // 月份取绝对值
    isLeap: month < 0,  // 负数表示闰月
    solarTerm: lunar.getJieQi() || '',
    yearGan: lunar.getYearGan(),
    yearZhi: lunar.getYearZhi(),
    monthGan: lunar.getMonthGan(),
    monthZhi: lunar.getMonthZhi(),
    dayGan: lunar.getDayGan(),
    dayZhi: lunar.getDayZhi(),
    shengXiao: lunar.getYearShengXiao(),
    yueXiang: lunar.getYueXiang()
  };
};

LunarCalendar.prototype._getNayin = function(ganzhi) {
  for (const nayin in NAYIN_MAP) {
    const gzStr = NAYIN_MAP[nayin];
    for (let i = 0; i < gzStr.length; i += 2) {
      if (gzStr.substring(i, i + 2) === ganzhi) {
        return nayin;
      }
    }
  }
  return '未知';
};

LunarCalendar.prototype._getYinYang = function(gan) {
  return GAN_YINYANG[gan] || '未知';
};

LunarCalendar.prototype._getChangShengInfo = function(ganzhi, zhi) {
  const nayin = this._getNayin(ganzhi);
  const wuxing = NAYIN_WUXING[nayin] || '';
  const changshengStart = NAYIN_CHANGSHENG[wuxing] || '';
  if (!changshengStart || !zhi) {
    return { nayin, wuxing, position: '未知', ji_xiong: '未知' };
  }
  const startIndex = ZHI_INDEX[changshengStart] || 0;
  const zhiIndex = ZHI_INDEX[zhi] || 0;
  const positionIndex = (zhiIndex - startIndex + 12) % 12;
  const position = CHANGSHENG_12[positionIndex];
  const ji_xiong = JI_XIONG[position] || '未知';
  return { nayin, wuxing, position, ji_xiong };
};

LunarCalendar.prototype._getTenGod = function(dayGan, otherGan) {
  const tenGodMap = {
    '甲甲': '比肩', '甲乙': '劫财', '甲丙': '食神', '甲丁': '伤官',
    '甲戊': '偏财', '甲己': '正财', '甲庚': '七杀', '甲辛': '正官',
    '甲壬': '偏印', '甲癸': '正印',
    '乙甲': '劫财', '乙乙': '比肩', '乙丙': '伤官', '乙丁': '食神',
    '乙戊': '正财', '乙己': '偏财', '乙庚': '正官', '乙辛': '七杀',
    '乙壬': '正印', '乙癸': '偏印',
    '丙甲': '正印', '丙乙': '偏印', '丙丙': '比肩', '丙丁': '劫财',
    '丙戊': '食神', '丙己': '伤官', '丙庚': '偏财', '丙辛': '正财',
    '丙壬': '七杀', '丙癸': '正官',
    '丁甲': '偏印', '丁乙': '正印', '丁丙': '劫财', '丁丁': '比肩',
    '丁戊': '伤官', '丁己': '食神', '丁庚': '正财', '丁辛': '偏财',
    '丁壬': '正官', '丁癸': '七杀',
    '戊甲': '七杀', '戊乙': '正官', '戊丙': '偏印', '戊丁': '正印',
    '戊戊': '比肩', '戊己': '劫财', '戊庚': '食神', '戊辛': '伤官',
    '戊壬': '偏财', '戊癸': '正财',
    '己甲': '正官', '己乙': '七杀', '己丙': '正印', '己丁': '偏印',
    '己戊': '劫财', '己己': '比肩', '己庚': '伤官', '己辛': '食神',
    '己壬': '正财', '己癸': '偏财',
    '庚甲': '偏财', '庚乙': '正财', '庚丙': '七杀', '庚丁': '正官',
    '庚戊': '偏印', '庚己': '正印', '庚庚': '比肩', '庚辛': '劫财',
    '庚壬': '食神', '庚癸': '伤官',
    '辛甲': '正财', '辛乙': '偏财', '辛丙': '正官', '辛丁': '七杀',
    '辛戊': '正印', '辛己': '偏印', '辛庚': '劫财', '辛辛': '比肩',
    '辛壬': '伤官', '辛癸': '食神',
    '壬甲': '食神', '壬乙': '伤官', '壬丙': '偏财', '壬丁': '正财',
    '壬戊': '七杀', '壬己': '正官', '壬庚': '偏印', '壬辛': '正印',
    '壬壬': '比肩', '壬癸': '劫财',
    '癸甲': '伤官', '癸乙': '食神', '癸丙': '正财', '癸丁': '偏财',
    '癸戊': '正官', '癸己': '七杀', '癸庚': '正印', '癸辛': '偏印',
    '癸壬': '劫财', '癸癸': '比肩'
  };
  return tenGodMap[dayGan + otherGan] || '未知';
};

LunarCalendar.ZHI_LIST = ZHI_LIST;
LunarCalendar.GAN_LIST = GAN_LIST;
LunarCalendar.NAYIN_WUXING = NAYIN_WUXING;
LunarCalendar.CHANGSHENG_12 = CHANGSHENG_12;

var _Solar = null;
var _Lunar = null;

Object.defineProperty(LunarCalendar, 'Solar', {
  get: function() {
    if (!_Solar && window.Solar) {
      _Solar = window.Solar;
    }
    return _Solar || null;
  }
});

Object.defineProperty(LunarCalendar, 'Lunar', {
  get: function() {
    if (!_Lunar && window.Lunar) {
      _Lunar = window.Lunar;
    }
    return _Lunar || null;
  }
});

export default LunarCalendar;
