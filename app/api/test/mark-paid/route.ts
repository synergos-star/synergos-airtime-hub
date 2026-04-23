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
      include: { deliveryJobs: true },
    });

    if (!transaction) {
      return NextResponse.json(
        { success: false, message: "Transaction not found." },
        { status: 404 }
      );
    }

    // Mark as paid
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        paymentStatus: "PAYMENT_SUCCESS",
        status: "PAYMENT_SUCCESS",
      },
    });

    // Prevent duplicate job
    const existingJob = transaction.deliveryJobs.find(j =>
      ["PENDING", "PROCESSING"].includes(j.status)
    );

    if (existingJob) {
      return NextResponse.json({
        success: true,
        message: "Transaction marked as paid. Existing delivery job already present.",
        jobId: existingJob.id,
      });
    }

    // Create delivery job
    const job = await prisma.deliveryJob.create({
      data: {
        transactionId: transaction.id,
        transactionReference: transaction.transactionReference,
        recipientNumber: transaction.recipientNumber,
        operator: transaction.operator,
        amount: transaction.airtimeAmount,
        ussdCode: buildUssdCode(transaction.recipientNumber, transaction.airtimeAmount),
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Transaction marked as paid and delivery job created.",
      job: {
        id: job.id,
        transactionReference: job.transactionReference,
        recipientNumber: job.recipientNumber,
        amount: job.amount,
        status: job.status,
      },
    });
  } catch (error) {
    console.error("TEST_MARK_PAID_ERROR", error);

    return NextResponse.json(
      { success: false, message: "Something went wrong." },
      { status: 500 }
    );
  }
}