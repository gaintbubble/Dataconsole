import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// 1. Set up the connection pool using your environment variable
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// 2. Initialize the Prisma adapter
const adapter = new PrismaPg(pool);

// 3. Pass the adapter to the Prisma Client
const prisma = new PrismaClient({ adapter });

// GET: Fetch all roster assignments for a specific month and department
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const department = searchParams.get("department");
  const yearMonth = searchParams.get("yearMonth"); // Format: "YYYY-MM"

  if (!department || !yearMonth) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  try {
    const records = await prisma.roster.findMany({
      where: {
        department: department,
        date: { startsWith: yearMonth }
      }
    });

    const assignments: Record<string, string[]> = {};
    records.forEach(record => {
      assignments[`${record.date}_${record.shiftName}`] = record.empIds;
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error("Failed to fetch roster:", error);
    return NextResponse.json({ error: "Failed to fetch roster" }, { status: 500 });
  }
}

// POST: Save or update assignments
export async function POST(request: Request) {
  try {
    const { department, yearMonth, assignments } = await request.json();

    if (!department || !yearMonth || !assignments) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      // Clear old records for the month to start fresh
      await tx.roster.deleteMany({
        where: {
          department: department,
          date: { startsWith: yearMonth }
        }
      });

      // Format the new records
      const newRecords = [];
      for (const [key, empIds] of Object.entries(assignments)) {
        if (!Array.isArray(empIds) || empIds.length === 0) continue;
        
        const [date, ...shiftParts] = key.split('_');
        const shiftName = shiftParts.join('_'); 

        newRecords.push({
          date,
          department,
          shiftName,
          empIds: empIds as string[]
        });
      }

      // Bulk insert
      if (newRecords.length > 0) {
        await tx.roster.createMany({
          data: newRecords
        });
      }
    });

    return NextResponse.json({ success: true, message: "Roster saved!" });
  } catch (error) {
    console.error("Save Roster Error:", error);
    return NextResponse.json({ error: "Failed to save roster" }, { status: 500 });
  }
}