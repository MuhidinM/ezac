/**
 * Payloads shaped like payment-service's UAT answers, with the names,
 * references and ids replaced by made-up values of the same form. The
 * payments still carry the raw fields payment-service sent before 11
 * November (providerResponse, qrPayload, full accounts), to show the BFF's
 * second check still removes them.
 */

/** A QR payment paid through EthQR (live), as GET /admin/zakat-payments/{id} returns it. */
export const livePayment = {
  paymentId: "zp_live000000000001",
  status: "SUCCEEDED",
  methodCode: "ethqr",
  zakatType: "general",
  amountEtb: 10,
  causeId: "general",
  causeTitle: "General Zakat fund",
  payerType: "guest",
  payerFullName: "Test Donor",
  creditAccount: "1021200000000",
  messageId: "EQTEST0000000001",
  providerReference: "087N1108B400000000108002",
  providerResponse: JSON.stringify({
    puid: "640000",
    orderId: "zp_live000000000001",
    state: "PAID",
    expectedAmount: 10.0,
    transaction: {
      id: "087N1108B41****8002",
      amount: 10.0,
      currency: "ETB",
      referenceNumber: "087N1108B41****8002",
      payerName: "Test Payer",
      description: "Payment from telebirr",
      status: null,
      transactedAt: "2026-11-04T18:09:26.026",
      sourceBankBic: "telebirr",
      categoryPurpose: "C2BSQR",
      endToEndId: "TELEBIRR00000000AAAAAAAAAA",
      bizMsgIdr: "TELEBIRR63****6970",
      storeLabel: null,
      terminalLabel: "zp_live000000000001",
      sourceBankCode: "TELEBIRR",
    },
    amountMatches: true,
  }),
  resolutionNote: "Confirmed by EthQR",
  certificateId: "ZC-2026-000006",
  paidAt: "2026-11-04T15:09:27.6955Z",
  createdAt: "2026-11-04T15:09:10.999784Z",
  qrPayload: "000201010211283900066400000108CBOEETAA02131021200000000520449005303230540510.005802ET",
  ethqrOrderId: "zp_live000000000001",
  paidByName: "Test Payer",
  paidFromBank: "telebirr",
};

/** A QR payment made against the EthQR sandbox. */
export const sandboxPayment = {
  paymentId: "zp_sandbox00000001",
  status: "SUCCEEDED",
  methodCode: "ethqr",
  amountEtb: 10,
  providerReference: "SBXFT000001",
  providerResponse: '{"state":"PAID","sandbox":true}',
  qrPayload: "000201010212SANDBOX0000015410.0053032306207zp_sandbox00000001",
  paidByName: "SANDBOX PAYER",
  paidFromBank: "Sandbox Bank",
  createdAt: "2026-11-04T13:54:11.656539Z",
};

/** One receipt from GET /admin/ethqr/transactions, with fields older answers carried (dropped by the BFF). */
export const ethqrReceipt = {
  referenceNumber: "087N1108B400000000108002",
  orderId: "zp_live000000000001",
  amount: 10,
  currency: "ETB",
  transactedAt: "2026-11-04T18:09:26.026",
  sourceBankBic: "telebirr",
  endToEndId: "TELEBIRR00000000AAAAAAAAAA",
  status: "COMPLETED",
  payerName: "T*** P****",
  matchedPaymentId: "zp_live000000000001",
  bizMsgIdr: "TELEBIRR630818302000000000000",
  payerAccount: "251911000000",
};

/** A payout bank call with raw bodies, in the shape the type described before the BFF filter. */
export const rawBankCall = {
  callId: "call-1",
  operation: "TRANSFER",
  url: "https://bank.internal.example/api/v1/transfer?key=secret",
  messageId: "EZACPO0000000001",
  httpStatus: 200,
  outcome: "UNKNOWN",
  durationMs: 30012,
  request: {
    debitAccount: "1000123456789",
    creditAccount: "1000987654321",
    amount: 500,
    narrative: "EZAC payout",
    headers: { Authorization: "Bearer abc.def.ghi" },
  },
  response: '{"status":"PENDING","responseCode":"E09","message":"Timeout waiting for core, account 1000987654321","ftNumber":"FT26308ABCDE"}',
  error: "Read timed out after 30000 ms for account 1000987654321",
  correlationId: "corr-1",
  at: "2026-11-05T09:00:00Z",
};
