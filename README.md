# graduate-detector
這個專案是要進行畢業學分的檢核，利用database存每個學生的修課紀錄
並提供一個網頁，學生輸入自己的基本資料(名字/ID)
# Graduation Audit System

以資訊科學系 112 學年入學畢業門檻為基準，分析學生必修、通識、體育、群修等各類別差幾學分畢業。資料來源為全人系統匯出的 JSON，排除雙主修、輔系，只審查原系畢業資格。

---

## 技術棧

| 層級 | 技術 |
|------|------|
| 後端 | Python |
| ORM | SQLAlchemy |
| 資料庫 | PostgreSQL |
| 容器化 | Docker |
| 壓測 | k6 |

---

## 資料來源

全人系統匯出 JSON（`exportStudentData.json`）

---

## 資料庫 Schema

### 1. `students` — 學生基本資料

| 欄位 | 型別 | 說明 |
|------|------|------|
| id | UUID / Integer (PK) | 系統內部唯一碼 |
| student_number | VARCHAR (Unique) | 學號 |
| chinese_name | VARCHAR | 中文姓名 |
| register_major | VARCHAR | 主修系所 |
| double_major | VARCHAR | 雙主修系所 |
| minor | VARCHAR | 輔系 |
| enrollment_year | Integer | 入學學年度（對應畢業門檻版本）|

### 2. `academic_records` — 學期總結

| 欄位 | 型別 | 說明 |
|------|------|------|
| id | UUID / Integer (PK) | 系統內部唯一碼 |
| student_id | FK → students | 關聯學生 |
| academic_year | Integer | 學年度（ex: 112）|
| semester | Integer | 學期（1 或 2）|
| average_score | Numeric(5,2) | 學期平均 |
| total_credits | Integer | 實拿總學分 |
| class_rank | VARCHAR | 班排 |

### 3. `course_records` — 歷年修課紀錄

| 欄位 | 型別 | 說明 |
|------|------|------|
| id | UUID / Integer (PK) | 系統內部唯一碼 |
| academic_record_id | FK → academic_records | 關聯學期 |
| course_code | VARCHAR | 課號（ex: 703016001）|
| course_name | VARCHAR | 課程名稱 |
| credit | Numeric(3,1) | 學分數 |
| score | VARCHAR | 成績（字串以相容「成績未到」）|
| course_type | VARCHAR | 必修 / 選修 / 群修 |
| remark | VARCHAR | 備註（ex: 資訊通、校際選課）|

### 4. `graduation_rules` — 系所畢業門檻規則

| 欄位 | 型別 | 說明 |
|------|------|------|
| id | UUID / Integer (PK) | 系統內部唯一碼 |
| department | VARCHAR | 適用系所 |
| applicable_year | Integer | 適用入學學年度 |
| total_required | Numeric(4,1) | 畢業總學分門檻 |
| required_point | Numeric(4,1) | 必修學分門檻 |
| group_point | Numeric(4,1) | 群修學分門檻 |
| rule_details | JSONB | 特殊規定（擋修條件、特定通識要求等）|

> 注意：`rule_details` 排除「資訊通識」計入群修的情況。

---

## 畢業審查邏輯

依下列類別分別計算已修與差缺學分：

- **必修**
- **通識**
- **體育**
- **群修**

審查條件：
- 只看 `register_major`，排除雙主修與輔系課程
- 以 `enrollment_year` 對應正確版本的 `graduation_rules`

---

## 未來擴充

- 若某類別學分不足，自動推薦可修課程清單
