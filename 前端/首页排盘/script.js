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

// ===== 五行颜色 =====
const WUXING_COLORS = {
    '木': 'wuxing-mu',
    '火': 'wuxing-huo',
    '土': 'wuxing-tu',
    '金': 'wuxing-jin',
    '水': 'wuxing-shui'
};

// ===== 五行对应的天干 =====
const GAN_WUXING = {
    '甲': '木', '乙': '木',
    '丙': '火', '丁': '火',
    '戊': '土', '己': '土',
    '庚': '金', '辛': '金',
    '壬': '水', '癸': '水'
};

// ===== 地支五行 =====
const ZHI_WUXING = {
    '子': '水', '丑': '土', '寅': '木', '卯': '木',
    '辰': '土', '巳': '火', '午': '火', '未': '土',
    '申': '金', '酉': '金', '戌': '土', '亥': '水'
};

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

// ===== 十神计算函数 =====
function getTenGod(baseGan, targetGan) {
    if (!baseGan || !targetGan) return '';

    // 天干五行属性映射
    const ganWuxing = {
        '甲': '木', '乙': '木',
        '丙': '火', '丁': '火',
        '戊': '土', '己': '土',
        '庚': '金', '辛': '金',
        '壬': '水', '癸': '水'
    };

    // 天干阴阳属性映射 (甲丙戊庚壬为阳, 乙丁己辛癸为阴)
    const ganYinyang = {
        '甲': '阳', '乙': '阴',
        '丙': '阳', '丁': '阴',
        '戊': '阳', '己': '阴',
        '庚': '阳', '辛': '阴',
        '壬': '阳', '癸': '阴'
    };

    const baseWuxing = ganWuxing[baseGan];
    const targetWuxing = ganWuxing[targetGan];
    const baseYinyang = ganYinyang[baseGan];
    const targetYinyang = ganYinyang[targetGan];

    if (!baseWuxing || !targetWuxing) return '';

    // 相同五行
    if (baseWuxing === targetWuxing) {
        if (baseYinyang === targetYinyang) {
            return '比肩';
        } else {
            return '劫财';
        }
    }

    // 五行生克关系
    const shengke = {
        '木': {'生': '火', '克': '土', '被生': '水', '被克': '金'},
        '火': {'生': '土', '克': '金', '被生': '木', '被克': '水'},
        '土': {'生': '金', '克': '水', '被生': '火', '被克': '木'},
        '金': {'生': '水', '克': '木', '被生': '土', '被克': '火'},
        '水': {'生': '木', '克': '火', '被生': '金', '被克': '土'}
    };

    const relations = shengke[baseWuxing];

    // 目标生我 (印星)
    if (targetWuxing === relations['被生']) {
        if (baseYinyang === targetYinyang) {
            return '偏印';
        } else {
            return '正印';
        }
    }

    // 我生目标 (食伤)
    if (targetWuxing === relations['生']) {
        if (baseYinyang === targetYinyang) {
            return '食神';
        } else {
            return '伤官';
        }
    }

    // 目标克我 (官杀)
    if (targetWuxing === relations['被克']) {
        if (baseYinyang === targetYinyang) {
            return '七杀';
        } else {
            return '正官';
        }
    }

    // 我克目标 (财星)
    if (targetWuxing === relations['克']) {
        if (baseYinyang === targetYinyang) {
            return '偏财';
        } else {
            return '正财';
        }
    }

    return '';
}

// ===== 60甲子校验 =====
function isValidYearGanzhi(ganzhi) {
    return JIAZI_60.includes(ganzhi);
}

function isValidDayGanzhi(ganzhi) {
    return JIAZI_60.includes(ganzhi);
}

// ===== 时柱干支选项（五鼠遁联动校验）=====
function getValidHourGanzhiOptions(dayGan) {
    if (!dayGan) return JIAZI_60;
    const validGans = getValidHourGans(dayGan);
    return JIAZI_60.filter(gz => validGans.includes(gz[0]));
}

// ===== 月柱干支选项（五虎遁联动校验）=====
function getValidMonthGanzhiOptions(yearGan) {
    if (!yearGan) return JIAZI_60;
    const validGans = getValidMonthGans(yearGan);
    return JIAZI_60.filter(gz => validGans.includes(gz[0]));
}

// ===== 更新天干选择器的禁用状态（联动校验）=====
function updateGanPickerDisabledStates(pillar) {
    const tooltip = document.getElementById('gan-picker-tooltip');
    if (!tooltip) return;

    let validGans = null;

    if (pillar === 'month') {
        // 月柱天干根据年柱天干过滤（五虎遁）
        const yearGan = ganzhiModalState.year.gan;
        if (yearGan) {
            validGans = getValidMonthGans(yearGan);
        }
    } else if (pillar === 'hour') {
        // 时柱天干根据日柱天干过滤（五鼠遁）
        const dayGan = ganzhiModalState.day.gan;
        if (dayGan) {
            validGans = getValidHourGans(dayGan);
        }
    }

    // 更新禁用状态
    tooltip.querySelectorAll('.picker-item').forEach(item => {
        const gan = item.dataset.gan;
        if (validGans) {
            item.classList.toggle('disabled', !validGans.includes(gan));
        } else {
            item.classList.remove('disabled');
        }
    });
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
    try {
        const [baziModule, liunianModule, shenshaModule, dayunModule] = await Promise.all([
            import(basePath + 'bazi.js'),
            import(basePath + 'liunian.js'),
            import(basePath + 'shensha.js'),
            import(basePath + 'dayun.js')
        ]);
        console.log('Algorithm modules loaded:', {
            bazi: baziModule,
            liunian: liunianModule,
            shensha: shenshaModule,
            dayun: dayunModule
        });
        _algoModules = {
            calculateBazi: baziModule.calculateBazi,
            getCurrentLiuNian: liunianModule.getCurrentLiuNian,
            getYearsLiuNian: liunianModule.getYearsLiuNian,
            calculateShenSha: shenshaModule.calculate_shensha,
            calculateDayun: dayunModule.calculateDayunXiaoyun
        };
        return _algoModules;
    } catch (error) {
        console.error('Failed to load algorithm modules:', error);
        throw error;
    }
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

    // 先显示浮层以获取正确的尺寸
    tooltip.classList.add('active');

    // 使用 requestAnimationFrame 确保 DOM 更新后再定位
    requestAnimationFrame(() => {
        const tooltipRect = tooltip.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        // 计算水平位置 - 窄屏时居中显示
        let left;
        if (windowWidth <= 400) {
            // 窄屏时居中
            left = (windowWidth - tooltipRect.width) / 2;
        } else {
            // 正常屏幕时对齐按钮
            left = rect.left;
            // 确保不超出右边界
            if (left + tooltipRect.width > windowWidth - 10) {
                left = windowWidth - tooltipRect.width - 10;
            }
        }
        // 确保不超出左边界
        left = Math.max(10, left);

        // 计算垂直位置
        let top = rect.top - tooltipRect.height - 10;
        // 如果上方空间不足，显示在下方
        if (top < 10) {
            top = rect.bottom + 10;
        }
        // 确保不超出底部边界
        if (top + tooltipRect.height > windowHeight - 10) {
            top = windowHeight - tooltipRect.height - 10;
        }

        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
    });

    currentPickerTarget = targetBtn;

    // 更新选中状态
    updatePickerTooltipSelection(pillar, type);

    // 更新天干选择器的禁用状态（联动校验）
    if (type === 'gan') {
        updateGanPickerDisabledStates(pillar);
    }
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

    // 日柱变化时，检查时干是否符合五鼠遁规则
    if (pillar === 'day' && hourGan) {
        const validHourGans = getValidHourGans(dayGan);
        if (!validHourGans.includes(hourGan)) {
            // 清空时干
            ganzhiModalState.hour.gan = null;
            updateGanzhiButtons();
        }
    }

    // 年柱变化时，检查月干是否符合五虎遁规则
    if (pillar === 'year' && monthGan) {
        const validMonthGans = getValidMonthGans(yearGan);
        if (!validMonthGans.includes(monthGan)) {
            // 清空月干
            ganzhiModalState.month.gan = null;
            updateGanzhiButtons();
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
        await saveRecord({ name, gender, date_type: 'solar', solar_year: year, solar_month: month, solar_day: day, hour, minute, longitude, use_true_solar: useTrueSolar }, baziResult);

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
        await saveRecord({ name, gender, date_type: 'lunar', lunar_year: year, lunar_month: month, lunar_day: day, is_leap_month: isLeapMonth, hour, minute, longitude, use_true_solar: useTrueSolar }, baziResult);

    } catch (error) {
        alert('计算失败: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// ===== 从干支计算 =====
async function calculateFromGanzhi(yearGanzhi, monthGanzhi, dayGanzhi, hourGanzhi) {
    console.log('calculateFromGanzhi called with:', { yearGanzhi, monthGanzhi, dayGanzhi, hourGanzhi });
    const name = document.getElementById('name').value || '匿名';
    const gender = document.querySelector('#gender-group .btn-gender.active').dataset.value;

    try {
        showLoading(true);
        const algo = await loadAlgorithmModules();

        const ganzhiInput = {
            year: yearGanzhi,
            month: monthGanzhi,
            day: dayGanzhi,
            hour: hourGanzhi
        };
        console.log('calculateFromGanzhi: ganzhiInput =', ganzhiInput);

        const baziResult = algo.calculateBazi(0, 0, 0, 0, 0, {
            isLunar: false,
            isGanzhi: true,
            ganzhiInput: ganzhiInput
        });

        console.log('calculateFromGanzhi: baziResult =', baziResult);
        console.log('calculateFromGanzhi: 三垣 =', {
            taiyuan: baziResult.taiyuan,
            minggong: baziResult.minggong,
            shengong: baziResult.shengong
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

    // 公历年份：1801~2099年，用户可滚动选择
    for (let y = 1801; y <= 2099; y++) {
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

    // 农历年份：1801~2099年，用户可滚动选择
    for (let y = 1801; y <= 2099; y++) {
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

    // 初始化隐藏的原生select（用于表单提交）
    for (let y = 1801; y <= 2099; y++) {
        const option = document.createElement('option');
        option.value = y;
        option.textContent = y + '年';
        yearSelect.appendChild(option);
    }
    yearSelect.value = currentYear;

    // 初始化自定义年份选择器
    initCustomYearSelect(currentYear);

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

// ===== 自定义年份选择器 =====
function initCustomYearSelect(currentYear) {
    const wrapper = document.getElementById('year-select-wrapper');
    const trigger = document.getElementById('year-select-trigger');
    const dropdown = document.getElementById('year-select-dropdown');
    const optionsContainer = document.getElementById('year-select-options');
    const textSpan = trigger.querySelector('.custom-select-text');
    const hiddenSelect = document.getElementById('year-select');

    // 填充年份选项
    optionsContainer.innerHTML = '';
    for (let y = 1801; y <= 2099; y++) {
        const option = document.createElement('div');
        option.className = 'custom-select-option';
        option.dataset.value = y;
        option.textContent = y + '年';
        if (y === currentYear) {
            option.classList.add('selected');
        }
        optionsContainer.appendChild(option);
    }

    // 设置初始显示文本
    textSpan.textContent = currentYear + '年';

    // 点击展开/收起下拉列表
    trigger.addEventListener('click', function(e) {
        e.stopPropagation();
        const isOpen = dropdown.classList.contains('active');
        closeAllCustomSelects();
        if (!isOpen) {
            dropdown.classList.add('active');
            trigger.classList.add('active');
            // 滚动到选中项
            const selectedOption = optionsContainer.querySelector('.custom-select-option.selected');
            if (selectedOption) {
                scrollToOption(optionsContainer, selectedOption);
            }
        }
    });

    // 选择年份
    optionsContainer.addEventListener('click', function(e) {
        const option = e.target.closest('.custom-select-option');
        if (option) {
            selectYear(option);
        }
    });

    // 滚动选择功能
    let scrollTimeout;
    optionsContainer.addEventListener('scroll', function() {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(function() {
            const visibleOptions = getVisibleOptions(optionsContainer);
            if (visibleOptions.center) {
                // 更新选中状态（可选，如果希望滚动时自动选中中间项）
            }
        }, 100);
    });

    // 选择年份函数
    function selectYear(option) {
        const value = parseInt(option.dataset.value);

        // 更新显示
        optionsContainer.querySelectorAll('.custom-select-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        option.classList.add('selected');
        textSpan.textContent = value + '年';

        // 更新隐藏的原生select
        hiddenSelect.value = value;

        // 触发change事件
        hiddenSelect.dispatchEvent(new Event('change'));

        // 关闭下拉列表
        dropdown.classList.remove('active');
        trigger.classList.remove('active');
    }

    // 关闭所有自定义选择器
    function closeAllCustomSelects() {
        document.querySelectorAll('.custom-select-dropdown').forEach(d => {
            d.classList.remove('active');
        });
        document.querySelectorAll('.custom-select-trigger').forEach(t => {
            t.classList.remove('active');
        });
    }

    // 点击外部关闭
    document.addEventListener('click', function(e) {
        if (!wrapper.contains(e.target)) {
            dropdown.classList.remove('active');
            trigger.classList.remove('active');
        }
    });

    // 滚动到指定选项（显示在中间位置）
    function scrollToOption(container, option) {
        const containerHeight = container.clientHeight;
        const optionHeight = option.offsetHeight;
        const optionTop = option.offsetTop;
        const scrollTop = optionTop - (containerHeight / 2) + (optionHeight / 2);
        container.scrollTop = Math.max(0, scrollTop);
    }

    // 获取当前可见的选项
    function getVisibleOptions(container) {
        const containerHeight = container.clientHeight;
        const scrollTop = container.scrollTop;
        const options = container.querySelectorAll('.custom-select-option');
        const visible = [];
        let center = null;
        let minDistance = Infinity;

        options.forEach(option => {
            const optionTop = option.offsetTop;
            const optionHeight = option.offsetHeight;
            const optionCenter = optionTop + optionHeight / 2;
            const containerCenter = scrollTop + containerHeight / 2;

            if (optionTop >= scrollTop && optionTop < scrollTop + containerHeight) {
                visible.push(option);
                const distance = Math.abs(optionCenter - containerCenter);
                if (distance < minDistance) {
                    minDistance = distance;
                    center = option;
                }
            }
        });

        return { visible, center };
    }
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

        // 根据日期类型使用正确的字段名保存记录
        if (isLunar) {
            await saveRecord({
                name, gender, date_type: 'lunar',
                lunar_year: year, lunar_month: month, lunar_day: day,
                is_leap_month: isLeapMonth, hour, minute,
                longitude, use_true_solar: useTrueSolar
            }, baziResult);
        } else {
            await saveRecord({
                name, gender, date_type: 'solar',
                solar_year: year, solar_month: month, solar_day: day,
                hour, minute,
                longitude, use_true_solar: useTrueSolar
            }, baziResult);
        }

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
    console.log('[displayResult] ============================================');
    console.log('[displayResult] 开始显示结果');
    console.log('[displayResult] result 类型:', typeof result);
    console.log('[displayResult] result 是否为 null:', result === null);
    console.log('[displayResult] result 是否为 undefined:', result === undefined);
    console.log('[displayResult] result 所有字段:', result ? Object.keys(result) : 'N/A');
    console.log('[displayResult] 完整数据:', JSON.stringify(result, null, 2));
    console.log('[displayResult] 三垣数据检查:', {
        taiyuan: result?.taiyuan,
        minggong: result?.minggong,
        shengong: result?.shengong
    });
    console.log('[displayResult] 四柱数据检查:', {
        year: result?.year,
        month: result?.month,
        day: result?.day,
        hour: result?.hour
    });

    const resultCard = document.getElementById('result-card');
    if (resultCard) {
        resultCard.style.display = 'block';
        console.log('[displayResult] 结果卡片已显示');
    } else {
        console.warn('[displayResult] 找不到结果卡片元素 result-card');
    }

    console.log('[displayResult] 调用 displayHeaderInfo...');
    displayHeaderInfo(result);

    console.log('[displayResult] 调用 displayPaiPanTable...');
    await displayPaiPanTable(result);

    console.log('[displayResult] 调用 displaySanyuan...');
    displaySanyuan(result);

    console.log('[displayResult] 调用 displayChangshengDetails...');
    displayChangshengDetails(result);

    console.log('[displayResult] 调用 displayDayunLiunian...');
    await displayDayunLiunian(result);

    if (resultCard) {
        resultCard.scrollIntoView({ behavior: 'smooth' });
    }
    console.log('[displayResult] 显示结果完成');
    console.log('[displayResult] ============================================');
}

function displayHeaderInfo(result) {
    console.log('[displayHeaderInfo] 开始显示头部信息');
    console.log('[displayHeaderInfo] result 类型:', typeof result);
    console.log('[displayHeaderInfo] result 字段:', Object.keys(result || {}));

    const nameEl = document.getElementById('info-name');
    const solarEl = document.getElementById('info-solar');
    const lunarEl = document.getElementById('info-lunar');
    const termEl = document.getElementById('info-solar-term');

    console.log('[displayHeaderInfo] DOM 元素:', { nameEl, solarEl, lunarEl, termEl });

    if (nameEl) nameEl.textContent = result?.name || '匿名';
    if (solarEl) solarEl.textContent = result?.solar_date || '';
    if (lunarEl) lunarEl.textContent = result?.lunar_date || '';
    if (termEl) termEl.textContent = result?.solar_term || '';

    console.log('[displayHeaderInfo] 显示内容:', {
        name: result?.name || '匿名',
        solar: result?.solar_date || '',
        lunar: result?.lunar_date || '',
        term: result?.solar_term || ''
    });
    console.log('[displayHeaderInfo] 显示完成');
}

async function displayPaiPanTable(result) {
    displayTenGods(result);
    displayHeavenlyStemAndEarthlyBranch(result);
    displayNayinRow(result);
    displayZangganRow(result);
    displayChangshengRow(result);
    await displayShenShaRow(result);
}

function displayZangganRow(result) {
    // 藏干数据映射（只包含天干，十神根据年干动态计算）
    const ZANGAN_MAP = {
        '子': ['癸'],
        '丑': ['己', '辛', '癸'],
        '寅': ['甲', '丙', '戊'],
        '卯': ['乙'],
        '辰': ['戊', '乙', '癸'],
        '巳': ['丙', '庚', '戊'],
        '午': ['丁', '己'],
        '未': ['己', '丁', '乙'],
        '申': ['庚', '壬', '戊'],
        '酉': ['辛'],
        '戌': ['戊', '辛', '丁'],
        '亥': ['壬', '甲']
    };

    // 获取年干
    const yearGan = result.year ? result.year.charAt(0) : null;

    // 四柱藏干
    const pillars = ['year', 'month', 'day', 'hour'];
    pillars.forEach(pillar => {
        const zangganCell = document.getElementById(`zanggan-${pillar}`);
        if (zangganCell && result[pillar]) {
            const zhi = result[pillar].charAt(1); // 获取地支
            const zangan = ZANGAN_MAP[zhi] || [];
            zangganCell.innerHTML = zangan.map(gan => {
                const ten = yearGan ? getTenGod(yearGan, gan) : '';
                return `<div>${gan}<small style="color:#666;font-size:9px;">${ten}</small></div>`;
            }).join('');
        }
    });

    // 三垣藏干
    const sanyuan = ['taiyuan', 'minggong', 'shengong'];
    sanyuan.forEach(pillar => {
        const zangganCell = document.getElementById(`zanggan-${pillar}`);
        if (zangganCell && result[pillar]?.ganzhi) {
            const zhi = result[pillar].ganzhi.charAt(1); // 获取地支
            const zangan = ZANGAN_MAP[zhi] || [];
            zangganCell.innerHTML = zangan.map(gan => {
                const ten = yearGan ? getTenGod(yearGan, gan) : '';
                return `<div>${gan}<small style="color:#666;font-size:9px;">${ten}</small></div>`;
            }).join('');
        }
    });
}

function displayChangshengRow(result) {
    const changshengData = result.nayin_changsheng || {};

    // 四柱长生
    const pillars = ['year', 'month', 'day', 'hour'];
    pillars.forEach(pillar => {
        const changshengCell = document.getElementById(`changsheng-${pillar}`);
        if (changshengCell && changshengData[pillar]) {
            const info = changshengData[pillar];
            changshengCell.textContent = info.position || '';
        }
    });

    // 三垣长生
    const sanyuan = ['taiyuan', 'minggong', 'shengong'];
    sanyuan.forEach(pillar => {
        const changshengCell = document.getElementById(`changsheng-${pillar}`);
        if (changshengCell && result[pillar]?.changsheng) {
            const info = result[pillar].changsheng;
            changshengCell.textContent = info.position || '';
        }
    });
}

function displayTenGods(result) {
    const tenGods = result.ten_gods || {};
    // 获取年干
    const yearGan = result.year ? result.year.charAt(0) : null;

    // 四柱十神（使用算法提供的数据）
    const yearEl = document.getElementById('shizhi-year');
    if (yearEl) yearEl.textContent = tenGods.year_gan || '';
    const monthEl = document.getElementById('shizhi-month');
    if (monthEl) monthEl.textContent = tenGods.month_gan || '';
    const dayEl = document.getElementById('shizhi-day');
    if (dayEl) dayEl.textContent = tenGods.day_gan || '';
    const hourEl = document.getElementById('shizhi-hour');
    if (hourEl) hourEl.textContent = tenGods.hour_gan || '';

    // 三垣十神：优先使用算法数据，否则根据年干动态计算
    const taiyuanEl = document.getElementById('shizhi-taiyuan');
    if (taiyuanEl) {
        if (tenGods.taiyuan_gan) {
            taiyuanEl.textContent = tenGods.taiyuan_gan;
        } else if (yearGan && result.taiyuan?.ganzhi) {
            const taiyuanGan = result.taiyuan.ganzhi.charAt(0);
            taiyuanEl.textContent = getTenGod(yearGan, taiyuanGan);
        }
    }

    const minggongEl = document.getElementById('shizhi-minggong');
    if (minggongEl) {
        if (tenGods.minggong_gan) {
            minggongEl.textContent = tenGods.minggong_gan;
        } else if (yearGan && result.minggong?.ganzhi) {
            const minggongGan = result.minggong.ganzhi.charAt(0);
            minggongEl.textContent = getTenGod(yearGan, minggongGan);
        }
    }

    const shengongEl = document.getElementById('shizhi-shengong');
    if (shengongEl) {
        if (tenGods.shengong_gan) {
            shengongEl.textContent = tenGods.shengong_gan;
        } else if (yearGan && result.shengong?.ganzhi) {
            const shengongGan = result.shengong.ganzhi.charAt(0);
            shengongEl.textContent = getTenGod(yearGan, shengongGan);
        }
    }
}

function displayHeavenlyStemAndEarthlyBranch(result) {
    // 处理四柱（字符串格式）
    const pillars = [
        { id: 'year', data: result.year },
        { id: 'month', data: result.month },
        { id: 'day', data: result.day },
        { id: 'hour', data: result.hour }
    ];

    pillars.forEach(p => {
        if (p.data) {
            const stem = p.data.charAt(0);
            const branch = p.data.charAt(1);
            const stemCell = document.getElementById(`stem-${p.id}`);
            const branchCell = document.getElementById(`branch-${p.id}`);
            if (stemCell) {
                stemCell.textContent = stem;
                stemCell.className = `table-cell stem-cell ${WUXING_COLORS[GAN_WUXING[stem]] || ''}`;
            }
            if (branchCell) {
                branchCell.textContent = branch;
                branchCell.className = `table-cell branch-cell ${WUXING_COLORS[ZHI_WUXING[branch]] || ''}`;
            }
        }
    });

    // 处理三垣（对象格式，包含 ganzhi 字段）
    const sanyuan = [
        { id: 'taiyuan', data: result.taiyuan?.ganzhi },
        { id: 'minggong', data: result.minggong?.ganzhi },
        { id: 'shengong', data: result.shengong?.ganzhi }
    ];

    sanyuan.forEach(s => {
        if (s.data) {
            const stem = s.data.charAt(0);
            const branch = s.data.charAt(1);
            const stemCell = document.getElementById(`stem-${s.id}`);
            const branchCell = document.getElementById(`branch-${s.id}`);
            if (stemCell) {
                stemCell.textContent = stem;
                stemCell.className = `table-cell stem-cell ${WUXING_COLORS[GAN_WUXING[stem]] || ''}`;
            }
            if (branchCell) {
                branchCell.textContent = branch;
                branchCell.className = `table-cell branch-cell ${WUXING_COLORS[ZHI_WUXING[branch]] || ''}`;
            }
        }
    });
}

function displayNayinRow(result) {
    document.getElementById('nayin-year').textContent = result.year_nayin || '';
    document.getElementById('nayin-month').textContent = result.month_nayin || '';
    document.getElementById('nayin-day').textContent = result.day_nayin || '';
    document.getElementById('nayin-hour').textContent = result.hour_nayin || '';
    // 三垣纳音
    document.getElementById('nayin-taiyuan').textContent = result.taiyuan?.nayin || '';
    document.getElementById('nayin-minggong').textContent = result.minggong?.nayin || '';
    document.getElementById('nayin-shengong').textContent = result.shengong?.nayin || '';
}

async function displayShenShaRow(result) {
    try {
        const shenshaResult = await calculateShenSha({
            year_ganzhi: result.year,
            month_ganzhi: result.month,
            day_ganzhi: result.day,
            hour_ganzhi: result.hour
        });

        // 四柱神煞
        ['year', 'month', 'day', 'hour'].forEach(pillar => {
            const cell = document.getElementById(`shensha-${pillar}`);
            const list = shenshaResult.shensha_by_column?.[pillar] || [];
            cell.textContent = list.length > 0 ? list.join(', ') : '无神煞';
        });

        // 三垣神煞（使用相同的神煞数据，或者可以留空）
        ['taiyuan', 'minggong', 'shengong'].forEach(pillar => {
            const cell = document.getElementById(`shensha-${pillar}`);
            if (cell) {
                cell.textContent = '无神煞';
            }
        });
    } catch (e) {
        console.error('神煞计算失败:', e);
    }
}

function displaySanyuanItem(type, data) {
    console.log(`displaySanyuanItem('${type}', ${JSON.stringify(data)})`);
    const ganzhiElement = document.getElementById(`${type}-ganzhi`);
    const nayinElement = document.getElementById(`${type}-nayin`);
    const changshengElement = document.getElementById(`${type}-changsheng`);

    console.log(`Elements for ${type}:`, { ganzhiElement, nayinElement, changshengElement });

    if (ganzhiElement && data.ganzhi) {
        ganzhiElement.textContent = data.ganzhi;
        console.log(`Set ${type}-ganzhi to:`, data.ganzhi);
    }
    if (nayinElement && data.nayin) {
        nayinElement.textContent = data.nayin;
        console.log(`Set ${type}-nayin to:`, data.nayin);
    }
    if (changshengElement && data.changsheng) {
        const position = data.changsheng.position || '未知';
        const jiXiong = data.changsheng.ji_xiong || '未知';
        changshengElement.textContent = `${position} (${jiXiong})`;
        console.log(`Set ${type}-changsheng to:`, `${position} (${jiXiong})`);
    }
}

function displaySanyuan(result) {
    console.log('displaySanyuan called with result:', result);
    const taiyuan = result.taiyuan || {};
    const minggong = result.minggong || {};
    const shengong = result.shengong || {};

    console.log('Sanyuan data:', { taiyuan, minggong, shengong });

    displaySanyuanItem('taiyuan', taiyuan);
    displaySanyuanItem('minggong', minggong);
    displaySanyuanItem('shengong', shengong);
}

function displayChangshengDetails(result) {
    const selfChangsheng = document.getElementById('self-changsheng');
    if (!selfChangsheng) return;
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

    // 从 solar_date 解析年份，如果是干支输入则使用当前年份
    let birthYear;
    if (result.solar_date && result.solar_date !== '干支输入' && result.solar_date !== '未知') {
        birthYear = parseInt(result.solar_date.split('-')[0]);
    } else if (result.original_solar?.year) {
        birthYear = result.original_solar.year;
    } else {
        // 干支输入模式，无法计算真实大运，使用当前年份作为参考
        birthYear = new Date().getFullYear();
    }

    if (!birthYear || isNaN(birthYear)) {
        console.warn('无法获取有效的出生年份，跳过大运计算');
        return;
    }

    const dayunResult = await calculateDayun(result, gender, { year: birthYear, month: 1, day: 1, hour: 12, minute: 0 });
    currentDayunResult = dayunResult;
    currentBirthYear = birthYear;

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

    // 渲染小运表格
    displayXiaoyunResult(dayunResult);
}

function displayXiaoyunResult(dayunResult) {
    const xiaoyunTable = document.getElementById('xiaoyun-table');
    if (!xiaoyunTable) return;

    const rows = xiaoyunTable.querySelectorAll('tbody tr');

    // 清空现有数据
    rows.forEach(row => {
        while (row.children.length > 1) row.removeChild(row.lastChild);
    });

    // 获取小运数据，默认显示前12个小运
    const xiaoyunList = dayunResult.xiaoyun || [];
    const displayCount = Math.min(12, xiaoyunList.length);

    for (let i = 0; i < displayCount; i++) {
        const xiaoyun = xiaoyunList[i];
        if (rows[0]) rows[0].innerHTML += `<td>${xiaoyun.ten_god || ''}</td>`;
        if (rows[1]) rows[1].innerHTML += `<td>${xiaoyun.ganzhi || ''}</td>`;
        if (rows[2]) rows[2].innerHTML += `<td>${xiaoyun.nayin || ''}</td>`;
        if (rows[3]) rows[3].innerHTML += `<td>${xiaoyun.age}岁</td>`;
    }
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

        // 标准化性别值
        const genderValue = inputData.gender === 'male' ? '男' : '女';

        // 合并原始输入数据到 fullData，确保专业页面能正确加载
        const fullData = {
            ...resultData,
            name: inputData.name || '匿名',
            gender: genderValue,  // 直接存储标准化的性别值
            dateType: inputData.date_type,  // 确保 dateType 在 fullData 中
            is_leap_month: inputData.is_leap_month || false,
            longitude: inputData.longitude || 120,
            use_true_solar: inputData.use_true_solar !== false
        };

        // 根据输入类型保存不同的原始数据
        if (inputData.date_type === 'ganzhi' && inputData.ganzhi) {
            // 干支输入模式 - 保存原始干支数据
            fullData.original_ganzhi = inputData.ganzhi;
        } else if (inputData.date_type === 'lunar') {
            // 农历输入模式 - 保存原始农历数据
            fullData.original_lunar = {
                year: inputData.lunar_year,
                month: inputData.lunar_month,
                day: inputData.lunar_day,
                is_leap_month: inputData.is_leap_month || false,
                hour: inputData.hour !== undefined ? inputData.hour : 12,
                minute: inputData.minute || 0
            };
            // 同时保存公历数据（从 resultData 中获取）
            if (resultData.original_solar) {
                fullData.original_solar = resultData.original_solar;
            }
        } else {
            // 公历输入模式 - 保存原始公历数据
            fullData.original_solar = {
                year: inputData.solar_year,
                month: inputData.solar_month,
                day: inputData.solar_day,
                hour: inputData.hour !== undefined ? inputData.hour : 12,
                minute: inputData.minute || 0
            };
        }

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
            zodiac: resultData.zodiac || '',
            fullData: fullData
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
