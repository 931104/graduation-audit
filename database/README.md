# Database

## 資料表總覽

```
students              學生基本資料
all_course            課程主檔（所有出現過的課）
course_record         學生修課紀錄
required_course       系所必修課程清單
cs_group              資科系群修課程清單
general_course        通識課程
general_category      通識領域字典（人文通、社會通、自然通）
general_course_category 通識課程 ↔ 領域（多對多）
graduation_rule       畢業門檻規則（預留）

general_course_view   [View] 通識課程含跨領域判斷
```

---

## 資料表說明

### `students` — 學生基本資料

| 欄位 | 型別 | 說明 |
|------|------|------|
| `student_id` | varchar(10) PK | 學號 |
| `chinese_name` | varchar(50) | 中文姓名 |
| `english_name` | varchar(50) | 英文姓名 |
| `department` | varchar(50) | 主修系所 |
| `double_major` | varchar(50) | 雙主修（無則 NULL） |
| `minor` | varchar(50) | 輔系（無則 NULL） |
| `enrollment_year` | integer | 入學學年度（對應畢業門檻版本） |
| `english_exemption` | boolean | 是否申請大學英文免修 |

---

### `all_course` — 課程主檔

所有出現過的課程，無論必修、選修、通識皆在此。其他課程資料表（`required_course`、`cs_group`、`general_course`）以 `course_code` 參考此表。

| 欄位 | 型別 | 說明 |
|------|------|------|
| `course_code` | varchar(20) PK | 課號（ex: `703016001`） |
| `course_name` | varchar(100) | 課程名稱 |
| `credit` | numeric(3,1) | 學分數 |
| `dept` | varchar(20) | 開課單位（目前 JSON 無此欄，預留） |

---

### `course_record` — 學生修課紀錄

記錄每位學生每學期每門課的修課結果，是審核邏輯的主要資料來源。

| 欄位 | 型別 | 說明 |
|------|------|------|
| `id` | serial PK | 系統流水號 |
| `student_id` | varchar(10) FK | 參考 `students` |
| `course_code` | varchar(20) FK | 參考 `all_course` |
| `academic_year` | varchar(5) | 修課學年（ex: `112`） |
| `academic_semester` | varchar(5) | 修課學期（ex: `1`、`2`） |
| `score` | numeric(5,2) | 數字成績；停修或未到則 NULL |
| `course_status` | varchar(30) | `通過` / `停修` / `成績未到或無成績` / 空字串（有數字成績） |
| `is_general` | boolean | 是否為通識課（依 `remark` 欄位判斷） |
| `is_defense` | boolean | 是否為國防課程 |

唯一鍵：`(student_id, course_code, academic_year, academic_semester)`

---

### `required_course` — 必修課程清單

從 `logic/app/data/required.json` 匯入，記錄特定系所、特定入學年度的必修課程。

| 欄位 | 型別 | 說明 |
|------|------|------|
| `required_uid` | serial PK | 系統流水號 |
| `course_code` | varchar(20) FK | 參考 `all_course` |
| `course_name` | varchar(100) | 課程名稱 |
| `take_in_dept` | varchar(20) | 適用系所 |
| `take_in_year` | varchar(20) | 適用入學年度 |

---

### `cs_group` — 資科系群修課程

從 `logic/app/data/group.json` 匯入，依群別（群A、群B…）分類。

| 欄位 | 型別 | 說明 |
|------|------|------|
| `group_uid` | serial PK | 系統流水號 |
| `course_code` | varchar(20) unique FK | 參考 `all_course` |
| `course_name` | varchar(100) | 課程名稱 |
| `course_class` | varchar(20) | 群別（ex: `群A`、`群B`） |
| `take_in_year` | varchar(20) | 適用入學年度 |

---

### `general_course` — 通識課程

從學生修課紀錄的 `remark` 欄位（人文通、社會通、自然通）識別後寫入。

| 欄位 | 型別 | 說明 |
|------|------|------|
| `course_code` | varchar(20) PK FK | 參考 `all_course` |
| `course_name` | varchar(50) | 課程名稱 |
| `is_core` | boolean | 是否為核心通識（對照 `core_general.json`） |

---

### `general_category` — 通識領域字典

| 欄位 | 型別 | 說明 |
|------|------|------|
| `category_code` | varchar(10) PK | 領域代碼（ex: `人文`） |
| `category_name` | varchar(20) | 領域名稱（ex: `人文通`） |

目前固定三筆：`人文`、`社會`、`自然`。「跨領域」不存為分類，由對應領域數 > 1 推算。

---

### `general_course_category` — 通識課程 ↔ 領域（多對多）

一門課可對應多個領域（跨領域通識）。

| 欄位 | 型別 | 說明 |
|------|------|------|
| `course_code` | varchar(20) FK | 參考 `general_course` |
| `category_code` | varchar(10) FK | 參考 `general_category` |

主鍵：`(course_code, category_code)`

---

### `graduation_rule` — 畢業門檻規則（預留）

目前審核邏輯以程式碼常數為準，此表預留供日後多系所、多年度規則擴充。

| 欄位 | 型別 | 說明 |
|------|------|------|
| `id` | serial PK | 系統流水號 |
| `department` | varchar(50) | 適用系所 |
| `applicable_year` | integer | 適用入學學年度 |
| `total_credit` | integer | 畢業總學分 |
| `required_credit` | integer | 必修學分門檻 |
| `group_credit` | integer | 群修學分門檻 |
| `general_credit` | integer | 通識學分門檻 |

---

### `general_course_view` — 通識課程 View

方便查詢用的 View，將跨領域狀態算好。

| 欄位 | 說明 |
|------|------|
| `course_code` | 課號 |
| `course_name` | 課程名稱 |
| `is_core` | 是否核心通識 |
| `category_count` | 對應領域數 |
| `is_interdisciplinary` | 是否跨領域（`category_count > 1`） |

---

## 資料表關聯圖

```
students ────────────── course_record ──────── all_course
                                                   │
                              ┌────────────────────┤
                              │                    │
                        required_course       cs_group
                              │
                        general_course ──── general_course_category ──── general_category
```

---

## 常用操作

### 啟動容器（首次或重置後）

```bash
# 從專案根目錄執行
sudo docker compose -f ./database/docker-compose.yml --env-file ./.env up -d
```

容器啟動時自動執行 `schema.sql` 建立所有資料表。

### 重置資料庫（清空重來）

```bash
sudo docker compose -f ./database/docker-compose.yml down -v
sudo docker compose -f ./database/docker-compose.yml --env-file ./.env up -d
```

### 匯入學生資料

```bash
# 從專案根目錄執行，自動掃描 data/ 下所有 exportStudentData*.json
python3 database/import.py

# 或指定單一檔案
python3 database/import.py data/exportStudentData_h.json
```

### 進入 psql 執行 SQL

```bash
docker exec -it my-postgres psql -U admin -d myapp
```

### 常用驗證 SQL

```sql
-- 所有資料表
\dt

-- 學生基本資料
SELECT student_id, chinese_name, enrollment_year, english_exemption FROM students;

-- 必修課程
SELECT rc.course_code, rc.course_name, ac.credit, rc.take_in_dept, rc.take_in_year
FROM required_course rc
JOIN all_course ac ON ac.course_code = rc.course_code;

-- 群修課程
SELECT course_class, course_code, course_name FROM cs_group ORDER BY course_class;

-- 通識課程（含跨領域判斷）
SELECT course_code, course_name, is_core, category_count, is_interdisciplinary
FROM general_course_view
ORDER BY is_interdisciplinary DESC, course_name;

-- 某學生的修課紀錄
SELECT cr.course_code, ac.course_name, ac.credit,
       cr.academic_year, cr.academic_semester,
       cr.score, cr.course_status, cr.is_general, cr.is_defense
FROM course_record cr
JOIN all_course ac ON ac.course_code = cr.course_code
WHERE cr.student_id = '112703046'
ORDER BY cr.academic_year, cr.academic_semester;

-- 離開
\q
```
