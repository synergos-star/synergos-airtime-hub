import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function extractMetadataValue(items: any[], name: string) {
  const found = items.find((item) => item.Name === name);
  return found?.Value ?? null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const stkCallback = body?.Body?.stkCallback;
    const checkoutRequestId = stkCallback?.CheckoutRequestID;
    const resultCode = stkCallback?.ResultCode;
    const resultDesc = stkCallback?.ResultDesc;
    const metadataItems = stkCallback?.CallbackMetadata?.Item ?? [];

    if (!checkoutRequestId) {
      return NextResponse.json(
        { success: false, message: "Missing CheckoutRequestID in callback." },
        { status: 400 }
      );
    }

    const transaction = await prisma.transaction.findFirst({
      where: { checkoutRequestId },
    });

    if (!transaction) {
      return NextResponse.json(
        { success: false, message: "Transaction not found for callback." },
        { status: 404 }
      );
    }

    if (Number(resultCode) === 0) {
      const mpesaReceipt = extractMetadataValue(metadataItems, "MpesaReceiptNumber");

      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          paymentStatus: "PAYMENT_SUCCESS",
          deliveryStatus: "NOT_SENT",
          status: "PAYMENT_SUCCESS",
          mpesaReceipt: mpesaReceipt ? String(mpesaReceipt) : null,
          failureReason: null,
        },
      });
    } else {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          paymentStatus: "PAYMENT_FAILED",
          status: "PAYMENT_FAILED",
          failureReason: resultDesc ? String(resultDesc) : "Payment failed.",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Callback processed successfully.",
    });
  } catch (error) {
    console.error("MPESA_CALLBACK_ERROR", error);

    return NextResponse.json(
      { success: false, message: "Failed to process callback." },
      { status: 500 }
    );
  }
}