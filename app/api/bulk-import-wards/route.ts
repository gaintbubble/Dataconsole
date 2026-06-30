import { NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';

export async function GET() {
  const wardMappings = [
    { o: "POST NATAL WARD", s: "Post Nat" },
    { o: "EMERGENCY", s: "ER" },
    { o: "LABOUR WARD", s: "Labour" },
    { o: "MALE MEDICAL WARD/HDU V-VIII", s: "MM" },
    { o: "ORTHO HDU", s: "Ortho" },
    { o: "MALE ENT", s: "M Ent" },
    { o: "FEMALE ENT", s: "F Ent" },
    { o: "FEMALE SURGICAL V-VIII", s: "FS" },
    { o: "CTICU", s: "CTICU" },
    { o: "ANTENATAL WARD", s: "Anten" },
    { o: "DELUXE AND SHARING", s: "Deluxe" },
    { o: "MALE OPTHOMOLOGY I,II", s: "M Optho" },
    { o: "FEMALE SURGICAL I-IV", s: "FS" },
    { o: "MALE SURGICAL IV,V", s: "MS" },
    { o: "PAEDIATRIC I", s: "Paed" },
    { o: "GENERAL MALE ORTHO", s: "MO" },
    { o: "MALE SURGICAL II,III", s: "MS" },
    { o: "MALE MEDICAL WARD IV,V", s: "MM" },
    { o: "PRE GYNAC WARD", s: "Gynac" },
    { o: "GENERAL FEMALE ORTHO III", s: "FO" },
    { o: "FEMALE MEDICAL WARD I-IV", s: "FM" },
    { o: "MALE AND FEMALE DVL", s: "DVL" },
    { o: "MALE PULMONOGY WARD II", s: "Pul" },
    { o: "MALE PULMONOGY WARD I", s: "PUL" },
    { o: "POST GYNAEC WARD", s: "Gynic" },
    { o: "PAEDIATRIC WARD II", s: "Paed" },
    { o: "VMSW", s: "vmsw" },
    { o: "PSYCHIATRY", s: "Psyc" },
    { o: "GENERAL MALE ORTHO III", s: "MO" },
    { o: "FEMALE PULMONOLOGY", s: "F.Pulmo" },
    { o: "GENERAL FEMALE ORTHO I ,II", s: "FO" },
    { o: "FEMALE OPTOMOLOGY WARD", s: "F.Opto" },
    { o: "PAEDIATRIC WARD III, IV", s: "Paed" },
    { o: "HDU", s: "HDU" },
    { o: "GENERAL MALE ORTHO II", s: "MO" },
    { o: "MALE MEDICAL WARD II,III", s: "MM" },
    { o: "FEMALE MEDICAL WARDV-VIII", s: "FM" },
    { o: "VGMW", s: "vgmw" },
    { o: "MALE MEDICAL WARD IV ,V", s: "MM" },
    { o: "GYNAEC ICU", s: "Gynac" },
    { o: "ICU", s: "ICU" },
    { o: "DIALYSIS WARD", s: "Dialy" },
    { o: "GENERAL MALE ORTHO IV", s: "MO" },
    { o: "MALE SURGICAL I", s: "MS" },
    { o: "MALE MEDICAL I", s: "MM" },
    { o: "NICU", s: "NICU" },
    { o: "SICU/HDU V-VIII", s: "Sicu" },
    { o: "GH-SICU", s: "sicu" },
    { o: "MULTI SHARING WARD", s: "MS" },
    { o: "CCU", s: "CCU" },
    { o: "CICU", s: "CICU" },
    { o: "MICU/HDU", s: "MICU" },
    { o: "CRITICAL CARE UNIT", s: "Critical" },
    { o: "Delux A/C MULTI SHARING WARD", s: "Deluxe" },
    { o: "PAEDIATRIC ICU", s: "Paed" }
  ];

  try {
    // 1. Clear out old Ward mappings to prevent duplicates
    await prisma.mappingDictionary.deleteMany({
      where: { category: "Ward" }
    });

    // 2. Insert the new list
    let count = 0;
    for (const item of wardMappings) {
      // Clean string for the database
      const cleanOriginal = item.o.trim().toLowerCase().replace(/\s+/g, " ");
      
      await prisma.mappingDictionary.create({
        data: {
          category: "Ward",
          originalName: cleanOriginal,
          shortName: item.s
        }
      });
      count++;
    }

    return NextResponse.json({ message: `Success! Imported ${count} Ward Rules!` }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}