/**
 * xingyao.js
 * 禄命法星曜计算模块 - 果老星宗算法
 * 实现儒略日计算、太阳/月亮位置计算、命宫/身宫计算
 * 使用0-based索引，与bazi.js保持一致
 */

function mod(n, m) {
  return ((n % m) + m) % m;
}

const ZHI_INDEX = {
  "子": 0,
  "丑": 1,
  "寅": 2,
  "卯": 3,
  "辰": 4,
  "巳": 5,
  "午": 6,
  "未": 7,
  "申": 8,
  "酉": 9,
  "戌": 10,
  "亥": 11,
};

const ZHI_LIST = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

const HUANGDAO_ZHI = {
  0: "子",
  1: "丑",
  2: "寅",
  3: "卯",
  4: "辰",
  5: "巳",
  6: "午",
  7: "未",
  8: "申",
  9: "酉",
  10: "戌",
  11: "亥",
};

function julianDay(year, month, day, hour = 0, minute = 0) {
  if (month <= 2) {
    year -= 1;
    month += 12;
  }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  const JD =
    Math.floor(365.25 * (year + 4716)) +
    Math.floor(30.6001 * (month + 1)) +
    day +
    hour / 24.0 +
    minute / 1440.0 +
    B -
    1524.5;
  return JD;
}

function sunPosition(jd) {
  const D = jd - 2451545.0;
  const L = mod(280.460 + 0.9856474 * D, 360);
  const g = mod(357.528 + 0.9856003 * D, 360);
  const Lambda = mod(L + 1.915 * Math.sin((g * Math.PI) / 180) + 0.020 * Math.sin((2 * g * Math.PI) / 180), 360);

  const degreeInZodiac = mod(Lambda, 30);
  const palace = Math.floor(Lambda / 30);  // 0-based
  return { palace, degree: degreeInZodiac };
}

function moonPosition(jd) {
  const D = jd - 2451545.0;
  const L = mod(218.317 + 13.396992 * D, 360);
  const moonAnomaly = mod(134.963 + 13.064993 * D, 360);
  let Lambda = L + 6.289 * Math.sin((moonAnomaly * Math.PI) / 180);
  Lambda = mod(Lambda, 360);

  const degreeInZodiac = mod(Lambda, 30);
  const palace = Math.floor(Lambda / 30);  // 0-based
  return { palace, degree: degreeInZodiac };
}

function getSunPosition(year, month, day, hour, minute) {
  const jd = julianDay(year, month, day, hour, minute);
  const { palace, degree } = sunPosition(jd);
  const zhi = HUANGDAO_ZHI[palace];
  return { zhi, degree };
}

function getMoonPosition(year, month, day, hour, minute) {
  const jd = julianDay(year, month, day, hour, minute);
  const { palace, degree } = moonPosition(jd);
  const zhi = HUANGDAO_ZHI[palace];
  return { zhi, degree };
}

function calculateMinggongGuolao(hourZhi, sunZhi, sunDegree) {
  const hourNum = ZHI_INDEX[hourZhi] || 0;
  const sunNum = ZHI_INDEX[sunZhi] || 0;

  // Original 1-based: (sun_num + hour_num - 4) mod 12, result 1-12 maps to ZHI_LIST_1[1-12]
  // 0-based equivalent: result 0-11 maps to ZHI_LIST_0[0-11], where '午' is at index 6
  // Derivation: (sun_num-1 + hour_num-1 - 4 + 12) % 12 = (sunNum + hourNum - 3) mod 12
  let minggongNum = (sunNum + hourNum - 3 + 12) % 12;

  return ZHI_LIST[minggongNum];
}

function calculateShengongGuolao(hourZhi, moonZhi, moonDegree) {
  const hourNum = ZHI_INDEX[hourZhi] || 0;
  const moonNum = ZHI_INDEX[moonZhi] || 0;

  // Original 1-based: (moon_num + hour_num + 2) mod 12, result 1-12 maps to ZHI_LIST_1[1-12]
  // 0-based equivalent: (moon_num-1 + hour_num-1 + 2 + 12) % 12 = (moonNum + hourNum + 0) mod 12
  let shengongNum = (moonNum + hourNum) % 12;

  return ZHI_LIST[shengongNum];
}

function calculateMingdu(sunZhi, sunDegree, minggongZhi) {
  const sunNum = ZHI_INDEX[sunZhi] || 0;
  const minggongNum = ZHI_INDEX[minggongZhi] || 0;
  const diff = (minggongNum - sunNum + 12) % 12;
  return (sunDegree + diff * 30) % 360;
}

function calculateShengdu(moonZhi, moonDegree, shengongZhi) {
  const moonNum = ZHI_INDEX[moonZhi] || 0;
  const shengongNum = ZHI_INDEX[shengongZhi] || 0;
  const diff = (shengongNum - moonNum + 12) % 12;
  return (moonDegree + diff * 30) % 360;
}

export { ZHI_INDEX, ZHI_LIST, HUANGDAO_ZHI, julianDay, sunPosition, moonPosition, getSunPosition, getMoonPosition, calculateMinggongGuolao, calculateShengongGuolao, calculateMingdu, calculateShengdu };