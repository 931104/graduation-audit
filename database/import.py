import json
import os
import psycopg2
import sys

DB_CONFIG = {
    "host": "localhost",
    "port": 5433,
    "database": "myapp",
    "user": "admin",
    "password": "123456",
}

SPECIAL_SCORES = {"停修", "通過", "成績未到或無成績", ""}


def parse_score(raw: str):
    """Return (score_float_or_None, status_str_or_None)."""
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


def import_data(data: list, conn):
    cur = conn.cursor()

    for entry in data:
        academic = entry.get("課業學習", {})
        about = academic.get("aboutMe", {})
        course_plan = academic.get("coursePlan", {})

        # ---------- students ----------
        student_id = about["studentNumber"]
        student_name = about["chineseName"]
        department = about["registerMajor"]
        double_major = about.get("doubleMajor") or None
        minor = about.get("registerMinor") or None
        enrollment_year = int(course_plan["coursePlanSchyy"])

        cur.execute(
            """
            INSERT INTO students (student_id, student_name, department, double_major, minor, enrollment_year)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (student_id) DO UPDATE SET
                student_name    = EXCLUDED.student_name,
                department      = EXCLUDED.department,
                double_major    = EXCLUDED.double_major,
                minor           = EXCLUDED.minor,
                enrollment_year = EXCLUDED.enrollment_year
            """,
            (student_id, student_name, department, double_major, minor, enrollment_year),
        )

        # ---------- courses & course_record ----------
        seen_courses = set()

        for year_block in academic.get("gradeRecordList", []):
            for rec in year_block.get("GradeRecords", []):
                course_code = rec["courseCode"]
                course_name = rec["courseName"]
                credit = float(rec["credit"])
                remark = rec.get("remark") or None
                required_or_elective = rec.get("requiredOrElectiveCourse") or None

                # remark stores 通識 category (人文通/自然通/社會通); fallback to 必/選/群
                db_remark = remark if remark else required_or_elective

                if course_code not in seen_courses:
                    cur.execute(
                        """
                        INSERT INTO course (course_name, course_code, credit, remark)
                        VALUES (%s, %s, %s, %s)
                        ON CONFLICT (course_code) DO UPDATE SET
                            course_name = EXCLUDED.course_name,
                            credit      = EXCLUDED.credit,
                            remark      = EXCLUDED.remark
                        """,
                        (course_name, course_code, credit, db_remark),
                    )
                    seen_courses.add(course_code)

                score_raw = rec.get("score", "")
                score_val, status = parse_score(str(score_raw))
                ays = rec.get("academicYearSemester", "")

                cur.execute(
                    """
                    INSERT INTO course_record
                        (student_id, course_code, academic_year_semester, score, course_status)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (student_id, course_code, academic_year_semester) DO UPDATE SET
                        score        = EXCLUDED.score,
                        course_status = EXCLUDED.course_status
                    """,
                    (student_id, course_code, ays, score_val, status),
                )

    conn.commit()
    cur.close()
    print("Import completed successfully.")


def main():
    default_path = os.path.join(os.path.dirname(__file__), "..", "data", "exportStudentData.json")
    json_path = sys.argv[1] if len(sys.argv) > 1 else default_path
    data = load_json(json_path)

    conn = psycopg2.connect(**DB_CONFIG)
    try:
        import_data(data, conn)
    except Exception as e:
        conn.rollback()
        print(f"Error: {e}", file=sys.stderr)
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
