import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

// --- READ DATA ---
export async function GET() {
  try {
    const admissions = await prisma.admission.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(admissions, { status: 200 });
  } catch (error) {
    console.error("Database GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch admissions" }, { status: 500 });
  }
}

// --- SAVE DATA ---
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { records } = body;

    if (!records || !Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: "No records provided to save." }, { status: 400 });
    }

    const newRecords = await prisma.admission.createMany({
      data: records,
      skipDuplicates: true, // Ignores rows with duplicate admission numbers
    });
    
    return NextResponse.json({ message: "Success", count: newRecords.count }, { status: 200 });
  } catch (error) {
    console.error("Database POST Error:", error);
    return NextResponse.json({ error: "Failed to save admissions" }, { status: 500 });
  }
}