type StkPushPayload = {
  amount: number;
  phoneNumber: string;
  accountReference: string;
  transactionDesc: string;
};

type MockStkPushResult = {
  success: boolean;
  merchantRequestId: string;
  checkoutRequestId: string;
  responseCode: string;
  responseDescription: string;
  customerMessage: string;
};

function normalizeKenyanPhone(value: string) {
  const cleaned = value.replace(/\D/g, "");

  if (cleaned.startsWith("254") && cleaned.length === 12) return cleaned;
  if (cleaned.startsWith("0") && cleaned.length === 10) return `254${cleaned.slice(1)}`;
  if (cleaned.length === 9) return `254${cleaned}`;
  return cleaned;
}

function makeId(prefix: string) {
  const stamp = Date.now().toString();
  const rand = Math.floor(Math.random() * 900000 + 100000).toString();
  return `${prefix}-${stamp}-${rand}`;
}

export async function initiateMockStkPush(
  payload: StkPushPayload
): Promise<MockStkPushResult> {
  const normalizedPhone = normalizeKenyanPhone(payload.phoneNumber);

  if (!normalizedPhone || normalizedPhone.length !== 12) {
    throw new Error("Invalid phone number for STK push.");
  }

  if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
    throw new Error("Invalid amount for STK push.");
  }

  return {
    success: true,
    merchantRequestId: makeId("MERCHANT"),
    checkoutRequestId: makeId("CHECKOUT"),
    responseCode: "0",
    responseDescription: "Success. Request accepted for processing.",
    customerMessage: "Success. STK push request accepted.",
  };
}