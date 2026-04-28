// ===== 全局状态 =====
let currentRecord = null;
let currentBaziResult = null;
let currentDayunResult = null;
let currentBirthYear = null;
let selectedDayunIndex = -1;
let currentAge = 0;
let dayunLiunianMode = false;  // 默认关闭大运流年模式
let currentDayunIndex = 0;      // 当前选中大运索引
let currentXiaoyunIndex = 0;    // 当前选中流年索引（相对于当前大运）
let currentLiunianIndex = 0;     // 当前选中流年索引（相对于当前大运）
let liunianCache = {};          // 流年数据缓存
let originalShenshaResult = null;  // 原始神煞结果（用于恢复）

// 获取全局 db 对象（database.js 中定义）
let db = window.db;
// 如果未加载，稍后重试（避免脚本加载顺序问题）
if (!db) {
    setTimeout(() => { db = window.db; }, 100);
}

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

// ===== 藏干数据 =====
const ZANGAN_MAP = {
    '子': [{gan: '癸', ten: '正印'}],
    '丑': [{gan: '己', ten: '比肩'}, {gan: '辛', ten: '正官'}, {gan: '癸', ten: '正印'}],
    '寅': [{gan: '甲', ten: '比肩'}, {gan: '丙', ten: '食神'}, {gan: '戊', ten: '偏财'}],
    '卯': [{gan: '乙', ten: '比肩'}],
    '辰': [{gan: '戊', ten: '偏财'}, {gan: '乙', ten: '劫财'}, {gan: '癸', ten: '正印'}],
    '巳': [{gan: '丙', ten: '食神'}, {gan: '庚', ten: '偏财'}, {gan: '戊', ten: '偏财'}],
    '午': [{gan: '丁', ten: '伤官'}, {gan: '己', ten: '偏财'}],
    '未': [{gan: '己', ten: '比肩'}, {gan: '丁', ten: '伤官'}, {gan: '乙', ten: '劫财'}],
    '申': [{gan: '庚', ten: '偏财'}, {gan: '壬', ten: '食神'}, {gan: '戊', ten: '偏财'}],
    '酉': [{gan: '辛', ten: '正官'}],
    '戌': [{gan: '戊', ten: '偏财'}, {gan: '辛', ten: '正官'}, {gan: '丁', ten: '伤官'}],
    '亥': [{gan: '壬', ten: '食神'}, {gan: '甲', ten: '偏印'}]
};

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

// ===== 十神映射表 =====
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
    '戊,甲': '七杀', '戊,乙': '正官', '戊,丙': '偏印', '戊,丁': '正印',
    '戊,戊': '比肩', '戊,己': '劫财', '戊,庚': '食神', '戊,辛': '伤官',
    '戊,壬': '偏财', '戊,癸': '正财',
    '己,甲': '正官', '己,乙': '七杀', '己,丙': '正印', '己,丁': '偏印',
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
    '癸,甲': '伤官', '癸,乙': '食神', '癸,丙': '正财', '癸,丁': '偏财',
    '癸,戊': '正官', '癸,己': '七杀', '癸,庚': '正印', '癸,辛': '偏印',
    '癸,壬': '劫财', '癸,癸': '比肩'
};

// ===== 获取十神函数 =====
function getTenGod(dayGan, otherGan) {
    return TEN_GOD_MAP[`${dayGan},${otherGan}`] || '';
}

// ===== API调用函数 =====
async function callCalculateAPI(data) {
    try {
        console.log('[callCalculateAPI] 开始调用，输入数据:', JSON.stringify(data, null, 2));
        console.log('[callCalculateAPI] date_type:', data.date_type);
        console.log('[callCalculateAPI] 是否有 ganzhi:', !!data.ganzhi);

        const algo = await loadAlgorithmModules();
        console.log('[callCalculateAPI] 算法模块已加载:', algo);
        console.log('[callCalculateAPI] calculateBazi 函数存在:', typeof algo.calculateBazi === 'function');

        let result;
        if (data.date_type === 'ganzhi' && data.ganzhi) {
            console.log('[callCalculateAPI] 使用干支输入模式');
            console.log('[callCalculateAPI] ganzhi 数据:', data.ganzhi);
            // 干支输入模式
            console.log('[callCalculateAPI] 调用 calculateBazi (干支模式)');
            result = algo.calculateBazi(0, 0, 0, 0, 0, {
                isLunar: false,
                isGanzhi: true,
                ganzhiInput: data.ganzhi
            });
            console.log('[callCalculateAPI] 干支模式计算结果:', result);
        } else if (data.date_type === 'lunar') {
            console.log('[callCalculateAPI] 使用农历输入模式');
            // 农历模式 - 使用 lunar_year 等字段
            const year = data.lunar_year || data.solar_year;
            const month = data.lunar_month || data.solar_month;
            const day = data.lunar_day || data.solar_day;
            result = algo.calculateBazi(
                year,
                month,
                day,
                data.hour || 12,
                data.minute || 0,
                {
                    isLunar: true,
                    isLeapMonth: data.is_leap_month || false,
                    longitude: data.longitude || 120,
                    useTrueSolar: data.use_true_solar !== false
                }
            );
        } else {
            // 公历模式 - 使用 solar_year 等字段
            result = algo.calculateBazi(
                data.solar_year,
                data.solar_month,
                data.solar_day,
                data.hour || 12,
                data.minute || 0,
                {
                    isLunar: false,
                    isLeapMonth: false,
                    longitude: data.longitude || 120,
                    useTrueSolar: data.use_true_solar !== false
                }
            );
        }
        result.name = data.name;
        return result;
    } catch (error) {
        console.error('calculate error:', error);
        throw error;
    }
}

async function callDayunAPI(data) {
    try {
        const algo = await loadAlgorithmModules();
        return algo.calculateDayun(data.bazi_result, data.gender, {
            year: data.birth_year,
            month: data.birth_month,
            day: data.birth_day,
            hour: data.birth_hour,
            minute: data.birth_minute
        });
    } catch (error) {
        console.error('dayun error:', error);
        throw error;
    }
}

async function callShenshaAPI(baziResult, dayunGanZhi = '', liunianGanZhi = '') {
    try {
        const algo = await loadAlgorithmModules();
        return algo.calculateShenSha(
            baziResult.year || '',
            baziResult.month || '',
            baziResult.day || '',
            baziResult.hour || '',
            baziResult.taiyuan?.ganzhi || '',
            baziResult.minggong?.ganzhi || '',
            baziResult.shengong?.ganzhi || '',
            baziResult.year_nayin || '',
            dayunGanZhi,
            liunianGanZhi,
            baziResult.birth_month || (baziResult.original_solar?.month || 1)
        );
    } catch (error) {
        console.error('shensha error:', error);
        throw error;
    }
}

async function callLiunianAPI() {
    try {
        const algo = await loadAlgorithmModules();
        return algo.getCurrentLiuNian();
    } catch (error) {
        console.error('liunian error:', error);
        throw error;
    }
}

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', async function() {
    initEventListeners();
    await loadRecordFromUrl();
});

// ===== 初始化事件监听 =====
function initEventListeners() {
    document.getElementById('back-btn').addEventListener('click', () => window.history.back());
    document.getElementById('copy-btn').addEventListener('click', copyResult);
    document.getElementById('note-btn').addEventListener('click', addNote);
    document.getElementById('delete-btn').addEventListener('click', showDeleteConfirm);
    
    document.querySelectorAll('.analysis-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            switchAnalysisTab(tabId);
        });
    });
    
    document.getElementById('dayun-liunian-btn').addEventListener('click', toggleDayunLiunianMode);
    
    // 笔记弹窗事件
    document.getElementById('note-cancel-btn').addEventListener('click', hideNoteModal);
    document.getElementById('note-save-btn').addEventListener('click', saveNote);
    document.getElementById('note-modal').addEventListener('click', function(e) {
        if (e.target === this) hideNoteModal();
    });
    
    // 删除弹窗事件
    document.getElementById('cancel-delete').addEventListener('click', hideDeleteConfirm);
    document.getElementById('confirm-delete').addEventListener('click', async function() {
        if (deleteTargetId) {
            await deleteCurrentRecord();
            hideDeleteConfirm();
        }
    });
    document.getElementById('delete-modal').addEventListener('click', function(e) {
        if (e.target === this) hideDeleteConfirm();
    });
}

// ===== 从URL加载记录 =====
async function loadRecordFromUrl() {
    try {
        console.log('[loadRecordFromUrl] 完整 URL:', window.location.href);
        console.log('[loadRecordFromUrl] location.search:', window.location.search);
        console.log('[loadRecordFromUrl] location.pathname:', window.location.pathname);

        const urlParams = new URLSearchParams(window.location.search);
        console.log('[loadRecordFromUrl] URL 参数:', Object.fromEntries(urlParams.entries()));

        const recordId = urlParams.get('recordId');
        console.log('[loadRecordFromUrl] recordId:', recordId);

        if (!recordId) {
            console.log('[loadRecordFromUrl] no recordId in URL, 显示错误');
            alert('缺少记录ID，请从记录页面选择记录');
            // 不跳转，让用户手动返回
            return;
        }

        // 确保 db 对象已加载
        let db = window.db;
        if (!db) {
            console.warn('[loadRecordFromUrl] window.db 未定义，等待数据库加载...');
            // 等待一小段时间让数据库脚本加载
            await new Promise(resolve => setTimeout(resolve, 100));
            db = window.db;
            if (!db) {
                console.error('[loadRecordFromUrl] 数据库未加载，请刷新页面');
                alert('数据库加载失败，请刷新页面重试');
                return;
            }
        }

        if (!db.db) {
            console.log('loadRecordFromUrl: initializing database...');
            await db.init();
        }
        const record = await db.getRecord(parseInt(recordId));

        console.log('loadRecordFromUrl: record =', record);
        console.log('loadRecordFromUrl: fullData =', record?.fullData);

        if (!record) {
            console.log('loadRecordFromUrl: record not found');
            alert('记录不存在，请返回记录页面重新选择');
            // 不跳转，让用户手动返回
            return;
        }

        // 无论是否有 fullData，都尝试显示记录
        // displayRecordData 会处理两种数据格式
        currentRecord = record;
        await displayRecordData(record);
    } catch (error) {
        console.error('加载记录失败:', error);
        alert('加载记录失败: ' + error.message);
    }
}
    }
}

// ===== 显示记录数据 =====
async function displayRecordData(record) {
    try {
        console.log('displayRecordData: record =', JSON.stringify(record, null, 2));

        // fullData 可能嵌套在 record.fullData 中，也可能直接在 record 中
        // 优先使用 record.fullData，如果不存在则使用 record 本身（排除 id, createdAt 等元数据）
        let data = record.fullData;
        if (!data) {
            // 如果没有 fullData，从 record 中提取有效数据
            data = {};
            for (const key of Object.keys(record)) {
                if (!['id', 'createdAt', 'updatedAt', 'cloudId', 'userId'].includes(key)) {
                    data[key] = record[key];
                }
            }
        }

        console.log('displayRecordData: extracted data =', data);

        // ===== 检测数据格式：新版本 vs 旧版本 =====
        // 新版本：data 包含 original_solar / original_lunar / original_ganzhi / dateType 等
        // 旧版本：data 直接是排盘结果，包含 year, month, day, hour, taiyuan 等
        const isNewFormat = data.original_solar || data.original_lunar || data.original_ganzhi || data.dateType;
        const isOldFormat = !isNewFormat && data.year && data.month && data.day && data.hour;

        console.log('displayRecordData: 数据格式检测:', { isNewFormat: !!isNewFormat, isOldFormat: !!isOldFormat });

        // 如果是旧数据格式，直接使用 data 作为排盘结果，但需要计算大运
        if (isOldFormat) {
            console.log('displayRecordData: 检测到旧数据格式，使用保存的排盘结果并计算大运');
            currentBaziResult = data;

            // 从 record 中获取名称（旧格式中名称在 record 级别）
            const name = record.name || data.name || '匿名';

            // 2. 显示基本信息
            displayBasicInfo(data, name);

            // 3. 显示四柱信息
            displaySizhu(data);

            // 4. 显示三垣
            displaySanyuan(data);

            // 5. 为旧数据计算大运（从 solar_date 解析出生年份）
            let birthYear = null;
            if (data.solar_date && data.solar_date !== '未知' && data.solar_date !== '干支输入') {
                const yearMatch = data.solar_date.match(/(\d{4})/);
                if (yearMatch) birthYear = parseInt(yearMatch[1]);
            }

            let dayunResult = null;
            let currentAge = 0;
            const genderValue = data.gender || record.gender || '男';
            const gender = genderValue === '男' ? 'male' : 'female';

            if (birthYear) {
                try {
                    dayunResult = await callDayunAPI({
                        bazi_result: data,
                        gender: gender,
                        birth_year: birthYear,
                        birth_month: 1,
                        birth_day: 1,
                        birth_hour: 12,
                        birth_minute: 0
                    });
                    currentDayunResult = dayunResult;
                    currentBirthYear = birthYear;

                    // 计算当前年龄
                    const currentYear = new Date().getFullYear();
                    currentAge = currentYear - birthYear;
                } catch (e) {
                    console.error('旧数据大运计算失败:', e);
                }
            }

            // 获取当前流年
            let liunianResult = {};
            try {
                liunianResult = await callLiunianAPI();
            } catch (e) {
                console.error('获取流年失败:', e);
            }

            // 找到当前大运和小运
            let currentDayunGanZhi = '';
            let currentXiaoyunGanZhi = '';
            if (dayunResult && dayunResult.dayun) {
                for (const dayun of dayunResult.dayun) {
                    if (currentAge >= dayun.start_age && currentAge <= dayun.end_age) {
                        currentDayunGanZhi = dayun.ganzhi;
                        break;
                    }
                }
                if (!currentDayunGanZhi && dayunResult.dayun.length > 0) {
                    currentDayunGanZhi = dayunResult.dayun[0].ganzhi;
                }

                if (dayunResult.xiaoyun) {
                    const currentXiaoyun = dayunResult.xiaoyun.find(x => x.age === currentAge);
                    if (currentXiaoyun) currentXiaoyunGanZhi = currentXiaoyun.ganzhi;
                }
            }

            const currentLiunianGanZhi = liunianResult['流年']?.ganzhi || '';

            // 6. 调用神煞API
            const shenshaResult = await callShenshaAPI(data, currentDayunGanZhi, currentLiunianGanZhi);
            originalShenshaResult = shenshaResult;

            // 7. 显示大运小运
            console.log('[旧数据格式] 准备显示大运，dayunResult:', dayunResult);
            if (dayunResult && dayunResult.dayun && dayunResult.dayun.length > 0) {
                const liuyunData = {
                    dayunGanZhi: currentDayunGanZhi,
                    xiaoyunGanZhi: currentXiaoyunGanZhi,
                    liunianGanZhi: currentLiunianGanZhi,
                    dayunShensha: shenshaResult.dayun_shensha || [],
                    liunianShensha: shenshaResult.liunian_shensha || [],
                    xiaoyunShensha: []
                };
                console.log('[旧数据格式] 调用 displayDayunXiaoyun，参数:', { dayunResult, currentAge, liuyunData });
                displayDayunXiaoyun(dayunResult, currentAge, liuyunData);
            } else {
                console.warn('[旧数据格式] 无大运数据可显示');
            }

            // 8. 显示神煞按柱
            displayShenshaByColumn(shenshaResult);

            // 9. 显示详细分析
            displayAnalysis(data, shenshaResult);

            return;
        }

        const originalSolar = data.original_solar || {};
        const originalLunar = data.original_lunar || {};
        const originalGanzhi = data.original_ganzhi || {};

        console.log('displayRecordData: data =', data);
        console.log('displayRecordData: originalSolar =', originalSolar);
        console.log('displayRecordData: originalLunar =', originalLunar);
        console.log('displayRecordData: originalGanzhi =', originalGanzhi);

        // 从fullData或record中提取正确的字段（优先从fullData读取，确保数据一致性）
        const solarDateStr = data.solarDate || data.solar_date || '';

        // dateType 从 fullData 或 record 中读取（检查多种格式）
        const dateType = data.dateType || record.dateType || data.date_type || record.date_type || 'solar';
        console.log('displayRecordData: dateType =', dateType);

        const isLeapMonth = data.is_leap_month || record.is_leap_month || originalLunar.is_leap_month || false;

        // gender 从 fullData 中读取，已经标准化为 '男' 或 '女'
        const genderValue = data.gender || record.gender || '男';
        const gender = genderValue === '男' ? 'male' : 'female';

        let baziResult;
        let referenceYear;
        let solarYear, solarMonth, solarDay, hour, minute;

        // 根据日期类型选择不同的计算方式
        if (dateType === 'ganzhi' && originalGanzhi && originalGanzhi.year) {
            // 干支输入模式
            const yearGanzhi = originalGanzhi.year;
            const monthGanzhi = originalGanzhi.month;
            const dayGanzhi = originalGanzhi.day;
            const hourGanzhi = originalGanzhi.hour;

            console.log('displayRecordData: 干支模式', { yearGanzhi, monthGanzhi, dayGanzhi, hourGanzhi });

            baziResult = await callCalculateAPI({
                name: data.name || '匿名',
                gender: gender,
                date_type: 'ganzhi',
                ganzhi: { year: yearGanzhi, month: monthGanzhi, day: dayGanzhi, hour: hourGanzhi }
            });

            // 干支模式下，使用当前年份作为参考
            referenceYear = new Date().getFullYear();
            solarYear = referenceYear;
            solarMonth = 1;
            solarDay = 1;
            hour = 12;
            minute = 0;
        } else if (dateType === 'lunar' && originalLunar && originalLunar.year) {
            // 农历输入模式
            const lunarYear = originalLunar.year;
            const lunarMonth = originalLunar.month;
            const lunarDay = originalLunar.day;
            // 优先从 originalLunar 读取时辰，兼容旧数据
            hour = originalLunar.hour !== undefined ? originalLunar.hour : (originalSolar.hour !== undefined ? originalSolar.hour : 12);
            minute = originalLunar.minute !== undefined ? originalLunar.minute : (originalSolar.minute || 0);

            console.log('displayRecordData: 农历模式', { lunarYear, lunarMonth, lunarDay, hour, minute, isLeapMonth });

            // 验证必要数据
            if (!lunarYear || isNaN(lunarYear)) {
                console.error('displayRecordData: 无效的年份数据', { lunarYear, solarDateStr, data });
                alert('记录数据不完整，请重新排盘保存');
                return;
            }

            // 调用排盘API（农历模式）- 使用正确的字段名
            const calculateData = {
                name: data.name || '匿名',
                gender: gender,
                date_type: 'lunar',
                lunar_year: lunarYear,
                lunar_month: lunarMonth,
                lunar_day: lunarDay,
                hour: hour,
                minute: minute,
                is_leap_month: isLeapMonth,
                longitude: data.longitude || 120,
                use_true_solar: data.use_true_solar !== false
            };

            baziResult = await callCalculateAPI(calculateData);
            referenceYear = lunarYear;
            // 更新 solarYear 等变量供后续使用
            solarYear = lunarYear;
            solarMonth = lunarMonth;
            solarDay = lunarDay;
        } else {
            // 公历模式
            solarYear = originalSolar.year;
            solarMonth = originalSolar.month;
            solarDay = originalSolar.day;

            // 如果 original_solar 不完整，尝试从日期字符串解析
            if (!solarYear && solarDateStr && solarDateStr !== '干支输入' && solarDateStr !== '未知') {
                const parts = solarDateStr.split(/[-\/年月日]/).filter(p => p);
                if (parts.length >= 3) {
                    solarYear = parseInt(parts[0]);
                    solarMonth = parseInt(parts[1]);
                    solarDay = parseInt(parts[2]);
                }
            }

            // 如果还是没有有效数据，尝试使用 data 中的数字字段
            // 注意：不要使用 record.year/month/day/hour，因为它们是干支字符串（如"甲子"）
            // 保存时使用下划线命名（solar_year），兼容处理
            if (!solarYear || isNaN(solarYear)) solarYear = data.solar_year || data.solarYear;
            if (!solarMonth || isNaN(solarMonth)) solarMonth = data.solar_month || data.solarMonth;
            if (!solarDay || isNaN(solarDay)) solarDay = data.solar_day || data.solarDay;

            // hour 处理：优先使用 originalSolar.hour，其次是 data.hour（必须是数字）
            if (originalSolar.hour !== undefined && typeof originalSolar.hour === 'number') {
                hour = originalSolar.hour;
            } else if (data.hour !== undefined && typeof data.hour === 'number') {
                hour = data.hour;
            } else {
                hour = 12; // 默认中午12点
            }
            minute = originalSolar.minute || 0;

            console.log('displayRecordData: 公历模式', { data, originalSolar, solarYear, solarMonth, solarDay, hour, minute });

            // 验证必要数据
            if (!solarYear || isNaN(solarYear)) {
                console.error('displayRecordData: 无效的年份数据', { solarYear, solarDateStr, data });
                alert('记录数据不完整，请重新排盘保存');
                return;
            }

            // 调用排盘API（公历模式）
            const calculateData = {
                name: data.name || '匿名',
                gender: gender,
                date_type: 'solar',
                solar_year: solarYear,
                solar_month: solarMonth,
                solar_day: solarDay,
                hour: hour,
                minute: minute,
                is_leap_month: isLeapMonth,
                longitude: data.longitude || 120,
                use_true_solar: data.use_true_solar !== false
            };

            baziResult = await callCalculateAPI(calculateData);
            referenceYear = solarYear;
        }

        currentBaziResult = baziResult;

        console.log('[displayRecordData] baziResult 类型:', typeof baziResult);
        console.log('[displayRecordData] baziResult 是否为 null:', baziResult === null);
        console.log('[displayRecordData] baziResult 是否为 undefined:', baziResult === undefined);
        console.log('[displayRecordData] baziResult 所有字段:', baziResult ? Object.keys(baziResult) : 'N/A');
        console.log('[displayRecordData] baziResult 完整数据:', JSON.stringify(baziResult, null, 2));

        console.log('[displayRecordData] 三垣数据检查:');
        console.log('  - taiyuan:', baziResult?.taiyuan);
        console.log('  - minggong:', baziResult?.minggong);
        console.log('  - shengong:', baziResult?.shengong);

        // 检查四柱数据
        console.log('[displayRecordData] 四柱数据检查:');
        console.log('  - year:', baziResult?.year, '类型:', typeof baziResult?.year);
        console.log('  - month:', baziResult?.month, '类型:', typeof baziResult?.month);
        console.log('  - day:', baziResult?.day, '类型:', typeof baziResult?.day);
        console.log('  - hour:', baziResult?.hour, '类型:', typeof baziResult?.hour);

        if (!baziResult) {
            console.error('[displayRecordData] baziResult 为空，无法显示数据');
            alert('排盘计算失败，请重试');
            return;
        }

        // 2. 显示基本信息
        displayBasicInfo(baziResult, data.name);

        // 3. 显示四柱信息
        displaySizhu(baziResult);

        // 4. 显示三垣
        displaySanyuan(baziResult);

        // 5. 调用大运API（干支模式下跳过大运计算）
        let dayunResult = null;
        if (dateType !== 'ganzhi') {
            dayunResult = await callDayunAPI({
                bazi_result: baziResult,
                gender: gender,
                birth_year: solarYear,
                birth_month: solarMonth,
                birth_day: solarDay,
                birth_hour: hour,
                birth_minute: minute
            });

            // 存储全局大运结果供弹窗使用
            currentDayunResult = dayunResult;
            currentBirthYear = solarYear;
        }

        // 获取当前流年
        const liunianResult = await callLiunianAPI();

        // 计算当前年龄
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        let currentAge = currentYear - referenceYear;
        if (currentMonth < solarMonth || (currentMonth === solarMonth)) {
            currentAge--;
        }

        // 找到当前大运
        let currentDayunGanZhi = '';
        if (dayunResult && dayunResult.dayun && dayunResult.dayun.length > 0) {
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
        if (dayunResult && dayunResult.xiaoyun && dayunResult.xiaoyun.length > 0) {
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

        // 6. 调用神煞API
        const shenshaResult = await callShenshaAPI(baziResult, currentDayunGanZhi, currentLiunianGanZhi);

        // 保存原始神煞结果
        originalShenshaResult = shenshaResult;

        // 存储当前流运信息
        const liuyunData = {
            dayunGanZhi: currentDayunGanZhi,
            xiaoyunGanZhi: currentXiaoyunGanZhi,
            liunianGanZhi: currentLiunianGanZhi,
            dayunShensha: shenshaResult.dayun_shensha || [],
            liunianShensha: shenshaResult.liunian_shensha || [],
            xiaoyunShensha: []
        };

        // 7. 显示大运小运
        if (dayunResult) {
            displayDayunXiaoyun(dayunResult, currentAge, liuyunData);
        }

        // 8. 显示神煞
        displayShenshaByColumn(shenshaResult);

        // 9. 显示详细分析
        displayAnalysis(baziResult, shenshaResult);

    } catch (error) {
        console.error('显示记录数据失败:', error);
    }
}

// ===== 显示基本信息 =====
function displayBasicInfo(result, name) {
    console.log('[displayBasicInfo] 输入参数:', { result, name });
    console.log('[displayBasicInfo] result 字段:', Object.keys(result || {}));
    console.log('[displayBasicInfo] 四柱数据:', {
        year: result?.year,
        month: result?.month,
        day: result?.day,
        hour: result?.hour
    });

    const nameEl = document.getElementById('info-name');
    const solarEl = document.getElementById('info-solar');
    const lunarEl = document.getElementById('info-lunar');
    const termEl = document.getElementById('info-solar-term');
    const baziEl = document.getElementById('info-bazi');

    console.log('[displayBasicInfo] DOM 元素:', { nameEl, solarEl, lunarEl, termEl, baziEl });

    if (nameEl) nameEl.textContent = name || '匿名';
    if (solarEl) solarEl.textContent = result?.solar_date || '';
    if (lunarEl) lunarEl.textContent = result?.lunar_date || '';
    if (termEl) termEl.textContent = result?.solar_term || '';

    const baziText = `${result?.year || ''} ${result?.month || ''} ${result?.day || ''} ${result?.hour || ''}`;
    if (baziEl) baziEl.textContent = baziText.trim();

    console.log('[displayBasicInfo] 显示完成，八字文本:', baziText);
}

// ===== 显示四柱 =====
function displaySizhu(result) {
    console.log('[displaySizhu] 开始显示四柱，输入 result:', result);
    console.log('[displaySizhu] result 类型:', typeof result);
    console.log('[displaySizhu] result 所有字段:', Object.keys(result || {}));

    const pillars = ['year', 'month', 'day', 'hour'];
    const sanyuanPillars = ['taiyuan', 'minggong', 'shengong'];
    const ten_gods = result.ten_gods || {};
    const nayin_changsheng = result.nayin_changsheng || {};

    console.log('[displaySizhu] ten_gods 原始数据:', JSON.stringify(ten_gods, null, 2));

    console.log('[displaySizhu] ten_gods:', ten_gods);
    console.log('[displaySizhu] nayin_changsheng:', nayin_changsheng);

    pillars.forEach(pillar => {
        console.log(`[displaySizhu] 处理 ${pillar} 柱，数据:`, result[pillar]);
        if (!result[pillar] || result[pillar].length < 2) return;
        
        // 天干
        const stemCell = document.getElementById(`stem-${pillar}`);
        console.log(`[displaySizhu] ${pillar} 天干元素 stemCell:`, stemCell);
        if (stemCell && result[pillar]) {
            const stem = result[pillar].charAt(0);
            console.log(`[displaySizhu] ${pillar} 天干:`, stem);
            stemCell.textContent = stem;
            stemCell.className = `table-cell stem-cell ${WUXING_COLORS[GAN_WUXING[stem]] || ''}`;
        }

        // 地支
        const branchCell = document.getElementById(`branch-${pillar}`);
        if (branchCell && result[pillar]) {
            const branch = result[pillar].charAt(1);
            console.log(`[displaySizhu] ${pillar} 地支:`, branch);
            branchCell.textContent = branch;
            branchCell.className = `table-cell branch-cell ${WUXING_COLORS[ZHI_WUXING[branch]] || ''}`;
        }

        // 十神
        const shizhiCell = document.getElementById(`shizhi-${pillar}`);
        if (shizhiCell) {
            const tenGod = ten_gods[`${pillar}_gan`] || '';
            console.log(`[displaySizhu] ${pillar} 十神:`, tenGod);
            shizhiCell.textContent = tenGod;
        }

        // 藏干
        const zangganCell = document.getElementById(`zanggan-${pillar}`);
        if (zangganCell && result[pillar]) {
            const branch = result[pillar].charAt(1);
            const zangan = ZANGAN_MAP[branch] || [];
            const yearGan = result.year ? result.year.charAt(0) : '';
            console.log(`[displaySizhu] ${pillar} 藏干，地支:`, branch, '年干:', yearGan, '藏干数据:', zangan);
            zangganCell.innerHTML = zangan.map(z => {
                const tenGod = getTenGod(yearGan, z.gan);
                return `${z.gan}(${tenGod})`;
            }).join('<br>');
        }

        // 纳音
        const nayinCell = document.getElementById(`nayin-${pillar}`);
        if (nayinCell) {
            const nayin = result[`${pillar}_nayin`] || '';
            console.log(`[displaySizhu] ${pillar} 纳音:`, nayin);
            nayinCell.textContent = nayin;
        }

        // 长生
        const changshengCell = document.getElementById(`changsheng-${pillar}`);
        if (changshengCell) {
            const info = nayin_changsheng[pillar] || {};
            console.log(`[displaySizhu] ${pillar} 长生:`, info);
            changshengCell.textContent = info.position || '';
        }

        // 神煞
        const shenshaCell = document.getElementById(`shensha-${pillar}`);
        if (shenshaCell) {
            shenshaCell.textContent = '';
        }
    });
    
    // 三垣列数据
    const sanyuanLabels = { taiyuan: '胎', minggong: '命', shengong: '身' };
    console.log('[displaySizhu] 开始处理三垣数据:', sanyuanPillars);
    sanyuanPillars.forEach(pillar => {
        const data = result[pillar] || {};
        console.log(`[displaySizhu] ${pillar} 数据:`, data);
        if (!data.ganzhi) {
            console.warn(`[displaySizhu] ${pillar} 缺少 ganzhi 数据`);
            return;
        }

        // 天干
        const stemCell = document.getElementById(`stem-${pillar}`);
        if (stemCell) {
            const stem = data.ganzhi.charAt(0);
            console.log(`[displaySizhu] ${pillar} 天干:`, stem);
            stemCell.textContent = stem;
            stemCell.className = `table-cell stem-cell ${WUXING_COLORS[GAN_WUXING[stem]] || ''}`;
        }

        // 地支
        const branchCell = document.getElementById(`branch-${pillar}`);
        if (branchCell) {
            const branch = data.ganzhi.charAt(1);
            console.log(`[displaySizhu] ${pillar} 地支:`, branch);
            branchCell.textContent = branch;
            branchCell.className = `table-cell branch-cell ${WUXING_COLORS[ZHI_WUXING[branch]] || ''}`;
        }

        // 十神（显示与年柱的十神关系）
        const shizhiCell = document.getElementById(`shizhi-${pillar}`);
        if (shizhiCell) {
            const yearGan = result.year ? result.year.charAt(0) : '';
            const taiyuanGan = data.ganzhi ? data.ganzhi.charAt(0) : '';
            shizhiCell.textContent = yearGan && taiyuanGan ? getTenGod(yearGan, taiyuanGan) : (sanyuanLabels[pillar] || '');
        }
        
        // 藏干
        const zangganCell = document.getElementById(`zanggan-${pillar}`);
        if (zangganCell) {
            const zhi = data.ganzhi.charAt(1) || '';
            const zangans = ZANGAN_MAP[zhi] || [];
            const yearGan = result.year ? result.year.charAt(0) : '';
            zangganCell.innerHTML = zangans.map(z => {
                const tenGod = getTenGod(yearGan, z.gan);
                return `${z.gan}(${tenGod})`;
            }).join('<br>') || '';
        }
        
        // 纳音
        const nayinCell = document.getElementById(`nayin-${pillar}`);
        if (nayinCell) {
            nayinCell.textContent = data.nayin || '';
        }
        
        // 长生
        const changshengCell = document.getElementById(`changsheng-${pillar}`);
        if (changshengCell) {
            changshengCell.textContent = data.changsheng?.position || '';
        }
        
        // 神煞
        const shenshaCell = document.getElementById(`shensha-${pillar}`);
        if (shenshaCell) {
            shenshaCell.textContent = '';
        }
    });
}

// ===== 显示三垣 =====
function displaySanyuan(result) {
    console.log('[displaySanyuan] 开始显示三垣');
    console.log('[displaySanyuan] 输入参数 result 类型:', typeof result);
    console.log('[displaySanyuan] result 是否为 null:', result === null);
    console.log('[displaySanyuan] result 是否为 undefined:', result === undefined);

    if (!result) {
        console.error('[displaySanyuan] result 为空，无法显示三垣');
        return;
    }

    console.log('[displaySanyuan] result 所有字段:', Object.keys(result));
    console.log('[displaySanyuan] 三垣原始数据:', {
        taiyuan: result.taiyuan,
        minggong: result.minggong,
        shengong: result.shengong
    });

    // 显示三垣卡片
    const sanyuanCard = document.getElementById('sanyuan-card');
    if (sanyuanCard) {
        sanyuanCard.style.display = 'block';
        console.log('[displaySanyuan] 三垣卡片已显示');
    } else {
        console.warn('[displaySanyuan] 找不到三垣卡片元素 sanyuan-card');
    }

    // 胎元
    const taiyuan = result.taiyuan || {};
    const taiyuanGanzhiEl = document.getElementById('taiyuan-ganzhi');
    const taiyuanNayinEl = document.getElementById('taiyuan-nayin');
    const taiyuanChangshengEl = document.getElementById('taiyuan-changsheng');
    console.log('[displaySanyuan] 胎元元素:', { taiyuanGanzhiEl, taiyuanNayinEl, taiyuanChangshengEl });

    if (taiyuanGanzhiEl) taiyuanGanzhiEl.textContent = taiyuan.ganzhi || '';
    if (taiyuanNayinEl) taiyuanNayinEl.textContent = taiyuan.nayin || '';
    const taiyuanCs = taiyuan.changsheng || {};
    if (taiyuanChangshengEl) taiyuanChangshengEl.textContent = `${taiyuanCs.position || ''} ${taiyuanCs.ji_xiong || ''}`.trim();
    console.log('[displaySanyuan] 胎元数据:', { ganzhi: taiyuan.ganzhi, nayin: taiyuan.nayin, changsheng: taiyuanCs });

    // 命宫
    const minggong = result.minggong || {};
    const minggongGanzhiEl = document.getElementById('minggong-ganzhi');
    const minggongNayinEl = document.getElementById('minggong-nayin');
    const minggongChangshengEl = document.getElementById('minggong-changsheng');

    if (minggongGanzhiEl) minggongGanzhiEl.textContent = minggong.ganzhi || '';
    if (minggongNayinEl) minggongNayinEl.textContent = minggong.nayin || '';
    const minggongCs = minggong.changsheng || {};
    if (minggongChangshengEl) minggongChangshengEl.textContent = `${minggongCs.position || ''} ${minggongCs.ji_xiong || ''}`.trim();
    console.log('[displaySanyuan] 命宫数据:', { ganzhi: minggong.ganzhi, nayin: minggong.nayin, changsheng: minggongCs });

    // 身宫
    const shengong = result.shengong || {};
    const shengongGanzhiEl = document.getElementById('shengong-ganzhi');
    const shengongNayinEl = document.getElementById('shengong-nayin');
    const shengongChangshengEl = document.getElementById('shengong-changsheng');

    if (shengongGanzhiEl) shengongGanzhiEl.textContent = shengong.ganzhi || '';
    if (shengongNayinEl) shengongNayinEl.textContent = shengong.nayin || '';
    const shengongCs = shengong.changsheng || {};
    if (shengongChangshengEl) shengongChangshengEl.textContent = `${shengongCs.position || ''} ${shengongCs.ji_xiong || ''}`.trim();
    console.log('[displaySanyuan] 身宫数据:', { ganzhi: shengong.ganzhi, nayin: shengong.nayin, changsheng: shengongCs });

    console.log('[displaySanyuan] 三垣显示完成');
}

// ===== 显示大运小运 =====
function displayDayunXiaoyun(dayunResult, currentAge, shenshaResult) {
    console.log('[displayDayunXiaoyun] 开始显示大运小运');
    console.log('[displayDayunXiaoyun] dayunResult:', dayunResult);
    console.log('[displayDayunXiaoyun] currentAge:', currentAge);
    console.log('[displayDayunXiaoyun] shenshaResult:', shenshaResult);

    const liunianData = shenshaResult || {};

    // 大运方向
    const directionEl = document.getElementById('dayun-direction');
    if (directionEl) {
        directionEl.textContent = dayunResult?.direction || '顺行';
        console.log('[displayDayunXiaoyun] 大运方向:', dayunResult?.direction || '顺行');
    }
    
    // 设置当前流运信息
    const currentDayunGanZhi = document.getElementById('current-dayun-ganzhi');
    const currentXiaoyunGanZhi = document.getElementById('current-xiaoyun-ganzhi');
    const currentLiunianGanZhi = document.getElementById('current-liunian-ganzhi');
    
    if (currentDayunGanZhi) currentDayunGanZhi.textContent = liunianData.dayunGanZhi || '';
    if (currentXiaoyunGanZhi) currentXiaoyunGanZhi.textContent = liunianData.xiaoyunGanZhi || '';
    if (currentLiunianGanZhi) currentLiunianGanZhi.textContent = liunianData.liunianGanZhi || '';
    
    // 显示大运神煞
    const dayunShenshaEl = document.getElementById('current-dayun-shensha');
    if (dayunShenshaEl) {
        const shensha = liunianData.dayunShensha || [];
        dayunShenshaEl.innerHTML = shensha.length > 0 
            ? shensha.map(s => `<span class="shensha-item">${s}</span>`).join('')
            : '<span class="shensha-item">无</span>';
    }
    
    // 显示小运神煞
    const xiaoyunShenshaEl = document.getElementById('current-xiaoyun-shensha');
    if (xiaoyunShenshaEl) {
        xiaoyunShenshaEl.innerHTML = '<span class="shensha-item">无</span>';
    }
    
    // 显示流年神煞
    const liunianShenshaEl = document.getElementById('current-liunian-shensha');
    if (liunianShenshaEl) {
        const shensha = liunianData.liunianShensha || [];
        liunianShenshaEl.innerHTML = shensha.length > 0 
            ? shensha.map(s => `<span class="shensha-item">${s}</span>`).join('')
            : '<span class="shensha-item">无</span>';
    }
    
    // 生成大运横向表格
    const dayunTable = document.getElementById('dayun-table');
    if (dayunTable && dayunResult.dayun && dayunResult.dayun.length > 0) {
        const tengodRow = dayunTable.querySelector('.dayun-tengod-row');
        const ganzhiRow = dayunTable.querySelector('.dayun-ganzhi-row');
        const nayinRow = dayunTable.querySelector('.dayun-nayin-row');
        const ageRow = dayunTable.querySelector('.dayun-age-row');
        const dateRow = dayunTable.querySelector('.dayun-date-row');

        // 清空现有列（保留第一列标签）
        while (tengodRow.children.length > 1) tengodRow.removeChild(tengodRow.lastChild);
        while (ganzhiRow.children.length > 1) ganzhiRow.removeChild(ganzhiRow.lastChild);
        while (nayinRow.children.length > 1) nayinRow.removeChild(nayinRow.lastChild);
        while (ageRow.children.length > 1) ageRow.removeChild(ageRow.lastChild);
        while (dateRow.children.length > 1) dateRow.removeChild(dateRow.lastChild);

        // 添加大运数据列
        dayunResult.dayun.forEach((dayun, index) => {
            // 十神
            const tenGodTd = document.createElement('td');
            tenGodTd.textContent = dayun.ten_god || '';
            tenGodTd.className = 'ten-god-cell';
            tengodRow.appendChild(tenGodTd);

            // 干支
            const ganzhiTd = document.createElement('td');
            ganzhiTd.textContent = dayun.ganzhi;
            ganzhiTd.className = 'ganzhi-cell clickable';
            ganzhiTd.dataset.index = index;
            ganzhiTd.addEventListener('click', async () => {
                if (!dayunLiunianMode) {
                    await toggleDayunLiunianMode();
                }
                await showLiuyunInXiaoyunArea(index);
                await updateTopThreeColumns(index, 0, 0);
            });
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

// ===== 显示神煞按柱 =====
function displayShenshaByColumn(shenshaResult) {
    const grid = document.getElementById('shensha-column-grid');
    grid.innerHTML = '';
    
    const shenshaByColumn = shenshaResult.shensha_by_column || {};
    const pillarNames = {
        'year': '年柱',
        'month': '月柱', 
        'day': '日柱',
        'hour': '时柱',
        'taiyuan': '胎元',
        'minggong': '命宫',
        'shengong': '身宫'
    };
    
    ['year', 'month', 'day', 'hour'].forEach(pillar => {
        const shensha = shenshaByColumn[pillar] || [];
        const item = document.createElement('div');
        item.className = 'shensha-column-item';
        item.innerHTML = `
            <div class="shensha-column-title">${pillarNames[pillar]}</div>
            <div class="shensha-column-content">${shensha.join('<br>') || '无'}</div>
        `;
        grid.appendChild(item);
    });
    
    // 主体的神煞格
    const mainShaItem = document.createElement('div');
    mainShaItem.className = 'shensha-column-item';
    mainShaItem.innerHTML = `
        <div class="shensha-column-title">胎元</div>
        <div class="shensha-column-content">${(shenshaByColumn.taiyuan || []).join('<br>') || '无'}</div>
    `;
    grid.appendChild(mainShaItem);
    
    const minggongItem = document.createElement('div');
    minggongItem.className = 'shensha-column-item';
    minggongItem.innerHTML = `
        <div class="shensha-column-title">命宫</div>
        <div class="shensha-column-content">${(shenshaByColumn.minggong || []).join('<br>') || '无'}</div>
    `;
    grid.appendChild(minggongItem);
    
    const shengongItem = document.createElement('div');
    shengongItem.className = 'shensha-column-item';
    shengongItem.innerHTML = `
        <div class="shensha-column-title">身宫</div>
        <div class="shensha-column-content">${(shenshaByColumn.shengong || []).join('<br>') || '无'}</div>
    `;
    grid.appendChild(shengongItem);
}

// ===== 显示详细分析 =====
function displayAnalysis(baziResult, shenshaResult) {
    // 五行强弱
    displayWuxingAnalysis(baziResult);
    
    // 神煞列表
    displayShenshaAnalysis(shenshaResult);
    
    // 十二长生
    displayChangshengAnalysis(baziResult);
    
    // 空亡
    displayKongwangAnalysis(baziResult);
}

function displayWuxingAnalysis(result) {
    const pillars = ['year', 'month', 'day', 'hour'];
    const wuxingCount = {'木': 0, '火': 0, '土': 0, '金': 0, '水': 0};
    
    pillars.forEach(pillar => {
        // 天干五行
        const stem = result[pillar].charAt(0);
        const stemWuxing = GAN_WUXING[stem];
        if (stemWuxing) wuxingCount[stemWuxing]++;
        
        // 地支五行
        const branch = result[pillar].charAt(1);
        const branchWuxing = ZHI_WUXING[branch];
        if (branchWuxing) wuxingCount[branchWuxing]++;
    });
    
    Object.keys(wuxingCount).forEach(wuxing => {
        const el = document.getElementById(`wuxing-${wuxing}`);
        if (el) {
            el.textContent = `${wuxingCount[wuxing]}个`;
            el.className = `wuxing-strength ${WUXING_COLORS[wuxing]}`;
        }
    });
}

function displayShenshaAnalysis(shenshaResult) {
    const container = document.getElementById('shensha-list');
    const shenshaByColumn = shenshaResult.shensha_by_column || {};
    
    let html = '';
    const pillarNames = {
        'year': '年柱', 'month': '月柱', 'day': '日柱', 'hour': '时柱',
        'taiyuan': '胎元', 'minggong': '命宫', 'shengong': '身宫'
    };
    
    Object.keys(shenshaByColumn).forEach(pillar => {
        const shensha = shenshaByColumn[pillar];
        if (shensha && shensha.length > 0) {
            html += `<div><strong>${pillarNames[pillar]}:</strong> ${shensha.join('、')}</div>`;
        }
    });
    
    container.innerHTML = html || '<div class="shensha-placeholder">无神煞</div>';
}

function displayLiuyunShenshaAnalysis(shenshaResult) {
    const container = document.getElementById('shensha-list');
    
    let html = '';
    const pillarNames = {
        'year': '年柱', 'month': '月柱', 'day': '日柱', 'hour': '时柱',
        'taiyuan': '胎元', 'minggong': '命宫', 'shengong': '身宫'
    };
    const mainPillars = ['year', 'month', 'day', 'hour'];
    
    // 显示四柱神煞
    const shenshaByColumn = shenshaResult.shensha_by_column || {};
    mainPillars.forEach(pillar => {
        const shensha = shenshaByColumn[pillar];
        if (shensha && shensha.length > 0) {
            html += `<div><strong>${pillarNames[pillar]}:</strong> ${shensha.join('、')}</div>`;
        }
    });
    
    // 显示大运神煞
    const dayunShensha = shenshaResult.dayun_shensha || [];
    if (dayunShensha.length > 0) {
        html += `<div><strong>大运神煞:</strong> ${dayunShensha.join('、')}</div>`;
    } else {
        html += `<div><strong>大运神煞:</strong> 无神煞</div>`;
    }
    
    // 显示流年神煞
    const liunianShensha = shenshaResult.liunian_shensha || [];
    if (liunianShensha.length > 0) {
        html += `<div><strong>流年神煞:</strong> ${liunianShensha.join('、')}</div>`;
    } else {
        html += `<div><strong>流年神煞:</strong> 无神煞</div>`;
    }
    
    container.innerHTML = html || '<div class="shensha-placeholder">无神煞</div>';
}

function displayChangshengAnalysis(result) {
    const container = document.getElementById('changsheng-grid');
    container.innerHTML = '';
    
    const nayin_changsheng = result.nayin_changsheng || {};
    const nian_gan_changsheng = result.nian_gan_changsheng || {};
    
    // 自坐长生
    const dayInfo = nayin_changsheng.day || {};
    const dayItem = document.createElement('div');
    dayItem.className = 'changsheng-item';
    dayItem.innerHTML = `
        <div class="changsheng-title">自坐长生</div>
        <div class="changsheng-content">
            ${result.day_nayin} ${result.day_zhi || result.day.charAt(1)} - ${dayInfo.position || ''} (${dayInfo.ji_xiong || ''})
        </div>
    `;
    container.appendChild(dayItem);
    
    // 年纳音坐支长生
    Object.keys(nian_gan_changsheng).forEach(key => {
        const info = nian_gan_changsheng[key];
        if (!info) return;
        
        const label = key === 'month_zhi' ? '月支' : key === 'day_zhi' ? '日支' : '时支';
        const item = document.createElement('div');
        item.className = 'changsheng-item';
        item.innerHTML = `
            <div class="changsheng-title">年纳音坐${label}长生</div>
            <div class="changsheng-content">
                ${info.nayin || ''} ${info.zhi || ''} ${info.position || ''} (${info.ji_xiong || ''})
            </div>
        `;
        container.appendChild(item);
    });
}

function displayKongwangAnalysis(result) {
    const container = document.getElementById('kongwang-list');
    // 空亡计算需要根据日柱所在旬
    const dayGanzhi = result.day || '';
    container.innerHTML = `<div class="kongwang-placeholder">空亡计算待实现</div>`;
}

// ===== 切换分析Tab =====
function switchAnalysisTab(tabId) {
    document.querySelectorAll('.analysis-tab').forEach(tab => {
        tab.classList.toggle('active', tab.getAttribute('data-tab') === tabId);
    });
    
    document.querySelectorAll('.analysis-section').forEach(section => {
        section.classList.toggle('active', section.id === `${tabId}-analysis`);
    });
}

// ===== 复制结果 =====
function copyResult() {
    if (!currentBaziResult) return;
    
    const text = `${currentBaziResult.year} ${currentBaziResult.month} ${currentBaziResult.day} ${currentBaziResult.hour}`;
    navigator.clipboard.writeText(text).then(() => {
        alert('已复制到剪贴板');
    });
}

// ===== 添加笔记 =====
let noteTargetId = null;

function addNote() {
    if (!currentRecord) return;
    noteTargetId = currentRecord.id;
    const textarea = document.getElementById('note-textarea');
    textarea.value = currentRecord.note || '';
    document.getElementById('note-modal').style.display = 'flex';
}

function hideNoteModal() {
    noteTargetId = null;
    document.getElementById('note-textarea').value = '';
    document.getElementById('note-modal').style.display = 'none';
}

async function saveNote() {
    if (!noteTargetId) return;

    // 确保 db 对象已加载
    let db = window.db;
    if (!db) {
        console.error('保存笔记时数据库未加载');
        alert('数据库未加载，请刷新页面重试');
        return;
    }

    const noteText = document.getElementById('note-textarea').value;
    try {
        const record = await db.getRecord(noteTargetId);
        if (record) {
            record.note = noteText;
            await db.updateRecord(noteTargetId, record);
            currentRecord.note = noteText;
        }
        hideNoteModal();
    } catch (err) {
        console.error('保存笔记失败:', err);
        alert('保存笔记失败');
    }
}

// ===== 删除记录 =====
let deleteTargetId = null;

function showDeleteConfirm() {
    if (!currentRecord) return;
    deleteTargetId = currentRecord.id;
    document.getElementById('delete-modal').style.display = 'flex';
}

function hideDeleteConfirm() {
    deleteTargetId = null;
    document.getElementById('delete-modal').style.display = 'none';
}

async function deleteCurrentRecord() {
    if (!deleteTargetId) return;

    // 确保 db 对象已加载
    let db = window.db;
    if (!db) {
        console.error('删除记录时数据库未加载');
        alert('数据库未加载，请刷新页面重试');
        return;
    }

    try {
        await db.deleteRecord(deleteTargetId);
        window.location.href = '../records/index.html';
    } catch (err) {
        console.error('删除记录失败:', err);
    }
}

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
    
    return 0;
}

// 调用多年流年API
async function getYearsLiunian(startYear, count) {
    try {
        const algo = await loadAlgorithmModules();
        return algo.getYearsLiuNian(startYear, count);
    } catch (error) {
        console.error('getYearsLiunian error:', error);
        throw error;
    }
}

// ===== 显示大运对应的流年小运到小运区域 =====
async function showLiuyunInXiaoyunArea(dayunIndex) {
    const xiaoyunTable = document.getElementById('xiaoyun-table');
    if (!xiaoyunTable || !currentDayunResult || !currentDayunResult.dayun) return;
    
    if (dayunIndex === -1) {
        dayunIndex = findCurrentDayunIndex(window._currentAge || currentAge);
    }
    
    const dayun = currentDayunResult.dayun[dayunIndex];
    if (!dayun) return;
    
    selectedDayunIndex = dayunIndex;
    
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
    
    const startYear = currentBirthYear + dayun.start_age;
    let liunianData = liunianCache[startYear];
    if (!liunianData) {
        liunianData = await getYearsLiunian(startYear, 10);
        liunianCache[startYear] = liunianData;
    }
    
    const xiaoyunStartIndex = dayun.start_age - 1;
    const xiaoyunData = currentDayunResult.xiaoyun.slice(xiaoyunStartIndex, xiaoyunStartIndex + 10);
    
    const subtitleEl = document.querySelector('.xiaoyun-table-container .xiaoyun-subtitle');
    if (subtitleEl) {
        subtitleEl.textContent = `小运流年 - ${dayun.ganzhi}`;
    }
    
    const liunianRow = xiaoyunTable.querySelector('.xiaoyun-liunian-row');
    const xiaoyunRowEl = xiaoyunTable.querySelector('.xiaoyun-xiaoyun-row');
    const ageRow = xiaoyunTable.querySelector('.xiaoyun-age-row');
    
    // 清空现有列（保留第一列标签）
    while (liunianRow.children.length > 1) liunianRow.removeChild(liunianRow.lastChild);
    while (xiaoyunRowEl.children.length > 1) xiaoyunRowEl.removeChild(xiaoyunRowEl.lastChild);
    while (ageRow.children.length > 1) ageRow.removeChild(ageRow.lastChild);
    
    // 隐藏小运行行（因为小运已合并到流年单元格中）
    xiaoyunRowEl.style.display = 'none';
    
    for (let i = 0; i < 10; i++) {
        const year = startYear + i;
        const liunian = liunianData[i] || {};
        const xiaoyun = xiaoyunData[i] || {};
        
        // 流年单元格（包含小运在下方）
        const liunianTd = document.createElement('td');
        liunianTd.className = 'liuyun-cell clickable';
        liunianTd.innerHTML = `
            <div class="liuyun-item liuyun-liu">${liunian.ganzhi || ''}</div>
            <div class="liuyun-item liuyun-xiao">${xiaoyun.ganzhi || ''}</div>
        `;
        liunianTd.style.cursor = 'pointer';
        liunianTd.addEventListener('click', () => {
            if (dayunLiunianMode) {
                currentLiunianIndex = i;
                currentXiaoyunIndex = i;
                highlightLiunianColumn(i);
                updateTopThreeColumns(dayunIndex, i, i);
            }
        });
        liunianRow.appendChild(liunianTd);
        
        // 小运单元格（占位，保持结构一致但隐藏）
        const xiaoyunTd = document.createElement('td');
        xiaoyunTd.style.display = 'none';
        xiaoyunRowEl.appendChild(xiaoyunTd);
        
        // 虚岁
        const ageTd = document.createElement('td');
        ageTd.textContent = `${dayun.start_age + i}岁`;
        ageTd.className = 'age-cell';
        ageRow.appendChild(ageTd);
    }
}

// ===== 切换大运流年模式 =====
async function toggleDayunLiunianMode() {
    dayunLiunianMode = !dayunLiunianMode;
    const btn = document.getElementById('dayun-liunian-btn');
    const sanyuanCard = document.getElementById('sanyuan-card');
    
    if (dayunLiunianMode) {
        btn.classList.add('active');
        if (sanyuanCard) sanyuanCard.style.display = 'block';
        document.getElementById('header-taiyuan').textContent = '大运';
        document.getElementById('header-minggong').textContent = '小运';
        document.getElementById('header-shengong').textContent = '流年';
        await showLiuyunInXiaoyunArea(-1);
        await updateTopThreeColumns(selectedDayunIndex, 0, 0);
    } else {
        btn.classList.remove('active');
        if (sanyuanCard) sanyuanCard.style.display = 'none';
        document.getElementById('header-taiyuan').textContent = '胎元';
        document.getElementById('header-minggong').textContent = '命宫';
        document.getElementById('header-shengong').textContent = '身宫';
        restoreSanyuanData();
        // 恢复原始神煞分析
        if (originalShenshaResult) {
            displayShenshaAnalysis(originalShenshaResult);
        }
    }
}

// ===== 更新上方三大运小运流年列 =====
async function updateTopThreeColumns(dayunIndex, xiaoyunRelIndex = 0, liunianRelIndex = 0) {
    if (!currentDayunResult || !currentBaziResult) return;
    
    if (dayunIndex === -1) {
        dayunIndex = findCurrentDayunIndex(window._currentAge || currentAge);
    }
    
    currentDayunIndex = dayunIndex;
    currentXiaoyunIndex = xiaoyunRelIndex;
    currentLiunianIndex = liunianRelIndex;
    
    const dayun = currentDayunResult.dayun[dayunIndex];
    if (!dayun) return;
    
    const startYear = currentBirthYear + dayun.start_age;
    let liunianData = liunianCache[startYear];
    if (!liunianData) {
        liunianData = await getYearsLiunian(startYear, 10);
        liunianCache[startYear] = liunianData;
    }
    
    const xiaoyunStartIndex = dayun.start_age - 1;
    const xiaoyun = currentDayunResult.xiaoyun[xiaoyunStartIndex + xiaoyunRelIndex];
    const liunian = liunianData[liunianRelIndex] || {};
    
    // 更新大运列
    document.getElementById('stem-taiyuan').textContent = dayun.ganzhi.charAt(0) || '';
    document.getElementById('branch-taiyuan').textContent = dayun.ganzhi.charAt(1) || '';
    document.getElementById('shizhi-taiyuan').textContent = dayun.ten_god || '';
    document.getElementById('nayin-taiyuan').textContent = dayun.nayin || '';
    
    // 更新小运列
    document.getElementById('stem-minggong').textContent = xiaoyun?.ganzhi.charAt(0) || '';
    document.getElementById('branch-minggong').textContent = xiaoyun?.ganzhi.charAt(1) || '';
    document.getElementById('shizhi-minggong').textContent = xiaoyun?.ten_god || '';
    document.getElementById('nayin-minggong').textContent = xiaoyun?.nayin || '';
    
    // 更新流年列
    const yearGan = currentBaziResult?.year?.charAt(0) || '';
    const liunianGan = liunian.ganzhi?.charAt(0) || '';
    document.getElementById('stem-shengong').textContent = liunianGan;
    document.getElementById('branch-shengong').textContent = liunian.ganzhi?.charAt(1) || '';
    document.getElementById('shizhi-shengong').textContent = getTenGod(yearGan, liunianGan);
    document.getElementById('nayin-shengong').textContent = liunian.nayin || '';
    
    // 获取并显示神煞
    const shenshaResult = await callShenshaAPI(
        currentBaziResult, 
        dayun.ganzhi || '', 
        liunian.ganzhi || ''
    );
    
    // 大运神煞
    const dayunShensha = shenshaResult.dayun_shensha || [];
    document.getElementById('shensha-taiyuan').textContent = dayunShensha.join(', ') || '';
    
    // 小运神煞（使用年柱神煞）
    const xiaoyunShensha = shenshaResult.year_shensha || [];
    document.getElementById('shensha-minggong').textContent = xiaoyunShensha.join(', ') || '';
    
    // 流年神煞
    const liunianShensha = shenshaResult.liunian_shensha || [];
    document.getElementById('shensha-shengong').textContent = liunianShensha.join(', ') || '';
    
    // 更新详细分析卡片的神煞列表
    displayLiuyunShenshaAnalysis(shenshaResult);
    
    // 大运藏干
    const dayunZhi = dayun.ganzhi.charAt(1) || '';
    const dayunZangans = ZANGAN_MAP[dayunZhi] || [];
    document.getElementById('zanggan-taiyuan').innerHTML = 
        dayunZangans.map(z => {
            const tenGod = getTenGod(yearGan, z.gan);
            return `${z.gan}(${tenGod})`;
        }).join('<br>') || '';
    
    // 小运藏干
    const xiaoyunZhi = xiaoyun?.ganzhi.charAt(1) || '';
    const xiaoyunZangans = ZANGAN_MAP[xiaoyunZhi] || [];
    document.getElementById('zanggan-minggong').innerHTML = 
        xiaoyunZangans.map(z => {
            const tenGod = getTenGod(yearGan, z.gan);
            return `${z.gan}(${tenGod})`;
        }).join('<br>') || '';
    
    // 流年藏干
    const liunianZhi = liunian.ganzhi?.charAt(1) || '';
    const liunianZangans = ZANGAN_MAP[liunianZhi] || [];
    document.getElementById('zanggan-shengong').innerHTML = 
        liunianZangans.map(z => {
            const tenGod = getTenGod(yearGan, z.gan);
            return `${z.gan}(${tenGod})`;
        }).join('<br>') || '';
    
    // 更新底部卡片的大运干支
    const currentDayunGanZhiEl = document.getElementById('current-dayun-ganzhi');
    if (currentDayunGanZhiEl) currentDayunGanZhiEl.textContent = dayun.ganzhi || '';
    
    // 更新底部卡片的小运干支
    const currentXiaoyunGanZhiEl = document.getElementById('current-xiaoyun-ganzhi');
    if (currentXiaoyunGanZhiEl) currentXiaoyunGanZhiEl.textContent = xiaoyun?.ganzhi || '';
    
    // 更新底部卡片的流年干支
    const currentLiunianGanZhiEl = document.getElementById('current-liunian-ganzhi');
    if (currentLiunianGanZhiEl) currentLiunianGanZhiEl.textContent = liunian.ganzhi || '';
    
    // 更新底部卡片的大运神煞
    const currentDayunShenshaEl = document.getElementById('current-dayun-shensha');
    if (currentDayunShenshaEl) {
        currentDayunShenshaEl.innerHTML = dayunShensha.length > 0 
            ? dayunShensha.map(s => `<span class="shensha-item">${s}</span>`).join('')
            : '<span class="shensha-item">无</span>';
    }
    
    // 更新底部卡片的流年神煞
    const currentLiunianShenshaEl = document.getElementById('current-liunian-shensha');
    if (currentLiunianShenshaEl) {
        currentLiunianShenshaEl.innerHTML = liunianShensha.length > 0 
            ? liunianShensha.map(s => `<span class="shensha-item">${s}</span>`).join('')
            : '<span class="shensha-item">无</span>';
    }
    
    // 更新底部卡片的小运神煞（目前固定显示"无"）
    const currentXiaoyunShenshaEl = document.getElementById('current-xiaoyun-shensha');
    if (currentXiaoyunShenshaEl) {
        currentXiaoyunShenshaEl.innerHTML = '<span class="shensha-item">无</span>';
    }
    
    highlightDayunColumn(dayunIndex);
    highlightLiunianColumn(liunianRelIndex);
}

// ===== 恢复三垣数据 =====
function restoreSanyuanData() {
    if (!currentBaziResult) return;
    const taiyuan = currentBaziResult.taiyuan || {};
    const minggong = currentBaziResult.minggong || {};
    const shengong = currentBaziResult.shengong || {};
    
    restoreSanyuanItem('taiyuan', taiyuan, '胎');
    restoreSanyuanItem('minggong', minggong, '命');
    restoreSanyuanItem('shengong', shengong, '身');
}

function restoreSanyuanItem(type, data, label) {
    if (!data) return;
    const ganzhi = data.ganzhi || '';
    const zhi = ganzhi.charAt(1) || '';
    const yearGan = currentBaziResult?.year?.charAt(0) || '';
    
    document.getElementById(`stem-${type}`).textContent = ganzhi.charAt(0) || '';
    document.getElementById(`branch-${type}`).textContent = zhi || '';
    document.getElementById(`shizhi-${type}`).textContent = label || '';
    document.getElementById(`nayin-${type}`).textContent = data.nayin || '';
    document.getElementById(`changsheng-${type}`).textContent = data.changsheng?.position || '';
    document.getElementById(`shensha-${type}`).textContent = '';
    
    // 恢复藏干
    const zangans = ZANGAN_MAP[zhi] || [];
    document.getElementById(`zanggan-${type}`).innerHTML = 
        zangans.map(z => {
            const tenGod = getTenGod(yearGan, z.gan);
            return `${z.gan}(${tenGod})`;
        }).join('<br>') || '';
}

// ===== 高亮函数 =====
function highlightDayunColumn(index) {
    const dayunTable = document.getElementById('dayun-table');
    if (!dayunTable) return;
    dayunTable.querySelectorAll('.ganzhi-cell').forEach((cell, idx) => {
        if (idx === index) {
            cell.classList.add('selected');
        } else {
            cell.classList.remove('selected');
        }
    });
}

function highlightLiunianColumn(index) {
    const xiaoyunTable = document.getElementById('xiaoyun-table');
    if (!xiaoyunTable) return;
    xiaoyunTable.querySelectorAll('.liuyun-cell').forEach((cell, idx) => {
        if (idx === index) {
            cell.classList.add('selected');
        } else {
            cell.classList.remove('selected');
        }
    });
}
