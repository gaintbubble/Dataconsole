import { NextResponse } from 'next/server';
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  try {
    // @ts-ignore
    let settings = await prisma.systemSetting.findUnique({
      where: { id: 'singleton' },
    });

    if (!settings) {
      // @ts-ignore
      settings = await prisma.systemSetting.create({
        data: {
          id: 'singleton',
          orgName: 'General Hospital',
          address: '123 Healthcare Ave, Medical District',
          phone: '+1 (555) 123-4567',
          email: 'admin@generalhospital.com',
          description: 'Leading healthcare provider in the region.'
        }
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // @ts-ignore
    const settings = await prisma.systemSetting.upsert({
      where: { id: 'singleton' },
      update: {
        orgName: data.orgName,
        address: data.address,
        phone: data.phone,
        email: data.email,
        description: data.description,
        logoUrl: data.logoUrl,
        copyTo: data.copyTo || [],
        showQrCode: data.showQrCode !== undefined ? data.showQrCode : true
      },
      create: {
        id: 'singleton',
        orgName: data.orgName,
        address: data.address,
        phone: data.phone,
        email: data.email,
        description: data.description,
        logoUrl: data.logoUrl,
        copyTo: data.copyTo || [],
        showQrCode: data.showQrCode !== undefined ? data.showQrCode : true
      }
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Failed to update settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
