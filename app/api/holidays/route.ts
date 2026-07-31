export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma"; // Using your shared Prisma connection

// GET: Fetch all holidays
export async function GET() {
  try {
    const holidays = await prisma.publicHoliday.findMany({
      orderBy: {
        date: 'asc', // Sorts by date so they appear in chronological order
      },
    });
    return NextResponse.json(holidays, { status: 200 });
  } catch (error) {
    console.error("Error fetching holidays:", error);
    return NextResponse.json({ error: "Failed to fetch holidays" }, { status: 500 });
  }
}

// POST: Create a new holiday
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, date, description, color } = body;

    if (!name || !date) {
      return NextResponse.json({ error: "Name and date are required" }, { status: 400 });
    }

    const newHoliday = await prisma.publicHoliday.create({
      data: {
        name,
        // Convert the string "YYYY-MM-DD" from the HTML input into a valid Date object
        date: new Date(date),
        description: description || "",
        color: color || "#fed7aa"
      },
    });

    return NextResponse.json(newHoliday, { status: 200 });
  } catch (error) {
    console.error("Error creating holiday:", error);
    return NextResponse.json({ error: "Failed to create holiday" }, { status: 500 });
  }
}

// DELETE: Remove a holiday
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Holiday ID is required" }, { status: 400 });
    }

    await prisma.publicHoliday.delete({
      where: {
        id: id,
      },
    });

    return NextResponse.json({ message: "Holiday deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting holiday:", error);
    return NextResponse.json({ error: "Failed to delete holiday" }, { status: 500 });
  }
}