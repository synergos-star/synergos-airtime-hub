export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const rateSetting = await prisma.systemSetting.findUnique({
      where: { settingKey: "airtime_rate" },
    });

    const airtimeRate = rateSetting ? Number(rateSetting.settingValue) : 0.93;

    return NextResponse.json({
      success: true,
      settings: {
        airtimeRate,
      },
    });
  } catch (error) {
    console.error("GET_SETTINGS_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch settings.",
      },
      { status: 500 }
    );
  }
}