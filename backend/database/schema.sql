create table students (
    student_id varchar(10) primary key,
    student_name varchar(20) not null,
    department  varchar(20) not null,
    double_major varchar(20),
    minor varchar(20),
    enrollment_year integer not null -- 入學年度
);

create table course (
    course_name varchar(20) not null,
    course_code varchar(20) primary key,
    credit numeric(3,1) not null,
    remark varchar(20) -- 必修/選修/通識
);

create table course_record (
    id serial primary key,
    student_id varchar(10) not null,
    course_code varchar(20) not null,
    score numeric(5,2) , -- 會有"停修", 所以可以null
    course_status varchar(20), -- 放停修等狀態
    foreign key (student_id) references students(student_id),
    foreign key (course_code) references course(course_code)
);

create table graduation_rule (
    id serial primary key, -- 系統內部唯一碼
    department varchar(20) not null,
    applicable_year integer not null, --畢業門檻參考年度
    total_credit integer not null, -- 總學分
    required_credit integer not null, -- 必修學分
    group_credit integer not null -- 群修學分
);
