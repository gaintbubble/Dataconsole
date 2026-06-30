export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';

export async function GET() {
  try {
    const mappings = await prisma.mappingDictionary.findMany({
      orderBy: { category: 'asc' }
    });
    return NextResponse.json(mappings, { status: 200 });
  } catch (error) {
    console.error("MAPPINGS GET ERROR:", error);
    return NextResponse.json({ error: "Failed to fetch mappings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { category, originalName, shortName, department, sequence } = body;

    const cleanOriginal = originalName.trim().toLowerCase().replace(/\s+/g, " ");
    
    // BULLETPROOF SEQUENCE PARSER (Prevents NaN crashes)
    let parsedSequence = null;
    if (sequence !== undefined && sequence !== null && sequence !== "") {
      const num = parseInt(String(sequence), 10);
      if (!isNaN(num)) {
        parsedSequence = num;
      }
    }

    const newMapping = await prisma.mappingDictionary.upsert({
      where: {
        category_originalName: {
          category: category,
          originalName: cleanOriginal,
        }
      },
      update: { 
        shortName: shortName.trim(),
        department: category === 'Parameter' ? department : null,
        sequence: category === 'Parameter' ? parsedSequence : null
      },
      create: {
        category: category,
        originalName: cleanOriginal,
        shortName: shortName.trim(),
        department: category === 'Parameter' ? department : null,
        sequence: category === 'Parameter' ? parsedSequence : null
      }
    });

    return NextResponse.json(newMapping, { status: 200 });
  } catch (error) {
    // This prints the EXACT error in your terminal if it fails again
    console.error("MAPPINGS POST ERROR:", error);
    return NextResponse.json({ error: "Failed to save mapping" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await prisma.mappingDictionary.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted successfully" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}