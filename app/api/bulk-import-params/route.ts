import { NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';

export async function GET() {
  const parameterMappings = [
    { o: "Appearance / Clarity", s: "App" },
    { o: "Urine Bilirubin", s: "U.Bili" },
    { o: "Colour", s: "Col" },
    { o: "Urine Ketones", s: "Keto" },
    { o: "Specific Gravity", s: "Spg" },
    { o: "Urine Glucose", s: "UG" },
    { o: "Urobilinogen", s: "Uro" },
    { o: "Squamous epithelial cells", s: "Ep" },
    { o: "Proteins", s: "Up" },
    { o: "Reaction (pH)", s: "ph" },
    { o: "Red Blood Cells", s: "RB" },
    { o: "Urine Blood", s: "Blod" },
    { o: "Pus Cells", s: "pus" },
    { o: "Basophils", s: "B" },
    { o: "Eosinophils", s: "E" },
    { o: "Lymphocytes", s: "L" },
    { o: "Mean Corpuscular Hb. (MCH)", s: "Mch" },
    { o: "Mean Corp. Hb. Conc. (MCHC)", s: "Mchc" },
    { o: "Mean Corpuscular Volume (MCV)", s: "Mcv" },
    { o: "Monocytes", s: "M" },
    { o: "Neutrophils", s: "N" },
    { o: "PCV", s: "Pcv" },
    { o: "PLATELET COUNT", s: "Plt" },
    { o: "RBC COUNT", s: "Rbcc" },
    { o: "RDW-CV", s: "Cv" },
    { o: "Total WBC Count", s: "Tc" },
    { o: "Haemoglobin (HB%)", s: "Hb" },
    { o: "IRON", s: "Iron" },
    { o: "FASTING BLOOD GLUCOSE (FBS)", s: "Fbs" },
    { o: "SERUM FERRITIN", s: "Ferr" },
    { o: "VITAMIN B12", s: "B12" },
    { o: "TRIGLYCERIDES", s: "Tri" },
    { o: "VLDL CHOLESTEROL", s: "Vldl" },
    { o: "TOTAL CHOLESTEROL", s: "Chol" },
    { o: "HDL CHOLESTEROL", s: "Hdl" },
    { o: "LDL CHOLESTEROL", s: "Ldl" },
    { o: "Non-HDL CHOLESTEROL RATIO", s: "Nhdl" },
    { o: "TOTAL CHOLESTEROL HDL RATIO", s: "ChR" },
    { o: "CALCIUM", s: "Cal" },
    { o: "CREATININE", s: "Cre" },
    { o: "POTASSIUM", s: "K+" },
    { o: "SODIUM", s: "N+" },
    { o: "URIC ACID", s: "U.A" },
    { o: "PHOSPHORUS", s: "Pho" },
    { o: "CHLORIDE", s: "Clor" },
    { o: "UREA", s: "Urea" },
    { o: "BLOOD UREA NITROGEN (BUN)", s: "Bun" },
    { o: "A/G RATIO", s: "A/G" },
    { o: "DIRECT BILIRUBIN", s: "D.B" },
    { o: "INDIRECT BILIRUBIN", s: "I.B" },
    { o: "TOTAL BILIRUBIN", s: "T.B" },
    { o: "PROTEIN", s: "Pro" },
    { o: "ASPARTATE TRANSAMINASE (AST) / SGOT", s: "OT" },
    { o: "ALANINE TRANSAMINASE (ALT) / SGPT", s: "PT" },
    { o: "ALBUMIN", s: "AlB" },
    { o: "GLOBULIN", s: "Glb" },
    { o: "ALKALINE PHOSPHATASE (ALP)", s: "Alp" },
    { o: "25-hydroxy VITAMIN D", s: "Vt-D" },
    { o: "GLYCATED HEMOGLOBIN (HbA1c)", s: "A1c" },
    { o: "MBG (Mean Blood Glucose)", s: "Mbg" },
    { o: "TOTAL T4", s: "T4" },
    { o: "THYROID STIMULATING HORMONE (TSH)", s: "Tsh" },
    { o: "TOTAL T3", s: "T3" },
    { o: "HIV-1", s: "Hiv" },
    { o: "HbsAg (Antigen Detection test)", s: "Ag" },
    { o: "HCV Rapid", s: "Hcv" },
    { o: "Prothrombin time (PT)", s: "Pt" },
    { o: "INR", s: "Inr" },
    { o: "RANDOM BLOOD GLUCOSE (RBS)", s: "Rbs" },
    { o: "TROPONIN I", s: "Trop-I" },
    { o: "Erythrocyte Sedimentation Rate (ESR)", s: "Esr" },
    { o: "GRAVINDEX TEST", s: "Upt" },
    { o: "Urine Protein", s: "U.Pro" },
    { o: "URINE CREATININE", s: "U.Cre" },
    { o: "PROTEIN CREATININE RATIO (PCR RATIO)", s: "PCR" },
    { o: "APTT - Activated Partial Thromboplastin Time", s: "Aptt" },
    { o: "AMYLASE", s: "Amy" },
    { o: "CA-125", s: "125" },
    { o: "FREE T4", s: "FT4" },
    { o: "FREE T3", s: "FT3" },
    { o: "POST PRANDIAL BLOOD GLUCOSE (PPBS)", s: "Ppbs" },
    { o: "CORTISOL", s: "Corti" },
    { o: "NT PRO BNP", s: "Bnp" },
    { o: "RETICULOCYTE COUNT", s: "Ret" },
    { o: "S.Typhi O Antibody", s: "O Anti" },
    { o: "S.Typhi H Antibody", s: "H Anti" },
    { o: "Absolute Eosinophils Count", s: "AEC" },
    { o: "D-DIMER", s: "D-Dim" },
    { o: "SERUM ALBUMIN", s: "S.Albu" },
    { o: "Stool Occult Blood", s: "SOB" },
    { o: "TRUST (Treponema Pallidum Antibody Detection Test)", s: "Trust" },
    { o: "PROLACTIN", s: "Prolac" },
    { o: "SERUM MAGNESIUM", s: "MG+" },
    { o: "CRP", s: "CRP" },
    { o: "Rheumatoid Factor", s: "RA" },
    { o: "BT (Bleeding Time)", s: "BT" },
    { o: "CT (Clotting Time)", s: "CT" },
    { o: "LACTATE DEHYDROGENASE (LDH)", s: "LDH" },
    { o: "DIPSI TEST", s: "Dip" },
    { o: "C-reactive protein (CRP)", s: "CRPQ" },
    { o: "ASLO", s: "Aso" },
    { o: "PERITONIAL FLUID ADENOSINE DEAMINASE (ADA)", s: "Ada" },
    { o: "CK MB", s: "Ck" },
    { o: "PROCALCITONIN", s: "Calci" },
    { o: "PHOSPHOROUS", s: "Phop" },
    { o: "Malaria Ag P.f", s: "M P.f" },
    { o: "Malaria Ag P.v", s: "M p.v" }
  ];

  try {
    // 1. Delete ALL existing Parameter names to ensure absolute strictness
    await prisma.mappingDictionary.deleteMany({
      where: { category: "Parameter" }
    });

    // 2. Insert ONLY the new list
    let count = 0;
    for (const item of parameterMappings) {
      const cleanOriginal = item.o.trim().toLowerCase().replace(/\s+/g, " ");
      
      await prisma.mappingDictionary.create({
        data: {
          category: "Parameter",
          originalName: cleanOriginal,
          shortName: item.s
        }
      });
      count++;
    }

    return NextResponse.json({ message: `Successfully wiped old parameters and imported exactly ${count} strict Parameter Rules!` }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}