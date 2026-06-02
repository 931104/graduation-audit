import sys
import os
from collections import defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.queries import fetch_course_records, fetch_student

W = 52

# 學校成績換算表（閾值由高到低，score >= threshold 即取對應 GPA）
_SCHOOL_GPA_THRESHOLDS = [
    (90, 4.3), (85, 4.0), (80, 3.7), (77, 3.3),
    (73, 3.0), (70, 2.7), (67, 2.3), (63, 2.0),
    (60, 1.7), (50, 1.0), (0, 0.0),
]

# 標準 4.0 制換算表（閾值由高到低）
_STD_GPA_THRESHOLDS = [(80, 4), (70, 3), (60, 2), (50, 1), (0, 0)]


def _to_school_gpa(score: float) -> float:
    for threshold, gpa in _SCHOOL_GPA_THRESHOLDS:
        if score >= threshold:
            return gpa
    return 0.0


def _to_std_gpa(score: float) -> float:
    for threshold, gpa in _STD_GPA_THRESHOLDS:
        if score >= threshold:
            return gpa
    return 0.0


def _should_include(record: dict) -> bool:
    """停修/退選（無分數）不納入，有分數的不及格/被當皆納入計算。"""
    score = record["score"]
    status = record["course_status"]
    if score is None:
        return False
    if "停修" in status or "退選" in status:
        return False
    return True


def _semester_key(record: dict) -> str:
    return f"{record['academic_year']}{record['academic_semester']}"


def _semester_label(key: str) -> str:
    year = key[:3]
    sem = key[3:]
    sem_map = {"10": "上學期", "20": "下學期", "30": "暑修"}
    return f"{year} 學年度 {sem_map.get(sem, sem)}"


def compute_gpa(records: list) -> dict:
    """依學期計算 GPA（學校制）。分母為所有有學分且有分數的課學分加總。"""
    semesters: dict = defaultdict(list)
    for r in records:
        if not _should_include(r):
            continue
        semesters[_semester_key(r)].append(r)

    semester_results = []
    all_weighted = 0.0
    all_std_weighted = 0.0
    all_credits = 0.0

    for sem_key in sorted(semesters):
        sem_records = semesters[sem_key]
        weighted = 0.0
        std_weighted = 0.0
        total_credits = 0.0

        courses = []
        for r in sem_records:
            score = float(r["score"])
            credit = r["credit"]
            school_gpa = _to_school_gpa(score)
            std_gpa = _to_std_gpa(score)
            weighted += school_gpa * credit
            std_weighted += std_gpa * credit
            total_credits += credit
            courses.append({
                "course_name": r["course_name"],
                "credit": credit,
                "score": score,
                "school_gpa": school_gpa,
                "std_gpa": std_gpa,
            })

        all_weighted += weighted
        all_std_weighted += std_weighted
        all_credits += total_credits
        sem_gpa = weighted / total_credits if total_credits else 0.0
        sem_std_gpa = std_weighted / total_credits if total_credits else 0.0

        semester_results.append({
            "label": _semester_label(sem_key),
            "courses": courses,
            "total_credits": total_credits,
            "gpa": sem_gpa,
            "std_gpa": sem_std_gpa,
        })

    overall_gpa = all_weighted / all_credits if all_credits else 0.0
    overall_std_gpa = all_std_weighted / all_credits if all_credits else 0.0

    return {
        "semesters": semester_results,
        "overall_gpa": overall_gpa,
        "overall_std_gpa": overall_std_gpa,
        "total_credits": all_credits,
    }


def _section(title: str):
    print(f"\n{'═' * W}")
    print(f"  {title}")
    print(f"{'═' * W}")


def print_gpa_report(student: dict, result: dict):
    name = student["chinese_name"]
    sid = student["student_id"]
    dept = student["department"]

    _section(f"GPA 計算報告 — {name} ({sid})")
    print(f"  系所：{dept}")

    for sem in result["semesters"]:
        print(f"  {sem['label']}  GPA : {sem['gpa']:.2f}/4.3  （4.0制：{sem['std_gpa']:.1f}/4）")

    _section("總 GPA")
    print(f"  學校制 GPA : {result['overall_gpa']:.2f}/4.3")
    print(f"  4.0制  GPA : {result['overall_std_gpa']:.2f}/4")
    print()


def main():
    student_id = "112703003"

    student = fetch_student(student_id)
    if student is None:
        print(f"找不到學生 {student_id}")
        return

    records = fetch_course_records(student_id, latest_only=False)
    result = compute_gpa(records)
    print_gpa_report(student, result)


if __name__ == "__main__":
    main()
