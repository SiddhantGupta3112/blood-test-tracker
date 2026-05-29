import pdfplumber
import re
from datetime import datetime, date as dt
from app.schemas import ReportMetadata

class Metadata:
    def __init__(self,):
        self.date: dt | None = dt.today()      
        self.lab_name: str | None = None   

    def collect_date(self, line):
        pattern = re.compile(
        r'\b(reported|date|collected)\b'
        r'(?!\s+(at|from|in))'
        r'\s*[:\-]?\s*'
        r'(.+?)(?=\b(reported|date|collected)\b|$)',
        re.IGNORECASE
        )
        return re.search(pattern, line) 
    
    def collect_lab_name(self, first_page_text: str):
        if not first_page_text:
            return
        keywords = ["diagnostics", "lab", "laboratory", "pathlab"]
        line = first_page_text.split("\n")[0]
            
        if any(word in line.lower().strip() for word in keywords):    
            self.lab_name = line

    def parse_datetime(self, raw: str):
        formats = [
            "%d/%m/%Y %I:%M:%S%p",
            "%d/%m/%Y %I:%M%p",
            "%d-%m-%Y %I:%M:%S%p",
            "%Y-%m-%d %H:%M:%S",
        ]

        for fmt in formats:
            try:
                parsed = datetime.strptime(raw, fmt)
                return parsed.date()  
            except ValueError:
                pass

        return None

    

    def collect_metadata(self, file_path: str, name: str) -> ReportMetadata:
        seen_lines = set()   

        with pdfplumber.open(file_path) as pdf:
            self.collect_lab_name(pdf.pages[0].extract_text())
            for page in pdf.pages:
                text = page.extract_text()
                if not text:
                    continue

                for line in text.split('\n'):
                    if line in seen_lines: continue
                    date = self.collect_date(line.lower())
                    
                    
                    if date:
                        self.date = self.parse_datetime(date.group(3).strip())
                        seen_lines.add(line)
        
        return ReportMetadata(
            collection_date=self.date if self.date is not None else dt.today(),
            lab_name=self.lab_name,
            file_name=name
        )


def get_metadata(file_path, name):
    parser = Metadata()
    return parser.collect_metadata(file_path, name)



