import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { initiateMockStkPush } from "@/lib/mpesa";

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
    });

    if (!transaction) {
      return NextResponse.json(
        { success: false, message: "Transaction not found." },
        { status: 404 }
      );
    }

    if (transaction.paymentStatus === "PAYMENT_SUCCESS") {
      return NextResponse.json(
        { success: false, message: "Payment is already completed for this transaction." },
        { status: 400 }
      );
    }

    const stk = await initiateMockStkPush({
      amount: transaction.amountToPay,
      phoneNumber: transaction.payingNumber,
      accountReference: transaction.transactionReference,
      transactionDesc: `Airtime purchase for ${transaction.recipientNumber}`,
    });

    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        merchantRequestId: stk.merchantRequestId,
        checkoutRequestId: stk.checkoutRequestId,
        paymentStatus: "PENDING_PAYMENT",
        status: "PENDING_PAYMENT",
      },
    });

    return NextResponse.json({
      success: true,
      message: stk.customerMessage,
      stk: {
        merchantRequestId: stk.merchantRequestId,
        checkoutRequestId: stk.checkoutRequestId,
        responseCode: stk.responseCode,
        responseDescription: stk.responseDescription,
      },
    });
  } catch (error) {
    console.error("MPESA_STK_PUSH_ERROR", error);

    return NextResponse.json(
      { success: false, message: "Failed to initiate STK push." },
      { status: 500 }
    );
  }
}