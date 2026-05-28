# 封裝所有對於 DB 的查詢，但不具有判斷邏輯
from sqlalchemy import select

from app.config import get_session
from app.models import AllCourse, CourseRecord, CsGroup, RequiredCourse, Student


def fetch_student(student_id: str):
    with get_session() as session:
        student = session.get(Student, student_id)
        if student is None:
            return None
        return {col.name: getattr(student, col.name) for col in Student.__table__.columns}


def fetch_course_records(student_id: str):
    """Each course_code returns only the latest attempt for the student."""
    stmt = (
        select(
            CourseRecord.course_code,
            CourseRecord.score,
            CourseRecord.course_status,
            CourseRecord.academic_year,
            CourseRecord.academic_semester,
            AllCourse.course_name,
            AllCourse.credit,
        )
        .join(AllCourse, CourseRecord.course_code == AllCourse.course_code)
        .where(CourseRecord.student_id == student_id)
        .order_by(
            CourseRecord.course_code,
            CourseRecord.academic_year.desc(),
            CourseRecord.academic_semester.desc(),
        )
        .distinct(CourseRecord.course_code)
    )
    with get_session() as session:
        rows = session.execute(stmt).all()

    return [
        {
            "course_code": row.course_code,
            "score": row.score,
            "course_status": row.course_status,
            "academic_year_semester": f"{row.academic_year}{row.academic_semester}",
            "course_name": row.course_name,
            "credit": row.credit,
        }
        for row in rows
    ]


def fetch_required_courses(dept: str, year: str) -> list[tuple[str, str]]:
    """Returns list of (course_code, course_name) for each required course entry."""
    stmt = (
        select(RequiredCourse.course_code, RequiredCourse.course_name)
        .where(
            RequiredCourse.take_in_dept == dept,
            RequiredCourse.take_in_year == year,
        )
        .order_by(RequiredCourse.required_uid)
    )
    with get_session() as session:
        return [(code, name) for code, name in session.execute(stmt).all()]


def fetch_group_names(year: str) -> dict[str, list[str]]:
    stmt = (
        select(CsGroup.course_class, CsGroup.course_name)
        .where(CsGroup.take_in_year == year)
        .order_by(CsGroup.course_class, CsGroup.group_uid)
    )
    with get_session() as session:
        result: dict[str, list[str]] = {}
        for course_class, course_name in session.execute(stmt).all():
            result.setdefault(course_class, []).append(course_name)
        return result
