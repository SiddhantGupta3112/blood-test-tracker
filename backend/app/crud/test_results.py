from app.models import Report, TestResult, TestMetadata
from app.schemas import ReportRow
from sqlalchemy.orm import Session, joinedload
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
        test_name_clean = row_dict["test_name"].strip()
        
        meta_item = db.query(TestMetadata).filter(
            TestMetadata.canonical_name == test_name_clean
        ).first()
        
  
        if not meta_item:
            meta_item = TestMetadata(
                canonical_name=test_name_clean,
                default_unit=row_dict.get("unit"),  
                category=None,
                description=None
            )
            db.add(meta_item)
            db.flush() 
            
        row_dict["is_abnormal"] = is_abnormal(
            row_dict["value"], 
            row_dict["lower_bound"],
            row_dict["upper_bound"],
        )
        
        row_dict["report_id"] = report_id
        row_dict["test_id"] = meta_item.test_id
        row_dict["text_value"] = str(row_dict["value"])
        
        db_item = TestResult(**row_dict)
        db_tests.append(db_item)
        
    db.add_all(db_tests)
    db.flush()
    
def delete_results_for_report(db: Session, report_id: int, user_id: int) -> bool:
    check_report_id = db.query(Report.report_id).filter(Report.report_id == report_id, Report.user_id == user_id).first()
    
    if not check_report_id:
        return False
    
    db.query(TestResult).filter(TestResult.report_id == report_id).delete(synchronize_session=False)
    db.flush()
    
    return True


def fetch_results_for_report(db: Session, report_id: int, user_id: int) -> list[TestResult] | None:
    results = (
    db.query(TestResult)
    .options(joinedload(TestResult.report))
    .join(Report, Report.report_id == TestResult.report_id)
    .filter(TestResult.report_id == report_id, Report.user_id == user_id)
    .all()
    )
    return results if results else None

def get_biomarker_history(db: Session, user_id: int, biomarker_name: str) -> List[TestResult] | None:
    results = (
        db.query(TestResult)
        .options(joinedload(TestResult.report))
        .join(Report, Report.report_id == TestResult.report_id)
        .filter(Report.user_id == user_id, TestResult.test_name == biomarker_name, Report.status == "verified")
        .order_by(Report.collection_date.asc())
        .all()
    )
    return results if results else None
  
  
def get_test_names(db: Session, user_id: int) -> List[str] | None:
    results = (
        db.query(TestResult.test_name).distinct()
        .join(Report, Report.report_id == TestResult.report_id)
        .filter(Report.user_id == user_id, Report.status == 'verified')
        .all()
    )
    return [r[0] for r in results] if results else None

def get_test_metadata(db: Session) -> List[str] | None:
    results = db.query(TestMetadata.canonical_name).all()
    return [row[0] for row in results] if results else None
