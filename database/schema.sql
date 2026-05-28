-- ---------- 學生 ----------
create table students (
    student_id      varchar(10) primary key,
    chinese_name    varchar(50) not null,
    english_name    varchar(50) not null,

    -- 系級
    department      varchar(50) not null,
    double_major    varchar(50),
    minor           varchar(50),

    -- 年度
    enrollment_year integer     not null,

    -- 英文抵免
    english_exemption boolean   not null
);


-- ---------- 全部課程（課程主檔） ----------
create table all_course (
    course_code varchar(20) primary key,
    course_name varchar(100) not null,
    credit      numeric(3,1) not null,

    -- 開課單位，json 中沒有
    dept        varchar(20)
);


-- ---------- 修課紀錄 ----------
-- 每個學生有一組（多筆）course_record
create table course_record (
    id                serial primary key,
    student_id        varchar(10) not null,
    course_code       varchar(20) not null,

    -- 修課時間
    academic_year     varchar(5)  not null,
    academic_semester varchar(5)  not null,

    -- 數字成績；停修或正在修為 NULL
    score             numeric(5,2),
    -- 通過、停修、被當、正在修
    course_status     varchar(30) not null,

    is_general        boolean     not null,
    is_defense        boolean     not null,

    unique (student_id, course_code, academic_year, academic_semester),

    foreign key (student_id)  references students(student_id),
    foreign key (course_code) references all_course(course_code)
);


-- ---------- 畢業門檻 ----------
create table graduation_rule (
    id              serial primary key, -- 系統內部唯一碼
    department      varchar(50) not null,
    applicable_year integer     not null, -- 畢業門檻參考年度

    total_credit    integer not null, -- 總學分
    required_credit integer not null, -- 必修學分
    group_credit    integer not null, -- 群修學分
    general_credit  integer not null  -- 通識學分
);


-- ---------- 必修課程 ----------
create table required_course (
    required_uid serial primary key,
    course_code  varchar(20)  not null,
    course_name  varchar(100) not null,

    take_in_dept varchar(20)  not null, -- 採用的科系
    take_in_year varchar(20)  not null, -- 採用的年份

    foreign key (course_code) references all_course(course_code)
);


-- ---------- 資科系群修課程 ----------
create table cs_group (
    group_uid    serial primary key,
    course_code  varchar(20)  not null unique,
    course_name  varchar(100) not null,

    course_class varchar(20)  not null, -- 群A、群B...
    take_in_year varchar(20)  not null, -- 採用年份

    foreign key (course_code) references all_course(course_code)
);


-- =========================================================
-- 通識（正規化後）
-- =========================================================
-- 「跨領域」不存成分類，而是用「對應領域數 > 1」推算。
-- =========================================================

-- ---------- 通識課程 ----------
create table general_course (
    course_code varchar(20) primary key,
    course_name varchar(50) not null,
    is_core     boolean     not null,

    foreign key (course_code) references all_course(course_code)
);


-- ---------- 通識領域字典（自然、社會、人文、資訊…） ----------
-- 注意：不要在這裡放「跨領域」，那是算出來的狀態，不是一個領域。
create table general_category (
    category_code varchar(10) primary key,
    category_name varchar(20) not null
);


-- ---------- 通識課程 ↔ 領域（多對多） ----------
create table general_course_category (
    course_code   varchar(20) not null,
    category_code varchar(10) not null,

    primary key (course_code, category_code),  -- 同一門課不會重複掛同一領域
    foreign key (course_code)   references general_course(course_code),
    foreign key (category_code) references general_category(category_code)
);


-- ---------- 方便查詢用的 view ----------
-- 直接把「跨領域」算好，之後可當成一張表使用。
create view general_course_view as
select
    gc.course_code,
    gc.course_name,
    gc.is_core,
    count(m.category_code)      as category_count,
    count(m.category_code) > 1  as is_interdisciplinary
from general_course gc
left join general_course_category m on m.course_code = gc.course_code
group by gc.course_code, gc.course_name, gc.is_core;


-- =========================================================
-- Indexes（審核 query 熱路徑）
-- =========================================================

-- course_record 是查詢熱點，每位學生審核都掃這張表
create index idx_course_record_student on course_record(student_id);

-- 通識查詢專用部分索引，比全表 student_id 索引更省
create index idx_course_record_student_general
    on course_record(student_id) where is_general;

-- required_course / cs_group：以 dept+year / year 過濾
create index idx_required_dept_year
    on required_course(take_in_dept, take_in_year);

create index idx_cs_group_year on cs_group(take_in_year);

-- 預留：未來支援多屆別、多系所
create index idx_students_enrollment_year on students(enrollment_year);
create index idx_graduation_rule_dept_year
    on graduation_rule(department, applicable_year);

