const LunarModule = require('lunar-javascript');
const { Solar } = LunarModule;

const GAN_LIST = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const ZHI_LIST = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

const NAYIN_WUXING = {
  '海中金':'金','炉中火':'火','大林木':'木','路旁土':'土','剑锋金':'金',
  '山头火':'火','涧下水':'水','城头土':'土','白蜡金':'金','杨柳木':'木',
  '井泉水':'水','屋上土':'土','霹雳火':'火','松柏木':'木','长流水':'水',
  '砂石金':'金','山下火':'火','平地木':'木','壁上土':'土','金箔金':'金',
  '覆灯火':'火','天河水':'水','大驿土':'土','钗钏金':'金','桑柘木':'木',
  '大溪水':'水','砂石土':'土','天上火':'火','石榴木':'木','大海水':'水',
  '泉中水':'水'
};

const NAYIN_MAP = {
  '海中金':'甲子乙丑','炉中火':'丙寅丁卯','大林木':'戊辰己巳','路旁土':'庚午辛未',
  '剑锋金':'壬申癸酉','山头火':'甲戌乙亥','涧下水':'丙子丁丑','城头土':'戊寅己卯',
  '白蜡金':'庚辰辛巳','杨柳木':'壬午癸未','井泉水':'甲申乙酉','屋上土':'丙戌丁亥',
  '霹雳火':'戊子己丑','松柏木':'庚寅辛卯','长流水':'壬辰癸巳','砂石金':'甲午乙未',
  '山下火':'丙申丁酉','平地木':'戊戌己亥','壁上土':'庚子辛丑','金箔金':'壬寅癸卯',
  '覆灯火':'甲辰乙巳','天河水':'丙午丁未','大驿土':'戊申己酉','钗钏金':'庚戌辛亥',
  '桑柘木':'壬子癸丑','大溪水':'甲寅乙卯','砂石土':'丙辰丁巳','天上火':'戊午己未',
  '石榴木':'庚申辛酉','大海水':'壬戌癸亥','泉中水':'壬戌癸亥'
};

const NAYIN_CHANGSHENG = {'木':'亥','火':'寅','金':'巳','水':'申','土':'申'};
const CHANGSHENG_12 = ['长生','沐浴','冠带','临官','帝旺','衰','病','死','墓','绝','胎','养'];
const ZHI_INDEX = {'子':0,'丑':1,'寅':2,'卯':3,'辰':4,'巳':5,'午':6,'未':7,'申':8,'酉':9,'戌':10,'亥':11};
const JI_XIONG = {'长生':'吉','帝旺':'吉','墓':'吉','胎':'吉','冠带':'平','临官':'平','养':'平','衰':'平','沐浴':'凶','病':'凶','死':'凶','绝':'凶'};

function getNayin(ganzhi) {
  for (const [nayin, gzStr] of Object.entries(NAYIN_MAP)) {
    for (let i = 0; i < gzStr.length; i += 2) {
      if (gzStr.substring(i, i + 2) === ganzhi) return nayin;
    }
  }
  return '未知';
}

function getChangshengInfo(ganzhi, zhi) {
  const nayin = getNayin(ganzhi);
  const wuxing = NAYIN_WUXING[nayin] || '';
  const changshengStart = NAYIN_CHANGSHENG[wuxing] || '';
  if (!changshengStart || !zhi) return {nayin, wuxing, position:'未知', ji_xiong:'未知'};
  const startIndex = ZHI_INDEX[changshengStart] || 0;
  const zhiIndex = ZHI_INDEX[zhi] || 0;
  const positionIndex = (zhiIndex - startIndex + 12) % 12;
  const position = CHANGSHENG_12[positionIndex];
  const ji_xiong = JI_XIONG[position] || '未知';
  return {nayin, wuxing, position, ji_xiong};
}

console.log('=== 测试2: 2006年1月1日12:30 ===');
console.log();

const solar = Solar.fromYmdHms(2006, 1, 1, 12, 30, 0);
const lunar = solar.getLunar();

const yearGanzhi = String(lunar.getYearInGanZhi());
const monthGanzhi = String(lunar.getMonthInGanZhi());
const dayGanzhi = String(lunar.getDayInGanZhi());
const hourGanzhi = String(lunar.getTimeInGanZhi());

console.log('农历:', lunar.getYear(), '年', lunar.getMonth(), '月', lunar.getDay(), '日', hourGanzhi.slice(1), '时');
console.log('四柱:', yearGanzhi, monthGanzhi, dayGanzhi, hourGanzhi);
console.log('生肖:', lunar.getYearShengXiao());
console.log('节气:', lunar.getJieQi() || '无');

const yearNayin = String(lunar.getYearNaYin());
const monthNayin = String(lunar.getMonthNaYin());
const dayNayin = String(lunar.getDayNaYin());
const hourNayin = String(lunar.getTimeNaYin());
console.log('纳音:', yearNayin, monthNayin, dayNayin, hourNayin);

const yinYangMap = {'甲':'阳','乙':'阴','丙':'阳','丁':'阴','戊':'阳','己':'阴','庚':'阳','辛':'阴','壬':'阳','癸':'阴'};
console.log('阴阳:', yinYangMap[yearGanzhi[0]], yinYangMap[monthGanzhi[0]], yinYangMap[dayGanzhi[0]], yinYangMap[hourGanzhi[0]]);

const bazi = {year: yearGanzhi, month: monthGanzhi, day: dayGanzhi, hour: hourGanzhi};

console.log();
console.log('【四柱天干自坐纳音十二长生】');
const cs = {
  year: getChangshengInfo(bazi.year, bazi.year[1]),
  month: getChangshengInfo(bazi.month, bazi.month[1]),
  day: getChangshengInfo(bazi.day, bazi.day[1]),
  hour: getChangshengInfo(bazi.hour, bazi.hour[1])
};
console.log('  年柱', bazi.year + ':', cs.year.nayin + '(' + cs.year.wuxing + ') -', cs.year.position, '[' + cs.year.ji_xiong + ']');
console.log('  月柱', bazi.month + ':', cs.month.nayin + '(' + cs.month.wuxing + ') -', cs.month.position, '[' + cs.month.ji_xiong + ']');
console.log('  日柱', bazi.day + ':', cs.day.nayin + '(' + cs.day.wuxing + ') -', cs.day.position, '[' + cs.day.ji_xiong + ']');
console.log('  时柱', bazi.hour + ':', cs.hour.nayin + '(' + cs.hour.wuxing + ') -', cs.hour.position, '[' + cs.hour.ji_xiong + ']');

console.log();
console.log('=== 测试完成 ===');