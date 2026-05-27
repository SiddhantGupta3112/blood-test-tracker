from app.models import Report, TestResult
from app.schemas import ReportRow
from sqlalchemy.orm import Session
from typing import List

def is_abnormal(value: float, lower_bound: float | None, upper_bound: float | None) -> bool | None:
    if lower_bound is None and upper_bound is None:
        return None

    if upper_bound is not None and value > upper_bound:
        return True

    if lower_bound is not None and value < lower_bound:
        return True

    return False

def add_test_data(db: Session, data: List[ReportRow], report_id: int):
    db_tests = []
    
    for ele in data:
        row_dict = ele.model_dump()
        
        row_dict["is_abnormal"] = is_abnormal(
            row_dict["value"], 
            row_dict["lower_bound"],
            row_dict["upper_bound"],
        )
        
        row_dict["report_id"] = report_id
        
        db_item = TestResult(**row_dict)
        db_tests.append(db_item)
        
    db.add_all(db_tests)
    db.commit()
    
def delete_results_for_report(db: Session, report_id: int, user_id: int) -> bool:
    check_report_id = db.query(Report.report_id).filter(Report.report_id == report_id, Report.user_id == user_id).first()
    
    if not check_report_id:
        return False
    
    db.query(TestResult).filter(TestResult.report_id == report_id).delete(synchronize_session=False)
    db.commit()
    
    return True