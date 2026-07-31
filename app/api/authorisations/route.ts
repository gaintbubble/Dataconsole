export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  try {
    const authorisations = await prisma.authorisation.findMany({
      orderBy: [
        { department: 'asc' },
        { isDefault: 'desc' },
        { personName: 'asc' }
      ]
    });
    return NextResponse.json(authorisations, { status: 200 });
  } catch (error) {
    console.error("Authorisation GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch authorisations" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const isDefault = data.isDefault === true;

    // If this person is set as default, remove default from everyone else in this department
    if (isDefault) {
      await prisma.authorisation.updateMany({
        where: { department: data.department },
        data: { isDefault: false }
      });
    }
    
    const authData = {
      department: data.department,
      personName: data.personName, 
      designation: data.designation,
      departmentTitle: data.departmentTitle,
      isDefault: isDefault 
    };

    const authorisation = data.id 
      ? await prisma.authorisation.update({
          where: { id: data.id },
          data: authData
        })
      : await prisma.authorisation.create({
          data: authData
        });
        
    return NextResponse.json(authorisation, { status: 200 });
  } catch (error) {
    console.error("Authorisation POST Error:", error);
    return NextResponse.json({ error: "Failed to save authorisation" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await prisma.authorisation.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Authorisation DELETE Error:", error);
    return NextResponse.json({ error: "Failed to delete authorisation" }, { status: 500 });
  }
}