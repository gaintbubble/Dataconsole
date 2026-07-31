export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  try {
    // Now sorting by sequence instead of createdAt!
    const shifts = await prisma.shift.findMany({
      orderBy: { sequence: 'asc' }
    });
    return NextResponse.json(shifts, { status: 200 });
  } catch (error) {
    console.error("Shift GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch shifts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Ensure sequence is stored as an integer
    const sequenceNum = parseInt(data.sequence) || 0;
    
    const shift = data.id 
      ? await prisma.shift.update({
          where: { id: data.id },
          data: { name: data.name, dailyTime: data.dailyTime, sequence: sequenceNum }
        })
      : await prisma.shift.create({
          data: { name: data.name, dailyTime: data.dailyTime, sequence: sequenceNum }
        });
        
    return NextResponse.json(shift, { status: 200 });
  } catch (error) {
    console.error("Shift POST Error:", error);
    return NextResponse.json({ error: "Failed to save shift" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await prisma.shift.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Shift DELETE Error:", error);
    return NextResponse.json({ error: "Failed to delete shift" }, { status: 500 });
  }
}