export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(departments, { status: 200 });
  } catch (error) {
    console.error("Department GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch departments" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    const department = data.id 
      ? await prisma.department.update({
          where: { id: data.id },
          data: { 
            name: data.name, 
            code: data.code,
            shiftTimings: data.shiftTimings // Now accepts JSON arrays!
          }
        })
      : await prisma.department.create({
          data: { 
            name: data.name, 
            code: data.code,
            shiftTimings: data.shiftTimings 
          }
        });
        
    return NextResponse.json(department, { status: 200 });
  } catch (error) {
    console.error("Department POST Error:", error);
    return NextResponse.json({ error: "Failed to save department" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await prisma.department.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Department DELETE Error:", error);
    return NextResponse.json({ error: "Failed to delete department" }, { status: 500 });
  }
}