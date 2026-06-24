from fastapi import (APIRouter, HTTPException, 
                     status, Depends, File, 
                     UploadFile)
import shutil
from app.models import User
from app.api.deps import get_db, get_current_user
from sqlalchemy.orm import Session
from app.core.config import settings
import uuid
from app.schemas import Report as ReportSchema, Validation, ReportSummary, ReportRow, StandaloneTestRequest
from app.services.database_service import save_report
from app.services.parse_pdf import get_report_data
from app.services.get_metadata import get_metadata
from app.crud.report import fetch_report, fetch_all_reports, delete_report, create_standalone_test
from app.crud.test_results import add_test_data, delete_results_for_report
from pathlib import Path
from app.limiter.dependency import get_user_key, RateLimiter

router = APIRouter(prefix="/pdf", tags=["pdf"])

@router.post("/upload", response_model=ReportSchema, status_code=status.HTTP_201_CREATED, dependencies=[Depends(RateLimiter(10, 60, get_user_key))])
def upload_pdf(
    file: UploadFile = File(...), 
    user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is missing a valid filename."
        )
        
    file_extension = Path(file.filename).suffix.lower()

    if file_extension not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File extension '{file_extension}' not allowed. Supported: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )
        
    unique_name = f"{uuid.uuid4()}_{file.filename}"
    file_path = settings.UPLOAD_DIR / unique_name
         
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        data = get_report_data(file_path)
        report_metadata = get_metadata(file_path, file.filename)
        report = save_report(db, data, report_metadata, user.user_id, str(file_path))
        return ReportSchema(
            report_id=report.report_id,
            report_metadata=report_metadata,
            report_data=[ReportRow(**row) for row in data]
        )
    except Exception:
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error Processing pdf"
        )
        
@router.post("/validate/{report_id}", status_code=status.HTTP_200_OK)
def validate_report(report_id: int, 
                    response: Validation, 
                    db: Session = Depends(get_db), 
                    user: User = Depends(get_current_user)
):
    
    report = fetch_report(db, user.user_id, report_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
        
     
    try:
        report_data = response.report_metadata.model_dump(exclude_unset=True)
        for key, value in report_data.items():
            setattr(report, key, value)
        
        report.status = "verified"
        
        delete_results_for_report(db, report.report_id, user.user_id)
        add_test_data(db, response.report_data, report.report_id)
        
        db.commit()
        db.refresh(report)
        
        return {"message": f"Report {report_id} verified successfully"}

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Report {report_id} verification failed"
    )
        
@router.post("/standalone", status_code=status.HTTP_201_CREATED)
def standalone_test(data: StandaloneTestRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        report = create_standalone_test(db, user.user_id, data)
        db.commit()
        db.refresh(report)
        
        return {"message": f"Report {report.report_id} verified successfully"}
    
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Test verification failed"
    )
        
@router.get("/reports", response_model=list[ReportSummary], status_code=status.HTTP_200_OK)
def get_all_reports(user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    reports = fetch_all_reports(db, user.user_id)
    
    summary = []
    for report, number_of_test in reports:
        report_summary = ReportSummary(
            report_id=report.report_id,
            collection_date=report.collection_date,
            age = (report.collection_date - user.date_of_birth).days // 365 if user.date_of_birth else None,
            number_of_test=number_of_test,
            file_name=report.file_name,
            lab_name=report.lab_name
        )
        
        summary.append(report_summary)
        
        
    return summary


@router.delete("/reports/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete(report_id: int, 
           user : User = Depends(get_current_user), 
           db: Session = Depends(get_db)
):
    report = fetch_report(db, user.user_id, report_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
        
    file_path = report.file_path
    
    delete_report(db, user.user_id, report_id)
    db.commit()
    if file_path and Path(file_path).exists():
        Path(file_path).unlink()
                
                
@router.patch("/reports/{report_id}", status_code=status.HTTP_200_OK)
def update_status(report_id: int, 
           user : User = Depends(get_current_user), 
           db: Session = Depends(get_db)
):
    report = fetch_report(db, user.user_id, report_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
      
    if report.status != "unverified":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only unverified reports can be marked as pending"
        )
          
    report.status = "pending"
    db.commit()
    db.refresh(report)
    
    return {"message": f"Report {report_id} status updated to pending successfully"}