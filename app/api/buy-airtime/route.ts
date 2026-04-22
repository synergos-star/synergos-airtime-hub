import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_RATE = 0.93;

function normalizeKenyanPhone(value: string) {
  const cleaned = value.replace(/\D/g, "");

  if (cleaned.startsWith("254") && cleaned.length === 12) return `+${cleaned}`;
  if (cleaned.startsWith("0") && cleaned.length === 10) return `+254${cleaned.slice(1)}`;
  if (cleaned.length === 9) return `+254${cleaned}`;
  return value;
}

function isValidKenyanPhone(value: string) {
  const normalized = normalizeKenyanPhone(value);
  return /^\+254(7\d{8}|1\d{8})$/.test(normalized);
}

function makeReference() {
  const stamp = Date.now().toString().slice(-8);
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `SYN-${stamp}-${rand}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const operator = String(body.operator ?? "").trim();
    const payingNumberRaw = String(body.payingNumber ?? "").trim();
    const recipientNumberRaw = String(body.recipientNumber ?? "").trim();
    const airtimeAmount = Number(body.airtimeAmount ?? 0);

    const payingNumber = normalizeKenyanPhone(payingNumberRaw);
    const recipientNumber = normalizeKenyanPhone(recipientNumberRaw);

    if (!operator) {
      return NextResponse.json(
        { success: false, message: "Operator is required." },
        { status: 400 }
      );
    }

    if (!["Safaricom", "Airtel", "Telkom"].includes(operator)) {
      return NextResponse.json(
        { success: false, message: "Invalid operator selected." },
        { status: 400 }
      );
    }

    if (!isValidKenyanPhone(payingNumber)) {
      return NextResponse.json(
        { success: false, message: "Invalid M-PESA payment number." },
        { status: 400 }
      );
    }

    if (!isValidKenyanPhone(recipientNumber)) {
      return NextResponse.json(
        { success: false, message: "Invalid airtime recipient number." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(airtimeAmount) || airtimeAmount <= 0) {
      return NextResponse.json(
        { success: false, message: "Airtime amount must be greater than zero." },
        { status: 400 }
      );
    }

    const amountToPay = Number((airtimeAmount * DEFAULT_RATE).toFixed(2));
    const transactionReference = makeReference();

    const transaction = await prisma.transaction.create({
      data: {
        transactionReference,
        recipientNumber,
        payingNumber,
        operator,
        airtimeAmount,
        rateUsed: DEFAULT_RATE,
        amountToPay,

        paymentStatus: "PENDING_PAYMENT",
        deliveryStatus: "NOT_SENT",
        status: "PENDING_PAYMENT",

        retryCount: 0,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Transaction created successfully.",
      transaction: {
        id: transaction.id,
        transactionReference: transaction.transactionReference,
        recipientNumber: transaction.recipientNumber,
        payingNumber: transaction.payingNumber,
        operator: transaction.operator,
        airtimeAmount: transaction.airtimeAmount,
        rateUsed: transaction.rateUsed,
        amountToPay: transaction.amountToPay,
        paymentStatus: transaction.paymentStatus,
        deliveryStatus: transaction.deliveryStatus,
        retryCount: transaction.retryCount,
        status: transaction.status,
        createdAt: transaction.createdAt,
      },
    });
  } catch (error) {
    console.error("BUY_AIRTIME_API_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while creating the transaction.",
      },
      { status: 500 }
    );
  }
}