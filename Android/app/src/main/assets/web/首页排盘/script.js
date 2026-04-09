// ===== 全局状态 =====
let currentDateType = 'solar';
let currentLongitude = 120;
let currentTimezone = 8;
let currentDayunResult = null;
let currentBirthYear = null;
let selectedDayunIndex = -1;
let currentAge = 0;

// ===== 干支弹窗状态 =====
let ganzhiModalState = {
    year: { gan: null, zhi: null },
    month: { gan: null, zhi: null },
    day: { gan: null, zhi: null },
    hour: { gan: null, zhi: null }
};

let currentPickerTarget = null; // 当前打开的选择器目标

// ===== 60甲子常量 =====
const JIAZI_60 = [
    "甲子","乙丑","丙寅","丁卯","戊辰","己巳","庚午","辛未","壬申","癸酉",
    "甲戌","乙亥","丙子","丁丑","戊寅","己卯","庚辰","辛巳","壬午","癸未",
    "甲申","乙酉","丙戌","丁亥","戊子","己丑","庚寅","辛卯","壬辰","癸巳",
    "甲午","乙未","丙申","丁酉","戊戌","己亥","庚子","辛丑","壬寅","癸卯",
    "甲辰","乙巳","丙午","丁未","戊申","己酉","庚戌","辛亥","壬子","癸丑",
    "甲寅","乙卯","丙辰","丁巳","戊午","己未","庚申","辛酉","壬戌","癸亥"
];

// ===== 五虎遁元函数 =====
function getWuHuDunYear(yearGan) {
    const wuhu_map = {
        "甲": "丙", "己": "丙",
        "乙": "戊", "庚": "戊",
        "丙": "庚", "辛": "庚",
        "丁": "壬", "壬": "壬",
        "戊": "甲", "癸": "甲"
    };
    return wuhu_map[yearGan] || "丙";
}

function getValidMonthGans(yearGan) {
    const startGan = getWuHuDunYear(yearGan);
    const gans = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
    const startIdx = gans.indexOf(startGan);
    return gans.map((_, i) => gans[(startIdx + i) % 10]);
}

// ===== 五鼠遁元函数 =====
function getWuShuDunDay(dayGan) {
    const wushu_map = {
        "甲": "甲", "己": "甲",
        "乙": "丙", "庚": "丙",
        "丙": "戊", "辛": "戊",
        "丁": "庚", "壬": "庚",
        "戊": "壬", "癸": "壬"
    };
    return wushu_map[dayGan] || "甲";
}

function getValidHourGans(dayGan) {
    const startGan = getWuShuDunDay(dayGan);
    const gans = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
    const startIdx = gans.indexOf(startGan);
    return gans.map((_, i) => gans[(startIdx + i) % 10]);
}

// ===== 60甲子校验 =====
function isValidYearGanzhi(ganzhi) {
    return JIAZI_60.includes(ganzhi);
}

function isValidDayGanzhi(ganzhi) {
    return JIAZI_60.includes(ganzhi);
}

// ===== 动态获取农历闰月 =====
function getLunarLeapMonth(year) {
    try {
        if (typeof LunarYear === 'undefined') {
            return getLunarLeapMonthFallback(year);
        }
        const lunarYear = LunarYear.fromYear(year);
        const leapMonth = lunarYear.getLeapMonth();
        return leapMonth > 0 ? leapMonth : 0;
    } catch (e) {
        return getLunarLeapMonthFallback(year);
    }
}

function getLunarLeapMonthFallback(year) {
    const leapMonths = {
        1978: 8, 1990: 6, 1993: 3, 1995: 8, 1998: 5, 2001: 4, 2004: 2, 2006: 7,
        2009: 5, 2012: 4, 2014: 9, 2017: 6, 2020: 4, 2023: 2,
        2025: 6, 2028: 5, 2031: 3, 2033: 11, 2036: 6, 2039: 5, 2042: 2
    };
    return leapMonths[year] || 0;
}

// ===== 算法模块 =====
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
    initGanzhiModal(); // 初始化干支弹窗

    await loadAlgorithmModules();
    await initTimeAndLocation();
    await loadRecordFromUrl();
});

// ===== 干支弹窗初始化 =====
function initGanzhiModal() {
    // 打开弹窗按钮
    document.getElementById('btn-open-ganzhi').addEventListener('click', openGanzhiModal);

    // 弹窗标签切换
    document.querySelectorAll('.modal-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            switchModalTab(this.dataset.tab);
        });
    });

    // 取消按钮
    document.getElementById('modal-cancel').addEventListener('click', closeGanzhiModal);

    // 确定按钮
    document.getElementById('modal-confirm').addEventListener('click', confirmGanzhiModal);

    // 弹窗外背景点击关闭
    document.getElementById('ganzhi-modal-overlay').addEventListener('click', function(e) {
        if (e.target === this) {
            closeGanzhiModal();
        }
    });

    // 四柱按钮点击
    document.querySelectorAll('.ganzhi-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const pillar = this.dataset.pillar;
            const type = this.dataset.type;
            showPickerTooltip(pillar, type, this);
        });
    });

    // 天干浮层选项点击
    document.querySelectorAll('#gan-picker-tooltip .picker-item').forEach(item => {
        item.addEventListener('click', function() {
            if (currentPickerTarget) {
                const pillar = currentPickerTarget.dataset.pillar;
                ganzhiModalState[pillar].gan = this.dataset.gan;
                updateGanzhiButtons();
                hideAllPickerTooltips();
            }
        });
    });

    // 地支浮层选项点击
    document.querySelectorAll('#zhi-picker-tooltip .picker-item').forEach(item => {
        item.addEventListener('click', function() {
            if (currentPickerTarget) {
                const pillar = currentPickerTarget.dataset.pillar;
                ganzhiModalState[pillar].zhi = this.dataset.zhi;
                updateGanzhiButtons();
                hideAllPickerTooltips();

                // 检查组合合法性
                checkGanzhiCombination(pillar);
            }
        });
    });

    // 点击其他地方关闭浮层
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.ganzhi-btn') && !e.target.closest('.picker-tooltip')) {
            hideAllPickerTooltips();
        }
    });

    // 初始化弹窗内日期选择器
    initModalDateSelectors();
}

// ===== 打开干支弹窗 =====
function openGanzhiModal() {
    // 初始化弹窗状态
    ganzhiModalState = {
        year: { gan: null, zhi: null },
        month: { gan: null, zhi: null },
        day: { gan: null, zhi: null },
        hour: { gan: null, zhi: null }
    };

    // 默认选中干支标签
    switchModalTab('ganzhi');

    // 显示弹窗
    document.getElementById('ganzhi-modal-overlay').classList.add('active');
}

// ===== 关闭干支弹窗 =====
function closeGanzhiModal() {
    document.getElementById('ganzhi-modal-overlay').classList.remove('active');
    hideAllPickerTooltips();
}

// ===== 切换弹窗标签 =====
function switchModalTab(tab) {
    document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.modal-tab[data-tab="${tab}"]`).classList.add('active');

    document.querySelectorAll('.modal-content').forEach(c => c.style.display = 'none');
    document.getElementById(`modal-content-${tab}`).style.display = 'block';
}

// ===== 显示选择浮层 =====
function showPickerTooltip(pillar, type, targetBtn) {
    hideAllPickerTooltips();

    const tooltip = document.getElementById(type === 'gan' ? 'gan-picker-tooltip' : 'zhi-picker-tooltip');
    const rect = targetBtn.getBoundingClientRect();

    // 定位浮层
    tooltip.style.left = rect.left + 'px';
    tooltip.style.top = (rect.top - 10) + 'px';

    // 调整位置确保不超出屏幕
    const tooltipRect = tooltip.getBoundingClientRect();
    if (tooltipRect.right > window.innerWidth) {
        tooltip.style.left = (window.innerWidth - tooltipRect.width - 10) + 'px';
    }
    if (tooltipRect.top < 0) {
        tooltip.style.top = rect.bottom + 10 + 'px';
    }

    tooltip.classList.add('active');
    currentPickerTarget = targetBtn;

    // 更新选中状态
    updatePickerTooltipSelection(pillar, type);
}

// ===== 更新浮层选中状态 =====
function updatePickerTooltipSelection(pillar, type) {
    const selected = type === 'gan' ? ganzhiModalState[pillar].gan : ganzhiModalState[pillar].zhi;

    const tooltip = document.getElementById(type === 'gan' ? 'gan-picker-tooltip' : 'zhi-picker-tooltip');
    tooltip.querySelectorAll('.picker-item').forEach(item => {
        item.classList.remove('selected');
        const value = type === 'gan' ? item.dataset.gan : item.dataset.zhi;
        if (value === selected) {
            item.classList.add('selected');
        }
    });
}

// ===== 隐藏所有选择浮层 =====
function hideAllPickerTooltips() {
    document.querySelectorAll('.picker-tooltip').forEach(t => t.classList.remove('active'));
    currentPickerTarget = null;
}

// ===== 更新四柱按钮显示 =====
function updateGanzhiButtons() {
    ['year', 'month', 'day', 'hour'].forEach(pillar => {
        const ganBtn = document.querySelector(`.gan-btn[data-pillar="${pillar}"]`);
        const zhiBtn = document.querySelector(`.zhi-btn[data-pillar="${pillar}"]`);

        if (ganBtn) {
            ganBtn.textContent = ganzhiModalState[pillar].gan || '-';
            ganBtn.classList.toggle('selected', !!ganzhiModalState[pillar].gan);
        }
        if (zhiBtn) {
            zhiBtn.textContent = ganzhiModalState[pillar].zhi || '-';
            zhiBtn.classList.toggle('selected', !!ganzhiModalState[pillar].zhi);
        }
    });
}

// ===== 检查干支组合合法性 =====
function checkGanzhiCombination(pillar) {
    const tip = document.getElementById('modal-ganzhi-tip');
    const confirmBtn = document.getElementById('modal-confirm');

    const yearGan = ganzhiModalState.year.gan;
    const monthGan = ganzhiModalState.month.gan;
    const dayGan = ganzhiModalState.day.gan;
    const hourGan = ganzhiModalState.hour.gan;

    // 检查年柱
    if (pillar === 'year' || pillar === 'month') {
        const yearGanzhi = (ganzhiModalState.year.gan || '') + (ganzhiModalState.year.zhi || '');
        if (yearGanzhi.length === 2 && !isValidYearGanzhi(yearGanzhi)) {
            tip.textContent = '年柱必须在60甲子范围内';
            return false;
        }
    }

    // 检查日柱
    if (pillar === 'day' || pillar === 'hour') {
        const dayGanzhi = (ganzhiModalState.day.gan || '') + (ganzhiModalState.day.zhi || '');
        if (dayGanzhi.length === 2 && !isValidDayGanzhi(dayGanzhi)) {
            tip.textContent = '日柱必须在60甲子范围内';
            return false;
        }
    }

    // 五虎遁检查
    if (pillar === 'year' || pillar === 'month') {
        if (yearGan && monthGan) {
            const validGans = getValidMonthGans(yearGan);
            if (!validGans.includes(monthGan)) {
                tip.textContent = '月干违反五虎遁规则';
                ganzhiModalState.month.gan = null;
                updateGanzhiButtons();
                return false;
            }
        }
    }

    // 五鼠遁检查
    if (pillar === 'day' || pillar === 'hour') {
        if (dayGan && hourGan) {
            const validGans = getValidHourGans(dayGan);
            if (!validGans.includes(hourGan)) {
                tip.textContent = '时干违反五鼠遁规则';
                ganzhiModalState.hour.gan = null;
                updateGanzhiButtons();
                return false;
            }
        }
    }

    tip.textContent = '';
    return true;
}

// ===== 确认干支选择 =====
function confirmGanzhiModal() {
    const tip = document.getElementById('modal-ganzhi-tip');

    // 获取当前标签页
    const activeTab = document.querySelector('.modal-tab.active').dataset.tab;

    if (activeTab === 'ganzhi') {
        // 干支模式
        const yearGanzhi = (ganzhiModalState.year.gan || '') + (ganzhiModalState.year.zhi || '');
        const monthGanzhi = (ganzhiModalState.month.gan || '') + (ganzhiModalState.month.zhi || '');
        const dayGanzhi = (ganzhiModalState.day.gan || '') + (ganzhiModalState.day.zhi || '');
        const hourGanzhi = (ganzhiModalState.hour.gan || '') + (ganzhiModalState.hour.zhi || '');

        if (!yearGanzhi || !monthGanzhi || !dayGanzhi || !hourGanzhi) {
            tip.textContent = '请选择完整的四柱';
            return;
        }

        if (!isValidYearGanzhi(yearGanzhi)) {
            tip.textContent = '年柱必须在60甲子范围内';
            return;
        }

        if (!isValidDayGanzhi(dayGanzhi)) {
            tip.textContent = '日柱必须在60甲子范围内';
            return;
        }

        // 校验五虎遁
        const validMonthGans = getValidMonthGans(ganzhiModalState.year.gan);
        if (!validMonthGans.includes(ganzhiModalState.month.gan)) {
            tip.textContent = '月干违反五虎遁规则';
            return;
        }

        // 校验五鼠遁
        const validHourGans = getValidHourGans(ganzhiModalState.day.gan);
        if (!validHourGans.includes(ganzhiModalState.hour.gan)) {
            tip.textContent = '时干违反五鼠遁规则';
            return;
        }

        // 关闭弹窗并计算
        closeGanzhiModal();
        calculateFromGanzhi(yearGanzhi, monthGanzhi, dayGanzhi, hourGanzhi);

    } else if (activeTab === 'solar') {
        // 公历模式
        const year = parseInt(document.getElementById('modal-year-select').value);
        const month = parseInt(document.getElementById('modal-month-select').value);
        const day = parseInt(document.getElementById('modal-day-select').value);
        const hour = parseInt(document.getElementById('modal-hour-select').value) || 0;
        const minute = parseInt(document.getElementById('modal-minute-select').value) || 0;

        if (!year || !month || !day) {
            tip.textContent = '请选择完整日期';
            return;
        }

        closeGanzhiModal();
        calculateFromSolar(year, month, day, hour, minute);

    } else if (activeTab === 'lunar') {
        // 农历模式
        const year = parseInt(document.getElementById('modal-lunar-year-select').value);
        const monthValue = parseInt(document.getElementById('modal-lunar-month-select').value);
        const day = parseInt(document.getElementById('modal-lunar-day-select').value);
        const hour = parseInt(document.getElementById('modal-lunar-hour-select').value) || 0;
        const minute = parseInt(document.getElementById('modal-lunar-minute-select').value) || 0;

        if (!year || !monthValue || !day) {
            tip.textContent = '请选择完整日期';
            return;
        }

        const isLeapMonth = monthValue < 0;
        const absMonth = Math.abs(monthValue);

        closeGanzhiModal();
        calculateFromLunar(year, absMonth, day, hour, minute, isLeapMonth);
    }
}

// ===== 从公历计算 =====
async function calculateFromSolar(year, month, day, hour, minute) {
    const name = document.getElementById('name').value || '匿名';
    const gender = document.querySelector('#gender-group .btn-gender.active').dataset.value;
    const longitude = parseFloat(document.getElementById('longitude').value) || 120;
    const useTrueSolar = document.getElementById('true-solar').checked;

    try {
        showLoading(true);
        const algo = await loadAlgorithmModules();

        const baziResult = algo.calculateBazi(year, month, day, hour, minute, {
            isLunar: false,
            isLeapMonth: false,
            longitude,
            useTrueSolar
        });

        baziResult.name = name;
        displayResult(baziResult);
        await saveRecord({ name, gender, date_type: 'solar', solar_year: year, solar_month: month, solar_day: day, hour, minute }, baziResult);

    } catch (error) {
        alert('计算失败: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// ===== 从农历计算 =====
async function calculateFromLunar(year, month, day, hour, minute, isLeapMonth) {
    const name = document.getElementById('name').value || '匿名';
    const gender = document.querySelector('#gender-group .btn-gender.active').dataset.value;
    const longitude = parseFloat(document.getElementById('longitude').value) || 120;
    const useTrueSolar = document.getElementById('true-solar').checked;

    try {
        showLoading(true);
        const algo = await loadAlgorithmModules();

        const baziResult = algo.calculateBazi(year, month, day, hour, minute, {
            isLunar: true,
            isLeapMonth,
            longitude,
            useTrueSolar
        });

        baziResult.name = name;
        displayResult(baziResult);
        await saveRecord({ name, gender, date_type: 'lunar', lunar_year: year, lunar_month: month, lunar_day: day, is_leap_month: isLeapMonth, hour, minute }, baziResult);

    } catch (error) {
        alert('计算失败: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// ===== 从干支计算 =====
async function calculateFromGanzhi(yearGanzhi, monthGanzhi, dayGanzhi, hourGanzhi) {
    const name = document.getElementById('name').value || '匿名';
    const gender = document.querySelector('#gender-group .btn-gender.active').dataset.value;

    try {
        showLoading(true);
        const algo = await loadAlgorithmModules();

        const baziResult = algo.calculateBazi(0, 0, 0, 0, 0, {
            isLunar: false,
            isGanzhi: true,
            ganzhiInput: {
                year: yearGanzhi,
                month: monthGanzhi,
                day: dayGanzhi,
                hour: hourGanzhi
            }
        });

        baziResult.name = name;
        baziResult.solar_date = '干支输入';
        baziResult.lunar_date = '干支输入';

        displayResult(baziResult);

        await saveRecord({
            name, gender, date_type: 'ganzhi',
            ganzhi: { year: yearGanzhi, month: monthGanzhi, day: dayGanzhi, hour: hourGanzhi }
        }, baziResult);

    } catch (error) {
        alert('计算失败: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// ===== 初始化弹窗内日期选择器 =====
function initModalDateSelectors() {
    // 公历
    const modalYearSelect = document.getElementById('modal-year-select');
    const modalMonthSelect = document.getElementById('modal-month-select');
    const modalDaySelect = document.getElementById('modal-day-select');

    const currentYear = new Date().getFullYear();
    for (let y = 1900; y <= 2077; y++) {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y + '年';
        modalYearSelect.appendChild(opt);
    }

    for (let m = 1; m <= 12; m++) {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m + '月';
        modalMonthSelect.appendChild(opt);
    }

    for (let d = 1; d <= 31; d++) {
        const opt = document.createElement('option');
        opt.value = d;
        opt.textContent = d + '日';
        modalDaySelect.appendChild(opt);
    }

    modalYearSelect.value = currentYear;
    modalMonthSelect.value = new Date().getMonth() + 1;
    modalDaySelect.value = new Date().getDate();

    // 农历
    const modalLunarYearSelect = document.getElementById('modal-lunar-year-select');
    const modalLunarMonthSelect = document.getElementById('modal-lunar-month-select');
    const modalLunarDaySelect = document.getElementById('modal-lunar-day-select');

    for (let y = 1900; y <= 2077; y++) {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y + '年';
        modalLunarYearSelect.appendChild(opt);
    }

    modalLunarYearSelect.addEventListener('change', updateModalLunarMonths);
    modalLunarMonthSelect.addEventListener('change', updateModalLunarDays);

    modalLunarYearSelect.value = currentYear;
    updateModalLunarMonths();
    modalLunarDaySelect.value = 1;
}

function updateModalLunarMonths() {
    const year = parseInt(document.getElementById('modal-lunar-year-select').value);
    const monthSelect = document.getElementById('modal-lunar-month-select');
    const leapMonth = getLunarLeapMonth(year);

    monthSelect.innerHTML = '';

    for (let m = 1; m <= 12; m++) {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m + '月';
        monthSelect.appendChild(opt);

        if (leapMonth === m) {
            const leapOpt = document.createElement('option');
            leapOpt.value = -m;
            leapOpt.textContent = '闰' + m + '月';
            monthSelect.appendChild(leapOpt);
        }
    }

    updateModalLunarDays();
}

function updateModalLunarDays() {
    const year = parseInt(document.getElementById('modal-lunar-year-select').value);
    const monthValue = parseInt(document.getElementById('modal-lunar-month-select').value);
    const daySelect = document.getElementById('modal-lunar-day-select');
    const absMonth = Math.abs(monthValue);

    let days = 29;
    if (absMonth > 0) {
        days = absMonth % 2 === 0 ? 30 : 29;
    }

    daySelect.innerHTML = '';
    for (let d = 1; d <= days; d++) {
        const opt = document.createElement('option');
        opt.value = d;
        opt.textContent = d + '日';
        daySelect.appendChild(opt);
    }
}

// ===== 原有功能保留 =====

function initDateSelectors() {
    const yearSelect = document.getElementById('year-select');
    const monthSelect = document.getElementById('month-select');
    const daySelect = document.getElementById('day-select');

    const currentYear = new Date().getFullYear();
    for (let y = 1900; y <= 2077; y++) {
        const option = document.createElement('option');
        option.value = y;
        option.textContent = y + '年';
        yearSelect.appendChild(option);
    }

    for (let m = 1; m <= 12; m++) {
        const option = document.createElement('option');
        option.value = m;
        option.textContent = m + '月';
        monthSelect.appendChild(option);
    }

    for (let d = 1; d <= 31; d++) {
        const option = document.createElement('option');
        option.value = d;
        option.textContent = d + '日';
        daySelect.appendChild(option);
    }

    yearSelect.addEventListener('change', updateMonths);
    monthSelect.addEventListener('change', updateDays);
}

function updateMonths() {
    const monthSelect = document.getElementById('month-select');
    monthSelect.innerHTML = '';

    if (currentDateType === 'lunar') {
        const year = parseInt(document.getElementById('year-select').value);
        const leapMonth = getLunarLeapMonth(year);

        for (let m = 1; m <= 12; m++) {
            const option = document.createElement('option');
            option.value = m;
            option.textContent = m + '月';
            monthSelect.appendChild(option);

            if (leapMonth === m) {
                const leapOption = document.createElement('option');
                leapOption.value = -m;
                leapOption.textContent = '闰' + m + '月';
                monthSelect.appendChild(leapOption);
            }
        }
    } else {
        for (let m = 1; m <= 12; m++) {
            const option = document.createElement('option');
            option.value = m;
            option.textContent = m + '月';
            monthSelect.appendChild(option);
        }
    }
    updateDays();
}

function updateDays() {
    const yearSelect = document.getElementById('year-select');
    const monthSelect = document.getElementById('month-select');
    const daySelect = document.getElementById('day-select');

    const year = parseInt(yearSelect.value);
    const month = parseInt(monthSelect.value);
    const absMonth = Math.abs(month);

    let days = 31;
    if (currentDateType === 'lunar') {
        days = absMonth % 2 === 0 ? 30 : 29;
    } else {
        if ([4, 6, 9, 11].includes(absMonth)) days = 30;
        if (absMonth === 2) days = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0) ? 29 : 28;
    }

    daySelect.innerHTML = '';
    for (let d = 1; d <= days; d++) {
        const option = document.createElement('option');
        option.value = d;
        option.textContent = d + '日';
        daySelect.appendChild(option);
    }
}

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

function initCalculateButton() {
    document.getElementById('calculate-btn').addEventListener('click', calculateBazi);
}

function initDefaultDate() {
    const now = new Date();
    document.getElementById('year-select').value = now.getFullYear();
    document.getElementById('month-select').value = now.getMonth() + 1;
    document.getElementById('day-select').value = now.getDate();
    document.getElementById('hour').value = now.getHours();
}

async function calculateBazi() {
    const name = document.getElementById('name').value || '匿名';
    const gender = document.querySelector('#gender-group .btn-gender.active').dataset.value;
    const year = parseInt(document.getElementById('year-select').value);
    const monthValue = parseInt(document.getElementById('month-select').value);
    const day = parseInt(document.getElementById('day-select').value);
    const hour = parseInt(document.getElementById('hour').value) || 0;
    const minute = parseInt(document.getElementById('minute').value) || 0;
    const longitude = parseFloat(document.getElementById('longitude').value) || 120;
    const useTrueSolar = document.getElementById('true-solar').checked;

    if (!year || !monthValue || !day) {
        alert('请选择完整日期');
        return;
    }

    const isLunar = currentDateType === 'lunar';
    const isLeapMonth = monthValue < 0;
    const month = Math.abs(monthValue);

    try {
        showLoading(true);
        const algo = await loadAlgorithmModules();

        const baziResult = algo.calculateBazi(year, month, day, hour, minute, {
            isLunar,
            isLeapMonth,
            longitude,
            useTrueSolar
        });

        baziResult.name = name;
        displayResult(baziResult);
        await saveRecord({ name, gender, date_type: currentDateType, solar_year: year, solar_month: month, solar_day: day, is_leap_month: isLeapMonth, hour, minute }, baziResult);

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

async function displayResult(result) {
    const resultCard = document.getElementById('result-card');
    resultCard.style.display = 'block';

    displayHeaderInfo(result);
    await displayPaiPanTable(result);
    displaySanyuan(result);
    displayChangshengDetails(result);
    await displayDayunLiunian(result);

    resultCard.scrollIntoView({ behavior: 'smooth' });
}

function displayHeaderInfo(result) {
    document.getElementById('info-name').textContent = result.name || '匿名';
    document.getElementById('info-solar').textContent = result.solar_date || '';
    document.getElementById('info-lunar').textContent = result.lunar_date || '';
    document.getElementById('info-solar-term').textContent = result.solar_term || '';
}

async function displayPaiPanTable(result) {
    displayTenGods(result);
    displayHeavenlyStemAndEarthlyBranch(result);
    displayNayinRow(result);
    await displayShenShaRow(result);
}

function displayTenGods(result) {
    const tenGods = result.ten_gods || {};
    document.getElementById('ten-god-year').textContent = tenGods.year_gan || '';
    document.getElementById('ten-god-month').textContent = tenGods.month_gan || '';
    document.getElementById('ten-god-day').textContent = tenGods.day_gan || '';
    document.getElementById('ten-god-hour').textContent = tenGods.hour_gan || '';
}

function displayHeavenlyStemAndEarthlyBranch(result) {
    const pillars = [
        { id: 'year', data: result.year },
        { id: 'month', data: result.month },
        { id: 'day', data: result.day },
        { id: 'hour', data: result.hour }
    ];

    pillars.forEach(p => {
        if (p.data) {
            document.getElementById(`stem-${p.id}`).textContent = p.data.charAt(0);
            document.getElementById(`branch-${p.id}`).textContent = p.data.charAt(1);
        }
    });
}

function displayNayinRow(result) {
    document.getElementById('nayin-year').textContent = result.year_nayin || '';
    document.getElementById('nayin-month').textContent = result.month_nayin || '';
    document.getElementById('nayin-day').textContent = result.day_nayin || '';
    document.getElementById('nayin-hour').textContent = result.hour_nayin || '';
}

async function displayShenShaRow(result) {
    try {
        const shenshaResult = await calculateShenSha({
            year_ganzhi: result.year,
            month_ganzhi: result.month,
            day_ganzhi: result.day,
            hour_ganzhi: result.hour
        });

        ['year', 'month', 'day', 'hour'].forEach(pillar => {
            const cell = document.getElementById(`shen-sha-${pillar}`);
            const list = shenshaResult.shensha_by_column?.[pillar] || [];
            cell.textContent = list.length > 0 ? list.join(', ') : '无神煞';
        });
    } catch (e) {
        console.error('神煞计算失败:', e);
    }
}

function displaySanyuan(result) {
    ['taiyuan', 'minggong', 'shengong'].forEach(type => {
        const data = result[type] || {};
        const prefix = type === 'taiyuan' ? '胎元' : type === 'minggong' ? '命宫' : '身宫';
        document.getElementById(`${type}-ganzhi`).textContent = data.ganzhi || '';
        document.getElementById(`${type}-nayin`).textContent = data.nayin || '';
    });
}

function displayChangshengDetails(result) {
    const selfChangsheng = document.getElementById('self-changsheng');
    const cs = result.nayin_changsheng || {};
    let html = '';
    ['year', 'month', 'day', 'hour'].forEach(p => {
        if (cs[p]) {
            html += `<div>${p === 'year' ? '年' : p === 'month' ? '月' : p === 'day' ? '日' : '时'}: ${cs[p].nayin} ${cs[p].position}</div>`;
        }
    });
    selfChangsheng.innerHTML = html;
}

async function displayDayunLiunian(result) {
    const gender = document.querySelector('#gender-group .btn-gender.active').dataset.value;
    const birthYear = result.solar_date?.split('-')[0];

    if (!birthYear) return;

    const dayunResult = await calculateDayun(result, gender, { year: parseInt(birthYear), month: 1, day: 1, hour: 12, minute: 0 });
    currentDayunResult = dayunResult;
    currentBirthYear = parseInt(birthYear);

    const liunianResult = await getCurrentLiunian();
    displayDayunResult(dayunResult, currentAge);
    displayLiunianResult(liunianResult);
}

async function calculateDayun(baziResult, gender, birth) {
    const algo = await loadAlgorithmModules();
    return algo.calculateDayun(baziResult, gender, birth);
}

async function getCurrentLiunian() {
    const algo = await loadAlgorithmModules();
    return algo.getCurrentLiuNian();
}

async function calculateShenSha(params) {
    const algo = await loadAlgorithmModules();
    return algo.calculateShenSha(
        params.year_ganzhi || '', params.month_ganzhi || '', params.day_ganzhi || '', params.hour_ganzhi || '',
        '', '', '', '', '', '', 1
    );
}

function displayDayunResult(dayunResult, currentAge) {
    document.getElementById('dayun-direction').textContent = dayunResult.direction || '顺行';

    const dayunTable = document.getElementById('dayun-table');
    const rows = dayunTable.querySelectorAll('tbody tr');

    rows.forEach(row => {
        while (row.children.length > 1) row.removeChild(row.lastChild);
    });

    (dayunResult.dayun || []).forEach(dayun => {
        rows[0].innerHTML += `<td>${dayun.ten_god || ''}</td>`;
        rows[1].innerHTML += `<td>${dayun.ganzhi}</td>`;
        rows[2].innerHTML += `<td>${dayun.nayin || ''}</td>`;
        rows[3].innerHTML += `<td>${dayun.start_age}岁</td>`;
        rows[4].innerHTML += `<td>${dayun.start_date || ''}</td>`;
    });
}

function displayLiunianResult(liunianResult) {
    const container = document.querySelector('.dayun-placeholder');
    if (!container) return;
    container.innerHTML = `
        <div class="dayun-item">
            <div class="dayun-title">当前流年</div>
            <div class="dayun-content">
                <div>流年: ${liunianResult['流年']?.ganzhi || ''}</div>
                <div>流月: ${liunianResult['流月']?.ganzhi || ''}</div>
            </div>
        </div>
    `;
}

async function saveRecord(inputData, resultData) {
    try {
        if (!db.db) await db.init();
        const record = {
            name: inputData.name || '匿名',
            gender: inputData.gender === 'male' ? '男' : '女',
            dateType: inputData.date_type,
            solarDate: resultData.solar_date || '',
            lunarDate: resultData.lunar_date || '',
            year: resultData.year || '',
            month: resultData.month || '',
            day: resultData.day || '',
            hour: resultData.hour || '',
            fullData: resultData
        };
        await db.addRecord(record);
    } catch (e) {
        console.error('保存失败:', e);
    }
}

async function loadRecordFromUrl() {}

async function initTimeAndLocation() {
    updateCurrentTime();
    setInterval(updateCurrentTime, 60000);
    await getLocationAndUpdate();

    document.getElementById('refresh-location')?.addEventListener('click', async () => {
        await getLocationAndUpdate();
    });
}

function updateCurrentTime() {
    const now = new Date();
    const timeEl = document.getElementById('current-time');
    if (timeEl) timeEl.textContent = now.toLocaleString('zh-CN');
}

async function getLocationAndUpdate() {
    const locationEl = document.getElementById('current-location');
    if (!navigator.geolocation) {
        if (locationEl) locationEl.textContent = '浏览器不支持定位';
        return;
    }
    if (locationEl) locationEl.textContent = '定位中...';

    try {
        const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
        });
        currentLongitude = pos.coords.longitude.toFixed(2);
        const lat = pos.coords.latitude.toFixed(2);
        if (locationEl) locationEl.textContent = `经度: ${currentLongitude}° 纬度: ${lat}°`;
        const lonInput = document.getElementById('longitude');
        if (lonInput) lonInput.value = currentLongitude;
    } catch (e) {
        if (locationEl) locationEl.textContent = '定位失败，使用默认经度';
    }
}

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        this.classList.add('active');
    });
});
