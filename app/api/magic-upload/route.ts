import { NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma'; 

// 1. PERFECT HAEMATOLOGY LIST (1 to 22)
const HAEMATOLOGY_UPDATE = [
  { originalName: "Haemoglobin (HB%)", shortName: "Hb", department: "Haematology", sequence: 1 },
  { originalName: "Total WBC Count", shortName: "Tc", department: "Haematology", sequence: 2 },
  { originalName: "Neutrophils", shortName: "N", department: "Haematology", sequence: 3 },
  { originalName: "Lymphocytes", shortName: "L", department: "Haematology", sequence: 4 },
  { originalName: "Eosinophils", shortName: "E", department: "Haematology", sequence: 5 },
  { originalName: "Basophils", shortName: "B", department: "Haematology", sequence: 6 },
  { originalName: "Monocytes", shortName: "M", department: "Haematology", sequence: 7 },
  { originalName: "RDW-CV", shortName: "Cv", department: "Haematology", sequence: 8 },
  { originalName: "PCV", shortName: "Pcv", department: "Haematology", sequence: 9 },
  { originalName: "PLATELET COUNT", shortName: "Plt", department: "Haematology", sequence: 10 },
  { originalName: "RBC COUNT", shortName: "Rbcc", department: "Haematology", sequence: 11 },
  { originalName: "Absolute Eosinophils Count", shortName: "AEC", department: "Haematology", sequence: 12 },
  { originalName: "Mean Corpuscular Volume (MCV)", shortName: "Mcv", department: "Haematology", sequence: 13 },
  { originalName: "Mean Corpuscular Hb. (MCH)", shortName: "Mch", department: "Haematology", sequence: 14 },
  { originalName: "Mean Corp. Hb.  Conc. (MCHC)", shortName: "Mchc", department: "Haematology", sequence: 15 },
  { originalName: "BT (Bleeding Time)", shortName: "BT", department: "Haematology", sequence: 16 },
  { originalName: "CT (Clotting Time)", shortName: "CT", department: "Haematology", sequence: 17 },
  { originalName: "RETICULOCYTE COUNT", shortName: "Ret", department: "Haematology", sequence: 18 },
  { originalName: "Prothrombin time (PT)", shortName: "Pt", department: "Haematology", sequence: 19 },
  { originalName: "INR", shortName: "Inr", department: "Haematology", sequence: 20 },
  { originalName: "APTT - Activated Partial Thromboplastin Time", shortName: "Aptt", department: "Haematology", sequence: 21 },
  { originalName: "Erythrocyte Sedimentation Rate (ESR)", shortName: "Esr", department: "Haematology", sequence: 22 },
];

// 2. PERFECT CLINICAL PATHOLOGY LIST (1 to 13)
const CLINICAL_PATH_UPDATE = [
  { originalName: "Appearance / Clarity", shortName: "App", department: "Clinical Pathology", sequence: 1 },
  { originalName: "Reaction (pH)", shortName: "ph", department: "Clinical Pathology", sequence: 2 },
  { originalName: "Proteins", shortName: "Up", department: "Clinical Pathology", sequence: 3 },
  { originalName: "Urine Glucose", shortName: "UG", department: "Clinical Pathology", sequence: 4 },
  { originalName: "Urine Ketones", shortName: "Keto", department: "Clinical Pathology", sequence: 5 },
  { originalName: "Urine Bilirubin", shortName: "U.Bili", department: "Clinical Pathology", sequence: 6 },
  { originalName: "Urobilinogen", shortName: "Uro", department: "Clinical Pathology", sequence: 7 },
  { originalName: "Pus Cells", shortName: "pus", department: "Clinical Pathology", sequence: 8 },
  { originalName: "Red Blood Cells", shortName: "RB", department: "Clinical Pathology", sequence: 9 },
  { originalName: "Squamous epithelial cells", shortName: "Ep", department: "Clinical Pathology", sequence: 10 },
  { originalName: "Specific Gravity", shortName: "Spg", department: "Clinical Pathology", sequence: 11 },
  { originalName: "Stool Occult Blood", shortName: "SOB", department: "Clinical Pathology", sequence: 12 },
  { originalName: "Urine Blood", shortName: "Blod", department: "Clinical Pathology", sequence: 13 }, 
];

// 3. PERFECT BIOCHEMISTRY LIST (1 to 58)
const BIOCHEMISTRY_UPDATE = [
  { originalName: "FASTING BLOOD GLUCOSE (FBS)", shortName: "Fbs", department: "Biochemistry", sequence: 1 },
  { originalName: "POST PRANDIAL BLOOD GLUCOSE (PPBS)", shortName: "Ppbs", department: "Biochemistry", sequence: 2 },
  { originalName: "RANDOM BLOOD GLUCOSE (RBS)", shortName: "Rbs", department: "Biochemistry", sequence: 3 },
  { originalName: "UREA", shortName: "Urea", department: "Biochemistry", sequence: 4 },
  { originalName: "URINE CREATININE", shortName: "U.Cre", department: "Biochemistry", sequence: 5 },
  { originalName: "URIC ACID", shortName: "U.A", department: "Biochemistry", sequence: 6 },
  { originalName: "TOTAL BILIRUBIN", shortName: "T.B", department: "Biochemistry", sequence: 7 },
  { originalName: "DIRECT BILIRUBIN", shortName: "D.B", department: "Biochemistry", sequence: 8 },
  { originalName: "PROTEIN", shortName: "Pro", department: "Biochemistry", sequence: 9 },
  { originalName: "SERUM ALBUMIN", shortName: "S.Albu", department: "Biochemistry", sequence: 10 },
  { originalName: "GLOBULIN", shortName: "Glb", department: "Biochemistry", sequence: 11 },
  { originalName: "A/G RATIO", shortName: "A/G", department: "Biochemistry", sequence: 12 },
  { originalName: "ASPARTATE TRANSAMINASE (AST) / SGOT", shortName: "OT", department: "Biochemistry", sequence: 13 },
  { originalName: "ALANINE TRANSAMINASE (ALT) / SGPT", shortName: "PT", department: "Biochemistry", sequence: 14 },
  { originalName: "ALKALINE PHOSPHATASE (ALP)", shortName: "Alp", department: "Biochemistry", sequence: 15 },
  { originalName: "TOTAL CHOLESTEROL", shortName: "Chol", department: "Biochemistry", sequence: 16 },
  { originalName: "LDL CHOLESTEROL", shortName: "Ldl", department: "Biochemistry", sequence: 17 },
  { originalName: "VLDL CHOLESTEROL", shortName: "Vldl", department: "Biochemistry", sequence: 18 },
  { originalName: "TRIGLYCERIDES", shortName: "Tri", department: "Biochemistry", sequence: 19 },
  { originalName: "CALCIUM", shortName: "Cal", department: "Biochemistry", sequence: 20 },
  { originalName: "PHOSPHORUS", shortName: "Pho", department: "Biochemistry", sequence: 21 },
  { originalName: "AMYLASE", shortName: "Amy", department: "Biochemistry", sequence: 22 },
  { originalName: "CK MB", shortName: "Ck", department: "Biochemistry", sequence: 23 },
  { originalName: "SODIUM", shortName: "N+", department: "Biochemistry", sequence: 24 },
  { originalName: "POTASSIUM", shortName: "K+", department: "Biochemistry", sequence: 25 },
  { originalName: "CHLORIDE", shortName: "Clor", department: "Biochemistry", sequence: 26 },
  { originalName: "CREATININE", shortName: "Cre", department: "Biochemistry", sequence: 27 },
  { originalName: "GLYCATED HEMOGLOBIN (HbA1c)", shortName: "A1c", department: "Biochemistry", sequence: 28 },
  { originalName: "TOTAL T3", shortName: "T3", department: "Biochemistry", sequence: 29 },
  { originalName: "TOTAL T4", shortName: "T4", department: "Biochemistry", sequence: 30 },
  { originalName: "THYROID STIMULATING HORMONE (TSH)", shortName: "Tsh", department: "Biochemistry", sequence: 31 },
  { originalName: "TROPONIN I", shortName: "Trop-I", department: "Biochemistry", sequence: 32 },
  { originalName: "IRON", shortName: "Iron", department: "Biochemistry", sequence: 33 },
  { originalName: "SERUM FERRITIN", shortName: "Ferr", department: "Biochemistry", sequence: 34 },
  { originalName: "VITAMIN B12", shortName: "B12", department: "Biochemistry", sequence: 35 },
  { originalName: "HDL CHOLESTEROL", shortName: "Hdl", department: "Biochemistry", sequence: 36 },
  { originalName: "Non-HDL CHOLESTEROL RATIO", shortName: "Nhdl", department: "Biochemistry", sequence: 37 },
  { originalName: "TOTAL CHOLESTEROL HDL RATIO", shortName: "ChR", department: "Biochemistry", sequence: 38 },
  { originalName: "BLOOD UREA NITROGEN (BUN)", shortName: "Bun", department: "Biochemistry", sequence: 39 },
  { originalName: "INDIRECT BILIRUBIN", shortName: "I.B", department: "Biochemistry", sequence: 40 },
  { originalName: "25-hydroxy VITAMIN D", shortName: "Vt-D", department: "Biochemistry", sequence: 41 },
  { originalName: "MBG (Mean Blood Glucose)", shortName: "Mbg", department: "Biochemistry", sequence: 42 },
  { originalName: "GRAVINDEX TEST", shortName: "Upt", department: "Biochemistry", sequence: 43 },
  { originalName: "Urine Protein", shortName: "U.Pro", department: "Biochemistry", sequence: 44 },
  { originalName: "PROTEIN CREATININE RATIO (PCR RATIO)", shortName: "PCR", department: "Biochemistry", sequence: 45 },
  { originalName: "CA-125", shortName: "125", department: "Biochemistry", sequence: 46 },
  { originalName: "FREE T4", shortName: "FT4", department: "Biochemistry", sequence: 47 },
  { originalName: "FREE T3", shortName: "FT3", department: "Biochemistry", sequence: 48 },
  { originalName: "CORTISOL", shortName: "Corti", department: "Biochemistry", sequence: 49 },
  { originalName: "NT PRO BNP", shortName: "Bnp", department: "Biochemistry", sequence: 50 },
  { originalName: "D-DIMER", shortName: "D-Dim", department: "Biochemistry", sequence: 51 },
  { originalName: "PROLACTIN", shortName: "Prolac", department: "Biochemistry", sequence: 52 },
  { originalName: "SERUM MAGNESIUM", shortName: "MG+", department: "Biochemistry", sequence: 53 },
  { originalName: "LACTATE DEHYDROGENASE (LDH)", shortName: "LDH", department: "Biochemistry", sequence: 54 },
  { originalName: "DIPSI TEST", shortName: "Dip", department: "Biochemistry", sequence: 55 },
  { originalName: "C-reactive protein (CRP)", shortName: "CRPQ", department: "Biochemistry", sequence: 56 },
  { originalName: "PERITONIAL FLUID ADENOSINE DEAMINASE (ADA)", shortName: "Ada", department: "Biochemistry", sequence: 57 },
  { originalName: "PROCALCITONIN", shortName: "Calci", department: "Biochemistry", sequence: 58 }
];

// 4. PERFECT SEROLOGY LIST (1 to 11) - Fixed the sequence numbering!
const SEROLOGY_UPDATE = [
  { originalName: "HIV-1", shortName: "Hiv", department: "Serology", sequence: 1 },
  { originalName: "HbsAg (Antigen Detection test)", shortName: "Ag", department: "Serology", sequence: 2 },
  { originalName: "HCV Rapid", shortName: "Hcv", department: "Serology", sequence: 3 },
  { originalName: "S.Typhi O Antibody", shortName: "O Anti", department: "Serology", sequence: 4 },
  { originalName: "S.Typhi H Antibody", shortName: "H Anti", department: "Serology", sequence: 5 },
  { originalName: "TRUST (Treponema Pallidum Antibody Detection Test)", shortName: "Trust", department: "Serology", sequence: 6 },
  { originalName: "CRP", shortName: "CRP", department: "Serology", sequence: 7 }, // Fixed from 8
  { originalName: "Rheumatoid Factor", shortName: "RA", department: "Serology", sequence: 8 },
  { originalName: "ASLO", shortName: "Aso", department: "Serology", sequence: 9 },
  { originalName: "Malaria Ag P.f", shortName: "M P.f", department: "Serology", sequence: 10 },
  { originalName: "Malaria Ag P.v", shortName: "M p.v", department: "Serology", sequence: 11 },
];

export async function GET() {
  try {
    // 1. DELETE ONLY OLD DATA FOR THESE FOUR DEPARTMENTS
    // (Admitted Wards, Result Values, etc. remain 100% untouched)
    await prisma.mappingDictionary.deleteMany({
      where: {
        category: "Parameter",
        department: {
          in: ["Haematology", "Clinical Pathology", "Biochemistry", "Serology"]
        }
      }
    });

    // 2. COMBINE ALL LISTS INTO ONE MASSIVE UPLOAD
    const COMBO_LIST = [
      ...HAEMATOLOGY_UPDATE, 
      ...CLINICAL_PATH_UPDATE, 
      ...BIOCHEMISTRY_UPDATE,
      ...SEROLOGY_UPDATE
    ];
    let count = 0;
    
    // 3. INSERT THE FRESH, PERFECT DATA
    for (const item of COMBO_LIST) {
      const cleanOriginal = item.originalName.trim().toLowerCase().replace(/\s+/g, " ");
      
      await prisma.mappingDictionary.create({
        data: {
          category: "Parameter",
          originalName: cleanOriginal,
          shortName: item.shortName,
          department: item.department,
          sequence: item.sequence
        }
      });
      count++;
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `🎉 SUCCESS! Completely updated ${count} parameters across ALL 4 DEPARTMENTS!` 
    });
    
  } catch (error) {
    console.error("Bulk Upload Error:", error);
    return NextResponse.json({ error: "Failed to update parameters" }, { status: 500 });
  }
}