"""
Parse the JSON exported from the school system and upsert into the database.
Also seeds static course rule tables (required_course, cs_group, general_course)
on every upload so the audit logic always has up-to-date reference data.
"""
import json
import os
from decimal import Decimal, InvalidOperation

from sqlalchemy.dialects.postgresql import insert

from app.config import get_session
from app.models import (
    AllCourse,
    CourseRecord,
    CsGroup,
    GeneralCategory,
    GeneralCourse,
    GeneralCourseCategory,
    RequiredCourse,
    Student,
)

_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")

IGNORED_STATUSES = {"停修", "成績未到或無成績", "退選"}
GENERAL_DOMAIN_KEYWORDS = ("人文通", "社會通", "自然通")
PHYSICAL_KEYWORD = "體育["
DEFENSE_PREFIX = "全民國防"
ENGLISH_COURSE_CODE_PREFIX = "599"
ENGLISH_COURSE_NAMES = {"大學英文（一）", "大學英文（二）"}
CHINESE_COURSE_KEYWORDS = ("國文－", "進階國文－")


def _load_json(path: str):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _parse_score(raw: str) -> Decimal | None:
    if raw is None:
        return None
    try:
        return Decimal(str(raw))
    except (InvalidOperation, ValueError):
        return None


def _parse_domains(remark: str | None) -> list[str]:
    if not remark:
        return []
    return [p.strip() for p in remark.split("、") if p.strip() in GENERAL_DOMAIN_KEYWORDS]


def _is_general(course_name: str, course_code: str, remark: str) -> bool:
    if _parse_domains(remark):
        return True
    if any(kw in course_name for kw in CHINESE_COURSE_KEYWORDS):
        return True
    if course_name in ENGLISH_COURSE_NAMES:
        return True
    if course_code.startswith(ENGLISH_COURSE_CODE_PREFIX):
        return True
    return False


def _is_defense(course_name: str) -> bool:
    return course_name.startswith(DEFENSE_PREFIX)


def _course_status(raw_score: str) -> str:
    if raw_score in IGNORED_STATUSES:
        return raw_score
    if raw_score == "通過":
        return "通過"
    try:
        Decimal(str(raw_score))
        return "有成績"
    except (InvalidOperation, ValueError):
        return raw_score or "未知"


def _upsert_all_course(session, course_code: str, course_name: str, credit: Decimal):
    stmt = (
        insert(AllCourse)
        .values(course_code=course_code, course_name=course_name, credit=credit, dept=None)
        .on_conflict_do_update(
            index_elements=["course_code"],
            set_={"course_name": course_name, "credit": credit},
        )
    )
    session.execute(stmt)


def _seed_static_data(session) -> tuple[set[str], dict[str, tuple[str, str]]]:
    """Seed required_course, cs_group, general_category from JSON files.
    Returns (core_course_names, group_lookup) for use during student import.
    """
    required_raw = _load_json(os.path.join(_DATA_DIR, "required.json"))
    group_raw = _load_json(os.path.join(_DATA_DIR, "group.json"))
    core_raw = _load_json(os.path.join(_DATA_DIR, "core_general.json"))

    core_course_names = {name for names in core_raw.values() for name in names}

    # general_category
    for domain in GENERAL_DOMAIN_KEYWORDS:
        stmt = (
            insert(GeneralCategory)
            .values(category_code=domain[:2], category_name=domain)
            .on_conflict_do_nothing(index_elements=["category_code"])
        )
        session.execute(stmt)

    # required_course — wipe and re-seed for this dept/year
    dept = required_raw["department"]
    year = required_raw["year"]
    session.query(RequiredCourse).filter(
        RequiredCourse.take_in_dept == dept,
        RequiredCourse.take_in_year == year,
    ).delete(synchronize_session=False)

    for c in required_raw["required_course"]:
        credit = Decimal(str(c["credit"]))
        _upsert_all_course(session, c["course_code"], c["course_name"], credit)
        session.add(RequiredCourse(
            course_code=c["course_code"],
            course_name=c["course_name"],
            take_in_dept=dept,
            take_in_year=year,
        ))

    # cs_group — build lookup and upsert
    group_lookup: dict[str, tuple[str, str]] = {}
    for group_name, courses in group_raw["group_course"].items():
        for c in courses:
            group_lookup[c["course_name"]] = (group_name, group_raw["year"])

    return core_course_names, group_lookup


def import_student_json(data: list) -> str:
    """Parse the school JSON export, seed static data, upsert student into DB.
    Returns student_id.
    """
    raw = data[0]["課業學習"]
    about = raw["aboutMe"]
    course_plan = raw.get("coursePlan", {})

    student_id = about["studentNumber"]
    chinese_name = about["chineseName"]
    english_name = about.get("englishName", "")
    department = about.get("registerMajor", "")
    double_major = about.get("registerDoubleMajor") or None
    minor = about.get("registerMinor") or None
    enrollment_year = int(course_plan.get("coursePlanSchyy") or 0)
    exemption_str = about.get("collegeEnglishExemption", "")
    english_exemption = bool(exemption_str and exemption_str.strip())

    grade_records = raw.get("gradeRecordList", [])

    with get_session() as session:
        # 1. Seed static course rules
        core_course_names, group_lookup = _seed_static_data(session)

        # 2. Upsert student
        stmt = (
            insert(Student)
            .values(
                student_id=student_id,
                chinese_name=chinese_name,
                english_name=english_name,
                department=department,
                double_major=double_major,
                minor=minor,
                enrollment_year=enrollment_year,
                english_exemption=english_exemption,
            )
            .on_conflict_do_update(
                index_elements=["student_id"],
                set_={
                    "chinese_name": chinese_name,
                    "english_name": english_name,
                    "department": department,
                    "double_major": double_major,
                    "minor": minor,
                    "enrollment_year": enrollment_year,
                    "english_exemption": english_exemption,
                },
            )
        )
        session.execute(stmt)

        # 3. Upsert courses and course records
        seen_codes: set[str] = set()
        for semester in grade_records:
            academic_year = str(semester["AcademicYear"])
            for course in semester["GradeRecords"]:
                code = course["courseCode"]
                name = course["courseName"]
                credit = Decimal(str(course.get("credit", "0")))
                raw_score = str(course.get("score", ""))
                remark = course.get("remark", "") or ""
                semester_num = str(course.get("semester", ""))

                status = _course_status(raw_score)
                score = _parse_score(raw_score) if status == "有成績" else None
                is_gen = _is_general(name, code, remark)
                is_def = _is_defense(name)

                # all_course
                _upsert_all_course(session, code, name, credit)

                # cs_group — only insert once per course_code
                if code not in seen_codes and name in group_lookup:
                    group_class, take_in_year = group_lookup[name]
                    session.execute(
                        insert(CsGroup)
                        .values(
                            course_code=code,
                            course_name=name,
                            course_class=group_class,
                            take_in_year=take_in_year,
                        )
                        .on_conflict_do_nothing(index_elements=["course_code"])
                    )

                # general_course + general_course_category
                domains = _parse_domains(remark)
                if domains and code not in seen_codes:
                    is_core = name in core_course_names
                    session.execute(
                        insert(GeneralCourse)
                        .values(course_code=code, course_name=name, is_core=is_core)
                        .on_conflict_do_update(
                            index_elements=["course_code"],
                            set_={"is_core": is_core},
                        )
                    )
                    for domain in domains:
                        session.execute(
                            insert(GeneralCourseCategory)
                            .values(course_code=code, category_code=domain[:2])
                            .on_conflict_do_nothing(
                                index_elements=["course_code", "category_code"]
                            )
                        )

                seen_codes.add(code)

                # course_record
                session.execute(
                    insert(CourseRecord)
                    .values(
                        student_id=student_id,
                        course_code=code,
                        academic_year=academic_year,
                        academic_semester=semester_num,
                        score=score,
                        course_status=status,
                        is_general=is_gen,
                        is_defense=is_def,
                    )
                    .on_conflict_do_update(
                        index_elements=[
                            "student_id", "course_code",
                            "academic_year", "academic_semester",
                        ],
                        set_={
                            "score": score,
                            "course_status": status,
                            "is_general": is_gen,
                            "is_defense": is_def,
                        },
                    )
                )

        session.commit()

    return student_id
