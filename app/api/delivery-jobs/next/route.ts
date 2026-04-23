export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const agentName = String(body.agentName ?? "apk-agent-1").trim();

    const pendingJob = await prisma.deliveryJob.findFirst({
      where: {
        status: "PENDING",
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (!pendingJob) {
      return NextResponse.json({
        success: true,
        message: "No pending delivery jobs available.",
        job: null,
      });
    }

    const job = await prisma.deliveryJob.update({
      where: { id: pendingJob.id },
      data: {
        status: "PROCESSING",
        agentName,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Delivery job fetched successfully.",
      job: {
        id: job.id,
        transactionReference: job.transactionReference,
        recipientNumber: job.recipientNumber,
        operator: job.operator,
        amount: job.amount,
        ussdCode: job.ussdCode,
        status: job.status,
        agentName: job.agentName,
        createdAt: job.createdAt,
      },
    });
  } catch (error) {
    console.error("FETCH_NEXT_DELIVERY_JOB_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while fetching the next delivery job.",
      },
      { status: 500 }
    );
  }
}