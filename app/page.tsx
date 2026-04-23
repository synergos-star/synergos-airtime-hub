"use client";

import { useEffect, useMemo, useState } from "react";

const FALLBACK_RATE = 0.93;
const SUPPORT_PHONE_1 = "0112371614";
const SUPPORT_PHONE_2 = "0796684318";
const SUPPORT_EMAIL = "ratiisimon@gmail.com";
const WHATSAPP_NUMBER = "254112371614";

type ServiceStatus = "LIVE" | "NO_AIRTIME" | "MAINTENANCE";

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

function formatKES(value: number) {
  if (!Number.isFinite(value)) return "KES 0.00";
  return `KSh ${value.toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

async function copyText(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    alert(`${label} copied`);
  } catch {
    alert(`Could not copy ${label}`);
  }
}

function TopLogo() {
  return (
    <div className="mb-5 text-center">
      <div className="inline-flex items-center gap-3 rounded-full bg-white/80 px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)] sm:gap-5 sm:px-6">
        <div className="relative h-12 w-12 rotate-45 rounded-2xl bg-gradient-to-br from-green-500 to-green-700 sm:h-16 sm:w-16">
          <div className="absolute inset-2 rounded-xl border-[6px] border-white border-t-transparent border-b-transparent" />
        </div>
        <div className="text-left">
          <div className="text-2xl font-black leading-none tracking-[0.16em] text-green-600 sm:text-4xl">
            SYNERGOS
          </div>
          <div className="mt-2 text-[11px] font-bold tracking-[0.32em] text-slate-900 sm:text-base sm:tracking-[0.42em]">
            AIRTIME HUB
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ badge, title, text }: { badge: string; title: string; text: string }) {
  return (
    <div className="flex items-start gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_8px_18px_rgba(15,23,42,0.04)]">
      <div className="flex h-14 w-14 min-w-14 items-center justify-center rounded-full bg-green-600 text-lg font-black text-white">
        {badge}
      </div>
      <div>
        <div className="text-lg font-black text-slate-900">{title}</div>
        <div className="mt-1 leading-7 text-slate-600">{text}</div>
      </div>
    </div>
  );
}

function WhyCard({ badge, title, text }: { badge: string; title: string; text: string }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-8 text-center shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
      <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-500 text-2xl font-black text-white sm:h-24 sm:w-24 sm:text-3xl">
        {badge}
      </div>
      <div className="text-xl font-black text-slate-900">{title}</div>
      <div className="mt-3 text-[17px] leading-8 text-slate-600">{text}</div>
    </div>
  );
}

function ServiceBanner({
  serviceStatus,
  serviceMessage,
}: {
  serviceStatus: ServiceStatus;
  serviceMessage: string;
}) {
  if (serviceStatus === "LIVE") return null;

  const styles =
    serviceStatus === "NO_AIRTIME"
      ? {
          wrap: "border-amber-200 bg-amber-50 text-amber-900",
          pill: "bg-amber-500 text-white",
          title: "No Airtime Available",
        }
      : {
          wrap: "border-red-200 bg-red-50 text-red-800",
          pill: "bg-red-600 text-white",
          title: "Under Maintenance",
        };

  return (
    <section className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
      <div className={`rounded-[24px] border px-5 py-4 shadow-sm ${styles.wrap}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className={`inline-block rounded-full px-3 py-1 text-xs font-black tracking-[0.14em] ${styles.pill}`}>
              {styles.title.toUpperCase()}
            </div>
            <div className="mt-2 text-sm font-medium sm:text-base">{serviceMessage}</div>
          </div>
          <div className="text-sm font-bold">
            Status: <span className="font-black">{serviceStatus}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

type ApiResponse = {
  success: boolean;
  message: string;
  transaction?: {
    transactionReference: string;
  };
};

type SettingsResponse = {
  success: boolean;
  settings?: {
    airtimeRate: number;
    serviceStatus: ServiceStatus;
    serviceMessage: string;
  };
};

export default function HomePage() {
  const [operator, setOperator] = useState("Safaricom");
  const [sameNumber, setSameNumber] = useState(false);
  const [payingNumber, setPayingNumber] = useState("");
  const [recipientNumber, setRecipientNumber] = useState("");
  const [amount, setAmount] = useState("250");

  const [currentRate, setCurrentRate] = useState(FALLBACK_RATE);
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>("LIVE");
  const [serviceMessage, setServiceMessage] = useState("Airtime service is available.");
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [transactionReference, setTransactionReference] = useState("");

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch("/api/settings", { cache: "no-store" });
        const data: SettingsResponse = await response.json();

        if (response.ok && data.success && data.settings) {
          setCurrentRate(data.settings.airtimeRate || FALLBACK_RATE);
          setServiceStatus(data.settings.serviceStatus || "LIVE");
          setServiceMessage(data.settings.serviceMessage || "Airtime service is available.");
        }
      } catch (error) {
        console.error("FETCH_SETTINGS_ERROR", error);
      } finally {
        setIsLoadingSettings(false);
      }
    }

    fetchSettings();
  }, []);

  const numericAmount = Number(amount || 0);
  const actualRecipientNumber = sameNumber ? payingNumber : recipientNumber;
  const serviceLive = serviceStatus === "LIVE";

  const amountToPay = useMemo(() => {
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return 0;
    return numericAmount * currentRate;
  }, [numericAmount, currentRate]);

  const payerValid = payingNumber.length === 0 ? true : isValidKenyanPhone(payingNumber);
  const recipientValid =
    actualRecipientNumber.length === 0 ? true : isValidKenyanPhone(actualRecipientNumber);
  const amountValid = amount.length === 0 ? true : Number.isFinite(numericAmount) && numericAmount > 0;

  const canProceed =
    Boolean(payingNumber) &&
    Boolean(actualRecipientNumber) &&
    Boolean(amount) &&
    payerValid &&
    recipientValid &&
    amountValid &&
    serviceLive &&
    !isSubmitting &&
    !isLoadingSettings;

  async function handleSubmit() {
    setErrorMessage("");
    setSuccessMessage("");
    setTransactionReference("");

    if (!serviceLive) {
      setErrorMessage(serviceMessage || "Service is temporarily unavailable.");
      return;
    }

    if (!canProceed) {
      setErrorMessage("Please fill all fields correctly before continuing.");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/buy-airtime", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operator,
          payingNumber,
          recipientNumber: actualRecipientNumber,
          airtimeAmount: numericAmount,
        }),
      });

      const data: ApiResponse = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(data.message || "Failed to create transaction.");
        return;
      }

      const createdReference = data.transaction?.transactionReference || "";
      setTransactionReference(createdReference);

      const stkResponse = await fetch("/api/mpesa/stk-push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactionReference: createdReference,
        }),
      });

      const stkData = await stkResponse.json();

      if (!stkResponse.ok || !stkData.success) {
        const message = String(stkData.message || "Transaction created, but STK push failed.");

        if (
          message.includes("Missing M-PESA shortcode") ||
          message.includes("Missing M-PESA consumer") ||
          message.includes("Missing M-PESA")
        ) {
          setSuccessMessage(
            "Transaction created successfully. M-PESA payment is not fully configured yet, so STK push was skipped for now."
          );
          return;
        }

        setErrorMessage(message);
        return;
      }

      setSuccessMessage("Transaction created and STK push initiated successfully.");
    } catch (error) {
      console.error("FRONTEND_SUBMIT_ERROR", error);
      setErrorMessage("Something went wrong while submitting your request.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7f5] text-slate-900">
      <section className="border-b border-slate-200 bg-[radial-gradient(circle_at_0%_15%,rgba(24,160,59,0.08),transparent_16%),radial-gradient(circle_at_100%_0%,rgba(11,125,216,0.05),transparent_20%),#f7f5f0]">
        <div className="mx-auto max-w-7xl px-4 pb-10 pt-7 sm:px-6 lg:px-8">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="text-lg font-black tracking-[0.10em] text-green-900">SYNERGOS</div>
              <div className="mt-1 text-[11px] font-bold tracking-[0.34em] text-slate-900">
                AIRTIME HUB
              </div>
            </div>
            <div className="w-20 sm:w-36" />
          </div>

          <TopLogo />

          <div className="mx-auto max-w-5xl text-center">
            <div className="text-4xl font-black leading-tight text-slate-900 sm:text-6xl lg:text-[68px]">
              Instant Airtime.
            </div>
            <div className="mt-1 text-4xl font-black leading-tight sm:text-6xl lg:text-[68px]">
              <span className="text-sky-600">Anytime</span>, Anywhere.
            </div>
            <div className="mt-1 text-4xl font-black leading-tight text-green-600 sm:text-6xl lg:text-[68px]">
              Enjoy flexible live rates.
            </div>

            <p className="mx-auto mt-5 max-w-4xl text-base leading-8 text-slate-700 sm:text-xl">
              Buy <span className="font-extrabold text-green-600">Safaricom</span>,{" "}
              <span className="font-extrabold text-red-600">Airtel</span> or{" "}
              <span className="font-extrabold text-sky-600">Telkom</span> airtime for yourself
              or any other number directly from your{" "}
              <span className="font-black text-green-600">M-PESA</span>.
            </p>

            <div className="mt-7">
              <a
                href="#buy"
                className="inline-block rounded-full bg-green-600 px-8 py-4 text-lg font-black text-white shadow-[0_14px_32px_rgba(18,154,49,0.18)] transition hover:bg-green-700 sm:px-10 sm:text-2xl"
              >
                BUY AIRTIME NOW
              </a>
            </div>
          </div>
        </div>
      </section>

      <ServiceBanner serviceStatus={serviceStatus} serviceMessage={serviceMessage} />

      <section className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[34px] bg-[linear-gradient(135deg,#012615_0%,#042816_35%,#07572d_100%)] shadow-[0_18px_44px_rgba(2,38,21,0.20)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_34%,rgba(90,255,140,0.16),transparent_16%),radial-gradient(circle_at_58%_54%,rgba(255,255,255,0.05),transparent_18%),radial-gradient(circle_at_18%_30%,rgba(255,255,255,0.03),transparent_30%)]" />
          <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(rgba(120,255,160,0.35)_1px,transparent_1px)] [background-size:14px_14px]" />

          <div className="relative grid gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:px-10 lg:py-10">
            <div>
              <div className="text-3xl font-black leading-tight text-white sm:text-[34px]">
                TOP UP INSTANTLY.
              </div>
              <div className="mt-1 text-3xl font-black leading-tight text-green-400 sm:text-[34px]">
                LIVE RATES.
              </div>

              <p className="mt-4 max-w-md text-base leading-8 text-emerald-50 sm:text-lg">
                Buy Safaricom, Airtel or Telkom airtime directly from your M-PESA.
              </p>

              <div className="mt-7 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-black text-green-700">
                    RATE
                  </div>
                  <div className="mt-3 text-sm font-extrabold text-white">Current Rate</div>
                  <div className="mt-1 text-xs text-emerald-100">
                    {(currentRate * 100).toFixed(1)}%
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-black text-green-700">
                    SAFE
                  </div>
                  <div className="mt-3 text-sm font-extrabold text-white">Secure Payments</div>
                  <div className="mt-1 text-xs text-emerald-100">Safe and trusted</div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-black text-green-700">
                    24/7
                  </div>
                  <div className="mt-3 text-sm font-extrabold text-white">Availability</div>
                  <div className="mt-1 text-xs text-emerald-100">
                    {serviceStatus === "LIVE" ? "Service live" : "Check notice"}
                  </div>
                </div>
              </div>
            </div>

            <div className="relative min-h-[420px] sm:min-h-[450px]">
              <div className="absolute left-14 top-2 h-[140px] w-[195px] rotate-[-4deg] rounded-[22px] bg-gradient-to-br from-green-400 to-green-700 p-5 text-white shadow-[0_20px_38px_rgba(0,0,0,0.28)] ring-1 ring-white/10">
                <div className="text-lg font-black">Safaricom</div>
                <div className="mt-5 text-[13px] opacity-90">Airtime</div>
                <div className="mt-2 text-[28px] font-black">500</div>
                <div className="absolute right-4 top-4 text-[11px] opacity-75">KSh</div>
              </div>

              <div className="absolute left-3 top-36 h-[125px] w-[178px] rotate-[-6deg] rounded-[22px] bg-gradient-to-br from-orange-400 to-red-700 p-5 text-white shadow-[0_20px_38px_rgba(0,0,0,0.28)] ring-1 ring-white/10">
                <div className="text-lg font-black">Airtel</div>
                <div className="mt-5 text-[13px] opacity-90">Airtime</div>
                <div className="mt-2 text-[28px] font-black">500</div>
              </div>

              <div className="absolute left-36 top-56 h-[125px] w-[182px] rotate-[-5deg] rounded-[22px] bg-gradient-to-br from-sky-400 to-blue-700 p-5 text-white shadow-[0_20px_38px_rgba(0,0,0,0.28)] ring-1 ring-white/10">
                <div className="text-lg font-black">Telkom</div>
                <div className="mt-5 text-[13px] opacity-90">Airtime</div>
                <div className="mt-2 text-[28px] font-black">500</div>
              </div>

              <div className="absolute right-2 top-2 h-[330px] w-[205px] overflow-hidden rounded-[34px] border-[6px] border-slate-900 bg-gradient-to-b from-green-700 to-green-900 shadow-[0_24px_48px_rgba(0,0,0,0.30)]">
                <div className="mx-auto h-[10px] w-[86px] rounded-b-xl bg-slate-900" />
                <div className="mx-auto mt-10 flex h-[98px] w-[98px] items-center justify-center rounded-full bg-gradient-to-b from-green-300 to-green-500 text-3xl font-black text-white shadow-[0_12px_24px_rgba(0,0,0,0.20)]">
                  OK
                </div>
                <div className="mt-6 text-center text-[22px] font-extrabold leading-8 text-white">
                  Payment
                  <br />
                  Successful
                </div>
              </div>

              <div className="absolute bottom-2 right-0 rounded-[20px] border border-slate-200 bg-white px-6 py-3 text-xl font-black shadow-[0_16px_32px_rgba(0,0,0,0.22)] sm:text-[28px]">
                PAY WITH <span className="text-green-700">M-PESA</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="buy" className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[620px] rounded-[30px] border border-slate-200 bg-white px-5 py-8 shadow-[0_18px_40px_rgba(15,23,42,0.07)] sm:px-7">
          <div className="grid gap-5">
            <div>
              <label className="mb-2 block font-extrabold">
                Select Operator : Safaricom, Airtel, Telkom
              </label>
              <select
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                className="h-[60px] w-full rounded-2xl border border-slate-300 bg-white px-4 text-base outline-none"
                disabled={!serviceLive}
              >
                <option>Safaricom</option>
                <option>Airtel</option>
                <option>Telkom</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block font-extrabold">
                From: Mobile number (To charge)
              </label>
              <input
                type="text"
                placeholder="Enter phone number"
                value={payingNumber}
                onChange={(e) => setPayingNumber(e.target.value)}
                disabled={!serviceLive}
                className="h-[60px] w-full rounded-2xl border border-slate-300 px-4 text-base outline-none disabled:bg-slate-100"
              />
              {!payerValid && (
                <p className="mt-2 text-sm text-red-600">Enter a valid Kenyan mobile number.</p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <input
                id="same-number"
                type="checkbox"
                checked={sameNumber}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setSameNumber(checked);
                  if (checked) setRecipientNumber("");
                }}
                disabled={!serviceLive}
              />
              <label htmlFor="same-number" className="font-bold text-slate-600">
                Use same number to receive airtime
              </label>
            </div>

            <div>
              <label className="mb-2 block font-extrabold">To: Enter Mobile number</label>
              <input
                type="text"
                placeholder="Enter recipient's number"
                value={recipientNumber}
                onChange={(e) => setRecipientNumber(e.target.value)}
                disabled={sameNumber || !serviceLive}
                className={`h-[60px] w-full rounded-2xl border border-slate-300 px-4 text-base outline-none ${
                  sameNumber || !serviceLive ? "bg-slate-100" : "bg-white"
                }`}
              />
              {!recipientValid && !sameNumber && (
                <p className="mt-2 text-sm text-red-600">Enter a valid Kenyan mobile number.</p>
              )}
            </div>

            <div>
              <label className="mb-2 block font-extrabold">Enter Amount (KES)</label>
              <input
                type="number"
                min="1"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={!serviceLive}
                className="h-[60px] w-full rounded-2xl border border-slate-300 px-4 text-base outline-none disabled:bg-slate-100"
              />
              {!amountValid && (
                <p className="mt-2 text-sm text-red-600">
                  Enter a valid airtime amount greater than zero.
                </p>
              )}
            </div>

            <div className="flex flex-wrap justify-center gap-2.5">
              {[100, 200, 500, 1000].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setAmount(String(preset))}
                  className="min-w-[62px] rounded-xl border border-slate-300 bg-white px-4 py-2 font-bold disabled:bg-slate-100"
                  type="button"
                  disabled={!serviceLive}
                >
                  {preset}
                </button>
              ))}
            </div>

            {errorMessage && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                <div className="font-bold">{successMessage}</div>
                {transactionReference && (
                  <div className="mt-1">
                    Transaction Reference:{" "}
                    <span className="font-extrabold">{transactionReference}</span>
                  </div>
                )}
              </div>
            )}

            <div className="rounded-[18px] border border-green-200 bg-gradient-to-b from-green-50 to-green-100 p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-base font-black text-green-700">You will pay</div>
                <div className="text-2xl font-black text-green-700">{formatKES(amountToPay)}</div>
              </div>

              <div className="mt-3 space-y-1 text-slate-700">
                <div className="flex justify-between gap-3">
                  <span>Airtime value</span>
                  <span>{formatKES(numericAmount)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Rate</span>
                  <span>{(currentRate * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>

            <button
              disabled={!canProceed}
              onClick={handleSubmit}
              className={`h-[60px] w-full rounded-2xl text-[19px] font-black text-white ${
                canProceed
                  ? "bg-gradient-to-r from-green-600 to-green-700 shadow-[0_14px_30px_rgba(31,159,50,0.18)]"
                  : "bg-slate-400"
              }`}
              type="button"
            >
              {isSubmitting
                ? "Creating Transaction..."
                : isLoadingSettings
                ? "Loading settings..."
                : serviceLive
                ? "BUY AIRTIME NOW"
                : serviceStatus === "NO_AIRTIME"
                ? "NO AIRTIME AVAILABLE"
                : "UNDER MAINTENANCE"}
            </button>
          </div>

          <div className="mt-4 text-center text-[15px] text-slate-500">
            {serviceLive
              ? "STK push will be sent to your M-PESA number. Airtime will be delivered instantly."
              : serviceMessage}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <InfoCard badge="FAST" title="Instant Delivery" text="Airtime is delivered instantly after successful payment verification." />
          <InfoCard badge="%" title="Best Rates" text="Enjoy live admin-controlled rates across the platform." />
          <InfoCard badge="LOCK" title="Secure Payments" text="100% secure M-PESA payments with advanced protection." />
          <InfoCard badge="HELP" title="24/7 Support" text="We are always here to help you whenever you need us." />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-slate-200 bg-[#eef3ee] px-5 py-6 sm:px-6">
          <div className="text-base font-extrabold text-green-800">WHY CHOOSE US</div>
          <div className="mt-2 text-3xl font-black text-green-950 sm:text-5xl">
            The Smarter Way to Top Up
          </div>
          <div className="mt-3 h-[5px] w-[70px] rounded-full bg-green-600" />

          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <WhyCard badge="FAST" title="Instant Delivery" text="Airtime is delivered instantly after successful payment verification." />
            <WhyCard badge="%" title="Live Rate" text="Your admin can update the rate and the site reflects it immediately." />
            <WhyCard badge="LOCK" title="Secure Payments" text="100% secure M-PESA payments with advanced protection." />
            <WhyCard badge="HELP" title="24/7 Support" text="We are always here to help you whenever you need us." />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.9fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
            <div className="text-3xl font-black sm:text-[40px]">How It Works</div>
            <div className="mt-5 grid gap-4">
              {[
                ["Enter your M-PESA number", "This is the number that will receive the STK push."],
                ["Choose the recipient", "Select the number that will receive the airtime."],
                ["Enter airtime amount", "Type the amount you want to buy."],
                ["Confirm and Pay", "Confirm details, pay via M-PESA and get airtime instantly."],
              ].map(([title, text], index) => (
                <div key={title} className="flex items-start gap-4">
                  <div className="flex h-[34px] w-[34px] min-w-[34px] items-center justify-center rounded-full bg-green-600 font-black text-white">
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-xl font-extrabold sm:text-[22px]">{title}</div>
                    <div className="mt-1 leading-7 text-slate-500">{text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
            <div className="text-3xl font-black sm:text-[40px]">Need Help?</div>
            <div className="mt-2 text-lg text-slate-500">Tap to contact us instantly</div>

            <div className="mt-5 grid gap-4">
              <div className="rounded-[18px] border border-green-200 bg-green-50 p-5">
                <div className="text-[22px] font-black">Call Support</div>
                <div className="mt-1 text-slate-500">Tap to call or copy</div>
                <div className="mt-4 flex flex-wrap gap-2.5">
                  <a href={`tel:${SUPPORT_PHONE_1}`} className="rounded-xl bg-green-600 px-4 py-3 font-extrabold text-white">Call 1</a>
                  <a href={`tel:${SUPPORT_PHONE_2}`} className="rounded-xl bg-sky-600 px-4 py-3 font-extrabold text-white">Call 2</a>
                  <button
                    onClick={() => copyText(`${SUPPORT_PHONE_1} / ${SUPPORT_PHONE_2}`, "Support numbers")}
                    className="rounded-xl bg-slate-900 px-4 py-3 font-extrabold text-white"
                    type="button"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="rounded-[18px] border border-green-200 bg-green-50 p-5">
                <div className="text-[22px] font-black">WhatsApp</div>
                <div className="mt-1 text-slate-500">Tap to chat on WhatsApp</div>
                <div className="mt-4">
                  <a
                    href={`https://wa.me/${WHATSAPP_NUMBER}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block rounded-xl bg-[#25D366] px-4 py-3 font-extrabold text-white"
                  >
                    Open WhatsApp
                  </a>
                </div>
              </div>

              <div className="rounded-[18px] border border-green-200 bg-green-50 p-5">
                <div className="text-[22px] font-black">Email Support</div>
                <div className="mt-1 text-slate-500">Tap to email or copy</div>
                <div className="mt-4 flex flex-wrap gap-2.5">
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="rounded-xl bg-green-600 px-4 py-3 font-extrabold text-white">Email</a>
                  <button
                    onClick={() => copyText(SUPPORT_EMAIL, "Support email")}
                    className="rounded-xl bg-slate-900 px-4 py-3 font-extrabold text-white"
                    type="button"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="px-4 pb-7 pt-9 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <div className="text-xl font-bold text-slate-700 sm:text-[22px]">
            Copyright © SYNERGOS AIRTIME HUB
          </div>
          <div className="mt-3 text-lg text-slate-500">Share on social</div>
          <div className="mt-5 flex flex-wrap justify-center gap-4">
            {["T", "F", "X", "I"].map((item, index) => (
              <div
                key={index}
                className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-white text-2xl font-black text-slate-900 shadow-[0_8px_18px_rgba(15,23,42,0.05)]"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}