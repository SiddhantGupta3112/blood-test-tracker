from pydantic import AfterValidator, BaseModel
from typing import Optional, Annotated, List
from datetime import date, datetime, timezone

def check_date(value: date) -> date:
    if value > date.today():
        raise ValueError("Date in the future")
    return value

class ReportRow(BaseModel):
    test_name: str
    value: float
    unit: Optional[str]
    lower_bound: Optional[float]
    upper_bound: Optional[float]
    
    model_config = {"from_attributes": True}
    
class TestResultResponse(BaseModel):
    value: float
    unit: Optional[str]
    lower_bound: Optional[float]
    upper_bound: Optional[float]
    is_abnormal: Optional[bool] = None
    collection_date: date
    age: Optional[int]
    lab_name: Optional[str]
    
    model_config = {"from_attributes": True}
    
class BiomarkerHistory(BaseModel):
    test_name: str
    results: list[TestResultResponse]
    
class ReportMetadata(BaseModel):
    collection_date: Annotated[date, AfterValidator(check_date)]
    lab_name: Optional[str]
    file_name: Optional[str]
    
    model_config = {"from_attributes": True}
    
class ReportPayload(BaseModel):
    report_id: int
    report_metadata: ReportMetadata
    report_data: List[ReportRow]

class Report(ReportPayload):
    pass

class Validation(ReportPayload):
    pass
    
class ReportSummary(BaseModel):
    report_id: int
    file_name: str # will be test_name for standalone tests
    collection_date: date
    age: Optional[int]
    lab_name: Optional[str]
    number_of_test: int
    
class StandaloneTestRequest(BaseModel):
    file_name: str
    test_name: str
    collection_date: Annotated[date, AfterValidator(check_date)]
    lab_name: Optional[str]
    value: float
    unit: Optional[str]
    lower_bound: Optional[float]
    upper_bound: Optional[float]
    
    
    