export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma'; // Make sure this path points to your prisma client

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    let filter = {};
    if (type === 'database') {
      // Send ONLY base patient records to the Database page
      filter = { parameterName: null };
    } else {
      // Send ONLY lab results to the Result Bank (Default)
      filter = { parameterName: { not: null } };
    }

    const records = await prisma.patientRecord.findMany({
      where: filter,
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(records, { status: 200 });
  } catch (error) {
    console.error("Database GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch records" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const records = Array.isArray(body) ? body : body.records;

    if (!records || !Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: "No records provided to save." }, { status: 400 });
    }

    const newRecords = await prisma.patientRecord.createMany({
      data: records,
      skipDuplicates: true,
    });
    
    return NextResponse.json({ message: "Success", count: newRecords.count }, { status: 200 });
  } catch (error) {
    console.error("Database POST Error:", error);
    return NextResponse.json({ error: "Failed to save records" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    
    if (body.deleteAll) {
      let filter = {};
      
      // ISOLATED DELETION LOGIC
      if (body.type === 'database') {
        filter = { parameterName: null }; // Only wipe main database entries
      } else if (body.type === 'result-bank') {
        filter = { parameterName: { not: null } }; // Only wipe result bank entries
      }

      const deleted = await prisma.patientRecord.deleteMany({
        where: filter
      });
      
      return NextResponse.json({ message: "Targeted records wiped", count: deleted.count }, { status: 200 });
    }
    return NextResponse.json({ error: "Invalid delete request" }, { status: 400 });
  } catch (error) {
    console.error("Database DELETE Error:", error);
    return NextResponse.json({ error: "Failed to delete records" }, { status: 500 });
  }
}