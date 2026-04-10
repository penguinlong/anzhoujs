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
    hour: { gan: null, zhi: null },
    selectedYear: null // 用户选择的出生年份
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

// ===== 干支年份查找函数 =====

/**
 * 根据年柱干支查找所有可能的年份（默认前后120年）
 */
function findYearsByYearGanzhi(yearGanzhi, range = 120) {
    const yearGanzhiIndex = JIAZI_60.indexOf(yearGanzhi);
    if (yearGanzhiIndex === -1) return [];

    const currentYear = new Date().getFullYear();
    const years = [];

    // 遍历前后range年内所有年份
    for (let year = currentYear - range; year <= currentYear + range; year++) {
        if (year < 1900 || year > 2100) continue;

        // 计算该年的年柱干支索引（60甲子循环）
        // 甲子年 = 1984年，用1984作为基准点计算
        const baseYear = 1984;
        const baseIndex = 0; // 1984年是甲子
        const yearDiff = year - baseYear;
        const index = ((yearDiff % 60) + 60) % 60;

        if (JIAZI_60[index] === yearGanzhi) {
            years.push(year);
        }
    }

    return years.sort((a, b) => a - b);
}

/**
 * 验证指定日期的四柱是否与输入匹配
 */
async function validateBaziMatch(year, month, day, hour, minute, inputYearGanzhi, inputMonthGanzhi, inputDayGanzhi, inputHourGanzhi) {
    try {
        // 使用lunar.js计算该日期的四柱
        const solar = Solar.fromYmd(year, month, day);
        const lunar = solar.getLunar();

        const yearGz = String(lunar.getYearInGanZhi());
        const monthGz = String(lunar.getMonthInGanZhi());
        const dayGz = String(lunar.getDayInGanZhi());
        const hourGz = String(lunar.getTimeInGanZhi());

        return yearGz === inputYearGanzhi &&
               monthGz === inputMonthGanzhi &&
               dayGz === inputDayGanzhi &&
               hourGz === inputHourGanzhi;
    } catch (e) {
        console.error('validateBaziMatch error:', e);
        return false;
    }
}

/**
 * 根据完整四柱查找所有可能的日期（精确匹配）
 */
async function findExactBaziDates(yearGanzhi, monthGanzhi, dayGanzhi, hourGanzhi, range = 120) {
    const results = [];

    // 获取年柱对应的所有可能年份
    const possibleYears = findYearsByYearGanzhi(yearGanzhi, range);

    // 对每个年份，遍历每月查找匹配的日期
    for (const year of possibleYears) {
        for (let month = 1; month <= 12; month++) {
            // 计算该月的天数
            const daysInMonth = new Date(year, month, 0).getDate();

            // 检查关键日期点（利用日柱60天循环）
            const checkDays = [1, 5, 10, 15, 20, 25];
            for (const day of checkDays) {
                if (day > daysInMonth) break;

                const isMatch = await validateBaziMatch(year, month, day, 12, 0,
                    yearGanzhi, monthGanzhi, dayGanzhi, hourGanzhi);
                if (isMatch) {
                    results.push({
                        year,
                        month,
                        day,
                        hour: 12,
                        note: `${year}年${month}月${day}日`
                    });
                    break;
                }
            }
        }
    }

    return results;
}

/**
 * 根据年柱干支生成年份选择列表（用于用户手动选择）
 */
function generateYearOptionsByGanzhi(yearGanzhi) {
    const currentYear = new Date().getFullYear();
    const years = findYearsByYearGanzhi(yearGanzhi, 120);

    return years.map(year => {
        const diff = year - currentYear;
        let yearNote = '';
        if (diff > 0) {
            yearNote = `（未来${diff}年）`;
        } else if (diff < 0) {
            yearNote = `（${Math.abs(diff)}年前）`;
        } else {
            yearNote = '（今年）';
        }
        return {
            year,
            note: `${year}${yearNote}`
        };
    });
}

/**
 * 填充年份选择器
 */
function populateYearSelector(years) {
    const select = document.getElementById('ganzhi-year-select');
    const section = document.getElementById('ganzhi-year-section');
    const tip = document.getElementById('ganzhi-year-tip');

    if (!select || !section) return;

    select.innerHTML = '';

    if (years.length === 0) {
        section.style.display = 'none';
        return;
    }

    // 添加提示选项
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = '-- 请选择出生年份 --';
    placeholder.disabled = true;
    placeholder.selected = true;
    select.appendChild(placeholder);

    years.forEach(item => {
        const option = document.createElement('option');
        option.value = item.year;
        option.textContent = item.note || `${item.year}年`;
        select.appendChild(option);
    });

    tip.textContent = `年柱 ${ganzhiModalState.year.gan}${ganzhiModalState.year.zhi} 在 1900-2100 年间共有 ${years.length} 个，请选择`;
    section.style.display = 'block';
}

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

// ===== 五行颜色辅助函数 =====
function getWuxingClass(char) {
    const wuxingMap = {
        '甲': 'wood', '乙': 'wood',
        '丙': 'fire', '丁': 'fire',
        '戊': 'earth', '己': 'earth',
        '庚': 'metal', '辛': 'metal',
        '壬': 'water', '癸': 'water',
        '寅': 'wood', '卯': 'wood',
        '巳': 'fire', '午': 'fire',
        '辰': 'earth', '丑': 'earth', '未': 'earth', '戌': 'earth',
        '申': 'metal', '酉': 'metal',
        '子': 'water', '亥': 'water'
    };
    return wuxingMap[char] || '';
}

function getGanZhiWuxingClass(char) {
    const wuxingMap = {
        '甲': 'wood', '乙': 'wood',
        '丙': 'fire', '丁': 'fire',
        '戊': 'earth', '己': 'earth',
        '庚': 'metal', '辛': 'metal',
        '壬': 'water', '癸': 'water',
        '子': 'water', '丑': 'earth', '寅': 'wood', '卯': 'wood',
        '辰': 'earth', '巳': 'fire', '午': 'fire', '未': 'earth',
        '申': 'metal', '酉': 'metal', '戌': 'earth', '亥': 'water'
    };
    return wuxingMap[char] || '';
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

    // 年份选择器
    document.getElementById('ganzhi-year-select').addEventListener('change', function() {
        ganzhiModalState.selectedYear = this.value ? parseInt(this.value) : null;
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
        hour: { gan: null, zhi: null },
        selectedYear: null
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
    // 隐藏年份选择区域
    const yearSection = document.getElementById('ganzhi-year-section');
    if (yearSection) yearSection.style.display = 'none';
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

    // 当年柱选择完成后，基于年柱查找可能的年份列表供用户选择
    const yearGanzhi = (ganzhiModalState.year.gan || '') + (ganzhiModalState.year.zhi || '');
    if (yearGanzhi.length === 2) {
        const possibleYears = generateYearOptionsByGanzhi(yearGanzhi);
        populateYearSelector(possibleYears);

        if (possibleYears.length === 0) {
            tip.textContent = `年柱 ${yearGanzhi} 在 1900-2100 年间无对应年份`;
        }
    }

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

        // 获取用户选择的年份
        const selectedYear = ganzhiModalState.selectedYear;

        // 关闭弹窗并计算
        closeGanzhiModal();
        calculateFromGanzhi(yearGanzhi, monthGanzhi, dayGanzhi, hourGanzhi, selectedYear);

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
async function calculateFromGanzhi(yearGanzhi, monthGanzhi, dayGanzhi, hourGanzhi, birthYear) {
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

        // 如果选择了出生年份，设置日期信息用于大运计算
        if (birthYear) {
            // 查找该四柱对应的实际日期
            const exactDates = await findExactBaziDates(yearGanzhi, monthGanzhi, dayGanzhi, hourGanzhi, 120);
            const targetDate = exactDates.find(d => d.year === birthYear);

            if (targetDate) {
                baziResult.solar_date = `${birthYear}-${String(targetDate.month).padStart(2, '0')}-${String(targetDate.day).padStart(2, '0')}`;
                baziResult.lunar_date = '干支输入';
                baziResult.original_solar = {
                    year: birthYear,
                    month: targetDate.month,
                    day: targetDate.day,
                    hour: targetDate.hour,
                    minute: 0
                };
            } else {
                // 如果该年柱没有精确匹配，使用默认值（可计算大运但不精确）
                baziResult.solar_date = `${birthYear}-01-01`;
                baziResult.lunar_date = '干支输入（仅年柱精确）';
                baziResult.original_solar = {
                    year: birthYear,
                    month: 1,
                    day: 1,
                    hour: 12,
                    minute: 0
                };
            }
        } else {
            // 没有选择年份，只显示八字信息
            baziResult.solar_date = '干支输入';
            baziResult.lunar_date = '干支输入';
        }

        displayResult(baziResult);

        await saveRecord({
            name, gender, date_type: 'ganzhi',
            solar_year: birthYear || null,
            solar_month: birthYear ? (baziResult.original_solar?.month || 1) : null,
            solar_day: birthYear ? (baziResult.original_solar?.day || 1) : null,
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
    // 年柱
    const yearStem = document.getElementById('stem-year');
    const yearBranch = document.getElementById('branch-year');
    if (yearStem && yearBranch && result.year) {
        const yearGan = result.year.charAt(0);
        const yearZhi = result.year.charAt(1);
        yearStem.textContent = yearGan;
        yearBranch.textContent = yearZhi;
        yearStem.className = `table-cell stem-cell ${getGanZhiWuxingClass(yearGan)}`;
        yearBranch.className = `table-cell branch-cell ${getGanZhiWuxingClass(yearZhi)}`;
    }

    // 月柱
    const monthStem = document.getElementById('stem-month');
    const monthBranch = document.getElementById('branch-month');
    if (monthStem && monthBranch && result.month) {
        const monthGan = result.month.charAt(0);
        const monthZhi = result.month.charAt(1);
        monthStem.textContent = monthGan;
        monthBranch.textContent = monthZhi;
        monthStem.className = `table-cell stem-cell ${getGanZhiWuxingClass(monthGan)}`;
        monthBranch.className = `table-cell branch-cell ${getGanZhiWuxingClass(monthZhi)}`;
    }

    // 日柱
    const dayStem = document.getElementById('stem-day');
    const dayBranch = document.getElementById('branch-day');
    if (dayStem && dayBranch && result.day) {
        const dayGan = result.day.charAt(0);
        const dayZhi = result.day.charAt(1);
        dayStem.textContent = dayGan;
        dayBranch.textContent = dayZhi;
        dayStem.className = `table-cell stem-cell ${getGanZhiWuxingClass(dayGan)}`;
        dayBranch.className = `table-cell branch-cell ${getGanZhiWuxingClass(dayZhi)}`;
    }

    // 时柱
    const hourStem = document.getElementById('stem-hour');
    const hourBranch = document.getElementById('branch-hour');
    if (hourStem && hourBranch && result.hour) {
        const hourGan = result.hour.charAt(0);
        const hourZhi = result.hour.charAt(1);
        hourStem.textContent = hourGan;
        hourBranch.textContent = hourZhi;
        hourStem.className = `table-cell stem-cell ${getGanZhiWuxingClass(hourGan)}`;
        hourBranch.className = `table-cell branch-cell ${getGanZhiWuxingClass(hourZhi)}`;
    }
}

function displayNayinRow(result) {
    const nayinCells = ['year', 'month', 'day', 'hour'];
    const nayinFields = ['year_nayin', 'month_nayin', 'day_nayin', 'hour_nayin'];

    nayinCells.forEach((cell, index) => {
        const el = document.getElementById(`nayin-${cell}`);
        const nayin = result[nayinFields[index]] || '';
        if (el) {
            el.textContent = nayin;
            // 添加纳音五行颜色
            const wuxing = getNayinWuxing(nayin);
            el.className = `table-cell nayin-cell ${wuxing}`;
        }
    });
}

// 获取纳音五行的五行类别
function getNayinWuxing(nayin) {
    const nayinMap = {
        '海中金': 'metal', '炉中火': 'fire', '大林木': 'wood', '路旁土': 'earth', '剑锋金': 'metal',
        '山头火': 'fire', '涧下水': 'water', '城头土': 'earth', '白蜡金': 'metal', '杨柳木': 'wood',
        '井泉水': 'water', '屋上土': 'earth', '霹雳火': 'fire', '松柏木': 'wood', '长流水': 'water',
        '砂石土': 'earth', '山下火': 'fire', '平地木': 'wood', '壁上土': 'earth', '金箔金': 'metal',
        '覆灯火': 'fire', '天河水': 'water', '大驿土': 'earth', '钗钏金': 'metal', '桑柘木': 'wood',
        '大溪水': 'water', '砂中土': 'earth', '天上火': 'fire', '石榴木': 'wood', '大海水': 'water'
    };
    return nayinMap[nayin] || '';
}

async function displayShenShaRow(result) {
    try {
        // 获取三垣干支
        const taiyuan = result.taiyuan || {};
        const minggong = result.minggong || {};
        const shengong = result.shengong || {};

        const shenshaResult = await calculateShenSha({
            year_ganzhi: result.year,
            month_ganzhi: result.month,
            day_ganzhi: result.day,
            hour_ganzhi: result.hour,
            taiyuan_ganzhi: taiyuan.ganzhi || '',
            minggong_ganzhi: minggong.ganzhi || '',
            shengong_ganzhi: shengong.ganzhi || ''
        });

        // 显示本命四柱神煞
        ['year', 'month', 'day', 'hour'].forEach(pillar => {
            const cell = document.getElementById(`shen-sha-${pillar}`);
            const list = shenshaResult.shensha_by_column?.[pillar] || [];
            cell.textContent = list.length > 0 ? list.join(', ') : '无神煞';
        });

        // 显示三垣神煞
        ['taiyuan', 'minggong', 'shengong'].forEach(pillar => {
            const cell = document.getElementById(`shen-sha-${pillar}`);
            if (cell) {
                const list = shenshaResult.shensha_by_column?.[pillar] || [];
                cell.textContent = list.length > 0 ? list.join(', ') : '无神煞';
            }
        });
    } catch (e) {
        console.error('神煞计算失败:', e);
    }
}

// 十神计算辅助函数
function getTenGod(dayGan, otherGan) {
    const TEN_GOD_MAP = {
        '甲,甲': '比肩', '甲,乙': '劫财', '甲,丙': '食神', '甲,丁': '伤官',
        '甲,戊': '偏财', '甲,己': '正财', '甲,庚': '七杀', '甲,辛': '正官',
        '甲,壬': '偏印', '甲,癸': '正印',
        '乙,甲': '劫财', '乙,乙': '比肩', '乙,丙': '伤官', '乙,丁': '食神',
        '乙,戊': '正财', '乙,己': '偏财', '乙,庚': '正官', '乙,辛': '七杀',
        '乙,壬': '正印', '乙,癸': '偏印',
        '丙,甲': '正印', '丙,乙': '偏印', '丙,丙': '比肩', '丙,丁': '劫财',
        '丙,戊': '食神', '丙,己': '伤官', '丙,庚': '偏财', '丙,辛': '正财',
        '丙,壬': '七杀', '丙,癸': '正官',
        '丁,甲': '偏印', '丁,乙': '正印', '丁,丙': '劫财', '丁,丁': '比肩',
        '丁,戊': '伤官', '丁,己': '食神', '丁,庚': '正财', '丁,辛': '偏财',
        '丁,壬': '正官', '丁,癸': '七杀',
        '戊,甲': '七杀', '戊,乙': '正官', '戊,丙': '比肩', '戊,丁': '劫财',
        '戊,戊': '比肩', '戊,己': '劫财', '戊,庚': '食神', '戊,辛': '伤官',
        '戊,壬': '偏财', '戊,癸': '正财',
        '己,甲': '正官', '己,乙': '七杀', '己,丙': '劫财', '己,丁': '比肩',
        '己,戊': '劫财', '己,己': '比肩', '己,庚': '伤官', '己,辛': '食神',
        '己,壬': '正财', '己,癸': '偏财',
        '庚,甲': '偏财', '庚,乙': '正财', '庚,丙': '七杀', '庚,丁': '正官',
        '庚,戊': '偏印', '庚,己': '正印', '庚,庚': '比肩', '庚,辛': '劫财',
        '庚,壬': '食神', '庚,癸': '伤官',
        '辛,甲': '正财', '辛,乙': '偏财', '辛,丙': '正官', '辛,丁': '七杀',
        '辛,戊': '正印', '辛,己': '偏印', '辛,庚': '劫财', '辛,辛': '比肩',
        '辛,壬': '伤官', '辛,癸': '食神',
        '壬,甲': '食神', '壬,乙': '伤官', '壬,丙': '偏财', '壬,丁': '正财',
        '壬,戊': '七杀', '壬,己': '正官', '壬,庚': '偏印', '壬,辛': '正印',
        '壬,壬': '比肩', '壬,癸': '劫财',
        '癸,甲': '正印', '癸,乙': '偏印', '癸,丙': '正财', '癸,丁': '偏财',
        '癸,戊': '正官', '癸,己': '七杀', '癸,庚': '正印', '癸,辛': '偏印',
        '癸,壬': '伤官', '癸,癸': '比肩'
    };
    return TEN_GOD_MAP[`${dayGan},${otherGan}`] || '';
}

function displaySanyuan(result) {
    // 获取年干用于计算十神
    const yearGan = result.year ? result.year.charAt(0) : '';

    // 填充表格中的胎元、命宫、身宫列
    ['taiyuan', 'minggong', 'shengong'].forEach(type => {
        const data = result[type] || {};

        // 填充十神
        const tenGodCell = document.getElementById(`ten-god-${type}`);
        if (tenGodCell && yearGan && data.gan) {
            tenGodCell.textContent = getTenGod(yearGan, data.gan);
        }

        // 填充天干
        const stemCell = document.getElementById(`stem-${type}`);
        if (stemCell) {
            stemCell.textContent = data.gan || '';
            stemCell.className = `table-cell stem-cell ${getGanZhiWuxingClass(data.gan || '')}`;
        }

        // 填充地支
        const branchCell = document.getElementById(`branch-${type}`);
        if (branchCell) {
            branchCell.textContent = data.zhi || '';
            branchCell.className = `table-cell branch-cell ${getGanZhiWuxingClass(data.zhi || '')}`;
        }

        // 填充纳音
        const nayinCell = document.getElementById(`nayin-${type}`);
        if (nayinCell) {
            const nayin = data.nayin || '';
            nayinCell.textContent = nayin;
            nayinCell.className = `table-cell nayin-cell ${getNayinWuxing(nayin)}`;
        }
    });

    // 同时更新三垣详细区域
    ['taiyuan', 'minggong', 'shengong'].forEach(type => {
        const data = result[type] || {};
        const ganzhiEl = document.getElementById(`${type}-ganzhi`);
        const nayinEl = document.getElementById(`${type}-nayin`);
        const changshengEl = document.getElementById(`${type}-changsheng`);

        if (ganzhiEl) ganzhiEl.textContent = data.ganzhi || '';
        if (nayinEl) nayinEl.textContent = data.nayin || '';
        if (changshengEl) {
            const changshengText = data.changsheng ? `${data.changsheng.nayin || ''} ${data.changsheng.position || ''}` : '';
            changshengEl.textContent = changshengText;
        }
    });
}

function displayChangshengDetails(result) {
    const selfChangsheng = document.getElementById('self-changsheng');
    const nayinChangsheng = document.getElementById('nayin-changsheng');

    // 自坐长生
    const cs = result.nayin_changsheng || {};
    let html = '';
    ['year', 'month', 'day', 'hour'].forEach(p => {
        if (cs[p]) {
            html += `<div>${p === 'year' ? '年' : p === 'month' ? '月' : p === 'day' ? '日' : '时'}: ${cs[p].nayin} ${cs[p].position}</div>`;
        }
    });
    if (selfChangsheng) selfChangsheng.innerHTML = html;

    // 年纳音坐支长生
    const ncs = result.nian_gan_changsheng || {};
    let html2 = '';
    ['month_zhi', 'day_zhi', 'hour_zhi'].forEach(p => {
        if (ncs[p]) {
            const label = p === 'month_zhi' ? '月' : p === 'day_zhi' ? '日' : '时';
            html2 += `<div>${label}柱: ${ncs[p].nayin} ${ncs[p].position}</div>`;
        }
    });
    if (nayinChangsheng) nayinChangsheng.innerHTML = html2;
}

async function displayDayunLiunian(baziResult) {
    try {
        // 获取性别
        const gender = document.querySelector('#gender-group .btn-gender.active').dataset.value;

        // 获取出生信息
        let birthYear, birthMonth, birthDay;

        // 检查是否有有效的日期信息
        if (baziResult.original_solar) {
            birthYear = baziResult.original_solar.year;
            birthMonth = baziResult.original_solar.month;
            birthDay = baziResult.original_solar.day;
        } else if (baziResult.solar_date && baziResult.solar_date.includes('-')) {
            birthYear = parseInt(baziResult.solar_date.split('-')[0]);
            birthMonth = parseInt(baziResult.solar_date.split('-')[1]);
            birthDay = parseInt(baziResult.solar_date.split('-')[2]);
        }

        // 检查是否是干支输入模式（无真实日期）
        if (!birthYear || !birthMonth || !birthDay || baziResult.solar_date === '干支输入') {
            console.log('干支输入模式，不显示大运小运流年');
            // 隐藏大运区域或显示提示
            const dayunSection = document.getElementById('dayun-section');
            if (dayunSection) {
                dayunSection.innerHTML = `
                    <div class="section-title">大运小运流年</div>
                    <div class="dayun-placeholder">
                        <div class="dayun-item">
                            <div class="dayun-title">提示</div>
                            <div class="dayun-content">
                                <div class="liunian-info">
                                    <div>干支输入模式无真实日期，大运小运流年需要真实出生日期才能计算</div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }
            return;
        }

        // 调用大运小运API
        const dayunResult = await calculateDayun(baziResult, gender, { year: birthYear, month: birthMonth, day: birthDay, hour: 12, minute: 0 });

        // 存储全局大运结果供弹窗使用
        currentDayunResult = dayunResult;
        currentBirthYear = birthYear;

        // 调用流年API
        const liunianResult = await getCurrentLiunian();

        // 计算当前年龄
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        let age = currentYear - birthYear;
        if (currentMonth < birthMonth || (currentMonth === birthMonth)) {
            age--;
        }
        currentAge = age;

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
        }

        // 获取当前流年
        let currentLiunianGanZhi = '';
        if (liunianResult && liunianResult['流年']) {
            currentLiunianGanZhi = liunianResult['流年'].ganzhi;
        }

        // 计算当前大运神煞
        let dayunShensha = [];
        let liunianShensha = [];
        if (dayunResult.dayun && dayunResult.dayun.length > 0) {
            const algo = await loadAlgorithmModules();
            for (const dayun of dayunResult.dayun) {
                if (currentAge >= dayun.start_age && currentAge <= dayun.end_age) {
                    try {
                        const shenshaResult = await algo.calculateShenSha(
                            baziResult.year || '', baziResult.month || '', baziResult.day || '', baziResult.hour || '',
                            dayun.ganzhi || '', '', '', '', '', '', 1
                        );
                        dayunShensha = (shenshaResult || []).map(s => s.name || s);
                    } catch (e) {
                        console.error('计算大运神煞失败:', e);
                    }
                    break;
                }
            }

            // 计算流年神煞
            try {
                const liunianGan = liunianResult['流年']?.ganzhi || '';
                if (liunianGan) {
                    const shenshaResult = await algo.calculateShenSha(
                        baziResult.year || '', baziResult.month || '', baziResult.day || '', baziResult.hour || '',
                        liunianGan, '', '', '', '', '', 1
                    );
                    liunianShensha = (shenshaResult || []).map(s => s.name || s);
                }
            } catch (e) {
                console.error('计算流年神煞失败:', e);
            }
        }

        // 存储当前流运数据供显示函数使用
        window._currentLiuyunData = {
            dayunGanZhi: currentDayunGanZhi,
            xiaoyunGanZhi: currentXiaoyunGanZhi,
            liunianGanZhi: currentLiunianGanZhi,
            dayunShensha: dayunShensha,
            liunianShensha: liunianShensha
        };

        // 显示大运小运结果
        displayDayunResult(dayunResult, currentAge);
        displayLiunianResult(liunianResult);
    } catch (error) {
        console.error('显示大运小运流年失败:', error);
    }
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

    // 存储当前年龄并自动显示当前大运的流年小运
    window._currentAge = currentAge;
    showLiuyunInXiaoyunArea(-1);
}

// 查找当前大运索引
function findCurrentDayunIndex(age) {
    if (!currentDayunResult || !currentDayunResult.dayun || currentDayunResult.dayun.length === 0) {
        return 0;
    }

    for (let i = 0; i < currentDayunResult.dayun.length; i++) {
        const dayun = currentDayunResult.dayun[i];
        if (age >= dayun.start_age && age <= dayun.end_age) {
            return i;
        }
    }

    return 0;
}

// 显示大运对应的流年小运到小运区域
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
    const algo = await loadAlgorithmModules();
    const liunianData = await algo.getYearsLiuNian(startYear, 10);

    // 获取对应的10年小运数据
    const xiaoyunStartIndex = dayun.start_age - 1; // 小运从1岁开始，index = age - 1
    const xiaoyunData = currentDayunResult.xiaoyun.slice(xiaoyunStartIndex, xiaoyunStartIndex + 10);

    // 更新小运表格的标题
    const subtitleEl = document.querySelector('.xiaoyun-table-container .xiaoyun-subtitle');
    if (subtitleEl) {
        subtitleEl.textContent = `小运流年 - ${dayun.ganzhi}`;
    }

    // 获取小运表格的各行
    const liunianRow = xiaoyunTable.querySelector('.xiaoyun-liunian-row');
    const xiaoyunRow = xiaoyunTable.querySelector('.xiaoyun-xiaoyun-row');
    const nayinRow = xiaoyunTable.querySelector('.xiaoyun-nayin-row');
    const ageRow = xiaoyunTable.querySelector('.xiaoyun-age-row');

    // 清空现有列（保留第一列标签）
    if (liunianRow) while (liunianRow.children.length > 1) liunianRow.removeChild(liunianRow.lastChild);
    if (xiaoyunRow) while (xiaoyunRow.children.length > 1) xiaoyunRow.removeChild(xiaoyunRow.lastChild);
    if (nayinRow) while (nayinRow.children.length > 1) nayinRow.removeChild(nayinRow.lastChild);
    if (ageRow) while (ageRow.children.length > 1) ageRow.removeChild(ageRow.lastChild);

    // 添加10列流年小运数据
    for (let i = 0; i < 10; i++) {
        const year = startYear + i;
        const liunian = liunianData[i] || {};
        const xiaoyun = xiaoyunData[i] || {};

        // 流年（流年行）
        if (liunianRow) {
            const liunianTd = document.createElement('td');
            liunianTd.textContent = liunian.ganzhi || '';
            liunianTd.className = 'liuyun-liunian-cell';
            liunianTd.style.color = 'var(--primary-color)';
            liunianTd.style.fontWeight = 'bold';
            liunianRow.appendChild(liunianTd);
        }

        // 小运（小运行）
        if (xiaoyunRow) {
            const xiaoyunTd = document.createElement('td');
            xiaoyunTd.textContent = xiaoyun.ganzhi || '';
            xiaoyunTd.className = 'liuyun-xiaoyun-cell';
            xiaoyunTd.style.color = '#4CAF50';
            xiaoyunTd.style.fontWeight = 'bold';
            xiaoyunRow.appendChild(xiaoyunTd);
        }

        // 纳音
        if (nayinRow) {
            const nayinTd = document.createElement('td');
            nayinTd.textContent = liunian.nayin || '';
            nayinTd.className = 'nayin-cell';
            nayinRow.appendChild(nayinTd);
        }

        // 虚岁
        if (ageRow) {
            const ageTd = document.createElement('td');
            ageTd.textContent = `${dayun.start_age + i}岁`;
            ageTd.className = 'age-cell';
            ageRow.appendChild(ageTd);
        }
    }
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
                        <span>流年神煞：${(window._currentLiuyunData?.liunianShensha || []).join('、') || '无'}</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    container.innerHTML += html;
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
            fullData: resultData,
            // 保存原始输入数据
            originalInput: {
                dateType: inputData.date_type,
                ganzhi: inputData.ganzhi,
                solar_year: inputData.solar_year,
                solar_month: inputData.solar_month,
                solar_day: inputData.solar_day,
                is_leap_month: inputData.is_leap_month,
                hour: inputData.hour,
                minute: inputData.minute
            }
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
