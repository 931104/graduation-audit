# 封裝所有對於 DB 的查詢，但不具有判斷邏輯
from psycopg2.extras import RealDictCursor

from app.config import get_conn, put_conn


def fetch_student(student_id: str):
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT * FROM students WHERE student_id = %s", (student_id,))
            return cur.fetchone()
    finally:
        put_conn(conn)


def fetch_course_records(student_id: str):
    """Each course_code returns only the latest attempt for the student."""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT DISTINCT ON (cr.course_code)
                    cr.course_code,
                    cr.score,
                    cr.course_status,
                    cr.academic_year || cr.academic_semester AS academic_year_semester,
                    c.course_name,
                    c.credit
                FROM course_record cr
                JOIN all_course c ON cr.course_code = c.course_code
                WHERE cr.student_id = %s
                ORDER BY cr.course_code, cr.academic_year DESC, cr.academic_semester DESC
                """,
                (student_id,),
            )
            return cur.fetchall()
    finally:
        put_conn(conn)


def fetch_required_courses(dept: str, year: str) -> list[tuple[str, str]]:
    """Returns list of (course_code, course_name) for each required course entry."""
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT course_code, course_name FROM required_course
                WHERE take_in_dept = %s AND take_in_year = %s
                ORDER BY required_uid
                """,
                (dept, year),
            )
            return cur.fetchall()
    finally:
        put_conn(conn)


def fetch_group_names(year: str) -> dict[str, list[str]]:
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT course_class, course_name FROM cs_group
                WHERE take_in_year = %s
                ORDER BY course_class, group_uid
                """,
                (year,),
            )
            result: dict[str, list[str]] = {}
            for course_class, course_name in cur.fetchall():
                result.setdefault(course_class, []).append(course_name)
            return result
    finally:
        put_conn(conn)
