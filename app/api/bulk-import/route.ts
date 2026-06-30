import { NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';

export async function GET() {
  // Your provided list, cleaned up (fixing the "minus;" and "plus;" HTML text)
  const resultMappings = [
    { o: "Clear", s: "cl" },
    { o: "Negative", s: "Neg" },
    { o: "Straw", s: "Strw" },
    { o: "1.003", s: "1.003" },
    { o: "Normal", s: "Nor" },
    { o: "3-5", s: "03-May" }, 
    { o: "7.5", s: "7.5" },
    { o: "Nil", s: "Nil" },
    { o: "0-5", s: "0-5" },
    { o: "Present", s: "Pre" },
    { o: "0.6+A13:A29", s: "0.6" },
    { o: "Dark-Yellow", s: "D.Yel" },
    { o: "1.02", s: "1.02" },
    { o: "2.0 mg/dL +", s: "+" },
    { o: "1-2", s: "01-Feb" },
    { o: "10 mg/dL Trace", s: "Tra" },
    { o: "Yellow", s: "Yel" },
    { o: ">=1,000 mg/dL ++++", s: "4+" },
    { o: "Light-Yellow", s: "P.Yelo" },
    { o: "50 mg/dL +", s: "+" },
    { o: "0-2", s: "0-2" },
    { o: "0.03 mg/dL Trace", s: "Trac" },
    { o: "1.0 mg/dL +", s: "+" },
    { o: "Dark-Amber", s: "Amber" },
    { o: "2-3", s: "02-Mar" },
    { o: "Positive", s: "Pos" },
    { o: "NON-REACTIVE", s: "NR" },
    { o: "Slightly-Cloudy", s: "S.T" },
    { o: "3.0 mg/dL +", s: "+" },
    { o: ">=1.0 mg/dL +++", s: "3+" },
    { o: "0.50 mg/dL ++", s: "2+" },
    { o: "Cloudy", s: "Tur" },
    { o: "100 mg/dL ++", s: "2+" },
    { o: "100 mg/dL +", s: "+" },
    { o: "3-4", s: "03-Apr" },
    { o: "TRACE", s: "Tra" },
    { o: "200 mg/dL ++", s: "2+" },
    { o: "Dark Yellow", s: "D.Yel" },
    { o: "Absent", s: "Abs" },
    { o: "Positive 12", s: "12" },
    { o: "6-8", s: "06-Aug" },
    { o: "Turbid", s: "Tur" },
    { o: "Ne3gative", s: "Neg" },
    { o: "NOT DETECTED", s: "Neg" },
    { o: "Light-Yellow", s: "Pale" },
    { o: "Dark-Yellow", s: "Yello" },
    { o: "5 mg/dL Trace", s: "Trac" },
    { o: "06-Oct", s: "3+" },
    { o: "0.10 mg/dL +", s: "+" },
    { o: "Prolonged", s: "Prol" }
  ];

  try {
    let count = 0;
    for (const item of resultMappings) {
      // Clean string for the database
      const cleanOriginal = item.o.trim().toLowerCase().replace(/\s+/g, " ");
      
      await prisma.mappingDictionary.upsert({
        where: {
          category_originalName: {
            category: "Result",
            originalName: cleanOriginal,
          }
        },
        update: { shortName: item.s },
        create: {
          category: "Result",
          originalName: cleanOriginal,
          shortName: item.s
        }
      });
      count++;
    }

    return NextResponse.json({ message: `Successfully imported ${count} Result Mappings!` }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}