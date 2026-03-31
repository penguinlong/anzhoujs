const GAN_LIST = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const ZHI_LIST = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

const GAN_INDEX = {
    "甲": 0,
    "乙": 1,
    "丙": 2,
    "丁": 3,
    "戊": 4,
    "己": 5,
    "庚": 6,
    "辛": 7,
    "壬": 8,
    "癸": 9,
};

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

const ZHI_SEQUENCE = [
    "子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"
];

const NAYIN_GAN = {
    "甲": "大林木",
    "乙": "大林木",
    "丙": "山头火",
    "丁": "山头火",
    "戊": "城头土",
    "己": "城头土",
    "庚": "剑锋金",
    "辛": "剑锋金",
    "壬": "涧下水",
    "癸": "涧下水",
};

class ShenShaCalculator {
    _get_nayin(ganzhi) {
        if (!ganzhi || ganzhi.length < 2) return "";
        return NAYIN_GAN.get(ganzhi[0], "") || "";
    }

    _get_xun(ganzhi) {
        const xun_map = {
            "甲子": "甲子旬", "乙丑": "甲子旬", "丙寅": "甲子旬", "丁卯": "甲子旬",
            "戊辰": "甲子旬", "己巳": "甲子旬", "庚午": "甲子旬", "辛未": "甲子旬",
            "壬申": "甲子旬", "癸酉": "甲子旬",
            "甲戌": "甲戌旬", "乙亥": "甲戌旬", "丙子": "甲戌旬", "丁丑": "甲戌旬",
            "戊寅": "甲戌旬", "己卯": "甲戌旬", "庚辰": "甲戌旬", "辛巳": "甲戌旬",
            "壬午": "甲戌旬", "癸未": "甲戌旬",
            "甲申": "甲申旬", "乙酉": "甲申旬", "丙戌": "甲申旬", "丁亥": "甲申旬",
            "戊子": "甲申旬", "己丑": "甲申旬", "庚寅": "甲申旬", "辛卯": "甲申旬",
            "壬辰": "甲申旬", "癸巳": "甲申旬",
            "甲午": "甲午旬", "乙未": "甲午旬", "丙申": "甲午旬", "丁酉": "甲午旬",
            "戊戌": "甲午旬", "己亥": "甲午旬", "庚子": "甲午旬", "辛丑": "甲午旬",
            "壬寅": "甲午旬", "癸卯": "甲午旬",
            "甲辰": "甲辰旬", "乙巳": "甲辰旬", "丙午": "甲辰旬", "丁未": "甲辰旬",
            "戊申": "甲辰旬", "己酉": "甲辰旬", "庚戌": "甲辰旬", "辛亥": "甲辰旬",
            "壬子": "甲辰旬", "癸丑": "甲辰旬",
            "甲寅": "甲寅旬", "乙卯": "甲寅旬", "丙辰": "甲寅旬", "丁巳": "甲寅旬",
            "戊午": "甲寅旬", "己未": "甲寅旬", "庚申": "甲寅旬", "辛酉": "甲寅旬",
            "壬戌": "甲寅旬", "癸亥": "甲寅旬",
        };
        return xun_map[ganzhi] || "甲子旬";
    }

    _get_next_zhi(zhi, steps = 1) {
        const idx = ZHI_INDEX[zhi] ?? 0;
        return ZHI_SEQUENCE[(idx + steps) % 12];
    }

    _find_pillars_for_zhi(zhi, pillars) {
        const result = [];
        for (const [pillar, pillar_zhi] of Object.entries(pillars)) {
            if (pillar_zhi === zhi) result.push(pillar);
        }
        return result;
    }

    _init_shensha_by_column() {
        return {
            "year": [],
            "month": [],
            "day": [],
            "hour": [],
            "taiyuan": [],
            "minggong": [],
            "shengong": [],
        };
    }

    _add_shensha_to_pillar(result, pillar, shensha) {
        if (pillar && shensha && !result[pillar].includes(shensha)) {
            result[pillar].push(shensha);
        }
    }

    _add_shensha_to_pillars(result, pillars, shensha) {
        for (const pillar of pillars) {
            this._add_shensha_to_pillar(result, pillar, shensha);
        }
    }

    _merge_shensha(target, source) {
        for (const [pillar, shensha_list] of Object.entries(source)) {
            for (const s of shensha_list) {
                if (!target[pillar].includes(s)) {
                    target[pillar].push(s);
                }
            }
        }
        return target;
    }

    calc_tianyi_guiren(year_gan, pillars) {
        const result = this._init_shensha_by_column();
        const tianyi_map = {
            "甲": ["丑", "未"], "戊": ["丑", "未"], "庚": ["丑", "未"],
            "乙": ["子", "申"], "己": ["子", "申"],
            "丙": ["亥", "酉"], "丁": ["亥", "酉"],
            "壬": ["卯", "巳"], "癸": ["卯", "巳"],
            "辛": ["寅", "午"],
        };
        const target_zhis = tianyi_map[year_gan] || [];
        for (const zhi of target_zhis) {
            const found_pillars = this._find_pillars_for_zhi(zhi, pillars);
            this._add_shensha_to_pillars(result, found_pillars, "天乙贵人");
        }
        return result;
    }

    calc_tiande(month_zhi, pillars) {
        const result = this._init_shensha_by_column();
        if (month_zhi) result["month"].push("天德");
        return result;
    }

    calc_yuede(month_zhi, pillars) {
        const result = this._init_shensha_by_column();
        if (month_zhi) result["month"].push("月德");
        return result;
    }

    calc_lushen(year_gan, pillars) {
        const result = this._init_shensha_by_column();
        const lu_map = {
            "甲": "寅", "乙": "卯", "丙": "巳", "戊": "巳",
            "丁": "午", "己": "午", "庚": "申", "辛": "酉",
            "壬": "亥", "癸": "子",
        };
        const target_zhi = lu_map[year_gan] || "";
        if (target_zhi) {
            const found_pillars = this._find_pillars_for_zhi(target_zhi, pillars);
            this._add_shensha_to_pillars(result, found_pillars, "禄神");
        }
        return result;
    }

    calc_wenchang(year_gan, pillars) {
        const result = this._init_shensha_by_column();
        const wenchang_map = {
            "甲": ["子", "午"], "乙": ["子", "午"],
            "丙": ["卯", "酉"], "丁": ["卯", "酉"],
            "戊": ["辰", "戌", "丑", "未"], "己": ["辰", "戌", "丑", "未"],
            "庚": ["寅", "亥"], "辛": ["寅", "亥"],
            "壬": ["巳", "申"], "癸": ["巳", "申"],
        };
        const target_zhis = wenchang_map[year_gan] || [];
        for (const zhi of target_zhis) {
            const found_pillars = this._find_pillars_for_zhi(zhi, pillars);
            this._add_shensha_to_pillars(result, found_pillars, "文昌");
        }
        return result;
    }

    calc_jinyu(year_gan, pillars) {
        const result = this._init_shensha_by_column();
        const jinyu_map = {
            "甲": "辰", "乙": "巳", "丙": "午", "戊": "午",
            "丁": "未", "己": "未", "庚": "申", "辛": "酉",
            "壬": "戌", "癸": "亥",
        };
        const target_zhi = jinyu_map[year_gan] || "";
        if (target_zhi) {
            const found_pillars = this._find_pillars_for_zhi(target_zhi, pillars);
            this._add_shensha_to_pillars(result, found_pillars, "金舆");
        }
        return result;
    }

    calc_hongluan_tianxi(year_zhi, pillars) {
        const result = this._init_shensha_by_column();
        const hongluan_map = {
            "子": "卯", "丑": "寅", "寅": "丑", "卯": "子",
            "辰": "亥", "巳": "戌", "午": "酉", "未": "申",
            "申": "未", "酉": "午", "戌": "巳", "亥": "辰",
        };
        const duichong_map = {
            "子": "午", "丑": "未", "寅": "申", "卯": "酉",
            "辰": "戌", "巳": "亥", "午": "子", "未": "丑",
            "申": "寅", "酉": "卯", "戌": "辰", "亥": "巳",
        };
        const hl_zhi = hongluan_map[year_zhi] || "";
        const tx_zhi = hl_zhi ? (duichong_map[hl_zhi] || "") : "";

        if (year_zhi) result["year"].push("红鸾");
        if (tx_zhi) {
            const found_pillars = this._find_pillars_for_zhi(tx_zhi, pillars);
            this._add_shensha_to_pillars(result, found_pillars, "天喜");
        }
        return result;
    }

    calc_sanqi(gans, pillars) {
        const result = this._init_shensha_by_column();
        const gan_set = new Set(gans);
        if (gan_set.has("甲") && gan_set.has("戊") && gan_set.has("庚")) {
            result["year"].push("天上三奇");
        }
        if (gan_set.has("乙") && gan_set.has("丙") && gan_set.has("丁")) {
            result["year"].push("地下三奇");
        }
        if (gan_set.has("壬") && gan_set.has("癸") && gan_set.has("辛")) {
            result["year"].push("人中三奇");
        }
        return result;
    }

    calc_jiesha(year_zhi, day_zhi, pillars) {
        const result = this._init_shensha_by_column();
        const jiesha_map = {
            "申": "巳", "子": "巳", "辰": "巳",
            "寅": "亥", "午": "亥", "戌": "亥",
            "巳": "寅", "酉": "寅", "丑": "寅",
            "亥": "申", "卯": "申", "未": "申",
        };
        const target_zhi_y = jiesha_map[year_zhi] || "";
        const target_zhi_d = jiesha_map[day_zhi] || "";

        if (target_zhi_y) {
            const found_pillars = this._find_pillars_for_zhi(target_zhi_y, pillars);
            this._add_shensha_to_pillars(result, found_pillars, "劫煞");
        }
        if (target_zhi_d && target_zhi_d !== target_zhi_y) {
            const found_pillars = this._find_pillars_for_zhi(target_zhi_d, pillars);
            this._add_shensha_to_pillars(result, found_pillars, "劫煞");
        }
        return result;
    }

    calc_wangshen(year_zhi, day_zhi, pillars) {
        const result = this._init_shensha_by_column();
        const wangshen_map = {
            "寅": "巳", "午": "巳", "戌": "巳",
            "亥": "寅", "卯": "寅", "未": "寅",
            "巳": "申", "酉": "申", "丑": "申",
            "申": "亥", "子": "亥", "辰": "亥",
        };
        const target_zhi_y = wangshen_map[year_zhi] || "";
        const target_zhi_d = wangshen_map[day_zhi] || "";

        if (target_zhi_y) {
            const found_pillars = this._find_pillars_for_zhi(target_zhi_y, pillars);
            this._add_shensha_to_pillars(result, found_pillars, "亡神");
        }
        if (target_zhi_d && target_zhi_d !== target_zhi_y) {
            const found_pillars = this._find_pillars_for_zhi(target_zhi_d, pillars);
            this._add_shensha_to_pillars(result, found_pillars, "亡神");
        }
        return result;
    }

    calc_zaisha(year_zhi, pillars) {
        const result = this._init_shensha_by_column();
        const jiesha_map = {
            "申": "巳", "子": "巳", "辰": "巳",
            "寅": "亥", "午": "亥", "戌": "亥",
            "巳": "寅", "酉": "寅", "丑": "寅",
            "亥": "申", "卯": "申", "未": "申",
        };
        const target_zhi = jiesha_map[year_zhi] || "";
        if (target_zhi) {
            const zai_zhi = this._get_next_zhi(target_zhi, 1);
            const found_pillars = this._find_pillars_for_zhi(zai_zhi, pillars);
            this._add_shensha_to_pillars(result, found_pillars, "灾煞");
        }
        return result;
    }

    calc_yangren(year_gan, pillars) {
        const result = this._init_shensha_by_column();
        const lu_map = {
            "甲": "寅", "乙": "卯", "丙": "巳", "戊": "巳",
            "丁": "午", "己": "午", "庚": "申", "辛": "酉",
            "壬": "亥", "癸": "子",
        };
        const target_zhi = lu_map[year_gan] || "";
        if (target_zhi) {
            const yang_zhi = this._get_next_zhi(target_zhi, 1);
            const found_pillars = this._find_pillars_for_zhi(yang_zhi, pillars);
            this._add_shensha_to_pillars(result, found_pillars, "羊刃");
        }
        return result;
    }

    calc_liue(year_zhi, pillars) {
        const result = this._init_shensha_by_column();
        const liue_map = {
            "申": "卯", "子": "卯", "辰": "卯",
            "寅": "酉", "午": "酉", "戌": "酉",
            "巳": "午", "酉": "午", "丑": "午",
            "亥": "子", "卯": "子", "未": "子",
        };
        const target_zhi = liue_map[year_zhi] || "";
        if (target_zhi) {
            const found_pillars = this._find_pillars_for_zhi(target_zhi, pillars);
            this._add_shensha_to_pillars(result, found_pillars, "六厄");
        }
        return result;
    }

    calc_yuanchen(year_zhi, pillars) {
        const result = this._init_shensha_by_column();
        const yuanchen_map = {
            "子": "未", "丑": "午", "寅": "巳", "卯": "辰",
            "申": "亥", "酉": "戌", "辰": "卯", "巳": "寅",
            "午": "丑", "未": "子", "戌": "酉", "亥": "申",
        };
        const target_zhi = yuanchen_map[year_zhi] || "";
        if (target_zhi) {
            const found_pillars = this._find_pillars_for_zhi(target_zhi, pillars);
            this._add_shensha_to_pillars(result, found_pillars, "元辰");
        }
        return result;
    }

    calc_shiebai(day_ganzhi, pillars) {
        const result = this._init_shensha_by_column();
        const shiebai_list = [
            "甲辰", "乙巳", "丙申", "丁亥", "戊戌",
            "己丑", "庚辰", "辛巳", "壬申", "癸亥",
        ];
        if (shiebai_list.includes(day_ganzhi)) {
            this._add_shensha_to_pillar(result, "day", "十恶大败");
        }
        return result;
    }

    calc_sihai(day_ganzhi, month, pillars) {
        const result = this._init_shensha_by_column();
        const spring = ["庚申", "辛酉"];
        const summer = ["壬子", "癸亥"];
        const autumn = ["甲寅", "乙卯"];
        const winter = ["丙午", "丁巳"];

        let is_sihai = false;
        if ([1, 2, 3].includes(month) && spring.includes(day_ganzhi)) {
            is_sihai = true;
        } else if ([4, 5, 6].includes(month) && summer.includes(day_ganzhi)) {
            is_sihai = true;
        } else if ([7, 8, 9].includes(month) && autumn.includes(day_ganzhi)) {
            is_sihai = true;
        } else if ([10, 11, 12].includes(month) && winter.includes(day_ganzhi)) {
            is_sihai = true;
        }

        if (is_sihai) {
            this._add_shensha_to_pillar(result, "day", "四废");
        }
        return result;
    }

    calc_yima(year_zhi, day_zhi, pillars) {
        const result = this._init_shensha_by_column();
        const yima_map = {
            "申": "寅", "子": "寅", "辰": "寅",
            "寅": "申", "午": "申", "戌": "申",
            "巳": "亥", "酉": "亥", "丑": "亥",
            "亥": "巳", "卯": "巳", "未": "巳",
        };
        const target_zhi_y = yima_map[year_zhi] || "";
        const target_zhi_d = yima_map[day_zhi] || "";

        if (target_zhi_y) {
            const found_pillars = this._find_pillars_for_zhi(target_zhi_y, pillars);
            this._add_shensha_to_pillars(result, found_pillars, "驿马");
        }
        if (target_zhi_d && target_zhi_d !== target_zhi_y) {
            const found_pillars = this._find_pillars_for_zhi(target_zhi_d, pillars);
            this._add_shensha_to_pillars(result, found_pillars, "驿马");
        }
        return result;
    }

    calc_huagai(year_zhi, day_zhi, pillars) {
        const result = this._init_shensha_by_column();
        const huagai_map = {
            "寅": "戌", "午": "戌", "戌": "戌",
            "亥": "未", "卯": "未", "未": "未",
            "申": "辰", "子": "辰", "辰": "辰",
            "巳": "丑", "酉": "丑", "丑": "丑",
        };
        const target_zhi_y = huagai_map[year_zhi] || "";
        const target_zhi_d = huagai_map[day_zhi] || "";

        if (target_zhi_y) {
            const found_pillars = this._find_pillars_for_zhi(target_zhi_y, pillars);
            this._add_shensha_to_pillars(result, found_pillars, "华盖");
        }
        if (target_zhi_d && target_zhi_d !== target_zhi_y) {
            const found_pillars = this._find_pillars_for_zhi(target_zhi_d, pillars);
            this._add_shensha_to_pillars(result, found_pillars, "华盖");
        }
        return result;
    }

    calc_guchen_guashu(year_zhi, pillars) {
        const result = this._init_shensha_by_column();
        const guchen_map = {
            "子": "寅", "丑": "卯", "寅": "辰", "卯": "巳",
            "辰": "午", "巳": "未", "午": "申", "未": "酉",
            "申": "戌", "酉": "亥", "戌": "子", "亥": "丑",
        };
        const guashu_map = {
            "子": "戌", "丑": "亥", "寅": "子", "卯": "丑",
            "辰": "寅", "巳": "卯", "午": "辰", "未": "巳",
            "申": "午", "酉": "未", "戌": "申", "亥": "酉",
        };
        const gc_zhi = guchen_map[year_zhi] || "";
        const gs_zhi = guashu_map[year_zhi] || "";

        if (gc_zhi) {
            const found_pillars = this._find_pillars_for_zhi(gc_zhi, pillars);
            this._add_shensha_to_pillars(result, found_pillars, "孤辰");
        }
        if (gs_zhi) {
            const found_pillars = this._find_pillars_for_zhi(gs_zhi, pillars);
            this._add_shensha_to_pillars(result, found_pillars, "寡宿");
        }
        return result;
    }

    calc_taohua(year_zhi, day_zhi, pillars) {
        const result = this._init_shensha_by_column();
        const taohua_map = {
            "申": "酉", "子": "酉", "辰": "酉",
            "寅": "卯", "午": "卯", "戌": "卯",
            "巳": "午", "酉": "午", "丑": "午",
            "亥": "子", "卯": "子", "未": "子",
        };
        const target_zhi_y = taohua_map[year_zhi] || "";
        const target_zhi_d = taohua_map[day_zhi] || "";

        if (target_zhi_y) {
            const found_pillars = this._find_pillars_for_zhi(target_zhi_y, pillars);
            this._add_shensha_to_pillars(result, found_pillars, "桃花");
        }
        if (target_zhi_d && target_zhi_d !== target_zhi_y) {
            const found_pillars = this._find_pillars_for_zhi(target_zhi_d, pillars);
            this._add_shensha_to_pillars(result, found_pillars, "桃花");
        }
        return result;
    }

    calc_kongwang(day_ganzhi, pillars) {
        const result = this._init_shensha_by_column();
        const xun = this._get_xun(day_ganzhi);
        const kongwang_map = {
            "甲子旬": ["戌", "亥"],
            "甲戌旬": ["申", "酉"],
            "甲申旬": ["午", "未"],
            "甲午旬": ["辰", "巳"],
            "甲辰旬": ["寅", "卯"],
            "甲寅旬": ["子", "丑"],
        };
        const kw_zhis = kongwang_map[xun] || [];
        let found_any = false;
        for (const kw of kw_zhis) {
            const found_pillars = this._find_pillars_for_zhi(kw, pillars);
            if (found_pillars.length > 0) {
                this._add_shensha_to_pillars(result, found_pillars, "空亡");
                found_any = true;
            }
        }
        if (!found_any) {
            this._add_shensha_to_pillar(result, "day", "空亡");
        }
        return result;
    }

    _calc_shensha_for_zhi(target_zhi, year_zhi, day_zhi) {
        const shensha_list = [];
        if (!target_zhi) return shensha_list;

        const yima_map = {
            "申": "寅", "子": "寅", "辰": "寅",
            "寅": "申", "午": "申", "戌": "申",
            "巳": "亥", "酉": "亥", "丑": "亥",
            "亥": "巳", "卯": "巳", "未": "巳",
        };
        if (yima_map[year_zhi] === target_zhi || yima_map[day_zhi] === target_zhi) {
            shensha_list.push("驿马");
        }

        const huagai_map = {
            "子": "辰", "丑": "巳", "寅": "午", "卯": "未",
            "辰": "申", "巳": "酉", "午": "戌", "未": "亥",
            "申": "子", "酉": "丑", "戌": "寅", "亥": "卯",
        };
        if (huagai_map[year_zhi] === target_zhi || huagai_map[day_zhi] === target_zhi) {
            shensha_list.push("华盖");
        }

        const taohua_map = {
            "申": "酉", "子": "酉", "辰": "酉",
            "寅": "卯", "午": "卯", "戌": "卯",
            "巳": "午", "酉": "午", "丑": "午",
            "亥": "子", "卯": "子", "未": "子",
        };
        if (taohua_map[year_zhi] === target_zhi || taohua_map[day_zhi] === target_zhi) {
            shensha_list.push("桃花");
        }

        const jiesha_map = {
            "申": "巳", "子": "午", "辰": "未",
            "寅": "亥", "午": "子", "戌": "丑",
            "巳": "寅", "酉": "卯", "丑": "辰",
            "亥": "申", "卯": "酉", "未": "戌",
        };
        if (jiesha_map[year_zhi] === target_zhi || jiesha_map[day_zhi] === target_zhi) {
            shensha_list.push("劫煞");
        }

        const zaisha_map = {
            "申": "寅", "子": "卯", "辰": "巳",
            "寅": "申", "午": "酉", "戌": "亥",
            "巳": "子", "酉": "丑", "丑": "辰",
            "亥": "午", "卯": "未", "未": "戌",
        };
        if (zaisha_map[year_zhi] === target_zhi || zaisha_map[day_zhi] === target_zhi) {
            shensha_list.push("灾煞");
        }

        const wangshen_map = {
            "申": "亥", "子": "巳", "辰": "寅",
            "寅": "申", "午": "亥", "戌": "巳",
            "巳": "子", "酉": "卯", "丑": "午",
            "亥": "辰", "卯": "戌", "未": "丑",
        };
        if (wangshen_map[year_zhi] === target_zhi || wangshen_map[day_zhi] === target_zhi) {
            shensha_list.push("亡神");
        }

        return shensha_list;
    }

    calculate(
        year_ganzhi,
        month_ganzhi,
        day_ganzhi,
        hour_ganzhi,
        taiyuan_ganzhi = "",
        minggong_ganzhi = "",
        shengong_ganzhi = "",
        year_nayin = "",
        dayun_ganzhi = "",
        liunian_ganzhi = "",
        month = 1
    ) {
        const year_gan = year_ganzhi ? year_ganzhi[0] : "";
        const year_zhi = year_ganzhi && year_ganzhi.length > 1 ? year_ganzhi[1] : "";
        const month_zhi = month_ganzhi && month_ganzhi.length > 1 ? month_ganzhi[1] : "";
        const day_zhi = day_ganzhi && day_ganzhi.length > 1 ? day_ganzhi[1] : "";
        const hour_zhi = hour_ganzhi && hour_ganzhi.length > 1 ? hour_ganzhi[1] : "";

        const taiyuan_zhi = taiyuan_ganzhi && taiyuan_ganzhi.length > 1 ? taiyuan_ganzhi[1] : "";
        const minggong_zhi = minggong_ganzhi && minggong_ganzhi.length > 1 ? minggong_ganzhi[1] : "";
        const shengong_zhi = shengong_ganzhi && shengong_ganzhi.length > 1 ? shengong_ganzhi[1] : "";

        const dayun_zhi = dayun_ganzhi && dayun_ganzhi.length > 1 ? dayun_ganzhi[1] : "";
        const liunian_zhi = liunian_ganzhi && liunian_ganzhi.length > 1 ? liunian_ganzhi[1] : "";

        const pillars = {
            "year": year_zhi,
            "month": month_zhi,
            "day": day_zhi,
            "hour": hour_zhi,
            "taiyuan": taiyuan_zhi,
            "minggong": minggong_zhi,
            "shengong": shengong_zhi,
        };

        const gans = [
            year_gan,
            month_ganzhi ? month_ganzhi[0] : "",
            day_ganzhi ? day_ganzhi[0] : "",
            hour_ganzhi ? hour_ganzhi[0] : "",
        ];

        const result = {
            "input": {
                year_ganzhi,
                month_ganzhi,
                day_ganzhi,
                hour_ganzhi,
                taiyuan_ganzhi,
                minggong_ganzhi,
                shengong_ganzhi,
                year_nayin,
                dayun_ganzhi,
                liunian_ganzhi,
                month,
            },
            "shensha_by_column": this._init_shensha_by_column(),
        };

        let shensha_by_column = result.shensha_by_column;

        shensha_by_column = this._merge_shensha(shensha_by_column, this.calc_tianyi_guiren(year_gan, pillars));
        shensha_by_column = this._merge_shensha(shensha_by_column, this.calc_tiande(month_zhi, pillars));
        shensha_by_column = this._merge_shensha(shensha_by_column, this.calc_yuede(month_zhi, pillars));
        shensha_by_column = this._merge_shensha(shensha_by_column, this.calc_lushen(year_gan, pillars));
        shensha_by_column = this._merge_shensha(shensha_by_column, this.calc_wenchang(year_gan, pillars));
        shensha_by_column = this._merge_shensha(shensha_by_column, this.calc_jinyu(year_gan, pillars));
        shensha_by_column = this._merge_shensha(shensha_by_column, this.calc_hongluan_tianxi(year_zhi, pillars));
        shensha_by_column = this._merge_shensha(shensha_by_column, this.calc_sanqi(gans, pillars));

        shensha_by_column = this._merge_shensha(shensha_by_column, this.calc_jiesha(year_zhi, day_zhi, pillars));
        shensha_by_column = this._merge_shensha(shensha_by_column, this.calc_wangshen(year_zhi, day_zhi, pillars));
        shensha_by_column = this._merge_shensha(shensha_by_column, this.calc_zaisha(year_zhi, pillars));
        shensha_by_column = this._merge_shensha(shensha_by_column, this.calc_yangren(year_gan, pillars));
        shensha_by_column = this._merge_shensha(shensha_by_column, this.calc_liue(year_zhi, pillars));
        shensha_by_column = this._merge_shensha(shensha_by_column, this.calc_yuanchen(year_zhi, pillars));
        shensha_by_column = this._merge_shensha(shensha_by_column, this.calc_shiebai(day_ganzhi, pillars));
        shensha_by_column = this._merge_shensha(shensha_by_column, this.calc_sihai(day_ganzhi, month, pillars));

        shensha_by_column = this._merge_shensha(shensha_by_column, this.calc_yima(year_zhi, day_zhi, pillars));
        shensha_by_column = this._merge_shensha(shensha_by_column, this.calc_huagai(year_zhi, day_zhi, pillars));
        shensha_by_column = this._merge_shensha(shensha_by_column, this.calc_guchen_guashu(year_zhi, pillars));
        shensha_by_column = this._merge_shensha(shensha_by_column, this.calc_taohua(year_zhi, day_zhi, pillars));
        shensha_by_column = this._merge_shensha(shensha_by_column, this.calc_kongwang(day_ganzhi, pillars));

        result.shensha_by_column = shensha_by_column;

        const dayun_shensha_list = [];
        const liunian_shensha_list = [];

        if (dayun_zhi) {
            dayun_shensha_list.push(...this._calc_shensha_for_zhi(dayun_zhi, year_zhi, day_zhi));
        }
        if (liunian_zhi) {
            liunian_shensha_list.push(...this._calc_shensha_for_zhi(liunian_zhi, year_zhi, day_zhi));
        }

        result.dayun_shensha = dayun_shensha_list;
        result.liunian_shensha = liunian_shensha_list;

        return result;
    }
}

function calculate_shensha(
    year_ganzhi,
    month_ganzhi,
    day_ganzhi,
    hour_ganzhi,
    taiyuan_ganzhi = "",
    minggong_ganzhi = "",
    shengong_ganzhi = "",
    year_nayin = "",
    dayun_ganzhi = "",
    liunian_ganzhi = "",
    month = 1
) {
    const calc = new ShenShaCalculator();
    return calc.calculate(
        year_ganzhi,
        month_ganzhi,
        day_ganzhi,
        hour_ganzhi,
        taiyuan_ganzhi,
        minggong_ganzhi,
        shengong_ganzhi,
        year_nayin,
        dayun_ganzhi,
        liunian_ganzhi,
        month
    );
}

export { GAN_LIST, ZHI_LIST, GAN_INDEX, ZHI_INDEX, ZHI_SEQUENCE, NAYIN_GAN, ShenShaCalculator, calculate_shensha };
