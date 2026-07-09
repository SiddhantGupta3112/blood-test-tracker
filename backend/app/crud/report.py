from app.models import Report, TestResult, TestMetadata
from app.schemas import ReportMetadata, StandaloneEntryRequest
from sqlalchemy.orm import Session
from sqlalchemy import func, Row
from typing import List
from .test_results import is_abnormal

def create_report(db: Session, report: ReportMetadata, user_id: int, file_path: str) -> Report:
    report_dict = report.model_dump()
    report_dict["user_id"] = user_id
    report_dict["status"] = "unverified"
    report_dict["file_path"] = file_path

    db_report = Report(**report_dict)
    
    
    db.add(db_report)
    db.flush()
    
    
    return db_report

def create_standalone_test(
    db: Session,
    user_id: int,
    data: StandaloneEntryRequest,
) -> Report:

    # Create report
    report = Report(
        user_id=user_id,
        file_name=data.file_name,
        collection_date=data.collection_date,
        lab_name=data.lab_name,
        status="verified",
    )

    db.add(report)
    db.flush()  # report_id becomes available

    for biomarker in data.biomarkers:
        biomarker_data = biomarker.model_dump()

        meta_item = (
            db.query(TestMetadata)
            .filter(TestMetadata.canonical_name == biomarker.test_name)
            .first()
        )

        if not meta_item:
            meta_item = TestMetadata(
                canonical_name=biomarker.test_name,
                default_unit=biomarker.unit,
            )
            db.add(meta_item)
            db.flush()

        biomarker_data["report_id"] = report.report_id
        biomarker_data["test_id"] = meta_item.test_id
        biomarker_data["text_value"] = str(biomarker.value)
        biomarker_data["is_abnormal"] = is_abnormal(
            biomarker.value,
            biomarker.lower_bound,
            biomarker.upper_bound,
        )

        db.add(TestResult(**biomarker_data))
    return report

def fetch_report(db: Session, user_id: int, report_id: int) -> Report | None:
    report = db.query(Report).filter(Report.report_id == report_id, Report.user_id == user_id).first()
        
    return report

def fetch_all_reports(db: Session, user_id: int) -> List[Row[tuple[Report, int]]]:
    results = (
    db.query(Report, func.count(TestResult.result_id).label("test_count"))
    .outerjoin(TestResult, Report.report_id == TestResult.report_id)
    .filter(Report.user_id == user_id)
    .group_by(Report.report_id)
    .all()
    )
    return results

def delete_report(db: Session, user_id: int, report_id: int) -> bool:
    report = fetch_report(db, user_id, report_id)
    
    if not report:
        return False
    
    db.delete(report)
    db.flush()
    
    return True

        
    