import json
import os
import psycopg2
import sys
from dotenv import load_dotenv

_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(_ROOT, ".env"))

DB_CONFIG = {
    "host":     os.getenv("DB_HOST", "localhost"),
    "port":     int(os.getenv("DB_PORT", "5433")),
    "database": os.getenv("DB_NAME", "myapp"),
    "user":     os.getenv("DB_USER", "admin"),
    "password": os.getenv("DB_PASSWORD", "123456"),
}

SPECIAL_SCORES = {"停修", "通過", "成績未到或無成績", ""}
GENERAL_DOMAIN_KEYWORDS = ("人文通", "社會通", "自然通")

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "logic", "app", "data")


def parse_score(raw: str):
    raw = raw.strip()
    if raw in SPECIAL_SCORES:
        return None, raw if raw else None
    try:
        return float(raw), None
    except ValueError:
        return None, raw


def load_json(path: str):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _parse_domains(remark: str | None) -> list[str]:
    """Return list of 通識 domains in remark; multiple = 跨領域."""
    if not remark:
        return []
    return [part.strip() for part in remark.split("、") if part.strip() in GENERAL_DOMAIN_KEYWORDS]


def _is_general(remark: str | None) -> bool:
    return bool(_parse_domains(remark))


def load_course_data():
    required_raw = load_json(os.path.join(DATA_DIR, "required.json"))
    group_raw    = load_json(os.path.join(DATA_DIR, "group.json"))
    general_raw  = load_json(os.path.join(DATA_DIR, "core_general.json"))

    required_courses = [
        {
            "course_code":  c["course_code"],
            "course_name":  c["course_name"],
            "credit":       float(c["credit"]),
            "take_in_dept": required_raw["department"],
            "take_in_year": required_raw["year"],
        }
        for c in required_raw["required_course"]
    ]

    group_courses = []
    for group_name, courses in group_raw["group_course"].items():
        for c in courses:
            group_courses.append({
                "course_name":  c["course_name"],
                "course_class": group_name,
                "take_in_year": group_raw["year"],
            })

    general_courses = []
    for category, course_names in general_raw.items():
        for name in course_names:
            general_courses.append({
                "course_name": name,
                "is_core":     True,
                "category":    category,
            })

    return required_courses, group_courses, general_courses


def seed_static_data(conn):
    """Seed general_category and required_course from JSON files.
    Returns (core_course_names, group_lookup) for use in import_data.
    """
    required_courses, group_courses, _ = load_course_data()
    core_raw = load_json(os.path.join(DATA_DIR, "core_general.json"))

    core_course_names = {name for names in core_raw.values() for name in names}
    group_lookup = {c["course_name"]: (c["course_class"], c["take_in_year"]) for c in group_courses}

    cur = conn.cursor()

    # Seed general_category: 人文通→人文, 社會通→社會, 自然通→自然
    for domain in GENERAL_DOMAIN_KEYWORDS:
        cur.execute(
            """
            INSERT INTO general_category (category_code, category_name)
            VALUES (%s, %s)
            ON CONFLICT (category_code) DO NOTHING
            """,
            (domain[:2], domain),
        )

    # Insert required courses; delete first for idempotent re-runs
    if required_courses:
        dept = required_courses[0]["take_in_dept"]
        year = required_courses[0]["take_in_year"]
        cur.execute(
            "DELETE FROM required_course WHERE take_in_dept = %s AND take_in_year = %s",
            (dept, year),
        )
    for c in required_courses:
        cur.execute(
            """
            INSERT INTO all_course (course_code, course_name, credit)
            VALUES (%s, %s, %s)
            ON CONFLICT (course_code) DO UPDATE SET
                course_name = EXCLUDED.course_name,
                credit      = EXCLUDED.credit
            """,
            (c["course_code"], c["course_name"], c["credit"]),
        )
        cur.execute(
            """
            INSERT INTO required_course (course_code, course_name, take_in_dept, take_in_year)
            VALUES (%s, %s, %s, %s)
            """,
            (c["course_code"], c["course_name"], c["take_in_dept"], c["take_in_year"]),
        )

    conn.commit()
    cur.close()
    return core_course_names, group_lookup


def import_data(data: list, conn, core_course_names: set, group_lookup: dict):
    cur = conn.cursor()

    for entry in data:
        academic    = entry.get("課業學習", {})
        about       = academic.get("aboutMe", {})
        course_plan = academic.get("coursePlan", {})

        # ---------- students ----------
        student_id        = about["studentNumber"]
        chinese_name      = about["chineseName"]
        english_name      = about.get("englishName", "")
        department        = about["registerMajor"]
        double_major      = about.get("doubleMajor") or None
        minor             = about.get("registerMinor") or None
        enrollment_year   = int(course_plan["coursePlanSchyy"])
        english_exemption = about.get("collegeEnglishExemption", "未申請") != "未申請"

        cur.execute(
            """
            INSERT INTO students
                (student_id, chinese_name, english_name, department,
                 double_major, minor, enrollment_year, english_exemption)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (student_id) DO UPDATE SET
                chinese_name      = EXCLUDED.chinese_name,
                english_name      = EXCLUDED.english_name,
                department        = EXCLUDED.department,
                double_major      = EXCLUDED.double_major,
                minor             = EXCLUDED.minor,
                enrollment_year   = EXCLUDED.enrollment_year,
                english_exemption = EXCLUDED.english_exemption
            """,
            (student_id, chinese_name, english_name, department,
             double_major, minor, enrollment_year, english_exemption),
        )

        # ---------- courses & course_record ----------
        seen_courses: set[str] = set()

        for year_block in academic.get("gradeRecordList", []):
            for rec in year_block.get("GradeRecords", []):
                course_code   = rec["courseCode"]
                course_name   = rec["courseName"]
                credit        = float(rec["credit"])
                remark        = rec.get("remark") or None
                academic_year = rec["academicYear"]
                semester      = rec["semester"]

                is_general = _is_general(remark)
                is_defense = "國防" in course_name

                # ---------- all_course ----------
                if course_code not in seen_courses:
                    cur.execute(
                        """
                        INSERT INTO all_course (course_code, course_name, credit)
                        VALUES (%s, %s, %s)
                        ON CONFLICT (course_code) DO UPDATE SET
                            course_name = EXCLUDED.course_name,
                            credit      = EXCLUDED.credit
                        """,
                        (course_code, course_name, credit),
                    )
                    seen_courses.add(course_code)

                    # ---------- cs_group ----------
                    if course_name in group_lookup:
                        group_class, take_in_year = group_lookup[course_name]
                        cur.execute(
                            """
                            INSERT INTO cs_group
                                (course_code, course_name, course_class, take_in_year)
                            VALUES (%s, %s, %s, %s)
                            ON CONFLICT (course_code) DO NOTHING
                            """,
                            (course_code, course_name, group_class, take_in_year),
                        )

                    # ---------- general_course + general_course_category ----------
                    domains = _parse_domains(remark)
                    if domains:
                        is_core = course_name in core_course_names
                        cur.execute(
                            """
                            INSERT INTO general_course (course_code, course_name, is_core)
                            VALUES (%s, %s, %s)
                            ON CONFLICT (course_code) DO UPDATE SET
                                is_core = EXCLUDED.is_core OR general_course.is_core
                            """,
                            (course_code, course_name, is_core),
                        )
                        for domain in domains:
                            cur.execute(
                                """
                                INSERT INTO general_course_category (course_code, category_code)
                                VALUES (%s, %s)
                                ON CONFLICT (course_code, category_code) DO NOTHING
                                """,
                                (course_code, domain[:2]),
                            )

                # ---------- course_record ----------
                score_raw = rec.get("score", "")
                score_val, status = parse_score(str(score_raw))
                if status is None:
                    status = ""  # numeric score; no special status

                cur.execute(
                    """
                    INSERT INTO course_record
                        (student_id, course_code, academic_year, academic_semester,
                         score, course_status, is_general, is_defense)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (student_id, course_code, academic_year, academic_semester) DO UPDATE SET
                        score         = EXCLUDED.score,
                        course_status = EXCLUDED.course_status,
                        is_general    = EXCLUDED.is_general,
                        is_defense    = EXCLUDED.is_defense
                    """,
                    (student_id, course_code, academic_year, semester,
                     score_val, status, is_general, is_defense),
                )

    conn.commit()
    cur.close()
    print("Import completed successfully.")


def main():
    default_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    paths = sys.argv[1:] if len(sys.argv) > 1 else [
        os.path.join(default_dir, f)
        for f in os.listdir(default_dir)
        if f.startswith("exportStudentData") and f.endswith(".json")
    ]

    if not paths:
        print("No input files found.", file=sys.stderr)
        sys.exit(1)

    conn = psycopg2.connect(**DB_CONFIG)
    try:
        core_course_names, group_lookup = seed_static_data(conn)
        for path in paths:
            print(f"Importing {path} ...")
            data = load_json(path)
            import_data(data, conn, core_course_names, group_lookup)
    except Exception as e:
        conn.rollback()
        print(f"Error: {e}", file=sys.stderr)
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
