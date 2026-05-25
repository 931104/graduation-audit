// 啟動
docker compose up -d

// 進去下sql
docker exec -it my-postgres psql -U admin -d myapp

// sql檢查schema建立是否正確
-- 查看所有資料表
\dt

-- 檢查table的attribute
\d students
\d course_record
\d required_course

-- 離開
\q

// 若有修改schema
在專案根目錄執行
停止並刪除舊容器和 volume（清空資料）
sudo docker compose -f ./database/docker-compose.yml down -v

重新啟動（會用新 schema 初始化）
sudo docker compose -f ./database/docker-compose.yml up -d

// import
python3 database/import.py

// 檢查是否正確
-- ② 學生基本資料
SELECT student_id, chinese_name, english_name, enrollment_year, english_exemption
FROM students;

-- ③ 必修課程（確認 required.json 全部進來）
SELECT rc.course_code, rc.course_name, ac.credit, rc.take_in_dept, rc.take_in_year
FROM required_course rc
JOIN all_course ac ON ac.course_code = rc.course_code;

-- ④ 群修課程（確認每群都有課、course_code 正確對應）
SELECT course_class, course_code, course_name
FROM cs_group
ORDER BY course_class;

-- ⑤ 通識課程 + 跨領域（用 view 直接看）
SELECT course_code, course_name, is_core, category_count, is_interdisciplinary
FROM general_course_view
ORDER BY is_interdisciplinary DESC, course_name;

-- ⑥ 通識領域分佈（各領域幾門）
SELECT gc.category_name, COUNT(*) AS course_count
FROM general_course_category gcc
JOIN general_category gc ON gc.category_code = gcc.category_code
GROUP BY gc.category_name;

-- ⑦ 某個學生的修課紀錄（換 student_id 即可）
SELECT cr.course_code, ac.course_name, ac.credit,
       cr.academic_year, cr.academic_semester,
       cr.score, cr.course_status, cr.is_general, cr.is_defense
FROM course_record cr
JOIN all_course ac ON ac.course_code = cr.course_code
WHERE cr.student_id = '112703037'
ORDER BY cr.academic_year, cr.academic_semester;

-- ⑧ is_general 標記是否合理（看哪些課被標為通識）
SELECT DISTINCT ac.course_code, ac.course_name, cr.is_general
FROM course_record cr
JOIN all_course ac ON ac.course_code = cr.course_code
WHERE cr.is_general = true
ORDER BY ac.course_name;

