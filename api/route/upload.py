from fastapi import APIRouter, UploadFile, File, HTTPException
import json
import os
import shutil
import importlib.util


router = APIRouter(
    prefix="/api",
    tags=["Upload"]
)


# 專案根目錄：graduation-audit/
ROOT_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(os.path.abspath(__file__))
    )
)

# data 資料夾
DATA_DIR = os.path.join(ROOT_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

# 固定存成這個檔案
TARGET_JSON_PATH = os.path.join(DATA_DIR, "exportStudentData.json")


def load_import_module():
    """
    動態載入 database/import.py

    因為 import.py 的檔名是 Python 關鍵字 import，
    所以不能直接寫：
        from database.import import ...
    """
    import_path = os.path.join(ROOT_DIR, "database", "import.py")

    spec = importlib.util.spec_from_file_location("database_import", import_path)
    database_import = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(database_import)

    return database_import


def get_student_id_from_json(data):
    """
    從全人 JSON 裡抓學生學號。
    import.py 裡是用 aboutMe["studentNumber"] 當 student_id。
    """
    try:
        first_entry = data[0]
        academic = first_entry.get("課業學習", {})
        about = academic.get("aboutMe", {})
        return about.get("studentNumber")
    except Exception:
        return None


@router.post("/upload-json")
async def upload_json(file: UploadFile = File(...)):
    """
    上傳全人 JSON，固定存到 data/exportStudentData.json，
    然後呼叫 database/import.py 匯入資料庫。
    """

    # 1. 檢查副檔名
    if not file.filename.endswith(".json"):
        raise HTTPException(
            status_code=400,
            detail="Only JSON files are allowed"
        )

    # 2. 將上傳檔案覆蓋存成 data/exportStudentData.json
    try:
        with open(TARGET_JSON_PATH, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"File save failed: {str(e)}"
        )

    # 3. 檢查 JSON 格式
    try:
        with open(TARGET_JSON_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)

    except json.JSONDecodeError:
        raise HTTPException(
            status_code=400,
            detail="Invalid JSON format"
        )

    # 4. 檢查 JSON 結構
    if not isinstance(data, list):
        raise HTTPException(
            status_code=400,
            detail="Invalid JSON structure: root should be a list"
        )

    student_id = get_student_id_from_json(data)

    # 5. 呼叫 database/import.py，寫入資料庫
    database_import = load_import_module()
    session = database_import.SessionLocal()

    try:
        core_course_names, group_lookup = database_import.seed_static_data(session)

        database_import.import_data(
            data=data,
            session=session,
            core_course_names=core_course_names,
            group_lookup=group_lookup
        )

    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"File saved to data/exportStudentData.json, but database import failed: {str(e)}"
        )

    finally:
        session.close()

    # 6. 回傳結果
    return {
        "success": True,
        "message": "JSON saved to data/exportStudentData.json and imported successfully",
        "originalFilename": file.filename,
        "savedPath": "data/exportStudentData.json",
        "studentId": student_id
    }


@router.get("/upload-test")
def upload_test():
    return {
        "success": True,
        "message": "Upload router is working",
        "targetPath": "data/exportStudentData.json"
    }
