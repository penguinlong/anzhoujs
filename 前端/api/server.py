# -*- coding: utf-8 -*-
"""
禄命法八字排盘 API + Web前端服务
运行方式: python server.py
API接口: POST /api/calculate
Web访问: http://localhost:5000
"""

from flask import Flask, request, jsonify, send_from_directory, redirect
from flask_cors import CORS
import sys
import os

# 获取前端目录路径
current_dir = os.path.dirname(os.path.abspath(__file__))
frontend_dir = os.path.join(current_dir, "..")

algo_path = os.path.join(current_dir, "..", "..", "算法")
sys.path.insert(0, os.path.abspath(algo_path))

from 八字排盘算法 import calculate_bazi
from 流年算法 import (
    get_current_liunian,
    get_liunian,
    get_year_months,
    get_month_days,
    get_years_liunian,
)
from 大运小运算法 import calculate_dayun_xiaoyun
from 禄命神煞排列算法 import calculate_shensha

app = Flask(__name__)
CORS(app)


@app.route("/")
def index():
    """重定向到排盘页面"""
    return redirect("/paipan")


@app.route("/api/calculate", methods=["POST"])
def calculate():
    try:
        data = request.get_json()

        name = data.get("name", "匿名")
        gender = data.get("gender", "male")
        date_type = data.get("date_type", "solar")
        hour = data.get("hour", 12)
        minute = data.get("minute", 0)
        longitude = data.get("longitude", 120)
        use_true_solar = data.get("use_true_solar", True)

        if date_type == "solar":
            year = data.get("solar_year")
            month = data.get("solar_month")
            day = data.get("solar_day")

            if not all([year, month, day]):
                return jsonify({"error": "缺少公历日期参数"}), 400

            result = calculate_bazi(
                year,
                month,
                day,
                hour,
                minute,
                is_lunar=False,
                longitude=longitude,
                use_true_solar=use_true_solar,
            )
        else:
            year = data.get("lunar_year")
            month = data.get("lunar_month")
            day = data.get("lunar_day")
            is_leap_month = data.get("is_leap_month", False)

            if not all([year, month, day]):
                return jsonify({"error": "缺少农历日期参数"}), 400

            result = calculate_bazi(
                year,
                month,
                day,
                hour,
                minute,
                is_lunar=True,
                is_leap_month=is_leap_month,
                longitude=longitude,
                use_true_solar=use_true_solar,
            )

        result["name"] = name
        result["gender"] = gender
        result["birth_month"] = month

        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/liunian", methods=["GET"])
def liunian_get():
    """获取当前流年流月流日"""
    try:
        result = get_current_liunian()
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/liunian", methods=["POST"])
def liunian_query():
    """查询任意时间的流年流月流日"""
    try:
        data = request.get_json()
        year = data.get("year")
        month = data.get("month", 1)
        day = data.get("day", 1)

        if not year:
            return jsonify({"error": "缺少年份参数"}), 400

        result = get_liunian(year, month, day)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/liunian/year", methods=["POST"])
def liunian_year():
    """获取某年12个月的干支列表"""
    try:
        data = request.get_json()
        year = data.get("year")

        if not year:
            return jsonify({"error": "缺少年份参数"}), 400

        result = get_year_months(year)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/liunian/month", methods=["POST"])
def liunian_month():
    """获取某年某月所有日期的干支列表"""
    try:
        data = request.get_json()
        year = data.get("year")
        month = data.get("month")

        if not year or not month:
            return jsonify({"error": "缺少年份或月份参数"}), 400

        result = get_month_days(year, month)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/liunian/years", methods=["POST"])
def liunian_years():
    """获取多年流年数据"""
    try:
        data = request.get_json()
        start_year = data.get("start_year")
        count = data.get("count", 10)

        if not start_year:
            return jsonify({"error": "缺少起始年份参数"}), 400

        result = get_years_liunian(start_year, count)
        return jsonify({"liunian": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/dayun", methods=["POST"])
def dayun_calculate():
    """计算大运小运"""
    try:
        data = request.get_json()

        bazi_result = data.get("bazi_result")
        gender = data.get("gender", "male")
        birth_year = data.get("birth_year")
        birth_month = data.get("birth_month")
        birth_day = data.get("birth_day")
        birth_hour = data.get("birth_hour", 12)
        birth_minute = data.get("birth_minute", 0)

        if not bazi_result:
            return jsonify({"error": "缺少八字结果参数"}), 400
        if not birth_year or not birth_month or not birth_day:
            return jsonify({"error": "缺少出生日期参数"}), 400

        result = calculate_dayun_xiaoyun(
            bazi_result,
            gender,
            birth_year,
            birth_month,
            birth_day,
            birth_hour,
            birth_minute,
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/shensha", methods=["POST"])
def shensha_calculate():
    """计算神煞排列"""
    try:
        data = request.get_json()

        year_ganzhi = data.get("year_ganzhi")
        month_ganzhi = data.get("month_ganzhi")
        day_ganzhi = data.get("day_ganzhi")
        hour_ganzhi = data.get("hour_ganzhi")
        taiyuan_ganzhi = data.get("taiyuan_ganzhi", "")
        minggong_ganzhi = data.get("minggong_ganzhi", "")
        shengong_ganzhi = data.get("shengong_ganzhi", "")
        year_nayin = data.get("year_nayin", "")
        dayun_ganzhi = data.get("dayun", "")
        liunian_ganzhi = data.get("liunian", "")
        month = data.get("month", 1)

        if not all([year_ganzhi, month_ganzhi, day_ganzhi, hour_ganzhi]):
            return jsonify({"error": "缺少干支参数"}), 400

        result = calculate_shensha(
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
        )
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ===== 静态文件服务 =====


@app.route("/首页排盘/")
@app.route("/首页排盘/index.html")
@app.route("/paipan")
def paipan_page():
    """排盘页面"""
    file_path = os.path.join(frontend_dir, "首页排盘", "index.html")
    try:
        with open(file_path, "rb") as f:
            content = f.read()
        return content, 200, {"Content-Type": "text/html; charset=utf-8"}
    except Exception as e:
        return f"Error reading file: {e}", 500


@app.route("/style.css")
def style_direct():
    """直接访问样式文件"""
    file_path = os.path.join(frontend_dir, "首页排盘", "style.css")
    try:
        with open(file_path, "rb") as f:
            content = f.read()
        return content, 200, {"Content-Type": "text/css; charset=utf-8"}
    except Exception as e:
        return f"Error reading file: {e}", 500


@app.route("/script.js")
def script_direct():
    """直接访问脚本文件"""
    file_path = os.path.join(frontend_dir, "首页排盘", "script.js")
    try:
        with open(file_path, "rb") as f:
            content = f.read()
        return content, 200, {"Content-Type": "application/javascript; charset=utf-8"}
    except Exception as e:
        return f"Error reading file: {e}", 500


@app.route("/用户管理/")
@app.route("/用户管理/index.html")
def user_page():
    """用户管理页面"""
    return send_from_directory(os.path.join(frontend_dir, "用户管理"), "index.html")


@app.route("/records/")
@app.route("/records/index.html")
def records_page():
    """记录页面"""
    return send_from_directory(os.path.join(frontend_dir, "records"), "index.html")


@app.route("/professional/")
@app.route("/professional/index.html")
def professional_page():
    """专业版页面"""
    return send_from_directory(os.path.join(frontend_dir, "professional"), "index.html")


@app.route("/调试/")
@app.route("/调试/index.html")
def debug_page():
    """调试页面"""
    return send_from_directory(os.path.join(frontend_dir, "调试"), "index.html")


# 静态资源路由
@app.route("/<path:filename>")
def static_files(filename):
    """其他静态文件"""
    file_path = os.path.join(frontend_dir, filename)
    if not os.path.exists(file_path):
        return f"File not found: {filename}", 404

    # 获取文件扩展名
    _, ext = os.path.splitext(filename)

    # 设置内容类型
    content_type = "text/html"
    if ext == ".css":
        content_type = "text/css"
    elif ext == ".js":
        content_type = "application/javascript"
    elif ext == ".json":
        content_type = "application/json"
    elif ext == ".png":
        content_type = "image/png"
    elif ext == ".jpg" or ext == ".jpeg":
        content_type = "image/jpeg"
    elif ext == ".gif":
        content_type = "image/gif"
    elif ext == ".ico":
        content_type = "image/x-icon"

    # 读取文件内容
    file_path = os.path.join(frontend_dir, filename)
    try:
        with open(file_path, "rb") as f:
            content = f.read()
        return content, 200, {"Content-Type": content_type}
    except Exception as e:
        print(f"读取文件失败: {e}")
        return f"Error reading file: {filename}", 500


if __name__ == "__main__":
    print("=" * 60)
    print("    禄命法八字排盘系统")
    print("=" * 60)
    print("")
    print("  API 服务已启动")
    print("")
    print("  访问地址（推荐）:")
    print("  → http://localhost:5000        (排盘首页)")
    print("  → http://localhost:5000/用户管理/index.html  (用户管理)")
    print("")
    print("  API 接口:")
    print("  → POST /api/calculate   (排盘计算)")
    print("  → POST /api/dayun       (大运小运)")
    print("  → GET  /api/liunian     (流年查询)")
    print("")
    print("=" * 60)
    app.run(host="0.0.0.0", port=5000, debug=True)
