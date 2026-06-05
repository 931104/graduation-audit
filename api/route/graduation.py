from fastapi import APIRouter, HTTPException
import os
import sys
from decimal import Decimal


# 專案根目錄 graduation-audit/
ROOT_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(os.path.abspath(__file__))
    )
)

# logic 資料夾
LOGIC_DIR = os.path.join(ROOT_DIR, "logic")

# 讓 API 可以 import logic/app 裡面的東西
if LOGIC_DIR not in sys.path:
    sys.path.insert(0, LOGIC_DIR)


from app.db.queries import fetch_student
from app.audit.cs_rules.cs_112 import Group, Required
from app.audit.general_rules.general_rules import General
from app.audit.general_rules.elective import Elective
from app.audit.general_rules.pc_rules import Physical


router = APIRouter(
    prefix="/api",
    tags=["Graduation Check"]
)


TOTAL_REQUIRED = 128.0
REQ_REQUIRED = 36.0
GROUP_REQUIRED = 15.0
GENERAL_REQUIRED = 28.0
PHY_REQUIRED = 4.0
ELEC_REQUIRED = (
    TOTAL_REQUIRED
    - REQ_REQUIRED
    - GROUP_REQUIRED
    - GENERAL_REQUIRED
    - PHY_REQUIRED
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


def shortage(required: float, earned: float) -> float:
    """
    計算尚缺學分。
    """
    return max(0.0, required - earned)


@router.post("/graduation-check/{student_id}")
def graduation_check(student_id: str):
    """
    執行畢業審核。
    student_id 例如：112703045
    """

    student = fetch_student(student_id)

    if student is None:
        raise HTTPException(
            status_code=404,
            detail=f"Student {student_id} not found"
        )

    try:
        # 專業必修
        req_ok, req_missing, req_passed, req_credits = Required(student_id)

        # 專業群修
        grp = Group(student_id)

        # 通識
        gen = General(student_id)

        # 體育
        phy = Physical(student_id)

        # 自由選修
        elec_total, elec_courses = Elective(
            student_id,
            require=req_passed,
            group=grp["used_courses"],
            general=gen,
            pc=phy,
        )

        # 通識學分計算
        gen_summary = gen["summary"]
        gen_credits = (
            gen_summary["counted_total_credit"]
            + gen_summary["english_credit"]
            + gen_summary["chinese_credit"]
        )

        # 各類是否通過
        group_ok = (
            grp["credits_ok"]
            and grp["group_a_ok"]
            and grp["domain_ok"]
        )

        gen_ok = gen["is_passed"]
        phy_ok = phy["is_passed"]
        elec_ok = elec_total >= ELEC_REQUIRED

        total_earned = (
            req_credits
            + grp["used_credits"]
            + gen_credits
            + phy["used_credits"]
            + elec_total
        )

        total_ok = (
            total_earned >= TOTAL_REQUIRED
            and req_ok
            and group_ok
            and gen_ok
            and phy_ok
            and elec_ok
        )

        # 整理缺少的分類
        missing_categories = []

        if not req_ok:
            missing_categories.append(
                f"專業必修尚缺 {shortage(REQ_REQUIRED, req_credits):.1f} 學分"
            )

        if not group_ok:
            missing_categories.append(
                f"專業群修尚缺 {shortage(GROUP_REQUIRED, grp['used_credits']):.1f} 學分"
            )

        if not gen_ok:
            missing_categories.append(
                f"通識尚缺 {shortage(GENERAL_REQUIRED, gen_credits):.1f} 學分"
            )

        if not phy_ok:
            missing_categories.append(
                f"體育尚缺 {shortage(PHY_REQUIRED, phy['used_credits']):.1f} 學分"
            )

        if not elec_ok:
            missing_categories.append(
                f"自由選修尚缺 {shortage(ELEC_REQUIRED, elec_total):.1f} 學分"
            )

        result = {
            "eligible": total_ok,
            "student": to_jsonable(student),
            "totalCredits": {
                "earned": float(total_earned),
                "required": TOTAL_REQUIRED,
                "missing": shortage(TOTAL_REQUIRED, total_earned)
            },
            "categories": {
                "required": {
                    "name": "專業必修",
                    "passed": req_ok,
                    "earnedCredits": float(req_credits),
                    "requiredCredits": REQ_REQUIRED,
                    "missingCredits": shortage(REQ_REQUIRED, req_credits),
                    "missingCourses": to_jsonable(req_missing),
                    "passedCourses": to_jsonable(req_passed)
                },
                "group": {
                    "name": "專業群修",
                    "passed": group_ok,
                    "earnedCredits": float(grp["used_credits"]),
                    "requiredCredits": GROUP_REQUIRED,
                    "missingCredits": shortage(GROUP_REQUIRED, grp["used_credits"]),
                    "detail": to_jsonable(grp)
                },
                "general": {
                    "name": "通識",
                    "passed": gen_ok,
                    "earnedCredits": float(gen_credits),
                    "requiredCredits": GENERAL_REQUIRED,
                    "missingCredits": shortage(GENERAL_REQUIRED, gen_credits),
                    "detail": to_jsonable(gen)
                },
                "physical": {
                    "name": "體育",
                    "passed": phy_ok,
                    "earnedCredits": float(phy["used_credits"]),
                    "requiredCredits": PHY_REQUIRED,
                    "missingCredits": shortage(PHY_REQUIRED, phy["used_credits"]),
                    "detail": to_jsonable(phy)
                },
                "elective": {
                    "name": "自由選修",
                    "passed": elec_ok,
                    "earnedCredits": float(elec_total),
                    "requiredCredits": ELEC_REQUIRED,
                    "missingCredits": shortage(ELEC_REQUIRED, elec_total),
                    "courses": to_jsonable(elec_courses)
                }
            },
            "missingCourses": to_jsonable(req_missing),
            "missingCategories": missing_categories
        }

        return {
            "success": True,
            "studentId": student_id,
            "result": result
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Graduation check failed: {str(e)}"
        )


@router.get("/graduation-check/{student_id}")
def get_graduation_check(student_id: str):
    """
    讓瀏覽器也可以直接用 GET 測試畢業審核。
    內部直接呼叫 POST 那支同樣的邏輯。
    """
    return graduation_check(student_id)
