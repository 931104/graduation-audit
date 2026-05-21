# 這個檔案實作資科系 112年入學的學生的必修、選修條件
from app.db.queries import fetch_course_records

PASS = 60.0

Required_list = [
    # 大一
    "微積分甲", "計算機程式設計（一）", "物件導向程式設計", "線性代數",
    # 大二
    "機率論", "離散數學", "資料結構", "演算法", "程式能力檢定", "數位系統導論", "數位系統實驗",
    # 大三
    "作業系統", "計算機結構與組織",
]
Group_list = [
    # 群A
    ["資訊專題（A）","資訊專題（B）","資訊專題（C）","資訊專題（D）"],
    # 群B
    ["人工智慧概論","資料庫系統","資料科學","機器學習概論","電腦視覺"],
    # 群C
    ["人機互動","電腦圖學","軟體開發環境應用設計","虛擬實境與觸覺回饋互動","視訊壓縮","資訊視覺化"],
    # 群D
    ["資訊安全","資訊理論","現代密碼學","數位簽章","工業物聯網與營運安全"],
    # 群E
    ["計算機網路","行動通訊網路","網路與通訊概論","分散式系統","軟體工程概論","等候理論"]
]

# 判斷專業必修是否足夠。
# 同一課名可能有上下學期（不同 course_code），全部都要通過才算完成。
# fetch_course_records 已對每個 course_code 取最新一次成績，處理重修情況。
# return (是否全過, 尚缺課名list, 已通過的course_code set, 已通過的總學分)
def Required(student_id: str):
    courses = fetch_course_records(student_id)
    required_name_set = set(Required_list)

    # 按課名分組，收集所有相符的 code 及是否通過
    name_to_records: dict[str, list[dict]] = {}
    for c in courses:
        name = c["course_name"]
        if name not in required_name_set:
            continue
        score = c["score"]
        is_passed = (score is not None and float(score) >= PASS) or c["course_status"] == "通過"
        name_to_records.setdefault(name, []).append({
            "code":   c["course_code"],
            "passed": is_passed,
            "credit": float(c["credit"]),
        })

    missing = []
    passed_codes: set[str] = set()
    passed_credits = 0.0

    for name in Required_list:
        records = name_to_records.get(name, [])
        if not records:
            missing.append(name)          # 完全沒修過
            continue
        if all(r["passed"] for r in records):
            for r in records:
                passed_codes.add(r["code"])
                passed_credits += r["credit"]
        else:
            missing.append(name)          # 有某學期未通過

    return len(missing) == 0, missing, passed_codes, passed_credits

# 判斷專業群修是否足夠。
# 規則：群A恰好6學分(2門)；群BCDE從4個群中選3個，每群僅採計1門，共9學分；總計15學分。
# 若BCDE四群都有通過，第四群的課改算選修；同群內多餘的課也改算選修。
# return {
#   "group_credits":  {"群A": 學分, "群B": 學分, ...},  # 實際計入的學分(非總修學分)
#   "group_a_ok":     群A是否>=6學分,
#   "domain_count":   BCDE中實際計入的群數量(最多3),
#   "domain_ok":      domain_count >= 3,
#   "used_credits":   實際計入群修的學分(上限15),
#   "credits_ok":     used_credits >= 15,
#   "used_courses":   計入群修的課程名稱list,
#   "extra_courses":  改算選修的課程名稱list,
# }
def Group(student_id: str):
    courses = fetch_course_records(student_id)

    GROUP_A_CREDIT_LIMIT = 6.0
    BCDE_GROUPS_NEEDED = 3
    GROUP_TOTAL_LIMIT = 15.0
    BCDE_NAMES = ["群B", "群C", "群D", "群E"]
    group_names = ["群A"] + BCDE_NAMES

    passed_in_group: dict[str, list[tuple[str, float]]] = {name: [] for name in group_names}
    for c in courses:
        score = c["score"]
        is_passed = (score is not None and score >= PASS) or c["course_status"] == "通過"
        if not is_passed:
            continue
        for name, group in zip(group_names, Group_list):
            if c["course_name"] in group:
                passed_in_group[name].append((c["course_name"], float(c["credit"])))
                break

    # 群A：依序累積，超過 6 學分的課改算選修
    used_a: list[tuple[str, float]] = []
    extra_a: list[tuple[str, float]] = []
    group_a_credits = 0.0
    for course_name, credit in passed_in_group["群A"]:
        if group_a_credits + credit <= GROUP_A_CREDIT_LIMIT:
            used_a.append((course_name, credit))
            group_a_credits += credit
        else:
            extra_a.append((course_name, credit))

    # 群BCDE：每群取學分最高的1門，再從中挑學分最高的3群計入
    bcde_best: dict[str, tuple[str, float]] = {}
    for name in BCDE_NAMES:
        if passed_in_group[name]:
            best_idx = max(range(len(passed_in_group[name])), key=lambda i: passed_in_group[name][i][1])
            bcde_best[name] = passed_in_group[name][best_idx]

    selected_groups = {
        name
        for name, _ in sorted(bcde_best.items(), key=lambda x: x[1][1], reverse=True)[:BCDE_GROUPS_NEEDED]
    }

    used_bcde: list[tuple[str, float]] = []
    extra_bcde: list[tuple[str, float]] = []
    for name in BCDE_NAMES:
        group_courses = passed_in_group[name]
        if not group_courses:
            continue
        if name in selected_groups:
            best_idx = max(range(len(group_courses)), key=lambda i: group_courses[i][1])
            for i, item in enumerate(group_courses):
                if i == best_idx:
                    used_bcde.append(item)
                else:
                    extra_bcde.append(item)
        else:
            extra_bcde.extend(group_courses)

    bcde_credits = sum(cr for _, cr in used_bcde)
    used_credits = group_a_credits + bcde_credits

    group_credits = {"群A": group_a_credits}
    for name in BCDE_NAMES:
        if name in selected_groups:
            group_credits[name] = bcde_best[name][1]
        else:
            group_credits[name] = 0.0

    return {
        "group_credits": group_credits,
        "group_a_ok": group_a_credits >= GROUP_A_CREDIT_LIMIT,
        "domain_count": len(selected_groups),
        "domain_ok": len(selected_groups) >= BCDE_GROUPS_NEEDED,
        "used_credits": used_credits,
        "credits_ok": used_credits >= GROUP_TOTAL_LIMIT,
        "used_courses": [name for name, _ in used_a + used_bcde],
        "extra_courses": [name for name, _ in extra_a + extra_bcde],
    }

def main():
    b = Required("112703037")
    a = Group("112703037")
    print(b)
    
    print(a)

if __name__ == "__main__":
    main()
