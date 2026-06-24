import pdfplumber
import re
from app.utils import validate
from typing import Tuple
from pathlib import Path

class BloodReportParser:
    def is_valid_result(self, line):
        pattern = r"(.*?)\s+(\d+\.?\d*)(?:\s+([a-zA-Z/%.<>]+))?\s+(.*)"
        return re.search(pattern, line)
    
    def extract_bounds(self, ref: str) -> Tuple[float | None, float | None]:
        try:    
            if not isinstance(ref, str):
                return None, None

            ref = ref.strip()
            if not ref:
                return None, None

            parts = [p.strip() for p in ref.split(",")]
            

            for part in parts:
                tokens = part.split()
                if len(tokens) == 3 and tokens[1] == "-":
                    lower = float(tokens[0])
                    upper = float(tokens[2])
                    return lower, upper

            for part in parts:
                if part.startswith("<"):
                    value = float(part.replace("<", "").strip())
                    return None, value

                if part.startswith(">"):
                    value = float(part.replace(">", "").strip())
                    return value, None

            return None, None

        except Exception:
            return None, None

    def parse(self, file_path : Path) -> list[dict]:
        extracted_data = []
        try:
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    text = page.extract_text()
                    if not text: 
                        continue
                    
                    for line in text.split('\n'):
                        match = self.is_valid_result(line)
                        if match:
                            name, val, unit, ref = match.groups()
                            lowerbound, upperbound = self.extract_bounds(ref)
                            if validate(name, float(val), unit, ref):
                                extracted_data.append({
                                    "test_name": name.strip(),
                                    "value": float(val.strip()),
                                    "unit": unit.strip() if unit else None,
                                    "lower_bound": lowerbound,
                                    "upper_bound" : upperbound
                                })
            return extracted_data
        except Exception:
            return []
def get_report_data(file_path: Path):
    parser = BloodReportParser()
    return parser.parse(file_path)


