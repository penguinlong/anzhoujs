# 禄命法 APK 本地化实施计划

## 一、项目概述

将禄命法八字排盘系统打包为 Android APK，实现完全本地离线运行。

### 目标架构
`
APK 安装 → NanoHTTPD 本地静态服务器 → WebView 加载前端 → JS 算法本地计算
`

### 核心技术栈
| 组件 | 技术方案 |
|------|---------|
| 后端 | NanoHTTPD (仅提供静态文件服务) |
| 算法 | lunar-javascript + 自研JS算法 |
| 前端 | 现有 HTML/CSS/JS (改造) |
| 存储 | IndexedDB (已有) |
| 通信 | 前端直接调用本地JS算法 (无HTTP请求) |

---

## 二、任务拆分总览

`
├── 任务一：JS算法开发
│   ├── 1.1 lunar-javascript 集成
│   ├── 1.2 八字排盘算法 (bazi.js)
│   ├── 1.3 流年算法 (liunian.js)
│   ├── 1.4 大运小运算法 (dayun.js)
│   ├── 1.5 神煞排列算法 (shensha.js)
│   ├── 1.6 星曜计算 (xingyao.js)
│   └── 1.7 纳音十二长生 (nayin.js)
│
├── 任务二：前端改造
│   ├── 2.1 API调用改造 (移除fetch到localhost)
│   ├── 2.2 算法模块导入
│   └── 2.3 测试验证
│
├── 任务三：安卓项目创建
│   ├── 3.1 项目初始化 (Android Studio)
│   ├── 3.2 NanoHTTPD 集成
│   ├── 3.3 WebView 配置
│   └── 3.4 权限配置
│
├── 任务四：资源打包与测试
│   ├── 4.1 前端资源打包到 assets
│   ├── 4.2 APK 构建与签名
│   └── 4.3 回归测试
│
└── 任务五：文档与交付
    ├── 5.1 使用说明
    └── 5.2 技术文档
`

---

## 三、详细任务说明

### 任务一：JS算法开发

**目标目录**: \前端/算法/\

**依赖库**: \lunar-javascript\ (npm)

#### 1.1 lunar-javascript 集成

**文件**: \前端/算法/lunar-wrapper.js\

**职责**: 封装 \lunar-javascript\ 库，对齐原 Python \lunar_python\ 的 API 接口

**关键接口**:
\\\javascript
// 初始化
const calendar = new LunarCalendar();

// 公历转农历
calendar.solarToLunar(year, month, day, hour, minute);

// 获取八字
calendar.getBazi(year, month, day, hour, minute, options);
\\\

---

#### 1.2 八字排盘算法

**文件**: \前端/算法/bazi.js\

**职责**:
- 将 \算法/八字排盘算法.py\ 翻译为 JavaScript
- 实现 \calculate_bazi()\ 函数
- 支持公历、农历、干支三种输入方式
- 计算十神、纳音、胎元、命宫、身宫

**依赖**:
- \lunar-wrapper.js\
- \
ayin.js\
- \xingyao.js\

---

#### 1.3 流年算法

**文件**: \前端/算法/liunian.js\

**职责**:
- 将 \算法/流年算法.py\ 翻译为 JavaScript
- 实现 \getCurrentLiuNian()\ - 获取当前流年流月流日
- 实现 \getLiuNian(year, month, day)\ - 获取指定时间流年
- 实现 \getYearMonths(year)\ - 获取一年12个月干支
- 实现 \getMonthDays(year, month)\ - 获取一月所有日干支
- 实现 \getYearsLiuNian(startYear, count)\ - 获取多年流年

---

#### 1.4 大运小运算法

**文件**: \前端/算法/dayun.js\

**职责**:
- 将 \算法/大运小运算法.py\ 翻译为 JavaScript
- 实现 \calculateDayun(baziResult, gender, birthDate)\ - 计算大运小运
- 支持顺行/逆行判断
- 计算起运年龄、交运日期
- 生成童限、大运、小运序列

---

#### 1.5 神煞排列算法

**文件**: \前端/算法/shensha.js\

**职责**:
- 将 \算法/禄命神煞排列算法.py\ 翻译为 JavaScript
- 实现 \calculateShenSha(params)\ - 计算所有神煞
- 按柱位显示神煞

**依赖**: 无外部依赖，纯查表实现

---

#### 1.6 星曜计算

**文件**: \前端/算法/xingyao.js\

**职责**:
- 将 \算法/星曜计算.py\ 翻译为 JavaScript
- 实现儒略日计算
- 实现太阳/月亮位置计算
- 实现命宫、身宫计算

---

#### 1.7 纳音十二长生

**文件**: \前端/算法/nayin.js\

**职责**:
- 将 \算法/纳音五行十二长生旺衰算法.py\ 翻译为 JavaScript
- 实现纳音查表
- 实现十二长生位置计算
- 实现吉凶判断

---

### 任务二：前端改造

**目标**: 修改 \前端/首页排盘/script.js\

**改造内容**:

1. **移除 HTTP 请求**:
\\\javascript
// 删除
fetch('http://localhost:5000/api/calculate', ...)

// 替换为
import { calculateBazi } from '../算法/bazi.js';
const result = calculateBazi(params);
\\\

2. **移除所有后端API调用**:
   - \/api/calculate\ → \azi.calculateBazi()\
   - \/api/dayun\ → \dayun.calculateDayun()\
   - \/api/liunian\ → \liunian.getCurrentLiuNian()\
   - \/api/shensha\ → \shensha.calculateShenSha()\

3. **添加算法模块导入**

---

### 任务三：安卓项目创建

**目标**: 创建可打包的 Android Studio 项目

**项目配置**:
- **项目名称**: 禄命法
- **包名**: \com.luming.app\
- **最低SDK**: API 24 (Android 7.0)

#### 3.1 项目结构

`
app/src/main/
├── java/com/luming/app/
│   ├── MainActivity.java    # WebView + 启动服务器
│   └── LocalServer.java     # NanoHTTPD 静态服务器
├── res/layout/
│   └── activity_main.xml    # WebView 布局
├── assets/web/              # 前端静态文件
│   ├── 首页排盘/
│   ├── 算法/
│   └── ...
└── AndroidManifest.xml       # 权限配置
`

#### 3.2 MainActivity 职责

- 启动 NanoHTTPD 本地服务器（端口 8080）
- 配置 WebView 加载本地前端
- 处理服务器就绪检测

#### 3.3 LocalServer 职责

- 继承 NanoHTTPD
- 提供静态文件服务（从 assets/web/ 目录）
- 处理 MIME 类型

---

### 任务四：资源打包与测试

#### 4.1 前端资源打包

**目标目录**: \pp/src/main/assets/web/\

**打包内容**:
- \首页排盘/\ - 主页面
- \common/\ - 数据库模块
- \算法/\ - JS算法模块
- 其他页面

#### 4.2 APK 构建

\\\ash
./gradlew assembleDebug
# 输出: app/build/outputs/apk/debug/app-debug.apk
\\\

---

## 四、Python → JavaScript 文件对照

| Python 文件 | JavaScript 文件 | 备注 |
|-----------|---------------|------|
| \算法/八字排盘算法.py\ | \前端/算法/bazi.js\ | 核心算法 |
| \算法/流年算法.py\ | \前端/算法/liunian.js\ | |
| \算法/大运小运算法.py\ | \前端/算法/dayun.js\ | |
| \算法/禄命神煞排列算法.py\ | \前端/算法/shensha.js\ | 纯查表 |
| \算法/星曜计算.py\ | \前端/算法/xingyao.js\ | 数学公式 |
| \算法/纳音五行十二长生旺衰算法.py\ | \前端/算法/nayin.js\ | 纯查表 |
| \前端/api/server.py\ | 无（前端直接调用JS） | 后端移除 |

---

## 五、依赖清单

### NPM 依赖
\\\json
{
  "lunar-javascript": "^1.7.7"
}
\\\

### Android 依赖
\\\groovy
dependencies {
    implementation 'org.nanohttpd:nanohttpd:2.3.1'
}
\\\

---

## 六、进度检查点

| 检查点 | 完成标准 |
|-------|---------|
| CP1 | 所有 JS 算法文件创建完成 |
| CP2 | 前端页面可正常加载 |
| CP3 | 八字排盘计算结果验证一致 |
| CP4 | Android 项目编译通过 |
| CP5 | Debug APK 生成 |
| CP6 | Release APK 生成 |

---

## 七、参考资源

- [lunar-javascript](https://github.com/6tail/lunar-javascript)
- [NanoHTTPD](https://github.com/NanoHttpd/nanohttpd)
- [Android WebView 文档](https://developer.android.com/reference/android/webkit/WebView)

---

**文档版本**: v1.1
**创建日期**: 2026-03-31
**最后更新**: 2026-04-01
**状态**: 进行中

---

## 八、当前进度

| 任务 | 状态 | 备注 |
|------|------|------|
| 任务一：JS算法开发 | ✅ 已完成 | bazi.js, liunian.js, dayun.js, shensha.js, xingyao.js, nayin.js |
| 任务二：前端改造 | ✅ 已完成 | 移除所有后端API调用 |
| 任务三：安卓项目创建 | ✅ 已完成 | 3.1-3.4全部完成 |
| 任务四：资源打包与测试 | 🔄 进行中 | 前端资源已打包，APK构建待测试 |
| 任务五：文档与交付 | 🔄 进行中 | 使用说明、技术文档已创建 |

### 检查点进度

| 检查点 | 完成标准 | 状态 |
|-------|---------|------|
| CP1 | 所有 JS 算法文件创建完成 | ✅ |
| CP2 | 前端页面可正常加载 | ✅ |
| CP3 | 八字排盘计算结果验证一致 | ✅ |
| CP4 | Android 项目编译通过 | ⏳ 待测试 |
| CP5 | Debug APK 生成 | ⏳ 待构建 |
| CP6 | Release APK 生成 | ⏳ 待构建 |
