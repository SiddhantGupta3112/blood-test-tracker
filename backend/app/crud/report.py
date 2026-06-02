from app.models import Report, TestResult, TestMetadata
from app.schemas import ReportMetadata, StandaloneTestRequest
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

def create_standalone_test(db: Session, user_id: int, data: StandaloneTestRequest) -> Report:
    data_dict = data.model_dump()
    
    metadata_keys = {"file_name", "collection_date", "lab_name"}

    report_dict = {k: data_dict[k] for k in metadata_keys if k in data_dict}

    result_dict = {k: v for k, v in data_dict.items() if k not in metadata_keys} 
    report_dict["user_id"] = user_id
    report_dict["status"] = "verified"
    
    report = Report(**report_dict)
    
    meta_item = db.query(TestMetadata).filter(
            TestMetadata.canonical_name == data_dict["test_name"]
        ).first()
        
  
    if not meta_item:
        meta_item = TestMetadata(
            canonical_name=data_dict["test_name"],
            default_unit=data_dict.get("unit"),  
            category=None,
            description=None
        )
        db.add(meta_item)
        db.flush()
    
    db.add(report)
    db.flush()
    db.refresh(report)

    result_dict["report_id"] = report.report_id
    result_dict["is_abnormal"] = is_abnormal(
            data_dict["value"], 
            data_dict["lower_bound"],
            data_dict["upper_bound"],
        )
    result_dict["text_value"] = str(result_dict["value"])
    result_dict["test_id"] = meta_item.test_id

    result = TestResult(**result_dict)
    db.add(result)
    
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

        
    