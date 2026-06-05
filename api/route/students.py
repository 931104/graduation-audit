from fastapi import APIRouter, HTTPException, Query
import os
import sys
from decimal import Decimal


# 專案根目錄 graduation-audit/
ROOT_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(os.path.abspath(__file__))
    )
)

LOGIC_DIR = os.path.join(ROOT_DIR, "logic")

# 讓 API 可以 import logic/app 裡面的東西
if LOGIC_DIR not in sys.path:
    sys.path.insert(0, LOGIC_DIR)


from app.db.queries import fetch_student, fetch_course_records
from gpa import compute_gpa


router = APIRouter(
    prefix="/api/students",
    tags=["Students"]
)


def to_jsonable(obj):
    """
    把資料轉成 FastAPI 可以回傳的 JSON 格式。
    避免 Decimal、set、SQLAlchemy model 不能直接轉 JSON。
    """
    if obj is None:
        return None

    if isinstance(obj, Decimal):
        return float(obj)

    if isinstance(obj, set):
        return list(obj)

    if isinstance(obj, list):
        return [to_jsonable(item) for item in obj]

    if isinstance(obj, tuple):
        return [to_jsonable(item) for item in obj]

    if isinstance(obj, dict):
        return {
            key: to_jsonable(value)
            for key, value in obj.items()
        }

    if hasattr(obj, "__dict__"):
        return {
            key: to_jsonable(value)
            for key, value in obj.__dict__.items()
            if not key.startswith("_")
        }

    return obj


@router.get("/{student_id}")
def get_student(student_id: str):
    """
    查詢學生基本資料。
    student_id 例如：112703045
    """

    student = fetch_student(student_id)

    if student is None:
        raise HTTPException(
            status_code=404,
            detail=f"Student {student_id} not found"
        )

    return {
        "success": True,
        "studentId": student_id,
        "data": to_jsonable(student)
    }


@router.get("/{student_id}/courses")
def get_student_courses(
    student_id: str,
    latest_only: bool = Query(False, description="是否只查最新修課紀錄")
):
    """
    查詢學生修課紀錄。
    """

    student = fetch_student(student_id)

    if student is None:
        raise HTTPException(
            status_code=404,
            detail=f"Student {student_id} not found"
        )

    records = fetch_course_records(
        student_id,
        latest_only=latest_only
    )

    return {
        "success": True,
        "studentId": student_id,
        "count": len(records),
        "data": to_jsonable(records)
    }


@router.get("/{student_id}/gpa")
def get_student_gpa(student_id: str):
    """
    查詢學生 GPA。
    這裡直接使用 logic/gpa.py 裡的 compute_gpa。
    """

    student = fetch_student(student_id)

    if student is None:
        raise HTTPException(
            status_code=404,
            detail=f"Student {student_id} not found"
        )

    records = fetch_course_records(
        student_id,
        latest_only=False
    )

    result = compute_gpa(records)

    return {
        "success": True,
        "studentId": student_id,
        "student": to_jsonable(student),
        "gpaResult": to_jsonable(result)
    }
