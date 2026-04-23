function normalizeKenyanPhone(value: string) {
  const cleaned = value.replace(/\D/g, "");

  if (cleaned.startsWith("254") && cleaned.length === 12) return cleaned;
  if (cleaned.startsWith("0") && cleaned.length === 10) return `254${cleaned.slice(1)}`;
  if (cleaned.length === 9) return `254${cleaned}`;
  return cleaned;
}

function getTimestamp() {
  const now = new Date();
  const yyyy = now.getFullYear().toString();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}${hh}${mi}${ss}`;
}

function getBaseUrl() {
  const env = (process.env.MPESA_ENV || "sandbox").toLowerCase();
  return env === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";
}

export async function getMpesaAccessToken() {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    throw new Error("Missing M-PESA consumer key or secret.");
  }

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
  const url = `${getBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Basic ${auth}`,
    },
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok || !data.access_token) {
    throw new Error(data.errorMessage || "Failed to get M-PESA access token.");
  }

  return data.access_token as string;
}

type RealStkPushPayload = {
  amount: number;
  phoneNumber: string;
  accountReference: string;
  transactionDesc: string;
};

export async function initiateRealStkPush(payload: RealStkPushPayload) {
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  const callbackUrl = process.env.MPESA_CALLBACK_URL;

  if (!shortcode || !passkey || !callbackUrl) {
    throw new Error("Missing M-PESA shortcode, passkey, or callback URL.");
  }

  const normalizedPhone = normalizeKenyanPhone(payload.phoneNumber);

  if (!normalizedPhone || normalizedPhone.length !== 12) {
    throw new Error("Invalid phone number for STK push.");
  }

  if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
    throw new Error("Invalid amount for STK push.");
  }

  const timestamp = getTimestamp();
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
  const accessToken = await getMpesaAccessToken();

  const url = `${getBaseUrl()}/mpesa/stkpush/v1/processrequest`;

  const body = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: Math.round(payload.amount),
    PartyA: normalizedPhone,
    PartyB: shortcode,
    PhoneNumber: normalizedPhone,
    CallBackURL: callbackUrl,
    AccountReference: payload.accountReference,
    TransactionDesc: payload.transactionDesc,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok || data.ResponseCode !== "0") {
    throw new Error(data.errorMessage || data.ResponseDescription || "Failed to initiate STK push.");
  }

  return {
    success: true,
    merchantRequestId: data.MerchantRequestID as string,
    checkoutRequestId: data.CheckoutRequestID as string,
    responseCode: data.ResponseCode as string,
    responseDescription: data.ResponseDescription as string,
    customerMessage: data.CustomerMessage as string,
  };
}