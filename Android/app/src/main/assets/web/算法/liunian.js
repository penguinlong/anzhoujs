/**
 * liunian.js
 * 流年算法模块
 * 使用 lunar-wrapper 获取干支信息
 */

import LunarCalendar from './lunar-wrapper.mjs';

const GAN_LIST = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const ZHI_LIST = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

function getDaysInMonth(year, month) {
  if (month === 2) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0) ? 29 : 28;
  }
  if (month === 4 || month === 6 || month === 9 || month === 11) {
    return 30;
  }
  return 31;
}

function formatDate(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

class LiuNianCalculator {
  constructor() {
    this.calendar = new LunarCalendar();
  }

  getCurrentLiuNian() {
    const now = new Date();
    return this.getLiuNian(now.getFullYear(), now.getMonth() + 1, now.getDate());
  }

  getLiuNian(year, month = 1, day = 1) {
    this.calendar.solarToLunar(year, month, day, 12, 0);

    const yearGanzhi = this.calendar.getYearInGanZhi();
    const monthGanzhi = this.calendar.getMonthInGanZhi();
    const dayGanzhi = this.calendar.getDayInGanZhi();

    const yearNayin = this.calendar.getYearNaYin();
    const monthNayin = this.calendar.getMonthNaYin();
    const dayNayin = this.calendar.getDayNaYin();

    const yearWuxing = LunarCalendar.NAYIN_WUXING[yearNayin] || '';
    const monthWuxing = LunarCalendar.NAYIN_WUXING[monthNayin] || '';
    const dayWuxing = LunarCalendar.NAYIN_WUXING[dayNayin] || '';

    const yearChangsheng = this.calendar._getChangShengInfo(yearGanzhi, yearGanzhi[1]);

    return {
      流年: {
        ganzhi: yearGanzhi,
        nayin: yearNayin,
        wuxing: yearWuxing,
        position: yearChangsheng.position,
        ji_xiong: yearChangsheng.jiXiong,
      },
      流月: {
        ganzhi: monthGanzhi,
        nayin: monthNayin,
        wuxing: monthWuxing,
      },
      流日: {
        ganzhi: dayGanzhi,
        nayin: dayNayin,
        wuxing: dayWuxing,
      },
      当前时间: formatDate(year, month, day),
      农历: String(this.calendar.lunarInstance),
    };
  }

  getYearMonths(year) {
    const monthsData = [];

    for (let month = 1; month <= 12; month++) {
      try {
        this.calendar.solarToLunar(year, month, 1, 12, 0);
        const monthGanzhi = this.calendar.getMonthInGanZhi();
        const monthNayin = this.calendar.getMonthNaYin();
        const monthWuxing = LunarCalendar.NAYIN_WUXING[monthNayin] || '';

        monthsData.push({
          month,
          ganzhi: monthGanzhi,
          nayin: monthNayin,
          wuxing: monthWuxing,
        });
      } catch (e) {
        monthsData.push({
          month,
          ganzhi: '未知',
          nayin: '未知',
          wuxing: '未知',
          error: String(e),
        });
      }
    }

    return { year, months: monthsData };
  }

  getMonthDays(year, month) {
    const daysData = [];
    const maxDay = getDaysInMonth(year, month);

    for (let day = 1; day <= maxDay; day++) {
      try {
        this.calendar.solarToLunar(year, month, day, 12, 0);
        const dayGanzhi = this.calendar.getDayInGanZhi();
        const dayNayin = this.calendar.getDayNaYin();
        const dayWuxing = LunarCalendar.NAYIN_WUXING[dayNayin] || '';

        daysData.push({
          day,
          ganzhi: dayGanzhi,
          nayin: dayNayin,
          wuxing: dayWuxing,
          lunar: String(this.calendar.lunarInstance.getDay()),
        });
      } catch (e) {
        daysData.push({
          day,
          ganzhi: '未知',
          nayin: '未知',
          wuxing: '未知',
          error: String(e),
        });
      }
    }

    return { year, month, days: daysData };
  }

  getYearsLiuNian(startYear, count = 10) {
    const yearsData = [];

    for (let i = 0; i < count; i++) {
      const year = startYear + i;
      try {
        this.calendar.solarToLunar(year, 1, 1, 12, 0);
        const yearGanzhi = this.calendar.getYearInGanZhi();
        const yearNayin = this.calendar.getYearNaYin();
        const yearWuxing = LunarCalendar.NAYIN_WUXING[yearNayin] || '';
        const yearChangsheng = yearGanzhi
          ? this.calendar._getChangShengInfo(yearGanzhi, yearGanzhi[1])
          : {};

        yearsData.push({
          year,
          ganzhi: yearGanzhi,
          nayin: yearNayin,
          wuxing: yearWuxing,
          position: yearChangsheng.position || '未知',
          ji_xiong: yearChangsheng.jiXiong || '未知',
        });
      } catch (e) {
        yearsData.push({
          year,
          ganzhi: '未知',
          nayin: '未知',
          wuxing: '未知',
          position: '未知',
          ji_xiong: '未知',
          error: String(e),
        });
      }
    }

    return yearsData;
  }
}

function getCurrentLiuNian() {
  const calc = new LiuNianCalculator();
  return calc.getCurrentLiuNian();
}

function getLiuNian(year, month = 1, day = 1) {
  const calc = new LiuNianCalculator();
  return calc.getLiuNian(year, month, day);
}

function getYearMonths(year) {
  const calc = new LiuNianCalculator();
  return calc.getYearMonths(year);
}

function getMonthDays(year, month) {
  const calc = new LiuNianCalculator();
  return calc.getMonthDays(year, month);
}

function getYearsLiuNian(startYear, count = 10) {
  const calc = new LiuNianCalculator();
  return calc.getYearsLiuNian(startYear, count);
}

export {
  LiuNianCalculator,
  getCurrentLiuNian,
  getLiuNian,
  getYearMonths,
  getMonthDays,
  getYearsLiuNian,
  GAN_LIST,
  ZHI_LIST,
};
