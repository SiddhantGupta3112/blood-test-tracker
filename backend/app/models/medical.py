from datetime import date, datetime
from typing import List, Optional
from sqlalchemy import (
    ForeignKey, String, Float, DateTime, Date, func,
    CheckConstraint, Boolean, Text
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base


class User(Base):
    __tablename__ = "users"

    user_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    phone_country_code: Mapped[Optional[str]] = mapped_column(String(5))
    phone_number: Mapped[Optional[str]] = mapped_column(String(15))
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    date_of_birth: Mapped[Optional[date]] = mapped_column(Date)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )

    reports: Mapped[List["Report"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class Report(Base):
    __tablename__ = "reports"

    report_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False
    )
    collection_date: Mapped[date] = mapped_column(Date, nullable=False)
    upload_date: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    lab_name: Mapped[Optional[str]] = mapped_column(String(100))
    file_name: Mapped[Optional[str]] = mapped_column(String(255))
    file_path: Mapped[Optional[str]] = mapped_column(String(500))
    status: Mapped[str] = mapped_column(
        String(20),
        CheckConstraint("status IN ('pending', 'verified', 'rejected')"),
        default="pending",
        nullable=False
    )

    user: Mapped["User"] = relationship(back_populates="reports")
    results: Mapped[List["TestResult"]] = relationship(
        back_populates="report", cascade="all, delete-orphan"
    )


class TestMetadata(Base):
    __tablename__ = "test_metadata"

    test_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    canonical_name: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    category: Mapped[Optional[str]] = mapped_column(String(50))
    default_unit: Mapped[Optional[str]] = mapped_column(String(20))
    description: Mapped[Optional[str]] = mapped_column(Text)

    results: Mapped[List["TestResult"]] = relationship(back_populates="test_meta")


class TestResult(Base):
    __tablename__ = "test_results"

    result_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    report_id: Mapped[int] = mapped_column(
        ForeignKey("reports.report_id", ondelete="CASCADE"), nullable=False
    )
    test_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("test_metadata.test_id"), nullable=True
    )

    raw_name: Mapped[str] = mapped_column(String(150), nullable=False)
    value: Mapped[Optional[float]] = mapped_column(Float)
    text_value: Mapped[Optional[str]] = mapped_column(String(50))
    unit: Mapped[Optional[str]] = mapped_column(String(20))
    lower_bound: Mapped[Optional[float]] = mapped_column(Float)
    upper_bound: Mapped[Optional[float]] = mapped_column(Float)
    is_abnormal: Mapped[Optional[bool]] = mapped_column(Boolean)

    report: Mapped["Report"] = relationship(back_populates="results")
    test_meta: Mapped[Optional["TestMetadata"]] = relationship(back_populates="results")