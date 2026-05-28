from __future__ import annotations

from decimal import Decimal
from typing import Optional

from sqlalchemy import (
    Boolean,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Student(Base):
    __tablename__ = "students"

    student_id: Mapped[str] = mapped_column(String(10), primary_key=True)
    chinese_name: Mapped[str] = mapped_column(String(50), nullable=False)
    english_name: Mapped[str] = mapped_column(String(50), nullable=False)
    department: Mapped[str] = mapped_column(String(50), nullable=False)
    double_major: Mapped[Optional[str]] = mapped_column(String(50))
    minor: Mapped[Optional[str]] = mapped_column(String(50))
    enrollment_year: Mapped[int] = mapped_column(Integer, nullable=False)
    english_exemption: Mapped[bool] = mapped_column(Boolean, nullable=False)

    course_records: Mapped[list["CourseRecord"]] = relationship(
        back_populates="student", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("idx_students_enrollment_year", "enrollment_year"),
    )


class AllCourse(Base):
    __tablename__ = "all_course"

    course_code: Mapped[str] = mapped_column(String(20), primary_key=True)
    course_name: Mapped[str] = mapped_column(String(100), nullable=False)
    credit: Mapped[Decimal] = mapped_column(Numeric(3, 1), nullable=False)
    dept: Mapped[Optional[str]] = mapped_column(String(20))


class CourseRecord(Base):
    __tablename__ = "course_record"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    student_id: Mapped[str] = mapped_column(
        String(10), ForeignKey("students.student_id"), nullable=False
    )
    course_code: Mapped[str] = mapped_column(
        String(20), ForeignKey("all_course.course_code"), nullable=False
    )
    academic_year: Mapped[str] = mapped_column(String(5), nullable=False)
    academic_semester: Mapped[str] = mapped_column(String(5), nullable=False)
    score: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2))
    course_status: Mapped[str] = mapped_column(String(30), nullable=False)
    is_general: Mapped[bool] = mapped_column(Boolean, nullable=False)
    is_defense: Mapped[bool] = mapped_column(Boolean, nullable=False)

    student: Mapped["Student"] = relationship(back_populates="course_records")
    course: Mapped["AllCourse"] = relationship()

    __table_args__ = (
        UniqueConstraint(
            "student_id",
            "course_code",
            "academic_year",
            "academic_semester",
            name="uq_course_record_student_course_semester",
        ),
        Index("idx_course_record_student", "student_id"),
        Index(
            "idx_course_record_student_general",
            "student_id",
            postgresql_where=("is_general"),
        ),
    )


class GraduationRule(Base):
    __tablename__ = "graduation_rule"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    department: Mapped[str] = mapped_column(String(50), nullable=False)
    applicable_year: Mapped[int] = mapped_column(Integer, nullable=False)
    total_credit: Mapped[int] = mapped_column(Integer, nullable=False)
    required_credit: Mapped[int] = mapped_column(Integer, nullable=False)
    group_credit: Mapped[int] = mapped_column(Integer, nullable=False)
    general_credit: Mapped[int] = mapped_column(Integer, nullable=False)

    __table_args__ = (
        Index("idx_graduation_rule_dept_year", "department", "applicable_year"),
    )


class RequiredCourse(Base):
    __tablename__ = "required_course"

    required_uid: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    course_code: Mapped[str] = mapped_column(
        String(20), ForeignKey("all_course.course_code"), nullable=False
    )
    course_name: Mapped[str] = mapped_column(String(100), nullable=False)
    take_in_dept: Mapped[str] = mapped_column(String(20), nullable=False)
    take_in_year: Mapped[str] = mapped_column(String(20), nullable=False)

    course: Mapped["AllCourse"] = relationship()

    __table_args__ = (
        Index("idx_required_dept_year", "take_in_dept", "take_in_year"),
    )


class CsGroup(Base):
    __tablename__ = "cs_group"

    group_uid: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    course_code: Mapped[str] = mapped_column(
        String(20), ForeignKey("all_course.course_code"), unique=True, nullable=False
    )
    course_name: Mapped[str] = mapped_column(String(100), nullable=False)
    course_class: Mapped[str] = mapped_column(String(20), nullable=False)
    take_in_year: Mapped[str] = mapped_column(String(20), nullable=False)

    course: Mapped["AllCourse"] = relationship()

    __table_args__ = (
        Index("idx_cs_group_year", "take_in_year"),
    )


class GeneralCourse(Base):
    __tablename__ = "general_course"

    course_code: Mapped[str] = mapped_column(
        String(20), ForeignKey("all_course.course_code"), primary_key=True
    )
    course_name: Mapped[str] = mapped_column(String(50), nullable=False)
    is_core: Mapped[bool] = mapped_column(Boolean, nullable=False)

    course: Mapped["AllCourse"] = relationship()
    categories: Mapped[list["GeneralCategory"]] = relationship(
        secondary="general_course_category",
        back_populates="courses",
    )


class GeneralCategory(Base):
    __tablename__ = "general_category"

    category_code: Mapped[str] = mapped_column(String(10), primary_key=True)
    category_name: Mapped[str] = mapped_column(String(20), nullable=False)

    courses: Mapped[list["GeneralCourse"]] = relationship(
        secondary="general_course_category",
        back_populates="categories",
    )


class GeneralCourseCategory(Base):
    __tablename__ = "general_course_category"

    course_code: Mapped[str] = mapped_column(
        String(20), ForeignKey("general_course.course_code"), primary_key=True
    )
    category_code: Mapped[str] = mapped_column(
        String(10), ForeignKey("general_category.category_code"), primary_key=True
    )
