import { describe, expect, it } from "vitest";

import {
  maskAccount,
  maskDigits,
  redactBankCall,
  redactEthqrReceipt,
  redactPayment,
  redactPaymentsAdmin,
  redactsPath,
  summarizePayload,
} from "@/lib/zakat/redact";

import { ethqrReceipt, livePayment, rawBankCall, sandboxPayment } from "./fixtures/payments-admin";

describe("maskDigits", () => {
  it("keeps the last 4 digits of account and phone numbers", () => {
    expect(maskDigits("Account 1000123456789 not found")).toBe("Account ••••6789 not found");
    expect(maskDigits("Call 251911223344")).toBe("Call ••••3344");
  });

  it("leaves short numbers such as amounts and codes alone", () => {
    expect(maskDigits("HTTP 504 after 30000 ms, ETB 12345678")).toBe("HTTP 504 after 30000 ms, ETB 12345678");
  });
});

describe("maskAccount", () => {
  it("shows only the last 4 digits", () => {
    expect(maskAccount("1000123456789")).toBe("••••6789");
  });

  it("returns null for nothing and keeps a short value", () => {
    expect(maskAccount("")).toBeNull();
    expect(maskAccount(null)).toBeNull();
    expect(maskAccount("1234")).toBe("1234");
  });
});

describe("summarizePayload", () => {
  it("picks status, amounts and references from an EthQR answer and drops the rest", () => {
    const fields = summarizePayload(livePayment.providerResponse);
    const labels = fields.map((field) => field.label);
    expect(fields).toContainEqual({ label: "State", value: "PAID" });
    expect(fields).toContainEqual({ label: "Amount matches", value: "Yes" });
    expect(fields).toContainEqual({ label: "Reference number", value: "087N1108B41****8002" });
    expect(labels).not.toContain("Puid");
    expect(labels.some((label) => /payer|end to end|biz|puid|order id/i.test(label))).toBe(false);
  });

  it("keeps references whole but masks long digit runs in messages", () => {
    const fields = summarizePayload(rawBankCall.response);
    expect(fields).toContainEqual({ label: "FT number", value: "FT26308ABCDE" });
    expect(fields).toContainEqual({ label: "Message", value: "Timeout waiting for core, account ••••4321" });
  });

  it("names a field by its parent only when two fields would share a name", () => {
    expect(summarizePayload({ status: "OK", transaction: { status: "COMPLETED", amount: 5 } })).toEqual([
      { label: "Status", value: "OK" },
      { label: "Transaction status", value: "COMPLETED" },
      { label: "Amount", value: "5" },
    ]);
  });

  it("gives nothing for text that isn't JSON", () => {
    expect(summarizePayload("<soap:Envelope>1000123456789</soap:Envelope>")).toEqual([]);
    expect(summarizePayload(null)).toEqual([]);
  });

  it("never passes on headers or account fields", () => {
    const fields = summarizePayload(rawBankCall.request);
    expect(fields).toEqual([{ label: "Amount", value: "500" }]);
  });
});

describe("redactBankCall", () => {
  it("drops the URL and bodies, keeps the reference ids and masks the error", () => {
    const call = redactBankCall(rawBankCall);
    expect(call).not.toHaveProperty("url");
    expect(call).not.toHaveProperty("request");
    expect(call).not.toHaveProperty("response");
    expect(call).toMatchObject({
      callId: "call-1",
      messageId: "EZACPO0000000001",
      correlationId: "corr-1",
      outcome: "UNKNOWN",
      error: "Read timed out after 30000 ms for account ••••4321",
    });
    expect(JSON.stringify(call)).not.toContain("1000987654321");
    expect(JSON.stringify(call)).not.toContain("Bearer");
  });
});

describe("redactPayment", () => {
  it("replaces the raw bank answer with its useful fields and drops the QR contents", () => {
    const payment = redactPayment(livePayment) as Record<string, unknown>;
    expect(payment).not.toHaveProperty("providerResponse");
    expect(payment).not.toHaveProperty("qrPayload");
    expect(payment.bankAnswer).toContainEqual({ label: "State", value: "PAID" });
    expect(payment.sandbox).toBeUndefined();
    expect(payment.providerReference).toBe(livePayment.providerReference);
  });

  it("marks a sandbox payment", () => {
    const payment = redactPayment(sandboxPayment) as Record<string, unknown>;
    expect(payment.sandbox).toBe(true);
  });

  it("masks the donor's debit account", () => {
    const payment = redactPayment({ ...livePayment, debitAccount: "1000123456789" }) as Record<string, unknown>;
    expect(payment.debitAccount).toBe("••••6789");
  });
});

describe("redactEthqrReceipt", () => {
  it("keeps only the columns the reconciliation table shows", () => {
    expect(redactEthqrReceipt(ethqrReceipt)).toEqual({
      id: ethqrReceipt.id,
      amount: 10,
      currency: "ETB",
      referenceNumber: ethqrReceipt.referenceNumber,
      payerName: "Test Payer",
      status: "COMPLETED",
      transactedAt: ethqrReceipt.transactedAt,
      sourceBankBic: "telebirr",
      sourceBankCode: "TELEBIRR",
      terminalLabel: "zp_live000000000001",
    });
  });
});

describe("redactsPath", () => {
  it("names the paths whose answers carry raw data", () => {
    expect(redactsPath(["disbursements", "po_1", "bank-calls"])).toBe(true);
    expect(redactsPath(["zakat-payments"])).toBe(true);
    expect(redactsPath(["zakat-payments", "zp_1", "check"])).toBe(true);
    expect(redactsPath(["ethqr", "transactions"])).toBe(true);
    expect(redactsPath(["zakat-payments", "summary"])).toBe(false);
    expect(redactsPath(["disbursements", "po_1"])).toBe(false);
    expect(redactsPath(["payment-settings"])).toBe(false);
    expect(redactsPath(["ethqr", "merchant"])).toBe(false);
  });
});

describe("redactPaymentsAdmin", () => {
  const ok = (data: unknown) => ({ success: true, data });

  it("filters the payout bank-call log", () => {
    const body = redactPaymentsAdmin(["disbursements", "po_1", "bank-calls"], ok([rawBankCall])) as { data: Record<string, unknown>[] };
    expect(body.data[0]).not.toHaveProperty("request");
  });

  it("filters the payments list, one payment, and what check and resolve return", () => {
    const list = redactPaymentsAdmin(["zakat-payments"], ok({ items: [livePayment], pagination: { page: 1 } })) as {
      data: { items: Record<string, unknown>[]; pagination: unknown };
    };
    expect(list.data.items[0]).not.toHaveProperty("providerResponse");
    expect(list.data.pagination).toEqual({ page: 1 });

    for (const path of [["zakat-payments", "zp_1"], ["zakat-payments", "zp_1", "check"], ["zakat-payments", "zp_1", "resolve"]]) {
      const body = redactPaymentsAdmin(path, ok(sandboxPayment)) as { data: Record<string, unknown> };
      expect(body.data).not.toHaveProperty("qrPayload");
      expect(body.data.sandbox).toBe(true);
    }
  });

  it("leaves the payments summary and other paths untouched", () => {
    const summary = ok({ totalCount: 3 });
    expect(redactPaymentsAdmin(["zakat-payments", "summary"], summary)).toBe(summary);
    const settings = ok({ bankMode: "live" });
    expect(redactPaymentsAdmin(["payment-settings"], settings)).toBe(settings);
  });

  it("filters EthQR receipts and keeps the paging", () => {
    const body = redactPaymentsAdmin(["ethqr", "transactions"], ok({ content: [ethqrReceipt], pagination: { totalPages: 2 } })) as {
      data: { content: Record<string, unknown>[]; pagination: unknown };
    };
    expect(body.data.content[0]).not.toHaveProperty("payerAccount");
    expect(body.data.content[0]).not.toHaveProperty("bizMsgIdr");
    expect(body.data.pagination).toEqual({ totalPages: 2 });
  });

  it("strips raw third-party bodies from error answers but keeps codes and ids", () => {
    const body = redactPaymentsAdmin(["ethqr", "merchant"], {
      success: false,
      message: "EthQR refused the registration.",
      data: { ethqrCode: "E102", ethqrResponse: '{"secret":"x"}', disbursementId: "po_1" },
    }) as { data: Record<string, unknown>; message: string };
    expect(body.data).toEqual({ ethqrCode: "E102", disbursementId: "po_1" });
    expect(body.message).toBe("EthQR refused the registration.");
  });
});
