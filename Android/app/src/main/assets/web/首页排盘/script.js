// ===== 全局状态 =====
let currentDateType = 'solar';
let currentLongitude = 120; // 默认经度
let currentTimezone = 8; // 默认时区（北京时间）
let currentDayunResult = null; // 当前大运结果
let currentBirthYear = null; // 当前出生年份
let selectedDayunIndex = -1; // 当前选中的大运索引，-1表示自动选择当前大运
let currentAge = 0; // 当前年龄，用于自动选中大运

// ===== 算法模块（动态导入） =====
let _algoModules = null;

async function loadAlgorithmModules() {
    if (_algoModules) return _algoModules;
    const basePath = '../算法/';
    const [baziModule, liunianModule, shenshaModule, dayunModule] = await Promise.all([
        import(basePath + 'bazi.js'),
        import(basePath + 'liunian.js'),
        import(basePath + 'shensha.js'),
        import(basePath + 'dayun.js')
    ]);
    _algoModules = {
        calculateBazi: baziModule.calculateBazi,
        getCurrentLiuNian: liunianModule.getCurrentLiuNian,
        getYearsLiuNian: liunianModule.getYearsLiuNian,
        calculateShenSha: shenshaModule.calculate_shensha,
        calculateDayun: dayunModule.calculateDayunXiaoyun
    };
    return _algoModules;
}

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', async function() {
    initDateSelectors();
    initButtonGroups();
    initCalculateButton();
    initDefaultDate();
    
    // 预加载算法模块
    await loadAlgorithmModules();
    
    // 初始化时区和位置
    await initTimeAndLocation();
    
    // 检查URL参数，如果是从记录页面跳转过来的，加载记录
    await loadRecordFromUrl();
});

// ===== 初始化时区和位置 =====
async function initTimeAndLocation() {
    // 更新当前时间
    updateCurrentTime();
    setInterval(updateCurrentTime, 60000); // 每分钟更新时间
    
    // 获取位置（每小时更新）
    await getLocationAndUpdate();
    
    // 【重要】初始化时设置默认日期为今天（覆盖initDefaultDate的1990年）
    updateDefaultDateToNow();
    
    // 绑定刷新位置按钮
    document.getElementById('refresh-location')?.addEventListener('click', async () => {
        await getLocationAndUpdate();
    });
    
    // 绑定时区选择
    document.getElementById('timezone')?.addEventListener('change', (e) => {
        if (e.target.value === 'auto') {
            currentTimezone = -new Date().getTimezoneOffset() / 60;
        } else {
            currentTimezone = parseFloat(e.target.value);
        }
        updateCurrentTime();
        updateDefaultDateToNow();
    });
}

// ===== 更新当前时间显示 =====
function updateCurrentTime() {
    const now = new Date();
    const options = { 
        timeZone: `Etc/GMT${currentTimezone >= 0 ? '-' : '+'}${Math.abs(currentTimezone)}`,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
    };
    try {
        const timeStr = now.toLocaleString('zh-CN', options);
        const timeEl = document.getElementById('current-time');
        if (timeEl) timeEl.textContent = timeStr;
    } catch (e) {
        const timeEl = document.getElementById('current-time');
        if (timeEl) timeEl.textContent = now.toLocaleString('zh-CN');
    }
}

// ===== 获取位置并更新 =====
async function getLocationAndUpdate() {
    const locationEl = document.getElementById('current-location');
    const longitudeInput = document.getElementById('longitude');
    
    if (!navigator.geolocation) {
        if (locationEl) locationEl.textContent = '浏览器不支持定位';
        return;
    }
    
    if (locationEl) locationEl.textContent = '定位中...';
    
    try {
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000
            });
        });
        
        currentLongitude = position.coords.longitude.toFixed(2);
        const latitude = position.coords.latitude.toFixed(2);
        
        if (locationEl) locationEl.textContent = `经度: ${currentLongitude}° 纬度: ${latitude}°`;
        
        // 更新经度输入框
        if (longitudeInput) {
            longitudeInput.value = currentLongitude;
        }
        
        console.log('位置获取成功:', currentLongitude, latitude);
    } catch (error) {
        console.error('获取位置失败:', error);
        if (locationEl) locationEl.textContent = '定位失败，使用默认经度';
    }
}

// ===== 更新默认日期为当前日期 =====
function updateDefaultDateToNow() {
    const now = new Date();
    const yearSelect = document.getElementById('year-select');
    const monthSelect = document.getElementById('month-select');
    const daySelect = document.getElementById('day-select');
    const hourSelect = document.getElementById('hour');
    const minuteSelect = document.getElementById('minute');
    
    if (yearSelect) yearSelect.value = now.getFullYear();
    if (monthSelect) {
        updateMonths();
        monthSelect.value = now.getMonth() + 1;
    }
    if (daySelect) {
        updateDays();
        daySelect.value = now.getDate();
    }
    
    if (hourSelect) {
        hourSelect.value = now.getHours();
    }
    
    if (minuteSelect) {
        const currentMinute = now.getMinutes();
        const roundedMinute = Math.round(currentMinute / 15) * 15;
        minuteSelect.value = roundedMinute === 60 ? 0 : roundedMinute;
    }
}

// ===== 初始化默认日期 =====
function initDefaultDate() {
    const yearSelect = document.getElementById('year-select');
    yearSelect.value = 1990;
    updateMonths();
    yearSelect.value = 1990;
    const monthSelect = document.getElementById('month-select');
    monthSelect.value = 5;
    updateDays();
    monthSelect.value = 5;
    const daySelect = document.getElementById('day-select');
    daySelect.value = 15;
}

// ===== 初始化日期选择器 =====
function initDateSelectors() {
    const yearSelect = document.getElementById('year-select');
    const monthSelect = document.getElementById('month-select');
    const daySelect = document.getElementById('day-select');
    
    const currentYear = new Date().getFullYear();
    const startYear = Math.min(currentYear - 100, 1900);
    const endYear = 2077;
    
    for (let y = startYear; y <= endYear; y++) {
        const option = document.createElement('option');
        option.value = y;
        option.textContent = y + '年';
        yearSelect.appendChild(option);
    }
    
    yearSelect.addEventListener('change', updateMonths);
    monthSelect.addEventListener('change', updateDays);
}

function updateMonths() {
    const monthSelect = document.getElementById('month-select');
    const currentMonth = monthSelect.value;
    
    monthSelect.innerHTML = '';
    
    if (currentDateType === 'lunar') {
        const year = parseInt(document.getElementById('year-select').value);
        const leapMonth = getLunarLeapMonth(year);
        
        for (let m = 1; m <= 12; m++) {
            const option = document.createElement('option');
            if (leapMonth === m) {
                option.value = -m;
                option.textContent = m + '月(闰)';
            } else {
                option.value = m;
                option.textContent = m + '月';
            }
            monthSelect.appendChild(option);
        }
    } else {
        for (let m = 1; m <= 12; m++) {
            const option = document.createElement('option');
            option.value = m;
            option.textContent = m + '月';
            monthSelect.appendChild(option);
        }
    }
    
    if (currentMonth) {
        const absCurrent = Math.abs(parseInt(currentMonth));
        if (absCurrent <= 12) {
            monthSelect.value = currentMonth;
        }
    }
    updateDays();
}

function updateDays() {
    const yearSelect = document.getElementById('year-select');
    const monthSelect = document.getElementById('month-select');
    const daySelect = document.getElementById('day-select');
    const currentDay = daySelect.value;
    
    const year = parseInt(yearSelect.value);
    const month = parseInt(monthSelect.value);
    const absMonth = Math.abs(month);
    
    let daysInMonth = currentDateType === 'lunar' 
        ? getLunarDaysInMonth(year, absMonth) 
        : getSolarDaysInMonth(year, absMonth);
    
    daySelect.innerHTML = '';
    for (let d = 1; d <= daysInMonth; d++) {
        const option = document.createElement('option');
        option.value = d;
        option.textContent = d + '日';
        daySelect.appendChild(option);
    }
    
    if (currentDay && parseInt(currentDay) <= daysInMonth) {
        daySelect.value = currentDay;
    }
}

function getSolarDaysInMonth(year, month) {
    if (month === 2) {
        return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0) ? 29 : 28;
    }
    return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function getLunarDaysInMonth(year, month) {
    const absMonth = Math.abs(month);
    const leapMonth = getLunarLeapMonth(year);
    if (absMonth === leapMonth) return 29;
    if (leapMonth === 0 || absMonth < leapMonth) {
        return absMonth % 2 === 0 ? 30 : 29;
    } else {
        return absMonth % 2 === 0 ? 29 : 30;
    }
}

function getLunarLeapMonth(year) {
    const leapMonths = {
        1990: 6, 1993: 3, 1995: 8, 1998: 5, 2001: 4, 2004: 2, 2006: 7,
        2009: 5, 2012: 4, 2014: 9, 2017: 6, 2020: 4, 2023: 2,
        2025: 6, 2028: 5, 2031: 3, 2033: 11, 2036: 6, 2039: 5, 2042: 2,
        2044: 7, 2047: 5, 2050: 3, 2052: 8, 2055: 6, 2058: 4, 2061: 3,
        2063: 7, 2066: 5, 2069: 4, 2071: 11, 2074: 6, 2077: 5, 2080: 3,
        2082: 8, 2085: 6, 2088: 4, 2091: 3, 2093: 7, 2096: 5, 2099: 4,
        2101: 9, 2104: 6, 2107: 5, 2110: 3, 2112: 8, 2115: 6, 2118: 4,
        2121: 3, 2123: 7, 2126: 5, 2129: 4, 2132: 2, 2134: 6, 2137: 5,
        2140: 3, 2142: 7, 2145: 5, 2148: 4, 2151: 3, 2153: 7, 2156: 5,
        2159: 4, 2162: 2, 2164: 6, 2167: 5, 2170: 3, 2172: 7, 2175: 5,
        2178: 4, 2181: 3, 2183: 6, 2186: 5, 2189: 3, 2191: 7, 2194: 5,
        2197: 4, 2200: 3, 2202: 6, 2205: 5, 2208: 3, 2210: 7, 2213: 5,
        2216: 4, 2219: 3, 2221: 6, 2224: 5, 2227: 3, 2229: 8, 2232: 5,
        2235: 4, 2238: 3, 2240: 7, 2243: 5, 2246: 4, 2249: 3, 2251: 7,
        2254: 5, 2257: 4, 2260: 3, 2262: 6, 2265: 5, 2268: 3, 2270: 7,
        2273: 5, 2276: 4, 2279: 3, 2281: 6, 2284: 5, 2287: 3, 2289: 8,
        2292: 5, 2295: 4, 2298: 3, 2300: 6, 2303: 5, 2306: 3, 2308: 8,
        2311: 5, 2314: 4, 2317: 3, 2319: 6, 2322: 5, 2325: 3, 2327: 8,
        2330: 5, 2333: 4, 2336: 3, 2338: 7, 2341: 5, 2344: 4, 2347: 3,
        2349: 7, 2352: 5, 2355: 4, 2358: 3, 2360: 6, 2363: 5, 2366: 3,
        2368: 8, 2371: 5, 2374: 4, 2377: 3, 2379: 6, 2382: 5, 2385: 3,
        2387: 8, 2390: 5, 2393: 4, 2396: 3, 2398: 7, 2401: 5, 2404: 4,
        2407: 3, 2409: 6, 2412: 5, 2415: 3, 2417: 8, 2420: 5, 2423: 4,
        2426: 3, 2428: 6, 2431: 5, 2434: 3, 2436: 7, 2439: 5, 2442: 4,
        2445: 3, 2447: 7, 2450: 5, 2453: 4, 2456: 3, 2458: 6, 2461: 5,
        2464: 3, 2466: 8, 2469: 5, 2472: 4, 2475: 3, 2477: 6, 2480: 5,
        2483: 3, 2485: 8, 2488: 5, 2491: 4, 2494: 3, 2496: 6, 2499: 5,
        2502: 3, 2504: 7, 2507: 5, 2510: 4, 2513: 3, 2515: 7, 2518: 5,
        2521: 4, 2524: 3, 2526: 6, 2529: 5, 2532: 3, 2534: 8, 2537: 5,
        2540: 4, 2543: 3, 2545: 6, 2548: 5, 2551: 3, 2553: 7, 2556: 5,
        2559: 4, 2562: 3, 2564: 7, 2567: 5, 2570: 4, 2573: 3, 2575: 6,
        2578: 5, 2581: 3, 2583: 8, 2586: 5, 2589: 4, 2592: 3, 2594: 6,
        2597: 5, 2600: 3, 2602: 7, 2605: 5, 2608: 4, 2611: 3, 2613: 7,
        2616: 5, 2619: 4, 2622: 3, 2624: 6, 2627: 5, 2630: 3, 2632: 8,
        2635: 5, 2638: 4, 2641: 3, 2643: 6, 2646: 5, 2649: 3, 2651: 7,
        2654: 5, 2657: 4, 2660: 3, 2662: 7, 2665: 5, 2668: 4, 2671: 3,
        2673: 6, 2676: 5, 2679: 3, 2681: 8, 2684: 5, 2687: 4, 2690: 3,
        2692: 6, 2695: 5, 2698: 3, 2700: 7, 2703: 5, 2706: 4, 2709: 3,
        2711: 7, 2714: 5, 2717: 4, 2720: 3, 2722: 6, 2725: 5, 2728: 3,
        2730: 8, 2733: 5, 2736: 4, 2739: 3, 2741: 6, 2744: 5, 2747: 3,
        2749: 7, 2752: 5
    };
    return leapMonths[year] || 0;
}

// ===== 初始化按钮组 =====
function initButtonGroups() {
    const genderGroup = document.getElementById('gender-group');
    const dateTypeGroup = document.getElementById('date-type-group');
    
    genderGroup.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-gender')) {
            genderGroup.querySelectorAll('.btn-gender').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
        }
    });
    
    dateTypeGroup.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-date-type')) {
            dateTypeGroup.querySelectorAll('.btn-date-type').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            
            currentDateType = e.target.dataset.value;
            updateMonths();
        }
    });
}

// ===== 初始化排盘按钮 =====
function initCalculateButton() {
    document.getElementById('calculate-btn').addEventListener('click', calculateBazi);
}

// ===== 排盘计算 =====
async function calculateBazi() {
    const name = document.getElementById('name').value || '匿名';
    const gender = document.querySelector('#gender-group .btn-gender.active').dataset.value;
    const year = parseInt(document.getElementById('year-select').value);
    const month = parseInt(document.getElementById('month-select').value);
    const day = parseInt(document.getElementById('day-select').value);
    const hour = parseInt(document.getElementById('hour').value) || 0;
    const minute = parseInt(document.getElementById('minute').value) || 0;
    const longitude = parseFloat(document.getElementById('longitude').value) || 120;
    const useTrueSolar = document.getElementById('true-solar').checked;
    
    if (!year || !month || !day) {
        alert('请选择完整日期');
        return;
    }
    
    const isLunar = currentDateType === 'lunar';
    const isLeapMonth = month < 0;
    const absMonth = Math.abs(month);
    
    console.log('calculateBazi called with:', { year, month: absMonth, day, hour, minute, isLunar, isLeapMonth });
    
    try {
        showLoading(true);
        const algo = await loadAlgorithmModules();
        
        const baziResult = algo.calculateBazi(year, absMonth, day, hour, minute, {
            isLunar,
            isLeapMonth,
            longitude,
            useTrueSolar
        });
        
        // 补充算法未返回的字段
        baziResult.name = name;
        const orig = baziResult.original_solar || {};
        baziResult.solar_date = `${orig.year || year}-${String(orig.month || month).padStart(2,'0')}-${String(orig.day || day).padStart(2,'0')}`;
        baziResult.lunar_date = baziResult.lunar_date || '未知';
        
        displayResult(baziResult);
        await saveRecord({ name, gender, date_type: currentDateType, solar_year: year, solar_month: absMonth, solar_day: day, lunar_year: year, lunar_month: absMonth, lunar_day: day, is_leap_month: isLeapMonth, hour, minute, longitude, use_true_solar: useTrueSolar }, baziResult);
        
    } catch (error) {
        alert('计算失败: ' + error.message);
    } finally {
        showLoading(false);
    }
}

function showLoading(show) {
    const btn = document.getElementById('calculate-btn');
    btn.textContent = show ? '计算中...' : '开始排盘';
    btn.disabled = show;
}

// ===== 显示结果 =====
async function displayResult(result) {
    const resultCard = document.getElementById('result-card');
    resultCard.style.display = 'block';
    
    // 显示顶部信息
    displayHeaderInfo(result);
    
    // 显示排盘表格（包含神煞）
    await displayPaiPanTable(result);
    
    // 显示三垣
    displaySanyuan(result);
    
    // 显示十二长生
    displayChangshengDetails(result);
    
    // 隐藏旧的显示区域（如果存在）
    const oldSections = document.querySelectorAll('.result-section');
    oldSections.forEach(section => section.style.display = 'none');
    
    // 显示大运小运流年
    await displayDayunLiunian(result);
    
    resultCard.scrollIntoView({ behavior: 'smooth' });
}

// ===== 新的显示函数 =====

// 显示顶部信息
function displayHeaderInfo(result) {
    // 显示姓名
    const nameElement = document.getElementById('info-name');
    if (nameElement && result.name) {
        nameElement.textContent = result.name;
    }
    
    // 显示阳历
    const solarElement = document.getElementById('info-solar');
    if (solarElement && result.solar_date) {
        const time = result.true_solar_time || '';
        solarElement.textContent = `${result.solar_date} ${time}`;
    }
    
    // 显示农历
    const lunarElement = document.getElementById('info-lunar');
    if (lunarElement && result.lunar_date) {
        lunarElement.textContent = result.lunar_date;
    }
    
    // 显示节气
    const solarTermElement = document.getElementById('info-solar-term');
    if (solarTermElement && result.solar_term) {
        solarTermElement.textContent = result.solar_term;
    }
}

// 显示排盘表格
async function displayPaiPanTable(result) {
    // 显示十神
    displayTenGods(result);
    
    // 显示天干地支
    displayHeavenlyStemAndEarthlyBranch(result);
    
    // 显示纳音
    displayNayinRow(result);
    
    // 显示神煞
    await displayShenShaRow(result);
}

// 显示十神
function displayTenGods(result) {
    const tenGods = result.ten_gods || {};
    
    // 年柱十神
    const yearElement = document.getElementById('ten-god-year');
    if (yearElement) {
        yearElement.textContent = tenGods.year_gan || '';
    }
    
    // 月柱十神
    const monthElement = document.getElementById('ten-god-month');
    if (monthElement) {
        monthElement.textContent = tenGods.month_gan || '';
    }
    
    // 日柱十神
    const dayElement = document.getElementById('ten-god-day');
    if (dayElement) {
        dayElement.textContent = tenGods.day_gan || '';
    }
    
    // 时柱十神
    const hourElement = document.getElementById('ten-god-hour');
    if (hourElement) {
        hourElement.textContent = tenGods.hour_gan || '';
    }
    
    // 胎元十神（暂时留空）
    const taiyuanElement = document.getElementById('ten-god-taiyuan');
    if (taiyuanElement) {
        taiyuanElement.textContent = '胎';
    }
    
    // 命宫十神（暂时留空）
    const minggongElement = document.getElementById('ten-god-minggong');
    if (minggongElement) {
        minggongElement.textContent = '命';
    }
    
    // 身宫十神（暂时留空）
    const shengongElement = document.getElementById('ten-god-shengong');
    if (shengongElement) {
        shengongElement.textContent = '身';
    }
}

// 显示天干地支
function displayHeavenlyStemAndEarthlyBranch(result) {
    // 年柱
    const yearStem = document.getElementById('stem-year');
    const yearBranch = document.getElementById('branch-year');
    if (yearStem && yearBranch && result.year) {
        const yearGan = result.year.charAt(0); // 天干
        const yearZhi = result.year.charAt(1); // 地支
        yearStem.textContent = yearGan;
        yearBranch.textContent = yearZhi;
        
        // 添加五行颜色
        yearStem.className = `table-cell stem-cell ${getWuxingClass(yearGan)}`;
        yearBranch.className = `table-cell branch-cell ${getWuxingClass(yearZhi)}`;
    }
    
    // 月柱
    const monthStem = document.getElementById('stem-month');
    const monthBranch = document.getElementById('branch-month');
    if (monthStem && monthBranch && result.month) {
        const monthGan = result.month.charAt(0);
        const monthZhi = result.month.charAt(1);
        monthStem.textContent = monthGan;
        monthBranch.textContent = monthZhi;
        
        monthStem.className = `table-cell stem-cell ${getWuxingClass(monthGan)}`;
        monthBranch.className = `table-cell branch-cell ${getWuxingClass(monthZhi)}`;
    }
    
    // 日柱
    const dayStem = document.getElementById('stem-day');
    const dayBranch = document.getElementById('branch-day');
    if (dayStem && dayBranch && result.day) {
        const dayGan = result.day.charAt(0);
        const dayZhi = result.day.charAt(1);
        dayStem.textContent = dayGan;
        dayBranch.textContent = dayZhi;
        
        dayStem.className = `table-cell stem-cell ${getWuxingClass(dayGan)}`;
        dayBranch.className = `table-cell branch-cell ${getWuxingClass(dayZhi)}`;
    }
    
    // 时柱
    const hourStem = document.getElementById('stem-hour');
    const hourBranch = document.getElementById('branch-hour');
    if (hourStem && hourBranch && result.hour) {
        const hourGan = result.hour.charAt(0);
        const hourZhi = result.hour.charAt(1);
        hourStem.textContent = hourGan;
        hourBranch.textContent = hourZhi;
        
        hourStem.className = `table-cell stem-cell ${getWuxingClass(hourGan)}`;
        hourBranch.className = `table-cell branch-cell ${getWuxingClass(hourZhi)}`;
    }
    
    // 胎元
    const taiyuan = result.taiyuan || {};
    const taiyuanStem = document.getElementById('stem-taiyuan');
    const taiyuanBranch = document.getElementById('branch-taiyuan');
    if (taiyuanStem && taiyuanBranch && taiyuan.ganzhi) {
        const taiyuanGan = taiyuan.ganzhi.charAt(0);
        const taiyuanZhi = taiyuan.ganzhi.charAt(1);
        taiyuanStem.textContent = taiyuanGan;
        taiyuanBranch.textContent = taiyuanZhi;
        
        taiyuanStem.className = `table-cell stem-cell ${getWuxingClass(taiyuanGan)}`;
        taiyuanBranch.className = `table-cell branch-cell ${getWuxingClass(taiyuanZhi)}`;
    }
    
    // 命宫
    const minggong = result.minggong || {};
    const minggongStem = document.getElementById('stem-minggong');
    const minggongBranch = document.getElementById('branch-minggong');
    if (minggongStem && minggongBranch && minggong.ganzhi) {
        const minggongGan = minggong.ganzhi.charAt(0);
        const minggongZhi = minggong.ganzhi.charAt(1);
        minggongStem.textContent = minggongGan;
        minggongBranch.textContent = minggongZhi;
        
        minggongStem.className = `table-cell stem-cell ${getWuxingClass(minggongGan)}`;
        minggongBranch.className = `table-cell branch-cell ${getWuxingClass(minggongZhi)}`;
    }
    
    // 身宫
    const shengong = result.shengong || {};
    const shengongStem = document.getElementById('stem-shengong');
    const shengongBranch = document.getElementById('branch-shengong');
    if (shengongStem && shengongBranch && shengong.ganzhi) {
        const shengongGan = shengong.ganzhi.charAt(0);
        const shengongZhi = shengong.ganzhi.charAt(1);
        shengongStem.textContent = shengongGan;
        shengongBranch.textContent = shengongZhi;
        
        shengongStem.className = `table-cell stem-cell ${getWuxingClass(shengongGan)}`;
        shengongBranch.className = `table-cell branch-cell ${getWuxingClass(shengongZhi)}`;
    }
}

// 显示纳音行
function displayNayinRow(result) {
    // 年柱纳音
    const yearNayin = document.getElementById('nayin-year');
    if (yearNayin) {
        yearNayin.textContent = result.year_nayin || '';
    }
    
    // 月柱纳音
    const monthNayin = document.getElementById('nayin-month');
    if (monthNayin) {
        monthNayin.textContent = result.month_nayin || '';
    }
    
    // 日柱纳音
    const dayNayin = document.getElementById('nayin-day');
    if (dayNayin) {
        dayNayin.textContent = result.day_nayin || '';
    }
    
    // 时柱纳音
    const hourNayin = document.getElementById('nayin-hour');
    if (hourNayin) {
        hourNayin.textContent = result.hour_nayin || '';
    }
    
    // 胎元纳音
    const taiyuan = result.taiyuan || {};
    const taiyuanNayin = document.getElementById('nayin-taiyuan');
    if (taiyuanNayin) {
        taiyuanNayin.textContent = taiyuan.nayin || '';
    }
    
    // 命宫纳音
    const minggong = result.minggong || {};
    const minggongNayin = document.getElementById('nayin-minggong');
    if (minggongNayin) {
        minggongNayin.textContent = minggong.nayin || '';
    }
    
    // 身宫纳音
    const shengong = result.shengong || {};
    const shengongNayin = document.getElementById('nayin-shengong');
    if (shengongNayin) {
        shengongNayin.textContent = shengong.nayin || '';
    }
}

// 显示神煞行
async function displayShenShaRow(result) {
    try {
        const shenshaResult = await calculateShenSha({
            year_ganzhi: result.year,
            month_ganzhi: result.month,
            day_ganzhi: result.day,
            hour_ganzhi: result.hour,
            taiyuan_ganzhi: result.taiyuan?.ganzhi || '',
            minggong_ganzhi: result.minggong?.ganzhi || '',
            shengong_ganzhi: result.shengong?.ganzhi || '',
            year_nayin: result.year_nayin || '',
            dayun: '',
            liunian: '',
            month: 1
        });
        
        const pillars = ['year', 'month', 'day', 'hour', 'taiyuan', 'minggong', 'shengong'];
        const shenshaByColumn = shenshaResult.shensha_by_column || {};
        
        pillars.forEach((pillar) => {
            const cell = document.getElementById(`shen-sha-${pillar}`);
            if (!cell) return;
            
            const shenshaList = shenshaByColumn[pillar] || [];
            
            if (shenshaList.length > 0) {
                cell.textContent = shenshaList.join(', ');
            } else {
                cell.textContent = '无神煞';
            }
        });

    } catch (error) {
        console.error('显示神煞失败:', error);
        const shenShaCells = document.querySelectorAll('.shen-sha-cell');
        shenShaCells.forEach(cell => {
            cell.textContent = '神煞计算失败';
        });
    }
}

// 显示三垣（新版本）
function displaySanyuan(result) {
    // 胎元
    const taiyuan = result.taiyuan || {};
    displaySanyuanItem('taiyuan', taiyuan);
    
    // 命宫
    const minggong = result.minggong || {};
    displaySanyuanItem('minggong', minggong);
    
    // 身宫
    const shengong = result.shengong || {};
    displaySanyuanItem('shengong', shengong);
}

// 显示单个三垣项
function displaySanyuanItem(type, data) {
    const ganzhiElement = document.getElementById(`${type}-ganzhi`);
    const nayinElement = document.getElementById(`${type}-nayin`);
    const changshengElement = document.getElementById(`${type}-changsheng`);
    
    if (ganzhiElement && data.ganzhi) {
        ganzhiElement.textContent = data.ganzhi;
    }
    
    if (nayinElement && data.nayin) {
        nayinElement.textContent = data.nayin;
    }
    
    if (changshengElement && data.changsheng) {
        const position = data.changsheng.position || '未知';
        const jiXiong = data.changsheng.ji_xiong || '未知';
        changshengElement.textContent = `${position} (${jiXiong})`;
    }
}

// 显示十二长生详细
function displayChangshengDetails(result) {
    // 自坐长生
    const selfChangsheng = document.getElementById('self-changsheng');
    if (selfChangsheng && result.nayin_changsheng) {
        const changshengData = result.nayin_changsheng;
        let html = '';
        
        // 年柱
        if (changshengData.year) {
            html += `<div>年柱: ${changshengData.year.nayin} ${changshengData.year.position} (${changshengData.year.ji_xiong})</div>`;
        }
        
        // 月柱
        if (changshengData.month) {
            html += `<div>月柱: ${changshengData.month.nayin} ${changshengData.month.position} (${changshengData.month.ji_xiong})</div>`;
        }
        
        // 日柱
        if (changshengData.day) {
            html += `<div>日柱: ${changshengData.day.nayin} ${changshengData.day.position} (${changshengData.day.ji_xiong})</div>`;
        }
        
        // 时柱
        if (changshengData.hour) {
            html += `<div>时柱: ${changshengData.hour.nayin} ${changshengData.hour.position} (${changshengData.hour.ji_xiong})</div>`;
        }
        
        selfChangsheng.innerHTML = html;
    }
    
    // 年纳音坐支长生
    const nayinChangsheng = document.getElementById('nayin-changsheng');
    if (nayinChangsheng && result.nian_gan_changsheng) {
        const changshengData = result.nian_gan_changsheng;
        let html = '';
        
        // 月支
        if (changshengData.month_zhi) {
            html += `<div>月支: ${changshengData.month_zhi.nayin} ${changshengData.month_zhi.zhi} ${changshengData.month_zhi.position} (${changshengData.month_zhi.ji_xiong})</div>`;
        }
        
        // 日支
        if (changshengData.day_zhi) {
            html += `<div>日支: ${changshengData.day_zhi.nayin} ${changshengData.day_zhi.zhi} ${changshengData.day_zhi.position} (${changshengData.day_zhi.ji_xiong})</div>`;
        }
        
        // 时支
        if (changshengData.hour_zhi) {
            html += `<div>时支: ${changshengData.hour_zhi.nayin} ${changshengData.hour_zhi.zhi} ${changshengData.hour_zhi.position} (${changshengData.hour_zhi.ji_xiong})</div>`;
        }
        
        nayinChangsheng.innerHTML = html;
    }
}

// 获取五行CSS类
function getWuxingClass(zhi) {
    // 天干地支五行映射
    const wuxingMap = {
        // 天干
        '甲': 'wood', '乙': 'wood',
        '丙': 'fire', '丁': 'fire',
        '戊': 'earth', '己': 'earth',
        '庚': 'metal', '辛': 'metal',
        '壬': 'water', '癸': 'water',
        // 地支
        '寅': 'wood', '卯': 'wood',
        '巳': 'fire', '午': 'fire',
        '辰': 'earth', '戌': 'earth', '丑': 'earth', '未': 'earth',
        '申': 'metal', '酉': 'metal',
        '亥': 'water', '子': 'water'
    };
    
    return wuxingMap[zhi] || '';
}

// ===== 自动保存记录 =====
async function saveRecord(inputData, resultData) {
    try {
        if (!db.db) await db.init();
        
        const dateType = inputData.date_type;
        const dateDisplay = dateType === 'solar' 
            ? `阳历${resultData.solar_date || ''}` 
            : `农历${resultData.lunar_date || ''}`;
        
        const record = {
            name: inputData.name || '匿名',
            gender: inputData.gender === 'male' ? '男' : '女',
            dateType: dateType,
            dateDisplay: dateDisplay,
            solarDate: resultData.solar_date || '',
            lunarDate: resultData.lunar_date || '',
            actualTime: resultData.solar_date || '', // 实际时间用于去重检查
            year: resultData.year || '',
            month: resultData.month || '',
            day: resultData.day || '',
            hour: resultData.hour || '',
            yearNayin: resultData.year_nayin || '',
            monthNayin: resultData.month_nayin || '',
            dayNayin: resultData.day_nayin || '',
            hourNayin: resultData.hour_nayin || '',
            zodiac: resultData.zodiac || '',
            fullData: resultData  // 保存完整的API结果
        };
        
        console.log('准备保存记录:', record.gender, record.actualTime, record.year, record.month, record.day, record.hour);
        
        // 检查是否重复
        const beforeCount = (await db.getAllRecords()).length;
        await db.addRecord(record);
        const afterCount = (await db.getAllRecords()).length;
        
        if (afterCount === beforeCount) {
            console.log('去重生效：记录已更新而非新增');
        } else {
            console.log('新增记录，当前总数:', afterCount);
        }
    } catch (error) {
        console.error('自动保存失败:', error);
    }
}

// ===== 从URL加载记录 =====
async function loadRecordFromUrl() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const recordId = urlParams.get('recordId');
        
        if (!recordId) {
            // 没有recordId参数，正常初始化
            return;
        }
        
        // 显示加载状态
        showLoading(true);
        
        // 确保数据库已初始化
        if (!db.db) await db.init();
        
        // 从数据库获取记录
        const record = await db.getRecord(parseInt(recordId));
        
        if (!record) {
            console.error('未找到记录:', recordId);
            showLoading(false);
            return;
        }
        
        // 如果有完整数据，直接显示
        if (record.fullData) {
            displayResult(record.fullData);
            
            // 填充表单数据（可选）
            if (record.name) {
                document.getElementById('name').value = record.name;
            }
            
            // 更新按钮状态
            const btn = document.getElementById('calculate-btn');
            btn.textContent = '已加载记录';
            btn.disabled = true;
            
            console.log('已加载记录:', record.name);
        } else {
            // 如果没有完整数据，提示用户
            console.log('记录没有完整数据，显示基本信息');
            alert('该记录没有完整的排盘数据，将显示基本信息。如需完整数据，请重新计算。');
        }
        
        showLoading(false);
    } catch (error) {
        console.error('加载记录失败:', error);
        showLoading(false);
    }
}

// ===== 大运小运流年功能 =====

// 显示大运小运流年
async function displayDayunLiunian(baziResult) {
    try {
        // 获取性别
        const gender = document.querySelector('#gender-group .btn-gender.active').dataset.value;
        
        // 获取出生信息
        const birthYear = baziResult.solar_date ? parseInt(baziResult.solar_date.split('-')[0]) : null;
        const birthMonth = baziResult.solar_date ? parseInt(baziResult.solar_date.split('-')[1]) : null;
        const birthDay = baziResult.solar_date ? parseInt(baziResult.solar_date.split('-')[2]) : null;
        
        if (!birthYear || !birthMonth || !birthDay) {
            console.error('无法获取出生日期信息');
            return;
        }
        
        // 调用大运小运API
        const dayunResult = await calculateDayun(baziResult, gender, birthYear, birthMonth, birthDay);
        
        // 存储全局大运结果供弹窗使用
        currentDayunResult = dayunResult;
        currentBirthYear = birthYear;
        
        // 调用流年API
        const liunianResult = await getCurrentLiunian();
        
        // 计算当前年龄
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        let currentAge = currentYear - birthYear;
        if (currentMonth < birthMonth || (currentMonth === birthMonth)) {
            currentAge--;
        }
        
        // 找到当前大运
        let currentDayunGanZhi = '';
        if (dayunResult.dayun && dayunResult.dayun.length > 0) {
            for (const dayun of dayunResult.dayun) {
                if (currentAge >= dayun.start_age && currentAge <= dayun.end_age) {
                    currentDayunGanZhi = dayun.ganzhi;
                    break;
                }
            }
            if (!currentDayunGanZhi && dayunResult.dayun.length > 0) {
                currentDayunGanZhi = dayunResult.dayun[0].ganzhi;
            }
        }
        
        // 获取当前小运
        let currentXiaoyunGanZhi = '';
        if (dayunResult.xiaoyun && dayunResult.xiaoyun.length > 0) {
            const currentXiaoyun = dayunResult.xiaoyun.find(x => x.age === currentAge);
            if (currentXiaoyun) {
                currentXiaoyunGanZhi = currentXiaoyun.ganzhi;
            }
            if (!currentXiaoyunGanZhi && dayunResult.xiaoyun.length > 0) {
                currentXiaoyunGanZhi = dayunResult.xiaoyun[0].ganzhi;
            }
        }
        
        // 获取当前流年干支
        const currentLiunianGanZhi = liunianResult['流年']?.ganzhi || '';
        
        // 一次性调用神煞API获取所有神煞
        const shenshaResult = await calculateShenSha({
            year_ganzhi: baziResult.year,
            month_ganzhi: baziResult.month,
            day_ganzhi: baziResult.day,
            hour_ganzhi: baziResult.hour,
            year_nayin: baziResult.year_nayin,
            dayun: currentDayunGanZhi,
            liunian: currentLiunianGanZhi,
            month: birthMonth
        });
        
        // 存储当前流运信息用于显示
        window._currentLiuyunData = {
            dayunGanZhi: currentDayunGanZhi,
            xiaoyunGanZhi: currentXiaoyunGanZhi,
            liunianGanZhi: currentLiunianGanZhi,
            dayunShensha: shenshaResult.dayun_shensha || [],
            liunianShensha: shenshaResult.liunian_shensha || [],
            xiaoyunShensha: [] // 小运神煞暂用年柱神煞
        };
        
        // 显示大运小运流年
        displayDayunResult(dayunResult, currentAge);
        displayLiunianResult(liunianResult);
        
    } catch (error) {
        console.error('获取大运小运流年失败:', error);
        // 显示错误信息
        displayDayunError();
    }
}

// 调用大运小运API
async function calculateDayun(baziResult, gender, birthYear, birthMonth, birthDay) {
    const algo = await loadAlgorithmModules();
    return algo.calculateDayun(baziResult, gender, {
        year: birthYear,
        month: birthMonth,
        day: birthDay,
        hour: 12,
        minute: 0
    });
}

// 调用流年算法
async function getCurrentLiunian() {
    const algo = await loadAlgorithmModules();
    return algo.getCurrentLiuNian();
}

// 调用多年流年算法
async function getYearsLiunian(startYear, count) {
    const algo = await loadAlgorithmModules();
    return algo.getYearsLiuNian(startYear, count);
}

// 调用神煞算法
async function calculateShenSha(params) {
    const algo = await loadAlgorithmModules();
    return algo.calculateShenSha(
        params.year_ganzhi || '',
        params.month_ganzhi || '',
        params.day_ganzhi || '',
        params.hour_ganzhi || '',
        params.taiyuan_ganzhi || '',
        params.minggong_ganzhi || '',
        params.shengong_ganzhi || '',
        params.year_nayin || '',
        params.dayun || '',
        params.liunian || '',
        params.month || 1
    );
}

// 显示大运结果
function displayDayunResult(dayunResult, currentAge) {
    const dayunSection = document.getElementById('dayun-section');
    if (!dayunSection) return;
    
    const liuyunData = window._currentLiuyunData || {};
    
    // 更新当前流运标题区
    document.getElementById('current-dayun-ganzhi').textContent = liuyunData.dayunGanZhi || '';
    document.getElementById('current-xiaoyun-ganzhi').textContent = liuyunData.xiaoyunGanZhi || '';
    document.getElementById('current-liunian-ganzhi').textContent = liuyunData.liunianGanZhi || '';
    
    // 显示大运神煞
    const dayunShenshaEl = document.getElementById('current-dayun-shensha');
    if (dayunShenshaEl) {
        const shensha = liuyunData.dayunShensha || [];
        dayunShenshaEl.innerHTML = shensha.length > 0 
            ? shensha.map(s => `<span class="shensha-item">${s}</span>`).join('')
            : '<span class="shensha-item">无</span>';
    }
    
    // 显示小运神煞 (暂用空)
    const xiaoyunShenshaEl = document.getElementById('current-xiaoyun-shensha');
    if (xiaoyunShenshaEl) {
        xiaoyunShenshaEl.innerHTML = '<span class="shensha-item">无</span>';
    }
    
    // 显示流年神煞
    const liunianShenshaEl = document.getElementById('current-liunian-shensha');
    if (liunianShenshaEl) {
        const shensha = liuyunData.liunianShensha || [];
        liunianShenshaEl.innerHTML = shensha.length > 0 
            ? shensha.map(s => `<span class="shensha-item">${s}</span>`).join('')
            : '<span class="shensha-item">无</span>';
    }
    
    // 更新大运方向
    document.getElementById('dayun-direction').textContent = dayunResult.direction || '顺行';
    
    // 生成大运横向表格
    const dayunTable = document.getElementById('dayun-table');
    if (dayunTable && dayunResult.dayun && dayunResult.dayun.length > 0) {
        const headerRow = dayunTable.querySelector('.dayun-header-row');
        const ganzhiRow = dayunTable.querySelector('.dayun-ganzhi-row');
        const nayinRow = dayunTable.querySelector('.dayun-nayin-row');
        const ageRow = dayunTable.querySelector('.dayun-age-row');
        const dateRow = dayunTable.querySelector('.dayun-date-row');
        
        // 清空现有列（保留第一列标签）
        while (headerRow.children.length > 1) headerRow.removeChild(headerRow.lastChild);
        while (ganzhiRow.children.length > 1) ganzhiRow.removeChild(ganzhiRow.lastChild);
        while (nayinRow.children.length > 1) nayinRow.removeChild(nayinRow.lastChild);
        while (ageRow.children.length > 1) ageRow.removeChild(ageRow.lastChild);
        while (dateRow.children.length > 1) dateRow.removeChild(dateRow.lastChild);
        
        // 添加大运数据列
        dayunResult.dayun.forEach((dayun, index) => {
            // 十神
            const tenGodTh = document.createElement('th');
            tenGodTh.textContent = dayun.ten_god || '';
            tenGodTh.className = 'ten-god-cell';
            headerRow.appendChild(tenGodTh);
            
            // 干支
            const ganzhiTd = document.createElement('td');
            ganzhiTd.textContent = dayun.ganzhi;
            ganzhiTd.className = 'ganzhi-cell clickable';
            ganzhiTd.dataset.index = index;
            ganzhiTd.addEventListener('click', () => showLiuyunInXiaoyunArea(index));
            ganzhiRow.appendChild(ganzhiTd);
            
            // 纳音
            const nayinTd = document.createElement('td');
            nayinTd.textContent = dayun.nayin || '';
            nayinTd.className = 'nayin-cell';
            nayinRow.appendChild(nayinTd);
            
            // 虚岁
            const ageTd = document.createElement('td');
            ageTd.textContent = `${dayun.start_age}岁`;
            ageTd.className = 'age-cell';
            ageRow.appendChild(ageTd);
            
            // 交运日期
            const dateTd = document.createElement('td');
            dateTd.textContent = dayun.start_date || '';
            dateTd.className = 'date-cell';
            dateRow.appendChild(dateTd);
        });
    }
    
    // 生成小运横向表格
    const xiaoyunTable = document.getElementById('xiaoyun-table');
    if (xiaoyunTable && dayunResult.xiaoyun && dayunResult.xiaoyun.length > 0) {
        const headerRow = xiaoyunTable.querySelector('.xiaoyun-header-row');
        const ganzhiRow = xiaoyunTable.querySelector('.xiaoyun-ganzhi-row');
        const nayinRow = xiaoyunTable.querySelector('.xiaoyun-nayin-row');
        const ageRow = xiaoyunTable.querySelector('.xiaoyun-age-row');
        
        // 清空现有列（保留第一列标签）
        while (headerRow.children.length > 1) headerRow.removeChild(headerRow.lastChild);
        while (ganzhiRow.children.length > 1) ganzhiRow.removeChild(ganzhiRow.lastChild);
        while (nayinRow.children.length > 1) nayinRow.removeChild(nayinRow.lastChild);
        while (ageRow.children.length > 1) ageRow.removeChild(ageRow.lastChild);
        
        // 添加小运数据列 (每10年显示一列)
        for (let i = 0; i < Math.min(120, dayunResult.xiaoyun.length); i += 10) {
            const xiaoyun = dayunResult.xiaoyun[i];
            
            // 十神
            const tenGodTh = document.createElement('th');
            tenGodTh.textContent = xiaoyun.ten_god || '';
            tenGodTh.className = 'ten-god-cell';
            headerRow.appendChild(tenGodTh);
            
            // 干支
            const ganzhiTd = document.createElement('td');
            ganzhiTd.textContent = xiaoyun.ganzhi;
            ganzhiTd.className = 'ganzhi-cell';
            ganzhiRow.appendChild(ganzhiTd);
            
            // 纳音
            const nayinTd = document.createElement('td');
            nayinTd.textContent = xiaoyun.nayin || '';
            nayinTd.className = 'nayin-cell';
            nayinRow.appendChild(nayinTd);
            
            // 虚岁
            const ageTd = document.createElement('td');
            ageTd.textContent = `${xiaoyun.age}岁`;
            ageTd.className = 'age-cell';
            ageRow.appendChild(ageTd);
        }
    }
    
    // 存储当前年龄并自动显示当前大运的流年小运
    window._currentAge = currentAge;
    showLiuyunInXiaoyunArea(-1);
}

// 显示流年结果
function displayLiunianResult(liunianResult) {
    const liunianSection = document.getElementById('dayun-section');
    if (!liunianSection) return;
    
    const container = liunianSection.querySelector('.dayun-placeholder');
    if (!container) return;
    
    let html = `
        <div class="dayun-item">
            <div class="dayun-title">当前流年</div>
            <div class="dayun-content">
                <div class="liunian-info">
                    <div>时间：${liunianResult['当前时间']}</div>
                    <div>农历：${liunianResult['农历']}</div>
                    <div class="liunian-detail">
                        <span>流年：${liunianResult['流年']['ganzhi']}（${liunianResult['流年']['nayin']}）</span>
                        <span class="position ${liunianResult['流年']['ji_xiong'] === '吉' ? 'ji' : liunianResult['流年']['ji_xiong'] === '平' ? 'ping' : 'xiong'}">${liunianResult['流年']['position']}</span>
                    </div>
                    <div class="liunian-detail">
                        <span>流月：${liunianResult['流月']['ganzhi']}（${liunianResult['流月']['nayin']}）</span>
                    </div>
                    <div class="liunian-detail">
                        <span>流日：${liunianResult['流日']['ganzhi']}（${liunianResult['流日']['nayin']}）</span>
                    </div>
                    <div class="liunian-shensha">
                        <span>流年神煞：${liunianResult['流年神煞'] || '无'}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML += html;
}

// 显示大运错误信息
function displayDayunError() {
    const dayunSection = document.getElementById('dayun-section');
    if (!dayunSection) return;
    
    const container = dayunSection.querySelector('.dayun-placeholder');
    if (!container) return;
    
    container.innerHTML = `
        <div class="dayun-item">
            <div class="dayun-title">大运小运流年</div>
            <div class="dayun-content error">
                <div>获取大运小运流年数据失败</div>
                <div>请确保后端服务已启动</div>
            </div>
        </div>
    `;
}

// ===== 每小时自动更新位置 =====
setInterval(async () => {
    await getLocationAndUpdate();
    console.log('每小时自动更新位置完成');
}, 3600000); // 3600000毫秒 = 1小时

// ===== 底部导航 =====
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        this.classList.add('active');
    });
});

// ===== 查找当前大运索引 =====
function findCurrentDayunIndex(currentAge) {
    if (!currentDayunResult || !currentDayunResult.dayun || currentDayunResult.dayun.length === 0) {
        return 0;
    }
    
    for (let i = 0; i < currentDayunResult.dayun.length; i++) {
        const dayun = currentDayunResult.dayun[i];
        if (currentAge >= dayun.start_age && currentAge <= dayun.end_age) {
            return i;
        }
    }
    
    return 0; // 默认返回第一个大运
}

// ===== 显示大运对应的流年小运到小运区域 =====
async function showLiuyunInXiaoyunArea(dayunIndex) {
    const xiaoyunTable = document.getElementById('xiaoyun-table');
    if (!xiaoyunTable || !currentDayunResult || !currentDayunResult.dayun) return;
    
    // 如果dayunIndex为-1，自动根据年龄查找当前大运
    if (dayunIndex === -1) {
        dayunIndex = findCurrentDayunIndex(window._currentAge || currentAge);
    }
    
    const dayun = currentDayunResult.dayun[dayunIndex];
    if (!dayun) return;
    
    // 更新选中状态
    selectedDayunIndex = dayunIndex;
    
    // 更新大运列的高亮
    const dayunTable = document.getElementById('dayun-table');
    if (dayunTable) {
        dayunTable.querySelectorAll('.ganzhi-cell').forEach((cell, idx) => {
            if (idx === dayunIndex) {
                cell.classList.add('selected');
            } else {
                cell.classList.remove('selected');
            }
        });
    }
    
    // 计算起始年份：出生年 + 开始年龄
    const startYear = currentBirthYear + dayun.start_age;
    
    // 获取10年流年数据
    const liunianData = await getYearsLiunian(startYear, 10);
    
    // 获取对应的10年小运数据
    const xiaoyunStartIndex = dayun.start_age - 1; // 小运从1岁开始，index = age - 1
    const xiaoyunData = currentDayunResult.xiaoyun.slice(xiaoyunStartIndex, xiaoyunStartIndex + 10);
    
    // 更新小运表格的标题
    const subtitleEl = document.querySelector('.xiaoyun-table-container .dayun-subtitle, .xiaoyun-table-container .xiaoyun-subtitle');
    if (subtitleEl) {
        subtitleEl.textContent = `小运流年 - ${dayun.ganzhi}`;
    }
    
    // 获取小运表格的各行
    const headerRow = xiaoyunTable.querySelector('.xiaoyun-header-row');
    const ganzhiRow = xiaoyunTable.querySelector('.xiaoyun-ganzhi-row');
    const nayinRow = xiaoyunTable.querySelector('.xiaoyun-nayin-row');
    const ageRow = xiaoyunTable.querySelector('.xiaoyun-age-row');
    
    // 清空现有列（保留第一列标签）
    while (headerRow.children.length > 1) headerRow.removeChild(headerRow.lastChild);
    while (ganzhiRow.children.length > 1) ganzhiRow.removeChild(ganzhiRow.lastChild);
    while (nayinRow.children.length > 1) nayinRow.removeChild(nayinRow.lastChild);
    while (ageRow.children.length > 1) ageRow.removeChild(ageRow.lastChild);
    
    // 添加10列流年小运数据
    for (let i = 0; i < 10; i++) {
        const year = startYear + i;
        const liunian = liunianData[i] || {};
        const xiaoyun = xiaoyunData[i] || {};
        
        // 年份（十神行）
        const tenGodTh = document.createElement('th');
        tenGodTh.textContent = year;
        tenGodTh.className = 'liuyun-year-cell';
        tenGodTh.style.color = '#2196F3';
        headerRow.appendChild(tenGodTh);
        
        // 流年（干支行）
        const liunianTd = document.createElement('td');
        liunianTd.textContent = liunian.ganzhi || '';
        liunianTd.className = 'liuyun-liunian-cell';
        liunianTd.style.color = 'var(--primary-color)';
        liunianTd.style.fontWeight = 'bold';
        ganzhiRow.appendChild(liunianTd);
        
        // 小运（纳音行）
        const xiaoyunTd = document.createElement('td');
        xiaoyunTd.textContent = xiaoyun.ganzhi || '';
        xiaoyunTd.className = 'liuyun-xiaoyun-cell';
        xiaoyunTd.style.color = '#4CAF50';
        xiaoyunTd.style.fontWeight = 'bold';
        nayinRow.appendChild(xiaoyunTd);
        
        // 虚岁
        const ageTd = document.createElement('td');
        ageTd.textContent = `${dayun.start_age + i}岁`;
        ageTd.className = 'age-cell';
        ageRow.appendChild(ageTd);
    }
}