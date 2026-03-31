/**
 * nayin.js
 * 禄命法纳音五行十二长生旺衰算法模块
 * 纳音五行十二长生：木长生于亥，火长生于寅，金长生于巳，水土长生于申
 * 吉凶划分：四贵(吉)长生、帝旺、墓、胎；四平(平)冠带、临官、养、衰；四凶(凶)沐浴、病、死、绝
 */

(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else {
    root.NayinCalculator = factory();
  }
}(typeof self !== 'undefined' ? self : this, function() {
  'use strict';

  var NAYIN_WUXING = {
    '海中金': '金', '炉中火': '火', '大林木': '木', '路旁土': '土',
    '剑锋金': '金', '山头火': '火', '涧下水': '水', '城头土': '土',
    '白蜡金': '金', '杨柳木': '木', '井泉水': '水', '屋上土': '土',
    '霹雳火': '火', '松柏木': '木', '长流水': '水', '砂石金': '金',
    '山下火': '火', '平地木': '木', '壁上土': '土', '金箔金': '金',
    '覆灯火': '火', '天河水': '水', '大驿土': '土', '钗钏金': '金',
    '桑柘木': '木', '大溪水': '水', '砂石土': '土', '天上火': '火',
    '石榴木': '木', '大海水': '水', '泉中水': '水'
  };

  var NAYIN_CHANGSHENG = { '木': '亥', '火': '寅', '金': '巳', '水': '申', '土': '申' };

  var CHANGSHENG_12 = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养'];

  var ZHI_INDEX = {
    '子': 0, '丑': 1, '寅': 2, '卯': 3, '辰': 4, '巳': 5,
    '午': 6, '未': 7, '申': 8, '酉': 9, '戌': 10, '亥': 11
  };

  var JI_XIONG = {
    '长生': '吉', '帝旺': '吉', '墓': '吉', '胎': '吉',
    '冠带': '平', '临官': '平', '养': '平', '衰': '平',
    '沐浴': '凶', '病': '凶', '死': '凶', '绝': '凶'
  };

  var GAN_NAYIN = {
    '甲': '大林木', '乙': '大林木',
    '丙': '山头火', '丁': '山头火',
    '戊': '城头土', '己': '城头土',
    '庚': '剑锋金', '辛': '剑锋金',
    '壬': '涧下水', '癸': '涧下水'
  };

  var NAYIN_MAP = {
    '海中金': '甲子乙丑', '炉中火': '丙寅丁卯', '大林木': '戊辰己巳',
    '路旁土': '庚午辛未', '剑锋金': '壬申癸酉', '山头火': '甲戌乙亥',
    '涧下水': '丙子丁丑', '城头土': '戊寅己卯', '白蜡金': '庚辰辛巳',
    '杨柳木': '壬午癸未', '井泉水': '甲申乙酉', '屋上土': '丙戌丁亥',
    '霹雳火': '戊子己丑', '松柏木': '庚寅辛卯', '长流水': '壬辰癸巳',
    '砂石金': '甲午乙未', '山下火': '丙申丁酉', '平地木': '戊戌己亥',
    '壁上土': '庚子辛丑', '金箔金': '壬寅癸卯', '覆灯火': '甲辰乙巳',
    '天河水': '丙午丁未', '大驿土': '戊申己酉', '钗钏金': '庚戌辛亥',
    '桑柘木': '壬子癸丑', '大溪水': '甲寅乙卯', '砂石土': '丙辰丁巳',
    '天上火': '戊午己未', '石榴木': '庚申辛酉', '大海水': '壬戌癸亥'
  };

  function NayinCalculator() {}

  NayinCalculator.prototype.getNayin = function(ganzhi) {
    if (!ganzhi || ganzhi.length < 2) return '未知';
    for (var nayin in NAYIN_MAP) {
      if (NAYIN_MAP.hasOwnProperty(nayin) && NAYIN_MAP[nayin].indexOf(ganzhi) !== -1) {
        return nayin;
      }
    }
    return '未知';
  };

  NayinCalculator.prototype.getChangshengInfo = function(ganzhi, zhi) {
    var nayin = this.getNayin(ganzhi);
    var wuxing = NAYIN_WUXING[nayin] || '';
    var changshengStart = NAYIN_CHANGSHENG[wuxing] || '';

    if (!changshengStart || !zhi) {
      return { 'nayin': nayin, 'wuxing': wuxing, 'position': '未知', 'ji_xiong': '未知' };
    }

    var startIndex = ZHI_INDEX[changshengStart] || 0;
    var zhiIndex = ZHI_INDEX[zhi] || 0;
    var positionIndex = (zhiIndex - startIndex + 12) % 12;
    var position = CHANGSHENG_12[positionIndex];
    var jiXiong = JI_XIONG[position] || '未知';

    return { 'nayin': nayin, 'wuxing': wuxing, 'position': position, 'ji_xiong': jiXiong };
  };

  NayinCalculator.prototype.getChangshengByGan = function(gan, zhi) {
    var nayin = GAN_NAYIN[gan] || '';
    var wuxing = NAYIN_WUXING[nayin] || '';
    var changshengStart = NAYIN_CHANGSHENG[wuxing] || '';

    if (!changshengStart || !zhi) {
      return { 'nayin': nayin, 'wuxing': wuxing, 'position': '未知', 'ji_xiong': '未知' };
    }

    var startIndex = ZHI_INDEX[changshengStart] || 0;
    var zhiIndex = ZHI_INDEX[zhi] || 0;
    var positionIndex = (zhiIndex - startIndex + 12) % 12;
    var position = CHANGSHENG_12[positionIndex];
    var jiXiong = JI_XIONG[position] || '未知';

    return { 'nayin': nayin, 'wuxing': wuxing, 'position': position, 'ji_xiong': jiXiong };
  };

  NayinCalculator.prototype.getChangshengByNayin = function(nayin, zhi) {
    var wuxing = NAYIN_WUXING[nayin] || '';
    var changshengStart = NAYIN_CHANGSHENG[wuxing] || '';

    if (!changshengStart || !zhi) {
      return { 'nayin': nayin, 'wuxing': wuxing, 'position': '未知', 'ji_xiong': '未知', 'zhi': zhi };
    }

    var startIndex = ZHI_INDEX[changshengStart] || 0;
    var zhiIndex = ZHI_INDEX[zhi] || 0;
    var positionIndex = (zhiIndex - startIndex + 12) % 12;
    var position = CHANGSHENG_12[positionIndex];
    var jiXiong = JI_XIONG[position] || '未知';

    return { 'nayin': nayin, 'wuxing': wuxing, 'position': position, 'ji_xiong': jiXiong, 'zhi': zhi };
  };

  NayinCalculator.prototype.calculatePillarChangsheng = function(yearGanzhi, monthGanzhi, dayGanzhi, hourGanzhi) {
    return {
      'year': this.getChangshengInfo(yearGanzhi, yearGanzhi.charAt(1)),
      'month': this.getChangshengInfo(monthGanzhi, monthGanzhi.charAt(1)),
      'day': this.getChangshengInfo(dayGanzhi, dayGanzhi.charAt(1)),
      'hour': this.getChangshengInfo(hourGanzhi, hourGanzhi.charAt(1))
    };
  };

  NayinCalculator.prototype.calculateYearNayinChangsheng = function(yearGanzhi, yearNayin, monthGanzhi, dayGanzhi, hourGanzhi) {
    return {
      'month_zhi': this.getChangshengByNayin(yearNayin, monthGanzhi.charAt(1)),
      'day_zhi': this.getChangshengByNayin(yearNayin, dayGanzhi.charAt(1)),
      'hour_zhi': this.getChangshengByNayin(yearNayin, hourGanzhi.charAt(1))
    };
  };

  NayinCalculator.prototype.summarizeJiXiong = function(changshengDict, pillarKeys, pillarNames) {
    if (!pillarNames) pillarNames = pillarKeys;

    var jiList = [];
    var pingList = [];
    var xiongList = [];

    for (var i = 0; i < pillarKeys.length; i++) {
      var key = pillarKeys[i];
      var name = pillarNames[i];
      if (changshengDict.hasOwnProperty(key)) {
        var jiX = changshengDict[key]['ji_xiong'];
        var pos = changshengDict[key]['position'];
        if (jiX === '吉') {
          jiList.push(name + pos);
        } else if (jiX === '平') {
          pingList.push(name + pos);
        } else if (jiX === '凶') {
          xiongList.push(name + pos);
        }
      }
    }

    return { '四贵_吉': jiList, '四平_平': pingList, '四凶_凶': xiongList };
  };

  NayinCalculator.CHANGSHENG_12 = CHANGSHENG_12;
  NayinCalculator.JI_XIONG = JI_XIONG;
  NayinCalculator.NAYIN_WUXING = NAYIN_WUXING;
  NayinCalculator.NAYIN_CHANGSHENG = NAYIN_CHANGSHENG;
  NayinCalculator.GAN_NAYIN = GAN_NAYIN;
  NayinCalculator.NAYIN_MAP = NAYIN_MAP;
  NayinCalculator.ZHI_INDEX = ZHI_INDEX;

  return NayinCalculator;
}));
