# Graduation Audit System

以資訊科學系 112 學年入學畢業門檻為基準，分析學生必修、群修、通識、體育、自由選修各類別差幾學分畢業。
資料來源為全人系統匯出的 JSON，僅審查原系畢業資格（排除雙主修、輔系）。

---

## 專案結構

```
graduation-audit/
├── data/                        # 全人系統匯出的學生 JSON 資料
│   └── exportStudentData*.json
├── database/
│   ├── docker-compose.yml       # PostgreSQL 容器設定
│   ├── schema.sql               # 資料庫建表 DDL（容器啟動時自動執行）
│   └── import.py                # 將學生 JSON 匯入資料庫
└── logic/
    ├── requirements.txt
    ├── run.py                   # 主程式入口
    ├── .env                     # 資料庫連線設定
    └── app/
        ├── config.py            # 連線池設定（讀取 .env）
        ├── data/                # 靜態課程規則 JSON
        │   ├── required.json    # 必修課程清單
        │   ├── group.json       # 群修課程清單
        │   └── core_general.json# 核心通識課程清單
        └── audit/               # 各類別審核邏輯
            ├── cs_rules/        # 必修 & 群修
            └── general_rules/   # 通識、體育、自由選修
```

---

## 環境需求

- Python 3.12+
- Docker & Docker Compose
- （建議）virtualenv / venv

---

## 從零開始的完整步驟

### 第 1 步：Clone 專案

```bash
git clone <repo-url>
cd graduation-audit
```

---

### 第 2 步：建立 Python 虛擬環境並安裝套件

在**專案根目錄**執行：

```bash
python3 -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate

pip install -r logic/requirements.txt
```

---

### 第 3 步：啟動 PostgreSQL 容器

```bash
sudo docker compose -f ./database/docker-compose.yml --env-file ./.env up -d
```

容器啟動時會自動執行 `database/schema.sql`，建立所有資料表。

**確認容器正常運行：**

```bash
sudo docker ps
```

應可看到 `my-postgres` 容器處於 `Up` 狀態。

**（選用）進入資料庫確認 schema 建立正確：**

```bash
docker exec -it my-postgres psql -U admin -d myapp
```

```sql
\dt          -- 列出所有資料表
\d students  -- 查看 students 欄位
\q           -- 離開
```

---

### 第 4 步：準備學生資料

將全人系統匯出的 JSON 檔案放到 `data/` 目錄，檔名需符合 `exportStudentData*.json` 格式：
建立根目錄下的data資料夾
```
data/
├── exportStudentData.json
├── exportStudentData_h.json
└── exportStudentData_j.json
```

---

### 第 5 步：匯入資料庫

在**專案根目錄**執行：

```bash
python3 database/import.py
```

此腳本會：
1. 從 `logic/app/data/` 讀取靜態課程規則（必修、群修、通識），寫入 `required_course`、`cs_group` 等資料表
2. 掃描 `data/` 目錄下所有 `exportStudentData*.json`，匯入學生資料與修課紀錄

**（選用）匯入後驗證：**

```bash
docker exec -it my-postgres psql -U admin -d myapp
```

```sql
-- 確認學生資料
SELECT student_id, chinese_name, enrollment_year FROM students;

-- 確認必修課程
SELECT course_code, course_name FROM required_course;

-- 確認某學生修課紀錄
SELECT cr.course_code, ac.course_name, cr.score, cr.course_status
FROM course_record cr
JOIN all_course ac ON ac.course_code = cr.course_code
WHERE cr.student_id = '112703046';
```

---

### 第 6 步：執行畢業審核

在 `logic/` 目錄下執行：

```bash
cd logic
python3 run.py
```

> 若要審核不同學生，修改 `logic/run.py` 第 117 行的 `student_id`。

**輸出範例：**

```
════════════════════════════════════════════════════
  專業必修
════════════════════════════════════════════════════
  狀態        : ✓ 已完成
  已通過      : 18 門

════════════════════════════════════════════════════
  畢業審核總結
════════════════════════════════════════════════════
  分類        已獲       需求   狀態
  ──────────────────────────────────────────────────
  專業必修     36.0  /   36.0   ✓
  專業群修     15.0  /   15.0   ✓
  通識         28.0  /   28.0   ✓
  體育          4.0  /    4.0   ✓
  自由選修     45.0  /   45.0   ✓
  ──────────────────────────────────────────────────
  總計        128.0  /  128.0   ✓

  ✓ 符合畢業資格
```

---

## 常見操作

### 重置資料庫（清空所有資料重來）

```bash
# 停止並刪除容器與 volume
sudo docker compose -f ./database/docker-compose.yml down -v

# 重新啟動（會用 schema.sql 重新初始化）
sudo docker compose -f ./database/docker-compose.yml --env-file ./.env up -d

# 重新匯入資料
python3 database/import.py
```

### 重新匯入單一 JSON 檔案

```bash
python3 database/import.py data/exportStudentData_h.json
```

---

## 資料庫連線設定

所有連線參數統一定義在**根目錄 `.env`**，其他檔案皆從這裡讀取，只需改一個地方：

```
# .env（根目錄）
DB_HOST=localhost
DB_PORT=5433
DB_NAME=myapp
DB_USER=admin
DB_PASSWORD=123456
```

各檔案的讀取方式：

| 檔案 | 讀取方式 |
|------|---------|
| `database/docker-compose.yml` | Docker Compose 自動讀取執行目錄的 `.env`，以 `${DB_*}` 代入 |
| `database/import.py` | python-dotenv，路徑由 `__file__` 計算至根目錄 |
| `logic/app/config.py` | python-dotenv，路徑由 `__file__` 計算至根目錄 |

> **port 說明**：`docker-compose.yml` 的 `${DB_PORT}:5432` 是 `host:container`。
> 容器內部監聽 `5432`，外部連線（import.py / config.py）使用 `DB_PORT=5433`。
> 若本機已有 PostgreSQL 佔用 5432，此設定可避免衝突。

---

## 技術棧

| 層級 | 技術 |
|------|------|
| 審核邏輯 | Python 3.12 |
| 資料庫 | PostgreSQL 16 |
| 容器化 | Docker Compose |
| Python 套件 | psycopg2-binary、python-dotenv |
