from app.models import Report
from app.schemas import Report as ReportMetadata
from sqlalchemy.orm import Session
from typing import List

def create_report(db: Session, report: ReportMetadata, user_id: int) -> Report:
    report_dict = report.model_dump()
    report_dict["user_id"] = user_id
    report_dict["status"] = "unverified"

    db_report = Report(**report_dict)
    
    
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    
    return db_report

def fetch_report(db: Session, user_id: int, report_id: int) -> Report | None:
    report = db.query(Report).filter(Report.report_id == report_id, Report.user_id == user_id).first()
        
    return report

def fetch_all_reports(db: Session, user_id: int) -> List[Report]:
    reports = db.query(Report).filter( Report.user_id == user_id).all()

    return reports

def delete_report(db: Session, user_id: int, report_id: int) -> bool:
    report = fetch_report(db, user_id, report_id)
    
    if not report:
        return False
    
    db.delete(report)
    db.commit()
    
    return True

        
    