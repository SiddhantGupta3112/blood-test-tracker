from sqlalchemy.orm import Session
from app.schemas import ReportMetadata, ReportRow
from app.crud.report import create_report
from app.crud.test_results import add_test_data
from app.models import Report

def save_report(db: Session, raw_results: list[dict], report_metadata: ReportMetadata, user_id: int, file_path: str) -> Report:
    try:
        report = create_report(db, report_metadata, user_id, file_path)
    
        rows = [ReportRow(**row) for row in raw_results]
    
    
        add_test_data(db, rows, report.report_id)
        
        db.commit()
        db.refresh(report)
        
        return report
    except Exception:
        db.rollback()
        raise 