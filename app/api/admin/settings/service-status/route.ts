export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = ["LIVE", "NO_AIRTIME", "MAINTENANCE"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const serviceStatus = String(body.serviceStatus ?? "").trim().toUpperCase();
    const serviceMessage = String(body.serviceMessage ?? "").trim();
    const airtimeBalance = Number(body.airtimeBalance ?? 0);

    if (!VALID_STATUSES.includes(serviceStatus)) {
      return NextResponse.json(
        {
          success: false,
          message: "serviceStatus must be LIVE, NO_AIRTIME, or MAINTENANCE.",
        },
        { status: 400 }
      );
    }

    if (!Number.isFinite(airtimeBalance) || airtimeBalance < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "airtimeBalance must be a valid number not less than 0.",
        },
        { status: 400 }
      );
    }

    await prisma.systemSetting.upsert({
      where: { settingKey: "service_status" },
      update: { settingValue: serviceStatus },
      create: { settingKey: "service_status", settingValue: serviceStatus },
    });

    await prisma.systemSetting.upsert({
      where: { settingKey: "service_message" },
      update: { settingValue: serviceMessage || "Service status updated." },
      create: {
        settingKey: "service_message",
        settingValue: serviceMessage || "Service status updated.",
      },
    });

    await prisma.systemSetting.upsert({
      where: { settingKey: "airtime_balance" },
      update: { settingValue: airtimeBalance.toString() },
      create: {
        settingKey: "airtime_balance",
        settingValue: airtimeBalance.toString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Service status updated successfully.",
      settings: {
        serviceStatus,
        serviceMessage: serviceMessage || "Service status updated.",
        airtimeBalance,
      },
    });
  } catch (error) {
    console.error("UPDATE_SERVICE_STATUS_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update service status.",
      },
      { status: 500 }
    );
  }
}