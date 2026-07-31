export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  try {
    // Sorts by Department first, then by your custom Sequence!
    const staff = await prisma.employee.findMany({
      orderBy: [
        { department: 'asc' },
        { sequence: 'asc' }
      ]
    });
    return NextResponse.json(staff, { status: 200 });
  } catch (error) {
    console.error("Staff GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch staff" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const sequenceNum = parseInt(data.sequence) || 0;
    
    const staff = data.id 
      ? await prisma.employee.update({
          where: { id: data.id },
          data: { 
            empId: data.empId,
            sequence: sequenceNum,
            name: data.name, 
            department: data.department,
            status: data.status 
          }
        })
      : await prisma.employee.create({
          data: { 
            empId: data.empId,
            sequence: sequenceNum,
            name: data.name, 
            department: data.department,
            status: data.status 
          }
        });
        
    return NextResponse.json(staff, { status: 200 });
  } catch (error) {
    console.error("Staff POST Error:", error);
    return NextResponse.json({ error: "Failed to save staff" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await prisma.employee.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Staff DELETE Error:", error);
    return NextResponse.json({ error: "Failed to delete staff" }, { status: 500 });
  }
}