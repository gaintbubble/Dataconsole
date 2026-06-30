import { NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';

export async function GET() {
  const resultMappings = [
    { o: "Clear", s: "cl" },
    { o: "Negative", s: "Neg" },
    { o: "Straw", s: "Strw" },
    { o: "1.003", s: "1.003" },
    { o: "Normal", s: "Nor" },
    { o: "3-5", s: "3-5" },
    { o: "03-May", s: "3-5" }, // Fixes Excel date corruption
    { o: "7.5", s: "7.5" },
    { o: "Nil", s: "Nil" },
    { o: "0-5", s: "0-5" },
    { o: "Present", s: "Pre" },
    { o: "0.6", s: "0.6" },
    { o: "Dark-Yellow", s: "D.Yel" },
    { o: "1.02", s: "1.02" },
    { o: "2.0 mg/dL +", s: "+" },
    { o: "1-2", s: "1-2" },
    { o: "01-Feb", s: "1-2" }, // Fixes Excel date corruption
    { o: "10 mg/dL Trace", s: "Tra" },
    { o: "Yellow", s: "Yel" },
    { o: ">=1,000 mg/dL ++++", s: "4+" },
    { o: "Light-Yellow", s: "P.Yelo" },
    { o: "50 mg/dL +", s: "+" },
    { o: "0-2", s: "0-2" },
    { o: "0.03 mg/dL Trace", s: "Trac" },
    { o: "1.0 mg/dL +", s: "+" },
    { o: "Dark-Amber", s: "Amber" },
    { o: "2-3", s: "2-3" },
    { o: "02-Mar", s: "2-3" }, // Fixes Excel date corruption
    { o: "Positive", s: "Pos" },
    { o: "NON-REACTIVE", s: "NR" },
    { o: "Slightly-Cloudy", s: "S.T" },
    { o: "3.0 mg/dL +", s: "+" },
    { o: ">=1.0 mg/dL +++", s: "3+" },
    { o: "0.50 mg/dL ++", s: "2+" },
    { o: "Cloudy", s: "Tur" },
    { o: "100 mg/dL ++", s: "2+" },
    { o: "100 mg/dL +", s: "+" },
    { o: "3-4", s: "3-4" },
    { o: "03-Apr", s: "3-4" }, // Fixes Excel date corruption
    { o: "TRACE", s: "Tra" },
    { o: "200 mg/dL ++", s: "2+" },
    { o: "Dark Yellow", s: "D.Yel" },
    { o: "Absent", s: "Abs" },
    { o: "Positive 12", s: "12" },
    { o: "6-8", s: "6-8" },
    { o: "06-Aug", s: "6-8" }, // Fixes Excel date corruption
    { o: "Turbid", s: "Tur" },
    { o: "Ne3gative", s: "Neg" },
    { o: "NOT DETECTED", s: "Neg" },
    { o: "5 mg/dL Trace", s: "Trac" },
    { o: "06-Oct", s: "3+" }, // Fixes Excel date corruption
    { o: "0.10 mg/dL +", s: "+" },
    { o: "Prolonged", s: "Prol" }
  ];

  try {
    // Clear out old result mappings just in case
    await prisma.mappingDictionary.deleteMany({
      where: { category: "Result" }
    });

    let count = 0;
    for (const item of resultMappings) {
      const cleanOriginal = item.o.trim().toLowerCase().replace(/\s+/g, " ");
      
      await prisma.mappingDictionary.create({
        data: {
          category: "Result",
          originalName: cleanOriginal,
          shortName: item.s
        }
      });
      count++;
    }

    return NextResponse.json({ message: `Success! Imported ${count} Result Rules!` }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}