import { NextResponse } from "next/server";

const CACHE_TTL_MS = 8 * 60 * 60 * 1000;
const KARATS = [24, 22, 21, 20, 18, 16, 14, 10] as const;

type Karat = (typeof KARATS)[number];
type Metal = "gold" | "silver";
type RatesByKarat = Record<Karat, number>;

type ApiPayload = {
  usdToEtb: number;
  usdPerGram: Record<Metal, RatesByKarat>;
  etbPerGram: Record<Metal, RatesByKarat>;
  fetchedAt: string;
  expiresAt: string;
  sourceStatus: "live" | "cache";
};

let pricingCache: { payload: ApiPayload; expiresAtMs: number } | null = null;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function mapKaratPrices(data: Record<string, unknown>) {
  const mapped = {} as RatesByKarat;
  for (const karat of KARATS) {
    const key = `price_gram_${karat}k`;
    mapped[karat] = toFiniteNumber(data[key]) ?? 0;
  }
  return mapped;
}

/** If a karat slot is missing/zero, derive from 24k × purity so ETB differs by karat. */
function enrichUsdPerGramFrom24k(usd: RatesByKarat): RatesByKarat {
  const base24 = usd[24];
  if (!(base24 > 0)) return usd;
  const out = { ...usd };
  for (const karat of KARATS) {
    if (!(out[karat] > 0)) {
      out[karat] = base24 * (karat / 24);
    }
  }
  return out;
}

async function fetchMetalUsdPerGram(symbol: "XAU" | "XAG", apiKey: string) {
  const response = await fetch(`https://www.goldapi.io/api/${symbol}/USD`, {
    method: "GET",
    headers: {
      "x-access-token": apiKey,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`GoldAPI ${symbol} failed: ${response.status}`);
  }

  const json = (await response.json()) as Record<string, unknown>;
  return mapKaratPrices(json);
}

function extractUsdMidRate(json: Record<string, unknown>) {
  const data = json.data as
    | { mCURRENCYRATESDetailType?: Array<Record<string, unknown>> }
    | undefined;
  const rows = data?.mCURRENCYRATESDetailType;

  if (!rows?.length) return null;

  const usdRow =
    rows.find((row) => row.Ccy === "USD" && row.CcyMarket === 10) ??
    rows.find((row) => row.Ccy === "USD");

  if (!usdRow) return null;

  const midRate = toFiniteNumber(usdRow.MidRate);
  return midRate;
}

async function fetchUsdToEtb(bearerToken: string) {
  const response = await fetch(
    "https://internalgateway-apim.coopbankoromiasc.com/payment-switches/1.0.0/fxrate",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ currency: "USD" }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`CBO FX failed: ${response.status}`);
  }

  const json = (await response.json()) as Record<string, unknown>;
  const rate = extractUsdMidRate(json);
  if (!rate) {
    throw new Error("CBO FX response missing USD MidRate");
  }
  return rate;
}

function toEtbPerGram(
  usdPerGram: Record<Metal, RatesByKarat>,
  usdToEtb: number,
): Record<Metal, RatesByKarat> {
  return {
    gold: KARATS.reduce(
      (acc, karat) => {
        acc[karat] = usdPerGram.gold[karat] * usdToEtb;
        return acc;
      },
      {} as RatesByKarat,
    ),
    silver: KARATS.reduce(
      (acc, karat) => {
        acc[karat] = usdPerGram.silver[karat] * usdToEtb;
        return acc;
      },
      {} as RatesByKarat,
    ),
  };
}

export async function GET() {
  const now = Date.now();
  if (pricingCache && pricingCache.expiresAtMs > now) {
    return NextResponse.json({
      ...pricingCache.payload,
      sourceStatus: "cache",
    } satisfies ApiPayload);
  }

  const goldApiKey = process.env.GOLDAPI_ACCESS_TOKEN;
  const cboBearerToken = process.env.CBO_FX_BEARER_TOKEN;

  if (!goldApiKey) {
    return jsonError("Missing GOLDAPI_ACCESS_TOKEN", 500);
  }
  if (!cboBearerToken) {
    return jsonError("Missing CBO_FX_BEARER_TOKEN", 500);
  }

  try {
    const [goldUsdPerGram, silverUsdPerGram, usdToEtb] = await Promise.all([
      fetchMetalUsdPerGram("XAU", goldApiKey),
      fetchMetalUsdPerGram("XAG", goldApiKey),
      fetchUsdToEtb(cboBearerToken),
    ]);

    const usdPerGram = {
      gold: enrichUsdPerGramFrom24k(goldUsdPerGram),
      silver: enrichUsdPerGramFrom24k(silverUsdPerGram),
    };
    if (!(usdPerGram.gold[24] > 0) || !(usdPerGram.silver[24] > 0)) {
      throw new Error("GoldAPI missing 24k USD/gram prices");
    }
    const payload: ApiPayload = {
      usdToEtb,
      usdPerGram,
      etbPerGram: toEtbPerGram(usdPerGram, usdToEtb),
      fetchedAt: new Date(now).toISOString(),
      expiresAt: new Date(now + CACHE_TTL_MS).toISOString(),
      sourceStatus: "live",
    };

    pricingCache = {
      payload,
      expiresAtMs: now + CACHE_TTL_MS,
    };

    return NextResponse.json(payload);
  } catch (error) {
    if (pricingCache) {
      return NextResponse.json({
        ...pricingCache.payload,
        sourceStatus: "cache",
      } satisfies ApiPayload);
    }
    return jsonError(
      error instanceof Error ? error.message : "Failed to fetch metal pricing",
      502,
    );
  }
}
