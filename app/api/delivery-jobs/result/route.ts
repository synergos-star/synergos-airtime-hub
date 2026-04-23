export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const jobId = Number(body.jobId ?? 0);
    const status = String(body.status ?? "").trim().toUpperCase();
    const providerResponse = body.providerResponse ? String(body.providerResponse) : null;
    const failureReason = body.failureReason ? String(body.failureReason) : null;
    const deliveryReference = body.deliveryReference ? String(body.deliveryReference) : null;

    if (!Number.isFinite(jobId) || jobId <= 0) {
      return NextResponse.json(
        { success: false, message: "A valid jobId is required." },
        { status: 400 }
      );
    }

    if (!["SUCCESS", "FAILED"].includes(status)) {
      return NextResponse.json(
        { success: false, message: "Status must be SUCCESS or FAILED." },
        { status: 400 }
      );
    }

    const job = await prisma.deliveryJob.findUnique({
      where: { id: jobId },
      include: {
        transaction: true,
      },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, message: "Delivery job not found." },
        { status: 404 }
      );
    }

    if (status === "SUCCESS") {
      const updatedJob = await prisma.deliveryJob.update({
        where: { id: job.id },
        data: {
          status: "SUCCESS",
          providerResponse,
          failureReason: null,
          executedAt: new Date(),
        },
      });

      await prisma.transaction.update({
        where: { id: job.transactionId },
        data: {
          deliveryStatus: "DELIVERY_SUCCESS",
          status: "DELIVERY_SUCCESS",
          deliveryReference,
          deliveryFailureReason: null,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Delivery job marked as successful.",
        job: {
          id: updatedJob.id,
          status: updatedJob.status,
          executedAt: updatedJob.executedAt,
        },
      });
    }

    const updatedJob = await prisma.deliveryJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        providerResponse,
        failureReason: failureReason || "Delivery failed.",
        executedAt: new Date(),
        retryCount: {
          increment: 1,
        },
      },
    });

    await prisma.transaction.update({
      where: { id: job.transactionId },
      data: {
        deliveryStatus: "DELIVERY_FAILED",
        status: "PAYMENT_SUCCESS",
        deliveryFailureReason: failureReason || "Delivery failed.",
        retryCount: {
          increment: 1,
        },
        lastRetryAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Delivery job marked as failed.",
      job: {
        id: updatedJob.id,
        status: updatedJob.status,
        executedAt: updatedJob.executedAt,
        retryCount: updatedJob.retryCount,
      },
    });
  } catch (error) {
    console.error("DELIVERY_JOB_RESULT_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while saving the delivery result.",
      },
      { status: 500 }
    );
  }
}