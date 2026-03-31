/**
 * nayin.mjs
 * ES6 wrapper for nayin.js (UMD module)
 */

const NAYIN_WUXING = {
  '海中金': '金', '炉中火': '火', '大林木': '木', '路旁土': '土', '剑锋金': '金',
  '山头火': '火', '涧下水': '水', '城头土': '土', '白蜡金': '金', '杨柳木': '木',
  '井泉水': '水', '屋上土': '土', '霹雳火': '火', '松柏木': '木', '长流水': '水',
  '砂石金': '金', '山下火': '火', '平地木': '木', '壁上土': '土', '金箔金': '金',
  '覆灯火': '火', '天河水': '水', '大驿土': '土', '钗钏金': '金', '桑柘木': '木',
  '大溪水': '水', '砂石土': '土', '天上火': '火', '石榴木': '木', '大海水': '水',
  '泉中水': '水'
};

const NAYIN_MAP = {
  '海中金': '甲子乙丑', '炉中火': '丙寅丁卯', '大林木': '戊辰己巳', '路旁土': '庚午辛未',
  '剑锋金': '壬申癸酉', '山头火': '甲戌乙亥', '涧下水': '丙子丁丑', '城头土': '戊寅己卯',
  '白蜡金': '庚辰辛巳', '杨柳木': '壬午癸未', '井泉水': '甲申乙酉', '屋上土': '丙戌丁亥',
  '霹雳火': '戊子己丑', '松柏木': '庚寅辛卯', '长流水': '壬辰癸巳', '砂石金': '甲午乙未',
  '山下火': '丙申丁酉', '平地木': '戊戌己亥', '壁上土': '庚子辛丑', '金箔金': '壬寅癸卯',
  '覆灯火': '甲辰乙巳', '天河水': '丙午丁未', '大驿土': '戊申己酉', '钗钏金': '庚戌辛亥',
  '桑柘木': '壬子癸丑', '大溪水': '甲寅乙卯', '砂石土': '丙辰丁巳', '天上火': '戊午己未',
  '石榴木': '庚申辛酉', '大海水': '壬戌癸亥', '泉中水': '壬戌癸亥'
};

const NAYIN_CHANGSHENG = { '木': '亥', '火': '寅', '金': '巳', '水': '申', '土': '申' };
const CHANGSHENG_12 = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养'];
const ZHI_INDEX = { '子': 0, '丑': 1, '寅': 2, '卯': 3, '辰': 4, '巳': 5, '午': 6, '未': 7, '申': 8, '酉': 9, '戌': 10, '亥': 11 };
const JI_XIONG = {
  '长生': '吉', '帝旺': '吉', '墓': '吉', '胎': '吉',
  '冠带': '平', '临官': '平', '养': '平', '衰': '平',
  '沐浴': '凶', '病': '凶', '死': '凶', '绝': '凶'
};
const GAN_NAYIN = {
  '甲': '大林木', '乙': '大林木', '丙': '山头火', '丁': '山头火',
  '戊': '城头土', '己': '城头土', '庚': '剑锋金', '辛': '剑锋金',
  '壬': '涧下水', '癸': '涧下水'
};

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