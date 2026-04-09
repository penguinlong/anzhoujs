/**
 * bazi.js
 * 禄命法八字排盘算法模块
 * 基于真实万年历库 lunar-javascript
 * 支持公历、农历、干支三种输入方式
 * 处理真太阳时、节气换柱、子时跨日等规则
 * 命宫/身宫计算采用果老星宗算法
 */

import LunarCalendar from './lunar-wrapper.mjs';
import { getSunPosition, getMoonPosition, calculateMinggongGuolao, calculateShengongGuolao } from './xingyao.js';
import NayinCalculator from './nayin.mjs';

const GAN_LIST = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const ZHI_LIST = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

const ZHI_INDEX = {
  '子': 0, '丑': 1, '寅': 2, '卯': 3, '辰': 4, '巳': 5,
  '午': 6, '未': 7, '申': 8, '酉': 9, '戌': 10, '亥': 11
};

const HOUR_ZHI_NUM = {
  '子': 1, '丑': 2, '寅': 3, '卯': 4, '辰': 5, '巳': 6,
  '午': 7, '未': 8, '申': 9, '酉': 10, '戌': 11, '亥': 12
};

const HOUR_ZHI_CN = {
  '子': '子时', '丑': '丑时', '寅': '寅时', '卯': '卯时',
  '辰': '辰时', '巳': '巳时', '午': '午时', '未': '未时',
  '申': '申时', '酉': '酉时', '戌': '戌时', '亥': '亥时'
};

function handleMidnightCrossing(year, month, day, hour, minute) {
  if (hour >= 23) {
    const d = new Date(year, month - 1, day, hour, minute);
    d.setHours(d.getHours() + 1);
    return {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate(),
      hour: d.getHours(),
      minute: d.getMinutes()
    };
  }
  return { year, month, day, hour, minute };
}

function findGanIn60Jiazi(startGanIndex, targetZhiIndex) {
  for (let start = startGanIndex; start < 60; start += 10) {
    for (let d = 0; d < 60; d++) {
      const pos = (start + d) % 60;
      if (pos % 12 === targetZhiIndex) {
        return pos % 10;
      }
    }
  }
  return startGanIndex;
}

class BaziCalculator {
  constructor() {
    this.lunarCalc = new LunarCalendar();
    this.nayinCalc = new NayinCalculator();
  }

  calculateFromSolar(year, month, day, hour = 12, minute = 0, longitude = 120.0, useTrueSolar = true) {
    const { year: y, month: m, day: d, hour: h, minute: min } = handleMidnightCrossing(year, month, day, hour, minute);
    const solar = LunarCalendar.Solar.fromYmdHms(y, m, d, h, min, 0);
    return this._calculate(solar, longitude, useTrueSolar, year, month, day, hour, minute);
  }

  calculateFromLunar(year, month, day, hour = 12, minute = 0, isLeapMonth = false, longitude = 120.0, useTrueSolar = true) {
    const { year: y, month: m, day: d, hour: h, minute: min } = handleMidnightCrossing(year, month, day, hour, minute);
    let lunarMonth = isLeapMonth ? -m : m;
    const lunar = LunarCalendar.Lunar.fromYmdHms(y, lunarMonth, d, h, min, 0);
    const solar = lunar.getSolar();
    return this._calculate(solar, longitude, useTrueSolar, year, month, day, hour, minute, isLeapMonth);
  }

  calculateFromGanzhi(yearGanzhi, monthGanzhi, dayGanzhi, hourGanzhi) {
    // 获取生肖（根据年支）
    const yearZhi = yearGanzhi[1];
    const ZHI_ZODIAC = {
      '子': '鼠', '丑': '牛', '寅': '虎', '卯': '兔',
      '辰': '龙', '巳': '蛇', '午': '马', '未': '羊',
      '申': '猴', '酉': '鸡', '戌': '狗', '亥': '猪'
    };

    return {
      'year': yearGanzhi,
      'month': monthGanzhi,
      'day': dayGanzhi,
      'hour': hourGanzhi,
      'year_nayin': this.nayinCalc.getNayin(yearGanzhi),
      'month_nayin': this.nayinCalc.getNayin(monthGanzhi),
      'day_nayin': this.nayinCalc.getNayin(dayGanzhi),
      'hour_nayin': this.nayinCalc.getNayin(hourGanzhi),
      'year_yinyang': this.lunarCalc._getYinYang(yearGanzhi[0]),
      'month_yinyang': this.lunarCalc._getYinYang(monthGanzhi[0]),
      'day_yinyang': this.lunarCalc._getYinYang(dayGanzhi[0]),
      'hour_yinyang': this.lunarCalc._getYinYang(hourGanzhi[0]),
      'solar_term': '未知',
      'leap_month': false,
      'true_solar_time': '未知',
      'lunar_date': '未知',
      'solar_date': '未知',
      'zodiac': ZHI_ZODIAC[yearZhi] || '未知',
      'ten_gods': {
        'year_gan': '年主',
        'month_gan': this.lunarCalc._getTenGod(dayGanzhi[0], monthGanzhi[0]),
        'day_gan': '日主',
        'hour_gan': this.lunarCalc._getTenGod(dayGanzhi[0], hourGanzhi[0]),
        'year_zhi': '年支',
        'month_zhi': this.lunarCalc._getTenGod(dayGanzhi[0], monthGanzhi[1]),
        'day_zhi': '日支',
        'hour_zhi': this.lunarCalc._getTenGod(dayGanzhi[0], hourGanzhi[1])
      },
      'nayin_changsheng': {
        'year': this.nayinCalc.getChangshengInfo(dayGanzhi, yearGanzhi[1]),
        'month': this.nayinCalc.getChangshengInfo(dayGanzhi, monthGanzhi[1]),
        'day': this.nayinCalc.getChangshengInfo(dayGanzhi, dayGanzhi[1]),
        'hour': this.nayinCalc.getChangshengInfo(dayGanzhi, hourGanzhi[1])
      },
      'nian_gan_changsheng': {
        'month_zhi': this.nayinCalc.getChangshengByNayin(yearGanzhi[0], monthGanzhi[1]),
        'day_zhi': this.nayinCalc.getChangshengByNayin(yearGanzhi[0], dayGanzhi[1]),
        'hour_zhi': this.nayinCalc.getChangshengByNayin(yearGanzhi[0], hourGanzhi[1])
      }
    };
  }

  _calculate(solar, longitude, useTrueSolar, originalYear, originalMonth, originalDay, originalHour, originalMinute, isLeapMonth = false) {
    let calcSolar = solar;
    const originalHourUsed = originalHour !== undefined ? originalHour : solar.getHour();
    const originalMinuteUsed = originalMinute !== undefined ? originalMinute : solar.getMinute();

    if (useTrueSolar) {
      const adjusted = this.lunarCalc.applyTrueSolarTime(longitude, calcSolar.getHour(), calcSolar.getMinute());
      calcSolar = LunarCalendar.Solar.fromYmdHms(
        calcSolar.getYear(),
        calcSolar.getMonth(),
        calcSolar.getDay(),
        adjusted.hour,
        adjusted.minute,
        0
      );
    }

    const lunar = calcSolar.getLunar();
    const yearGanzhi = String(lunar.getYearInGanZhi());
    const monthGanzhi = String(lunar.getMonthInGanZhi());
    const dayGanzhi = String(lunar.getDayInGanZhi());
    const hourGanzhi = String(lunar.getTimeInGanZhi());
    const yearNayin = String(lunar.getYearNaYin());

    const hourZhi = hourGanzhi[1];
    const hourZhiCn = HOUR_ZHI_CN[hourZhi] || '时';
    const trueSolarTime = `${String(calcSolar.getHour()).padStart(2, '0')}:${String(calcSolar.getMinute()).padStart(2, '0')}`;

    return {
      'year': yearGanzhi,
      'month': monthGanzhi,
      'day': dayGanzhi,
      'hour': hourGanzhi,
      'year_nayin': String(lunar.getYearNaYin()),
      'month_nayin': String(lunar.getMonthNaYin()),
      'day_nayin': String(lunar.getDayNaYin()),
      'hour_nayin': String(lunar.getTimeNaYin()),
      'year_yinyang': this.lunarCalc._getYinYang(yearGanzhi[0]),
      'month_yinyang': this.lunarCalc._getYinYang(monthGanzhi[0]),
      'day_yinyang': this.lunarCalc._getYinYang(dayGanzhi[0]),
      'hour_yinyang': this.lunarCalc._getYinYang(hourGanzhi[0]),
      'solar_term': lunar.getJieQi() || '无',
      'leap_month': lunar.getMonth() < 0,  // 负数表示闰月
      'true_solar_time': trueSolarTime,
      'lunar_date': String(lunar) + hourZhiCn,
      'solar_date': String(calcSolar),
      'zodiac': lunar.getYearShengXiao(),
      'ten_gods': {
        'year_gan': '年主',
        'month_gan': this.lunarCalc._getTenGod(yearGanzhi[0], monthGanzhi[0]),
        'day_gan': this.lunarCalc._getTenGod(yearGanzhi[0], dayGanzhi[0]),
        'hour_gan': this.lunarCalc._getTenGod(yearGanzhi[0], hourGanzhi[0]),
        'year_zhi': '年主',
        'month_zhi': this.lunarCalc._getTenGod(yearGanzhi[0], monthGanzhi[1]),
        'day_zhi': this.lunarCalc._getTenGod(yearGanzhi[0], dayGanzhi[1]),
        'hour_zhi': this.lunarCalc._getTenGod(yearGanzhi[0], hourGanzhi[1])
      },
      'nayin_changsheng': {
        'year': this.nayinCalc.getChangshengInfo(yearGanzhi, yearGanzhi[1]),
        'month': this.nayinCalc.getChangshengInfo(monthGanzhi, monthGanzhi[1]),
        'day': this.nayinCalc.getChangshengInfo(dayGanzhi, dayGanzhi[1]),
        'hour': this.nayinCalc.getChangshengInfo(hourGanzhi, hourGanzhi[1])
      },
      'nian_gan_changsheng': {
        'month_zhi': this.nayinCalc.getChangshengByNayin(yearNayin, monthGanzhi[1]),
        'day_zhi': this.nayinCalc.getChangshengByNayin(yearNayin, dayGanzhi[1]),
        'hour_zhi': this.nayinCalc.getChangshengByNayin(yearNayin, hourGanzhi[1])
      },
      'taiyuan': this._calculateTaiyuan(monthGanzhi[0], monthGanzhi[1], yearNayin),
      'minggong': this._calculateMinggong(yearGanzhi[0], monthGanzhi[1], hourGanzhi[1], yearNayin, calcSolar),
      'shengong': this._calculateShengong(yearGanzhi[0], dayGanzhi[0], monthGanzhi[1], hourGanzhi[1], yearNayin, calcSolar),
      'original_solar': {
        'year': originalYear || solar.getYear(),
        'month': originalMonth || solar.getMonth(),
        'day': originalDay || solar.getDay(),
        'hour': originalHourUsed,
        'minute': originalMinuteUsed
      }
    };
  }

  _calculateTaiyuan(monthGan, monthZhi, yearNayin) {
    const ganIndex = GAN_LIST.indexOf(monthGan);
    const newGan = GAN_LIST[(ganIndex + 1) % 10];

    const zhiIndex = ZHI_INDEX[monthZhi];
    const newZhi = ZHI_LIST[(zhiIndex + 3) % 12];

    const ganzhi = newGan + newZhi;
    const nayin = this.nayinCalc.getNayin(ganzhi);
    const wuxing = NayinCalculator.NAYIN_WUXING[nayin] || '';
    const changsheng = this.nayinCalc.getChangshengByNayin(nayin, newZhi);
    const nianNayinChangsheng = this.nayinCalc.getChangshengByNayin(yearNayin, newZhi);

    return {
      'gan': newGan,
      'zhi': newZhi,
      'ganzhi': ganzhi,
      'nayin': nayin,
      'wuxing': wuxing,
      'changsheng': changsheng,
      'nian_nayin_changsheng': nianNayinChangsheng
    };
  }

  _calculateMinggong(yearGan, monthZhi, hourZhi, yearNayin, solar) {
    let minggongZhi;

    if (solar) {
      const { zhi: sunZhi, degree: sunDegree } = getSunPosition(
        solar.getYear(), solar.getMonth(), solar.getDay(),
        solar.getHour(), solar.getMinute()
      );
      minggongZhi = calculateMinggongGuolao(hourZhi, sunZhi, sunDegree);
    } else {
      const monthNum = ZHI_INDEX[monthZhi] + 1;
      const hourNum = HOUR_ZHI_NUM[hourZhi];
      const minggongZhiIndex = (10 - monthNum - hourNum + 24) % 12;
      minggongZhi = ZHI_LIST[minggongZhiIndex];
    }

    const minggongZhiIndex = ZHI_INDEX[minggongZhi];
    const yearGanIndex = GAN_LIST.indexOf(yearGan);
    const minggongGanIndex = findGanIn60Jiazi(yearGanIndex, minggongZhiIndex);
    const minggongGan = GAN_LIST[minggongGanIndex];

    const ganzhi = minggongGan + minggongZhi;
    const nayin = this.nayinCalc.getNayin(ganzhi);
    const wuxing = NayinCalculator.NAYIN_WUXING[nayin] || '';
    const changsheng = this.nayinCalc.getChangshengByNayin(nayin, minggongZhi);
    const nianNayinChangsheng = this.nayinCalc.getChangshengByNayin(yearNayin, minggongZhi);

    return {
      'gan': minggongGan,
      'zhi': minggongZhi,
      'ganzhi': ganzhi,
      'nayin': nayin,
      'wuxing': wuxing,
      'changsheng': changsheng,
      'nian_nayin_changsheng': nianNayinChangsheng
    };
  }

  _calculateShengong(yearGan, dayGan, monthZhi, hourZhi, yearNayin, solar) {
    let shengongZhi;

    if (solar) {
      const { zhi: moonZhi, degree: moonDegree } = getMoonPosition(
        solar.getYear(), solar.getMonth(), solar.getDay(),
        solar.getHour(), solar.getMinute()
      );
      shengongZhi = calculateShengongGuolao(hourZhi, moonZhi, moonDegree);
    } else {
      const monthNum = ZHI_INDEX[monthZhi] + 1;
      const hourNum = HOUR_ZHI_NUM[hourZhi];
      const shengongZhiIndex = (monthNum + hourNum) % 12;
      shengongZhi = ZHI_LIST[shengongZhiIndex];
    }

    const shengongZhiIndex = ZHI_INDEX[shengongZhi];
    const dayGanIndex = GAN_LIST.indexOf(dayGan);
    const shengongGanIndex = findGanIn60Jiazi(dayGanIndex, shengongZhiIndex);
    const shengongGan = GAN_LIST[shengongGanIndex];

    const ganzhi = shengongGan + shengongZhi;
    const nayin = this.nayinCalc.getNayin(ganzhi);
    const wuxing = NayinCalculator.NAYIN_WUXING[nayin] || '';
    const changsheng = this.nayinCalc.getChangshengByNayin(nayin, shengongZhi);
    const nianNayinChangsheng = this.nayinCalc.getChangshengByNayin(yearNayin, shengongZhi);

    return {
      'gan': shengongGan,
      'zhi': shengongZhi,
      'ganzhi': ganzhi,
      'nayin': nayin,
      'wuxing': wuxing,
      'changsheng': changsheng,
      'nian_nayin_changsheng': nianNayinChangsheng
    };
  }
}

function calculateBazi(year, month, day, hour = 12, minute = 0, options = {}) {
  const {
    isLunar = false,
    isGanzhi = false,
    ganzhiInput = '',
    isLeapMonth = false,
    longitude = 120.0,
    useTrueSolar = true
  } = options;

  const calc = new BaziCalculator();

  if (isGanzhi) {
    // 支持两种格式：对象格式 { year, month, day, hour } 或字符串格式 "年柱/月柱/日柱/时柱"
    let yearGanzhi, monthGanzhi, dayGanzhi, hourGanzhi;

    if (typeof ganzhiInput === 'object' && ganzhiInput !== null) {
      yearGanzhi = ganzhiInput.year;
      monthGanzhi = ganzhiInput.month;
      dayGanzhi = ganzhiInput.day;
      hourGanzhi = ganzhiInput.hour;
    } else {
      const parts = String(ganzhiInput).replace(/\s/g, '').split('/');
      if (parts.length !== 4) {
        throw new Error('干支输入格式错误，应为：年柱/月柱/日柱/时柱');
      }
      yearGanzhi = parts[0];
      monthGanzhi = parts[1];
      dayGanzhi = parts[2];
      hourGanzhi = parts[3];
    }

    if (!yearGanzhi || !monthGanzhi || !dayGanzhi || !hourGanzhi) {
      throw new Error('干支输入不完整');
    }

    return calc.calculateFromGanzhi(yearGanzhi, monthGanzhi, dayGanzhi, hourGanzhi);
  }

  if (isLunar) {
    return calc.calculateFromLunar(year, month, day, hour, minute, isLeapMonth, longitude, useTrueSolar);
  } else {
    return calc.calculateFromSolar(year, month, day, hour, minute, longitude, useTrueSolar);
  }
}

function printBazi(result) {
  const lines = [];
  lines.push(`农历: ${result['lunar_date']}`);
  lines.push(`四柱: ${result['year']} ${result['month']} ${result['day']} ${result['hour']}`);
  lines.push(`生肖: ${result['zodiac']}`);
  lines.push(`节气: ${result['solar_term']}`);
  lines.push(`纳音: ${result['year_nayin']} ${result['month_nayin']} ${result['day_nayin']} ${result['hour_nayin']}`);
  lines.push(`阴阳: ${result['year_yinyang']} ${result['month_yinyang']} ${result['day_yinyang']} ${result['hour_yinyang']}`);

  if (result['nayin_changsheng']) {
    const cs = result['nayin_changsheng'];
    lines.push('【四柱天干自坐纳音十二长生】');
    lines.push(`  年柱 ${result['year']}: ${cs['year']['nayin']}(${cs['year']['wuxing']}) - ${cs['year']['position']} [${cs['year']['ji_xiong']}]`);
    lines.push(`  月柱 ${result['month']}: ${cs['month']['nayin']}(${cs['month']['wuxing']}) - ${cs['month']['position']} [${cs['month']['ji_xiong']}]`);
    lines.push(`  日柱 ${result['day']}: ${cs['day']['nayin']}(${cs['day']['wuxing']}) - ${cs['day']['position']} [${cs['day']['ji_xiong']}]`);
    lines.push(`  时柱 ${result['hour']}: ${cs['hour']['nayin']}(${cs['hour']['wuxing']}) - ${cs['hour']['position']} [${cs['hour']['ji_xiong']}]`);

    const jiList = [];
    const pingList = [];
    const xiongList = [];
    for (const key of ['year', 'month', 'day', 'hour']) {
      const jiX = cs[key]['ji_xiong'];
      const pos = cs[key]['position'];
      if (jiX === '吉') jiList.push(`${result[key][0]}${pos}`);
      else if (jiX === '平') pingList.push(`${result[key][0]}${pos}`);
      else if (jiX === '凶') xiongList.push(`${result[key][0]}${pos}`);
    }

    if (jiList.length || pingList.length || xiongList.length) {
      lines.push('【吉凶总论】');
      if (jiList.length) lines.push(`  四贵(吉): ${jiList.join(', ')}`);
      if (pingList.length) lines.push(`  四平(平): ${pingList.join(', ')}`);
      if (xiongList.length) lines.push(`  四凶(凶): ${xiongList.join(', ')}`);
    }
  }

  if (result['nian_gan_changsheng']) {
    const ngcs = result['nian_gan_changsheng'];
    const yearGanNayin = result['year_nayin'];
    lines.push('【年干坐月日时三支纳音十二长生】');
    lines.push(`  年干${result['year'][0]}纳音${yearGanNayin}`);
    lines.push(`  月支${result['month'][1]}: ${ngcs['month_zhi']['nayin']}(${ngcs['month_zhi']['wuxing']}) - ${ngcs['month_zhi']['position']} [${ngcs['month_zhi']['ji_xiong']}]`);
    lines.push(`  日支${result['day'][1]}: ${ngcs['day_zhi']['nayin']}(${ngcs['day_zhi']['wuxing']}) - ${ngcs['day_zhi']['position']} [${ngcs['day_zhi']['ji_xiong']}]`);
    lines.push(`  时支${result['hour'][1]}: ${ngcs['hour_zhi']['nayin']}(${ngcs['hour_zhi']['wuxing']}) - ${ngcs['hour_zhi']['position']} [${ngcs['hour_zhi']['ji_xiong']}]`);
  }

  if (result['taiyuan']) {
    const ty = result['taiyuan'];
    lines.push('【胎元】（先天受孕之宫）');
    lines.push(`  ${ty['ganzhi']} - ${ty['nayin']}(${ty['wuxing']}) - ${ty['changsheng']['position']} [${ty['changsheng']['ji_xiong']}]`);
    lines.push(`  年纳音坐: ${ty['nian_nayin_changsheng']['position']} [${ty['nian_nayin_changsheng']['ji_xiong']}]`);
  }

  if (result['minggong']) {
    const mg = result['minggong'];
    lines.push('【命宫】（命之归宿 - 果老星宗）');
    lines.push(`  ${mg['ganzhi']} - ${mg['nayin']}(${mg['wuxing']}) - ${mg['changsheng']['position']} [${mg['changsheng']['ji_xiong']}]`);
    lines.push(`  年纳音坐: ${mg['nian_nayin_changsheng']['position']} [${mg['nian_nayin_changsheng']['ji_xiong']}]`);
  }

  if (result['shengong']) {
    const sg = result['shengong'];
    lines.push('【身宫】（后天身心 - 果老星宗）');
    lines.push(`  ${sg['ganzhi']} - ${sg['nayin']}(${sg['wuxing']}) - ${sg['changsheng']['position']} [${sg['changsheng']['ji_xiong']}]`);
    lines.push(`  年纳音坐: ${sg['nian_nayin_changsheng']['position']} [${sg['nian_nayin_changsheng']['ji_xiong']}]`);
  }

  return lines.join('\n');
}

export { BaziCalculator, calculateBazi, printBazi };
export default BaziCalculator;
