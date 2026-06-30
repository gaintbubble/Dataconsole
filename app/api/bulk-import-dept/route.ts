import { NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';

export async function GET() {
  const deptMappings = [
    { o: "EMERGENCY MEDICINE", s: "EM" },
    { o: "GENERAL DEPARTMENT", s: "DM" },
    { o: "PAEDIATRICS OP", s: "Paed" },
    { o: "OBSTETRICS(OBST)", s: "Obst" },
    { o: "UROLOGY", s: "Uro" },
    { o: "GENERAL SURGERY", s: "GS" },
    { o: "GYNAECOLOGY", s: "Gync" },
    { o: "RESPIRATORY MEDICINE", s: "Resp" },
    { o: "PSYCHIATRY", s: "Psyc" },
    { o: "ORTHOPAEDICS", s: "Ortho" },
    { o: "OPHTHALMOLOGY", s: "Optho" },
    { o: "RADIATION ONCOLOGY", s: "R.onco" },
    { o: "GENERAL MEDICINE", s: "GM" },
    { o: "ENT", s: "ENT" },
    { o: "DERMATOLOGY, VENEREOLOGY AND LEPROSY(DVL)", s: "Dermo" },
    { o: "DENTAL AND ORAL SURGERY", s: "Dental" },
    { o: "SURGICAL ONCOLOGY", s: "s.ONCO" },
    { o: "MEDICAL GASTROENTEROLOGY", s: "Gastro" },
    { o: "NEPHROLOGY", s: "Nephro" },
    { o: "MEDICAL ONCOLOGY", s: "M.Onco" },
    { o: "SURGICAL GASTRO", s: "s.Gas" },
    { o: "PLASTIC & RECONSTRUCTIVE & AESTHETIC SURGERY", s: "Plstic" },
    { o: "NEURO SURGERY", s: "N.S" },
    { o: "NEUROLOGY", s: "Neuro" },
    { o: "Ayurvedic", s: "Ayur" }
  ];

  try {
    // 1. Clear out old Department mappings
    await prisma.mappingDictionary.deleteMany({
      where: { category: "Department" }
    });

    // 2. Insert the new list
    for (const item of deptMappings) {
      const cleanOriginal = item.o.trim().toLowerCase().replace(/\s+/g, " ");
      await prisma.mappingDictionary.create({
        data: {
          category: "Department",
          originalName: cleanOriginal,
          shortName: item.s
        }
      });
    }

    return NextResponse.json({ message: "Success! Imported Department Rules!" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}