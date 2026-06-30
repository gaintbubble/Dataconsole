import { NextResponse } from 'next/server';
// 1. Correctly points to your custom Prisma database connection
import { prisma } from '../../../lib/prisma'; 

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { hours } = body;

    if (!hours || isNaN(hours)) {
      return NextResponse.json({ error: "Invalid hours provided" }, { status: 400 });
    }

    // Calculate the exact cutoff timestamp
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);

    // 2. Safely delete from PatientRecord
    const deletedRecords = await prisma.patientRecord.deleteMany({
      where: {
        // Only target Result Bank data (ignore the main Database entries)
        parameterName: { not: null },
        // Only target records older than the cutoff
        createdAt: {
          lt: cutoffDate, 
        },
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: `Successfully deleted ${deletedRecords.count} old records.` 
    });

  } catch (error) {
    console.error("Database Cleanup Error:", error);
    return NextResponse.json({ error: "Failed to clean database" }, { status: 500 });
  }
}