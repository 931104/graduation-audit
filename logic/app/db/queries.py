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
                    cr.academic_year_semester,
                    c.course_name,
                    c.credit,
                    c.remark,
                    c.special_attribute
                FROM course_record cr
                JOIN course c ON cr.course_code = c.course_code
                WHERE cr.student_id = %s
                ORDER BY cr.course_code, cr.academic_year_semester DESC
                """,
                (student_id,),
            )
            return cur.fetchall()
    finally:
        put_conn(conn)
