# 這個檔案實作資科系 112 年入學學生的專業必修、群修條件
from app.db.queries import fetch_course_records

PASS = 60.0

Required_list = [
    "微積分甲",
    "計算機程式設計（一）",
    "物件導向程式設計",
    "線性代數",
    "機率論",
    "離散數學",
    "資料結構",
    "演算法",
    "程式能力檢定",
    "數位系統導論",
    "數位系統實驗",
    "作業系統",
    "計算機結構與組織",
]

Group_list = [
    ["資訊專題（A）", "資訊專題（B）", "資訊專題（C）", "資訊專題（D）"],
    ["人工智慧概論", "資料庫系統", "資料科學", "機器學習概論", "電腦視覺"],
    ["人機互動", "電腦圖學", "軟體開發環境應用設計", "虛擬實境與觸覺回饋互動", "視訊壓縮", "資訊視覺化"],
    ["資訊安全", "資訊理論", "現代密碼學", "數位簽章", "工業物聯網與營運安全"],
    ["計算機網路", "行動通訊網路", "網路與通訊概論", "分散式系統", "軟體工程概論", "等候理論"],
]


def Required(student_id: str):
    courses = fetch_course_records(student_id)
    required_name_set = set(Required_list)

    name_to_records: dict[str, list[dict]] = {}
    for course in courses:
        name = course["course_name"]
        if name not in required_name_set:
            continue
        score = course["score"]
        is_passed = (score is not None and float(score) >= PASS) or course["course_status"] == "通過"
        name_to_records.setdefault(name, []).append(
            {
                "code": course["course_code"],
                "passed": is_passed,
                "credit": float(course["credit"]),
            }
        )

    missing = []
    passed_codes: set[str] = set()
    passed_credits = 0.0

    for name in Required_list:
        records = name_to_records.get(name, [])
        if not records:
            missing.append(name)
            continue
        if all(record["passed"] for record in records):
            for record in records:
                passed_codes.add(record["code"])
                passed_credits += record["credit"]
        else:
            missing.append(name)

    return len(missing) == 0, missing, passed_codes, passed_credits


def Group(student_id: str):
    courses = fetch_course_records(student_id)

    GROUP_A_CREDIT_LIMIT = 6.0
    BCDE_GROUPS_NEEDED = 3
    GROUP_TOTAL_LIMIT = 15.0
    BCDE_NAMES = ["群B", "群C", "群D", "群E"]
    group_names = ["群A"] + BCDE_NAMES

    passed_in_group: dict[str, list[tuple[str, float]]] = {name: [] for name in group_names}
    for course in courses:
        score = course["score"]
        is_passed = (score is not None and float(score) >= PASS) or course["course_status"] == "通過"
        if not is_passed:
            continue
        for name, group in zip(group_names, Group_list):
            if course["course_name"] in group:
                passed_in_group[name].append((course["course_name"], float(course["credit"])))
                break

    used_a: list[tuple[str, float]] = []
    extra_a: list[tuple[str, float]] = []
    group_a_credits = 0.0
    for course_name, credit in passed_in_group["群A"]:
        if group_a_credits + credit <= GROUP_A_CREDIT_LIMIT:
            used_a.append((course_name, credit))
            group_a_credits += credit
        else:
            extra_a.append((course_name, credit))

    bcde_best: dict[str, tuple[str, float]] = {}
    for name in BCDE_NAMES:
        if passed_in_group[name]:
            best_idx = max(range(len(passed_in_group[name])), key=lambda i: passed_in_group[name][i][1])
            bcde_best[name] = passed_in_group[name][best_idx]

    selected_groups = {
        name
        for name, _ in sorted(bcde_best.items(), key=lambda item: item[1][1], reverse=True)[:BCDE_GROUPS_NEEDED]
    }

    used_bcde: list[tuple[str, float]] = []
    extra_bcde: list[tuple[str, float]] = []
    for name in BCDE_NAMES:
        group_courses = passed_in_group[name]
        if not group_courses:
            continue
        if name in selected_groups:
            best_idx = max(range(len(group_courses)), key=lambda i: group_courses[i][1])
            for idx, item in enumerate(group_courses):
                if idx == best_idx:
                    used_bcde.append(item)
                else:
                    extra_bcde.append(item)
        else:
            extra_bcde.extend(group_courses)

    bcde_credits = sum(credit for _, credit in used_bcde)
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
        "total_credits": sum(sum(credit for _, credit in passed_in_group[name]) for name in group_names),
        "used_credits": used_credits,
        "credits_ok": used_credits >= GROUP_TOTAL_LIMIT,
        "used_courses": [name for name, _ in used_a + used_bcde],
        "extra_courses": [name for name, _ in extra_a + extra_bcde],
    }


def main():
    print(Required("112703034"))
    print(Group("112703034"))


if __name__ == "__main__":
    main()
