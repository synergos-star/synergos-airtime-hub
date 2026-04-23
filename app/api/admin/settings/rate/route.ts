export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const airtimeRate = Number(body.airtimeRate ?? 0);

    if (!Number.isFinite(airtimeRate) || airtimeRate <= 0 || airtimeRate > 1) {
      return NextResponse.json(
        {
          success: false,
          message: "airtimeRate must be a number greater than 0 and not more than 1.",
        },
        { status: 400 }
      );
    }

    const updated = await prisma.systemSetting.upsert({
      where: { settingKey: "airtime_rate" },
      update: {
        settingValue: airtimeRate.toString(),
      },
      create: {
        settingKey: "airtime_rate",
        settingValue: airtimeRate.toString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Airtime rate updated successfully.",
      setting: {
        key: updated.settingKey,
        value: Number(updated.settingValue),
      },
    });
  } catch (error) {
    console.error("UPDATE_RATE_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update airtime rate.",
      },
      { status: 500 }
    );
  }
}