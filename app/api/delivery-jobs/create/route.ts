export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function buildUssdCode(recipientNumber: string, amount: number) {
  return `*180*6*5*${recipientNumber}*${Math.round(amount)}*1*PIN#`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const transactionReference = String(body.transactionReference ?? "").trim();

    if (!transactionReference) {
      return NextResponse.json(
        { success: false, message: "Transaction reference is required." },
        { status: 400 }
      );
    }

    const transaction = await prisma.transaction.findUnique({
      where: { transactionReference },
      include: {
        deliveryJobs: {
          where: {
            status: {
              in: ["PENDING", "PROCESSING"],
            },
          },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { success: false, message: "Transaction not found." },
        { status: 404 }
      );
    }

    if (transaction.paymentStatus !== "PAYMENT_SUCCESS") {
      return NextResponse.json(
        {
          success: false,
          message: "Delivery job can only be created after successful payment.",
        },
        { status: 400 }
      );
    }

    if (transaction.deliveryStatus === "DELIVERY_SUCCESS") {
      return NextResponse.json(
        { success: false, message: "Airtime has already been delivered." },
        { status: 400 }
      );
    }

    if (transaction.deliveryJobs.length > 0) {
      return NextResponse.json(
        { success: false, message: "A pending delivery job already exists." },
        { status: 400 }
      );
    }

    const job = await prisma.deliveryJob.create({
      data: {
        transactionId: transaction.id,
        transactionReference: transaction.transactionReference,
        recipientNumber: transaction.recipientNumber,
        operator: transaction.operator,
        amount: transaction.airtimeAmount,
        ussdCode: buildUssdCode(transaction.recipientNumber, transaction.airtimeAmount),
        status: "PENDING",
        retryCount: transaction.retryCount,
      },
    });

    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        deliveryStatus: "PENDING",
        status: "PAYMENT_SUCCESS",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Delivery job created successfully.",
      job: {
        id: job.id,
        transactionReference: job.transactionReference,
        recipientNumber: job.recipientNumber,
        operator: job.operator,
        amount: job.amount,
        status: job.status,
        createdAt: job.createdAt,
      },
    });
  } catch (error) {
    console.error("CREATE_DELIVERY_JOB_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while creating the delivery job.",
      },
      { status: 500 }
    );
  }
}