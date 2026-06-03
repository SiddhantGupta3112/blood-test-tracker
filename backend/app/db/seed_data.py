from app.models import TestMetadata
from sqlalchemy.orm import Session

test_metadata_seed = [
    # --- LIVER FUNCTION PANEL ---
    {"canonical_name": "AST (SGOT)", "default_unit": "U/L", "category": "Liver Function"},
    {"canonical_name": "ALT (SGPT)", "default_unit": "U/L", "category": "Liver Function"},
    {"canonical_name": "AST:ALT Ratio", "default_unit": None, "category": "Liver Function"},
    {"canonical_name": "GGTP", "default_unit": "U/L", "category": "Liver Function"},
    {"canonical_name": "Alkaline Phosphatase (ALP)", "default_unit": "U/L", "category": "Liver Function"},
    {"canonical_name": "Bilirubin Total", "default_unit": "mg/dL", "category": "Liver Function"},
    {"canonical_name": "Bilirubin Direct", "default_unit": "mg/dL", "category": "Liver Function"},
    {"canonical_name": "Bilirubin Indirect", "default_unit": "mg/dL", "category": "Liver Function"},
    {"canonical_name": "Total Protein", "default_unit": "g/dL", "category": "Liver Function"},
    {"canonical_name": "Albumin", "default_unit": "g/dL", "category": "Liver Function"},
    {"canonical_name": "A : G Ratio", "default_unit": None, "category": "Liver Function"},
    
    # --- LIPID PROFILE PANEL ---
    {"canonical_name": "Cholesterol, Total", "default_unit": "mg/dL", "category": "Lipid Profile"},
    {"canonical_name": "Triglycerides", "default_unit": "mg/dL", "category": "Lipid Profile"},
    {"canonical_name": "HDL Cholesterol", "default_unit": "mg/dL", "category": "Lipid Profile"},
    {"canonical_name": "LDL Cholesterol, Calculated", "default_unit": "mg/dL", "category": "Lipid Profile"},
    {"canonical_name": "VLDL Cholesterol, Calculated", "default_unit": "mg/dL", "category": "Lipid Profile"},
    {"canonical_name": "Non-HDL Cholesterol", "default_unit": "mg/dL", "category": "Lipid Profile"},
    
    # --- DIABETES & METABOLIC PANEL ---
    {"canonical_name": "HbA1c", "default_unit": "%", "category": "Diabetes"},
    {"canonical_name": "Glucose, Fasting (F), Plasma", "default_unit": "mg/dL", "category": "Diabetes"},
    {"canonical_name": "Estimated Average Glucose (eAG)", "default_unit": "mg/dL", "category": "Diabetes"},
    {"canonical_name": "Glucose", "default_unit": "mg/dL", "category": "Diabetes"},
    {"canonical_name": "Glucose, Post Prandial (PP)", "default_unit": "mg/dL", "category": "Diabetes"},
    
    # --- VITAMINS & MICRONUTRIENTS ---
    {"canonical_name": "Vitamin B12; Cyanocobalamin, Serum", "default_unit": "pg/mL", "category": "Vitamins"},
    {"canonical_name": "Vitamin D, 25-Hydroxy", "default_unit": "nmol/L", "category": "Vitamins"},

    # ➕ --- COMPLETE BLOOD COUNT (CBC) / HEMATOLOGY ---
    {"canonical_name": "Hemoglobin", "default_unit": "g/dL", "category": "Hematology"},
    {"canonical_name": "Packed Cell Volume (PCV) / Hematocrit", "default_unit": "%", "category": "Hematology"},
    {"canonical_name": "Total Leukocyte Count (WBC)", "default_unit": "10^3/µL", "category": "Hematology"},
    {"canonical_name": "Platelet Count", "default_unit": "10^3/µL", "category": "Hematology"},
    {"canonical_name": "Red Blood Cell Count (RBC)", "default_unit": "10^6/µL", "category": "Hematology"},
    {"canonical_name": "Mean Corpuscular Volume (MCV)", "default_unit": "fL", "category": "Hematology"},
    {"canonical_name": "Mean Corpuscular Hemoglobin (MCH)", "default_unit": "pg", "category": "Hematology"},
    {"canonical_name": "Mean Corpuscular Hemoglobin Concentration (MCHC)", "default_unit": "g/dL", "category": "Hematology"},
    {"canonical_name": "Red Cell Distribution Width (RDW-CV)", "default_unit": "%", "category": "Hematology"},
    {"canonical_name": "Neutrophils", "default_unit": "%", "category": "Hematology"},
    {"canonical_name": "Lymphocytes", "default_unit": "%", "category": "Hematology"},
    {"canonical_name": "Monocytes", "default_unit": "%", "category": "Hematology"},
    {"canonical_name": "Eosinophils", "default_unit": "%", "category": "Hematology"},
    {"canonical_name": "Basophils", "default_unit": "%", "category": "Hematology"},

    # ➕ --- RENAL / KIDNEY FUNCTION PANEL ---
    {"canonical_name": "Urea", "default_unit": "mg/dL", "category": "Kidney Function"},
    {"canonical_name": "Blood Urea Nitrogen (BUN)", "default_unit": "mg/dL", "category": "Kidney Function"},
    {"canonical_name": "Creatinine", "default_unit": "mg/dL", "category": "Kidney Function"},
    {"canonical_name": "BUN : Creatinine Ratio", "default_unit": None, "category": "Kidney Function"},
    {"canonical_name": "Uric Acid", "default_unit": "mg/dL", "category": "Kidney Function"},
    {"canonical_name": "Estimated Glomerular Filtration Rate (eGFR)", "default_unit": "mL/min/1.73m2", "category": "Kidney Function"},

    # ➕ --- SERUM ELECTROLYTES PANEL ---
    {"canonical_name": "Sodium", "default_unit": "mmol/L", "category": "Electrolytes"},
    {"canonical_name": "Potassium", "default_unit": "mmol/L", "category": "Electrolytes"},
    {"canonical_name": "Chloride", "default_unit": "mmol/L", "category": "Electrolytes"},
    {"canonical_name": "Calcium, Total", "default_unit": "mg/dL", "category": "Electrolytes"},

    # ➕ --- THYROID PROFILE PANEL ---
    {"canonical_name": "Thyroid Stimulating Hormone (TSH)", "default_unit": "µIU/mL", "category": "Thyroid Profile"},
    {"canonical_name": "Total Triiodothyronine (T3)", "default_unit": "ng/dL", "category": "Thyroid Profile"},
    {"canonical_name": "Total Thyroxine (T4)", "default_unit": "µg/dL", "category": "Thyroid Profile"},
    {"canonical_name": "Free Triiodothyronine (FT3)", "default_unit": "pg/mL", "category": "Thyroid Profile"},
    {"canonical_name": "Free Thyroxine (FT4)", "default_unit": "ng/dL", "category": "Thyroid Profile"},

    # ➕ --- CARDIAC & INFLAMMATORY MARKERS ---
    {"canonical_name": "High Sensitivity C-Reactive Protein (hs-CRP)", "default_unit": "mg/L", "category": "Inflammatory"},
    {"canonical_name": "Erythrocyte Sedimentation Rate (ESR)", "default_unit": "mm/hr", "category": "Inflammatory"},
    
    # ➕ --- IRON STUDIES PANEL ---
    {"canonical_name": "Iron, Serum", "default_unit": "µg/dL", "category": "Iron Studies"},
    {"canonical_name": "Total Iron Binding Capacity (TIBC)", "default_unit": "µg/dL", "category": "Iron Studies"},
    {"canonical_name": "Transferrin Saturation", "default_unit": "%", "category": "Iron Studies"},
    {"canonical_name": "Ferritin", "default_unit": "ng/mL", "category": "Iron Studies"}
]

def seed_test_metadata(db: Session):
    query = db.query(TestMetadata).first()
    
    if query:
        return
    
    items = [TestMetadata(**row) for row in test_metadata_seed]
    db.add_all(items)
    db.commit()
    