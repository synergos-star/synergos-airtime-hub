export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const FALLBACK_RATE = 0.93;

export async function GET() {
  try {
    const [rateSetting, statusSetting, messageSetting, balanceSetting] = await Promise.all([
      prisma.systemSetting.findUnique({ where: { settingKey: "airtime_rate" } }),
      prisma.systemSetting.findUnique({ where: { settingKey: "service_status" } }),
      prisma.systemSetting.findUnique({ where: { settingKey: "service_message" } }),
      prisma.systemSetting.findUnique({ where: { settingKey: "airtime_balance" } }),
    ]);

    const airtimeRate = rateSetting ? Number(rateSetting.settingValue) : FALLBACK_RATE;
    const serviceStatus = statusSetting?.settingValue || "LIVE";
    const serviceMessage = messageSetting?.settingValue || "Airtime service is available.";
    const airtimeBalance = balanceSetting ? Number(balanceSetting.settingValue) : 0;

    return NextResponse.json({
      success: true,
      settings: {
        airtimeRate: Number.isFinite(airtimeRate) ? airtimeRate : FALLBACK_RATE,
        serviceStatus,
        serviceMessage,
        airtimeBalance: Number.isFinite(airtimeBalance) ? airtimeBalance : 0,
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