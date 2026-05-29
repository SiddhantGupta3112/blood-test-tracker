from fastapi import (APIRouter, HTTPException, 
                     status, Depends )
from app.models import User
from app.api.deps import get_db, get_current_user
from sqlalchemy.orm import Session
from app.schemas import Report, ReportMetadata, ReportRow, TestResultResponse, BiomarkerHistory
from app.crud.report import fetch_report
from app.crud.test_results import  get_test_names, get_biomarker_history, fetch_results_for_report


router = APIRouter(prefix="/plots", tags=["plots"])

@router.get("/tests", response_model=list[str], status_code=status.HTTP_200_OK)
def get_unique_tests(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    test_names = get_test_names(db, user.user_id)
    
    if not test_names:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No tests found"
        )
        
    return test_names

@router.get("/history/{test_name}", response_model=BiomarkerHistory, status_code=status.HTTP_200_OK)
def get_test_history(test_name: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    tests = get_biomarker_history(db, user.user_id, test_name)
    
    if not tests:
        raise  HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No data found"
        )
        
    test_values = []
    
    for test in tests:
        result = TestResultResponse(
            value=test.value,
            unit=test.unit,
            lower_bound=test.lower_bound,
            upper_bound=test.upper_bound,
            is_abnormal=test.is_abnormal,
            collection_date=test.report.collection_date,
            lab_name=test.report.lab_name,
            age=(test.report.collection_date - user.date_of_birth).days // 365 if user.date_of_birth else None
        )
        test_values.append(result)
        
        
    result = BiomarkerHistory(
        test_name=test_name,
        results=test_values
    )
    
    return result

@router.get("/report/{report_id}", response_model=Report, status_code=status.HTTP_200_OK)
def get_results_for_report(report_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    data = fetch_results_for_report(db, report_id, user.user_id)
    if not data:
        raise  HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
        
    metadata = fetch_report(db, user.user_id, report_id)
    if not metadata:
        raise  HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    result = Report(
        report_id=report_id,
        report_metadata=ReportMetadata.model_validate(metadata),
        report_data=[ReportRow.model_validate(row) for row in data]
    )
    
    return result