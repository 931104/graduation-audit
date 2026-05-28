import json
import os
import sys

from dotenv import load_dotenv

_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(_ROOT, ".env"))

# Reuse the engine, session factory, and ORM models defined under logic/
sys.path.insert(0, os.path.join(_ROOT, "logic"))

from sqlalchemy import or_  # noqa: E402
from sqlalchemy.dialects.postgresql import insert as pg_insert  # noqa: E402

from app.config import SessionLocal  # noqa: E402
from app.models import (  # noqa: E402
    AllCourse,
    CourseRecord,
    CsGroup,
    GeneralCategory,
    GeneralCourse,
    GeneralCourseCategory,
    RequiredCourse,
    Student,
)

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


def _upsert_all_course(session, course_code: str, course_name: str, credit: float):
    stmt = pg_insert(AllCourse).values(
        course_code=course_code,
        course_name=course_name,
        credit=credit,
    )
    stmt = stmt.on_conflict_do_update(
        index_elements=[AllCourse.course_code],
        set_={
            "course_name": stmt.excluded.course_name,
            "credit":      stmt.excluded.credit,
        },
    )
    session.execute(stmt)


def seed_static_data(session):
    """Seed general_category and required_course from JSON files.
    Returns (core_course_names, group_lookup) for use in import_data.
    """
    required_courses, group_courses, _ = load_course_data()
    core_raw = load_json(os.path.join(DATA_DIR, "core_general.json"))

    core_course_names = {name for names in core_raw.values() for name in names}
    group_lookup = {c["course_name"]: (c["course_class"], c["take_in_year"]) for c in group_courses}

    # Seed general_category: 人文通→人文, 社會通→社會, 自然通→自然
    for domain in GENERAL_DOMAIN_KEYWORDS:
        stmt = pg_insert(GeneralCategory).values(
            category_code=domain[:2],
            category_name=domain,
        ).on_conflict_do_nothing(index_elements=[GeneralCategory.category_code])
        session.execute(stmt)

    # Reset required_course for this dept/year so re-runs are idempotent
    if required_courses:
        dept = required_courses[0]["take_in_dept"]
        year = required_courses[0]["take_in_year"]
        session.query(RequiredCourse).filter(
            RequiredCourse.take_in_dept == dept,
            RequiredCourse.take_in_year == year,
        ).delete(synchronize_session=False)

    for c in required_courses:
        _upsert_all_course(session, c["course_code"], c["course_name"], c["credit"])
        session.add(RequiredCourse(
            course_code  = c["course_code"],
            course_name  = c["course_name"],
            take_in_dept = c["take_in_dept"],
            take_in_year = c["take_in_year"],
        ))

    session.commit()
    return core_course_names, group_lookup


def import_data(data: list, session, core_course_names: set, group_lookup: dict):
    for entry in data:
        academic    = entry.get("課業學習", {})
        about       = academic.get("aboutMe", {})
        course_plan = academic.get("coursePlan", {})

        # ---------- students ----------
        student_values = {
            "student_id":        about["studentNumber"],
            "chinese_name":      about["chineseName"],
            "english_name":      about.get("englishName", ""),
            "department":        about["registerMajor"],
            "double_major":      about.get("doubleMajor") or None,
            "minor":             about.get("registerMinor") or None,
            "enrollment_year":   int(course_plan["coursePlanSchyy"]),
            "english_exemption": about.get("collegeEnglishExemption", "未申請") != "未申請",
        }

        student_stmt = pg_insert(Student).values(**student_values)
        student_stmt = student_stmt.on_conflict_do_update(
            index_elements=[Student.student_id],
            set_={
                key: student_stmt.excluded[key]
                for key in student_values
                if key != "student_id"
            },
        )
        session.execute(student_stmt)

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
                    _upsert_all_course(session, course_code, course_name, credit)
                    seen_courses.add(course_code)

                    # ---------- cs_group ----------
                    if course_name in group_lookup:
                        group_class, take_in_year = group_lookup[course_name]
                        cs_group_stmt = pg_insert(CsGroup).values(
                            course_code  = course_code,
                            course_name  = course_name,
                            course_class = group_class,
                            take_in_year = take_in_year,
                        ).on_conflict_do_nothing(index_elements=[CsGroup.course_code])
                        session.execute(cs_group_stmt)

                    # ---------- general_course + general_course_category ----------
                    domains = _parse_domains(remark)
                    if domains:
                        is_core = course_name in core_course_names

                        gc_stmt = pg_insert(GeneralCourse).values(
                            course_code = course_code,
                            course_name = course_name,
                            is_core     = is_core,
                        )
                        # Keep is_core sticky-True: existing OR incoming
                        gc_stmt = gc_stmt.on_conflict_do_update(
                            index_elements=[GeneralCourse.course_code],
                            set_={"is_core": or_(gc_stmt.excluded.is_core, GeneralCourse.is_core)},
                        )
                        session.execute(gc_stmt)

                        for domain in domains:
                            gcc_stmt = pg_insert(GeneralCourseCategory).values(
                                course_code   = course_code,
                                category_code = domain[:2],
                            ).on_conflict_do_nothing(
                                index_elements=[
                                    GeneralCourseCategory.course_code,
                                    GeneralCourseCategory.category_code,
                                ],
                            )
                            session.execute(gcc_stmt)

                # ---------- course_record ----------
                score_raw = rec.get("score", "")
                score_val, status = parse_score(str(score_raw))
                if status is None:
                    status = ""  # numeric score; no special status

                cr_stmt = pg_insert(CourseRecord).values(
                    student_id        = student_values["student_id"],
                    course_code       = course_code,
                    academic_year     = academic_year,
                    academic_semester = semester,
                    score             = score_val,
                    course_status     = status,
                    is_general        = is_general,
                    is_defense        = is_defense,
                )
                cr_stmt = cr_stmt.on_conflict_do_update(
                    index_elements=[
                        CourseRecord.student_id,
                        CourseRecord.course_code,
                        CourseRecord.academic_year,
                        CourseRecord.academic_semester,
                    ],
                    set_={
                        "score":         cr_stmt.excluded.score,
                        "course_status": cr_stmt.excluded.course_status,
                        "is_general":    cr_stmt.excluded.is_general,
                        "is_defense":    cr_stmt.excluded.is_defense,
                    },
                )
                session.execute(cr_stmt)

    session.commit()
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

    session = SessionLocal()
    try:
        core_course_names, group_lookup = seed_static_data(session)
        for path in paths:
            print(f"Importing {path} ...")
            data = load_json(path)
            import_data(data, session, core_course_names, group_lookup)
    except Exception as e:
        session.rollback()
        print(f"Error: {e}", file=sys.stderr)
        raise
    finally:
        session.close()


if __name__ == "__main__":
    main()
