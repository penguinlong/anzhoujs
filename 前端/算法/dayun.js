/**
 * dayun.js
 * 禄命法大运小运算法模块
 * 基于禄命法古法排大运、小运、童限
 */

import LunarCalendar from './lunar-wrapper.mjs';
import NayinCalculator from './nayin.mjs';
import { GAN_LIST, ZHI_LIST } from './constants.js';

const JIEQI_NAMES = [
  '立春', '惊蛰', '清明', '立夏', '芒种', '小暑',
  '立秋', '白露', '寒露', '立冬', '大雪', '小寒'
];

class DayunXiaoyunCalculator {
  constructor() {
    this.lunarCalc = new LunarCalendar();
    this.nayinCalc = new NayinCalculator();
  }

  isYangGan(gan) {
    return ['甲', '丙', '戊', '庚', '壬'].includes(gan);
  }

  getDayunDirection(yearGan, gender) {
    const isYang = this.isYangGan(yearGan);
    const isNan = gender === 'male';
    return (isYang && isNan) || (!isYang && !isNan) ? '顺行' : '逆行';
  }

  getJieqiTable(year) {
    return this.lunarCalc.getJieQiTable(year);
  }

  _getJieqiList(year) {
    const jieqiDates = [];
    const table = this.getJieqiTable(year);
    for (const name of JIEQI_NAMES) {
      if (table[name]) {
        jieqiDates.push({ name, date: table[name] });
      }
    }
    jieqiDates.sort((a, b) => a.date - b.date);
    return jieqiDates;
  }

  /**
   * 《五行精纪》起运岁数计算
   * 原文：运行则一辰十岁，折除乃三日为年
   * 古法换算：
   * - 3天 = 36时辰 = 1岁
   * - 1天 = 12时辰 = 4个月
   * - 1时辰 = 10天
   */
  calculateStartAge(birthSolar, direction) {
    const birthDate = new Date(
      birthSolar.year,
      birthSolar.month - 1,
      birthSolar.day,
      birthSolar.hour || 12,
      birthSolar.minute || 0
    );

    const year = birthSolar.year;
    let jieqiList = this._getJieqiList(year);

    if (jieqiList.length < 12) {
      jieqiList = this._getJieqiList(year + 1);
    }

    let targetJieqi = null;
    if (direction === '顺行') {
      for (const jq of jieqiList) {
        if (jq.date > birthDate) {
          targetJieqi = jq;
          break;
        }
      }
    } else {
      for (let i = jieqiList.length - 1; i >= 0; i--) {
        if (jieqiList[i].date < birthDate) {
          targetJieqi = jieqiList[i];
          break;
        }
      }
    }

    if (!targetJieqi) {
      return { years: 1, months: 0, days: 0, total_hours: 30, target_jieqi: null, jiaoyun_date: null };
    }

    let diff;
    if (direction === '顺行') {
      diff = targetJieqi.date - birthDate;
    } else {
      diff = birthDate - targetJieqi.date;
    }

    // 《五行精纪》古法：全部转换为时辰计算
    // 1天 = 12时辰，1时辰 = 2小时
    const totalHours = diff / (1000 * 60 * 60); // 总小时数
    const totalShichen = totalHours / 2; // 折算为时辰（1时辰=2小时）
    
    // 岁 = 总时辰 / 36（3天×12时辰=36时辰）
    let years = Math.floor(totalShichen / 36);
    const remainingShichen = totalShichen % 36; // 剩余不足1岁的时辰
    
    // 月 = 剩余时辰 / 12 * 4个月（1天=12时辰=4个月）
    let months = Math.floor(remainingShichen / 12 * 4);
    const remainingShichen2 = remainingShichen % 12; // 剩余不足1天的时辰
    
    // 日 = 剩余时辰 * 10天 / 12（1时辰=10天）
    let days = Math.floor(remainingShichen2 * 10 / 12);

    // 月超过12个月要进位到年
    if (months >= 12) {
      years += Math.floor(months / 12);
      months = months % 12;
    }

    return {
      years: Math.max(years, 1),
      months: months,
      days: days,
      total_days: Math.floor(totalHours / 24),
      total_hours: Math.floor(totalHours),
      target_jieqi: targetJieqi.name,
      jiaoyun_date: targetJieqi.date.toISOString().split('T')[0]
    };
  }

  calculateDayun(monthGanzhi, direction, startAge, birthSolar, startAgeInfo, yearGan) {
    if (!monthGanzhi || monthGanzhi.length !== 2) {
      return [];
    }

    const monthGan = monthGanzhi[0];
    const monthZhi = monthGanzhi[1];
    const ganIndex = GAN_LIST.indexOf(monthGan);
    const zhiIndex = ZHI_LIST.indexOf(monthZhi);

    // 计算第一个交运日期
    const birthDate = new Date(
      birthSolar.year,
      birthSolar.month - 1,
      birthSolar.day,
      birthSolar.hour || 12,
      birthSolar.minute || 0
    );
    
    let firstJiaoyunDate;
    if (startAgeInfo.jiaoyun_date) {
      firstJiaoyunDate = new Date(startAgeInfo.jiaoyun_date.replace(/-/g, '/'));
    } else {
      // 如果没有精确交运日期，按总天数估算
      firstJiaoyunDate = new Date(birthDate.getTime() + (startAgeInfo.total_days || 3) * 24 * 60 * 60 * 1000);
    }

    const dayunCount = 12;
    const dayunList = [];
    let currentAge = startAge;
    let currentJiaoyunDate = new Date(firstJiaoyunDate);

    for (let i = 0; i < dayunCount; i++) {
      let nextGanIndex, nextZhiIndex;
      if (direction === '顺行') {
        nextGanIndex = (ganIndex + i + 1) % 10;
        nextZhiIndex = (zhiIndex + i + 1) % 12;
      } else {
        nextGanIndex = (ganIndex - i - 1 + 10) % 10;
        nextZhiIndex = (zhiIndex - i - 1 + 12) % 12;
      }

      const ganzhi = GAN_LIST[nextGanIndex] + ZHI_LIST[nextZhiIndex];
      const dayunGan = GAN_LIST[nextGanIndex];
      const nayin = this.nayinCalc.getNayin(ganzhi);
      const wuxing = NayinCalculator.NAYIN_WUXING[nayin] || '';
      const changsheng = this.nayinCalc.getChangshengInfo(ganzhi, ZHI_LIST[nextZhiIndex]);
      const tenGod = this.lunarCalc._getTenGod(yearGan, dayunGan);

      dayunList.push({
        index: i + 1,
        ganzhi: ganzhi,
        nayin: nayin,
        wuxing: wuxing,
        position: changsheng.position,
        ji_xiong: changsheng.ji_xiong,
        ten_god: tenGod,
        start_age: currentAge,
        end_age: currentAge + 9,
        start_year: currentJiaoyunDate.getFullYear(),
        start_date: currentJiaoyunDate.toISOString().split('T')[0]
      });

      currentAge += 10;
      currentJiaoyunDate = new Date(currentJiaoyunDate.getTime() + 10 * 365 * 24 * 60 * 60 * 1000);
    }

    return dayunList;
  }

  calculateTongxian(yearGanzhi, startAge) {
    if (!yearGanzhi || yearGanzhi.length !== 2) {
      return [];
    }

    const yearGan = yearGanzhi[0];
    const yearZhi = yearGanzhi[1];

    const ganIndex = GAN_LIST.indexOf(yearGan);
    const zhiIndex = ZHI_LIST.indexOf(yearZhi);

    const tongxianList = [];
    for (let age = 1; age <= startAge; age++) {
      const gIdx = (ganIndex + age - 1) % 10;
      const zIdx = (zhiIndex + age - 1) % 12;

      const ganzhi = GAN_LIST[gIdx] + ZHI_LIST[zIdx];
      const nayin = this.nayinCalc.getNayin(ganzhi);
      const wuxing = NayinCalculator.NAYIN_WUXING[nayin] || '';

      tongxianList.push({
        age: age,
        ganzhi: ganzhi,
        nayin: nayin,
        wuxing: wuxing
      });
    }

    return tongxianList;
  }

  calculateXiaoyun(isNan, yearGan = '') {
    const xiaoyunList = [];

    const ganStart = isNan ? '丙' : '壬';
    const zhiStart = isNan ? '寅' : '申';

    const ganIndex = GAN_LIST.indexOf(ganStart);
    const zhiIndex = ZHI_LIST.indexOf(zhiStart);

    for (let age = 1; age < 121; age++) {
      let gIdx, zIdx;
      if (isNan) {
        gIdx = (ganIndex + age - 1) % 10;
        zIdx = (zhiIndex + age - 1) % 12;
      } else {
        gIdx = (ganIndex - age + 1 + 10) % 10;
        zIdx = (zhiIndex - age + 1 + 12) % 12;
      }

      const ganzhi = GAN_LIST[gIdx] + ZHI_LIST[zIdx];
      const xiaoyunGan = GAN_LIST[gIdx];
      const nayin = this.nayinCalc.getNayin(ganzhi);
      const wuxing = NayinCalculator.NAYIN_WUXING[nayin] || '';
      const tenGod = yearGan ? this.lunarCalc._getTenGod(yearGan, xiaoyunGan) : '';

      xiaoyunList.push({
        age: age,
        ganzhi: ganzhi,
        nayin: nayin,
        wuxing: wuxing,
        ten_god: tenGod
      });
    }

    return xiaoyunList;
  }

  calculate(baziResult, gender, birthDate) {
    const yearGanzhi = baziResult.year || '';
    const monthGanzhi = baziResult.month || '';
    const yearGan = yearGanzhi[0] || '';

    const isYangGan = this.isYangGan(yearGan);
    const isNan = gender === 'male';

    const direction = this.getDayunDirection(yearGan, gender);
    const startAgeInfo = this.calculateStartAge(birthDate, direction);
    const startAgeYears = startAgeInfo.years;

    const tongxianList = this.calculateTongxian(yearGanzhi, startAgeYears);
    const dayunList = this.calculateDayun(
      monthGanzhi,
      direction,
      startAgeYears,
      birthDate,
      startAgeInfo,
      yearGan
    );

    const xiaoyunList = this.calculateXiaoyun(isNan, yearGan);

    return {
      direction: direction,
      start_age: startAgeInfo,
      tongxian: tongxianList,
      dayun: dayunList,
      xiaoyun: xiaoyunList
    };
  }
}

function calculateDayunXiaoyun(baziResult, gender, birthYearOrSolar, birthMonth, birthDay, birthHour = 12, birthMinute = 0) {
  const calc = new DayunXiaoyunCalculator();
  let birthSolar;
  
  if (typeof birthYearOrSolar === 'object' && birthYearOrSolar !== null && 'year' in birthYearOrSolar) {
    birthSolar = birthYearOrSolar;
  } else {
    birthSolar = {
      year: birthYearOrSolar,
      month: birthMonth,
      day: birthDay,
      hour: birthHour,
      minute: birthMinute
    };
  }
  return calc.calculate(baziResult, gender, birthSolar);
}

function printDayun(result) {
  const lines = [];
  lines.push(`大运方向: ${result.direction}`);
  lines.push(`起运岁数: ${result.start_age.years}岁 ${result.start_age.months}月 ${result.start_age.days}日 (距节气${result.start_age.total_days}天)`);

  if (result.tongxian && result.tongxian.length > 0) {
    lines.push('\n【童限】');
    for (const t of result.tongxian) {
      lines.push(`  ${t.age}岁: ${t.ganzhi} - ${t.nayin}(${t.wuxing})`);
    }
  }

  if (result.dayun && result.dayun.length > 0) {
    lines.push('\n【大运】');
    for (const d of result.dayun) {
      lines.push(`  ${d.index}: ${d.ganzhi} - ${d.nayin}(${d.wuxing}) - ${d.position} [${d.ji_xiong}] 岁${d.start_age}-${d.end_age}`);
    }
  }

  if (result.xiaoyun && result.xiaoyun.length > 0) {
    lines.push('\n【小运 前10年】');
    for (let i = 0; i < Math.min(10, result.xiaoyun.length); i++) {
      const x = result.xiaoyun[i];
      lines.push(`  ${x.age}岁: ${x.ganzhi} - ${x.nayin}(${x.wuxing})`);
    }
  }

  return lines.join('\n');
}

function getCurrentLiuNian() {
  const calc = new DayunXiaoyunCalculator();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  
  try {
    calc.lunarCalc.solarToLunar(year, month, day, 12, 0);
    const yearGanzhi = calc.lunarCalc.getYearInGanZhi();
    const yearNayin = calc.lunarCalc.getYearNaYin();
    const yearChangsheng = calc.lunarCalc._getChangShengInfo(yearGanzhi, yearGanzhi[1]);
    
    return {
      流年: {
        year: year,
        ganzhi: yearGanzhi,
        nayin: yearNayin,
        wuxing: LunarCalendar.NAYIN_WUXING[yearNayin] || '',
        position: yearChangsheng.position,
        ji_xiong: yearChangsheng.jiXiong,
      },
      当前时间: `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`,
      农历: String(calc.lunarCalc.lunarInstance)
    };
  } catch (e) {
    return {
      流年: { year: year, ganzhi: '未知', nayin: '未知', wuxing: '未知', position: '未知', ji_xiong: '未知' },
      当前时间: `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`,
      农历: '未知'
    };
  }
}

function getYearsLiuNian(startYear, count = 10) {
  const calc = new DayunXiaoyunCalculator();
  const yearsData = [];

  for (let i = 0; i < count; i++) {
    const year = startYear + i;
    try {
      calc.lunarCalc.solarToLunar(year, 1, 1, 12, 0);
      const yearGanzhi = calc.lunarCalc.getYearInGanZhi();
      const yearNayin = calc.lunarCalc.getYearNaYin();
      const yearWuxing = LunarCalendar.NAYIN_WUXING[yearNayin] || '';
      const yearChangsheng = yearGanzhi
        ? calc.lunarCalc._getChangShengInfo(yearGanzhi, yearGanzhi[1])
        : {};

      yearsData.push({
        year: year,
        ganzhi: yearGanzhi,
        nayin: yearNayin,
        wuxing: yearWuxing,
        position: yearChangsheng.position || '未知',
        ji_xiong: yearChangsheng.jiXiong || '未知',
      });
    } catch (e) {
      yearsData.push({
        year: year,
        ganzhi: '未知',
        nayin: '未知',
        wuxing: '未知',
        position: '未知',
        ji_xiong: '未知',
      });
    }
  }

  return yearsData;
}

export { DayunXiaoyunCalculator, calculateDayunXiaoyun, printDayun, getCurrentLiuNian, getYearsLiuNian };
export default DayunXiaoyunCalculator;
