import "server-only";

import type { ShippingTier } from "@/lib/store/cart/types";
import { formatOrderReference } from "@/lib/store/checkout-session";
import { getCjAccessToken } from "@/lib/store/sources/cj-auth";
import { parseCjShippingAddress, type ParsedCjShippingAddress } from "@/lib/store/sources/cj-shipping";

const CJ_API_BASE = "https://developers.cjdropshipping.com/api2.0/v1";

export interface CjOrderLineInput {
  variantId: string;
  quantity: number;
  storeLineItemId: string;
}

export interface CreateCjStoreOrderInput {
  niOrderId: string;
  customerEmail: string | null;
  shipping: Record<string, unknown> | null;
  lines: CjOrderLineInput[];
  shippingTier?: ShippingTier;
  remark?: string;
}

export interface CjFreightOption {
  logisticName: string;
  logisticPrice: number;
  logisticAging: string;
}

export interface CreateCjStoreOrderResult {
  ok: true;
  cjOrderId: string;
  cjOrderNumber: string;
  cjOrderStatus: string | null;
  postageAmount: number | null;
  productAmount: number | null;
  paid: boolean;
  cjPayUrl: string | null;
  paymentError: string | null;
}

export interface CreateCjStoreOrderError {
  ok: false;
  code: string;
  message: string;
}

export type CjStoreOrderResult = CreateCjStoreOrderResult | CreateCjStoreOrderError;

interface CjApiResponse<T> {
  code?: number;
  result?: boolean;
  message?: string;
  data?: T;
}

async function cjRequest<T>(
  path: string,
  init: RequestInit & { token: string }
): Promise<CjApiResponse<T>> {
  const res = await fetch(`${CJ_API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "CJ-Access-Token": init.token,
      platformToken: "",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  const json = (await res.json()) as CjApiResponse<T>;
  if (!res.ok || json.result === false) {
    throw new Error(json.message ?? `CJ API ${path} failed (${res.status})`);
  }
  return json;
}

export async function getCjFreightOptions(input: {
  destinationCountryCode: string;
  lines: CjOrderLineInput[];
}): Promise<CjFreightOption[]> {
  const token = await getCjAccessToken();
  if (!token) return [];

  const json = await cjRequest<CjFreightOption[]>(
    "/logistic/freightCalculate",
    {
      token,
      method: "POST",
      body: JSON.stringify({
        startCountryCode: "CN",
        endCountryCode: input.destinationCountryCode,
        products: input.lines.map((line) => ({
          vid: line.variantId,
          quantity: line.quantity,
        })),
      }),
    }
  );

  return Array.isArray(json.data) ? json.data.filter((row) => row.logisticName) : [];
}

export function selectCjLogisticName(
  options: CjFreightOption[],
  shippingTier: ShippingTier = "standard"
): string | null {
  if (!options.length) return null;

  if (shippingTier === "expedited") {
    const ranked = [...options].sort((a, b) => parseAgingDays(a.logisticAging) - parseAgingDays(b.logisticAging));
    return ranked[0]?.logisticName ?? null;
  }

  const cjPacket = options
    .filter((row) => /CJPacket/i.test(row.logisticName))
    .sort((a, b) => a.logisticPrice - b.logisticPrice);
  if (cjPacket.length) return cjPacket[0].logisticName;

  return [...options].sort((a, b) => a.logisticPrice - b.logisticPrice)[0]?.logisticName ?? null;
}

function parseAgingDays(aging: string): number {
  const match = aging.match(/(\d+)/);
  return match ? Number(match[1]) : 99;
}

function isCjSandboxEnabled(): boolean {
  const flag = process.env.CJ_STORE_SANDBOX?.trim().toLowerCase();
  return flag === "true" || flag === "1";
}

function buildCreateOrderBody(
  input: CreateCjStoreOrderInput,
  address: ParsedCjShippingAddress,
  logisticName: string
) {
  const orderNumber = formatOrderReference(input.niOrderId);
  return {
    orderNumber,
    shippingZip: address.postalCode,
    shippingCountryCode: address.countryCode,
    shippingCountry: address.countryName,
    shippingProvince: address.state,
    shippingCity: address.city,
    shippingPhone: address.phone ?? "",
    shippingCustomerName: address.customerName,
    shippingAddress: address.line1,
    shippingAddress2: address.line2 ?? "",
    email: address.email ?? "",
    remark: input.remark ?? `NI Store order ${input.niOrderId}`,
    logisticName,
    fromCountryCode: "CN",
    platform: "Api",
    shopLogisticsType: 2,
    orderFlow: 1,
    payType: 2,
    isSandbox: isCjSandboxEnabled() ? 1 : 0,
    products: input.lines.map((line) => ({
      vid: line.variantId,
      quantity: line.quantity,
      storeLineItemId: line.storeLineItemId,
    })),
  };
}

interface CreateOrderData {
  orderId?: string;
  orderNumber?: string;
  orderStatus?: string | null;
  postageAmount?: number | null;
  productAmount?: number | null;
  cjPayUrl?: string | null;
  payId?: string | null;
}

interface CjOrderDetailData {
  orderId?: string;
  orderNum?: string;
  cjOrderId?: string;
  cjOrderCode?: string;
  orderStatus?: string | null;
}

async function getCjOrderDetail(token: string, orderId: string): Promise<CjOrderDetailData | null> {
  const json = await cjRequest<CjOrderDetailData>(
    `/shopping/order/getOrderDetail?orderId=${encodeURIComponent(orderId)}`,
    { token, method: "GET" }
  );
  return json.data ?? null;
}

async function payCjOrderBalance(
  token: string,
  input: { parentOrderId: string; payId?: string | null; isSandbox: boolean }
): Promise<{ paid: boolean; paymentError: string | null; cjPayUrl: string | null }> {
  const detail = await getCjOrderDetail(token, input.parentOrderId);
  const payableOrderId = detail?.cjOrderId?.trim() || input.parentOrderId;

  if (input.isSandbox) {
    try {
      await cjRequest<boolean>("/shopping/sandbox/simulatePay", {
        token,
        method: "POST",
        body: JSON.stringify({ shipmentOrderId: input.parentOrderId }),
      });
      return { paid: true, paymentError: null, cjPayUrl: null };
    } catch (err) {
      // Fall through to balance payment for sandbox when simulate is unavailable.
    }
  }

  try {
    await cjRequest<string | null>("/shopping/pay/payBalanceV2", {
      token,
      method: "POST",
      body: JSON.stringify({
        shipmentOrderId: payableOrderId,
        payId: input.payId ?? undefined,
      }),
    });
    return { paid: true, paymentError: null, cjPayUrl: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "CJ balance payment failed";
    return { paid: false, paymentError: message, cjPayUrl: null };
  }
}

export async function createAndPayCjStoreOrder(
  input: CreateCjStoreOrderInput
): Promise<CjStoreOrderResult> {
  const token = await getCjAccessToken();
  if (!token) {
    return { ok: false, code: "cj_not_configured", message: "CJ API key is not configured" };
  }

  const address = parseCjShippingAddress(input.shipping, input.customerEmail);
  if (!address) {
    return { ok: false, code: "invalid_shipping", message: "Order shipping address is incomplete" };
  }

  if (!input.lines.length || input.lines.some((line) => !line.variantId.trim())) {
    return { ok: false, code: "missing_variant", message: "Order is missing CJ variant IDs" };
  }

  try {
    const freightOptions = await getCjFreightOptions({
      destinationCountryCode: address.countryCode,
      lines: input.lines,
    });
    const logisticName = selectCjLogisticName(freightOptions, input.shippingTier ?? "standard");
    if (!logisticName) {
      return { ok: false, code: "no_logistics", message: "No CJ logistics option available" };
    }

    const createJson = await cjRequest<CreateOrderData>("/shopping/order/createOrderV3", {
      token,
      method: "POST",
      body: JSON.stringify(buildCreateOrderBody(input, address, logisticName)),
    });

    const created = createJson.data;
    const parentOrderId = created?.orderId?.trim();
    if (!parentOrderId) {
      return {
        ok: false,
        code: "create_failed",
        message: "CJ order create succeeded but no order ID was returned",
      };
    }

    await cjRequest<string>("/shopping/order/confirmOrder", {
      token,
      method: "PATCH",
      body: JSON.stringify({ orderId: parentOrderId }),
    });

    const payment = await payCjOrderBalance(token, {
      parentOrderId,
      payId: created?.payId,
      isSandbox: isCjSandboxEnabled(),
    });

    const detail = await getCjOrderDetail(token, parentOrderId);

    return {
      ok: true,
      cjOrderId: detail?.cjOrderId?.trim() || parentOrderId,
      cjOrderNumber: created?.orderNumber ?? formatOrderReference(input.niOrderId),
      cjOrderStatus: detail?.orderStatus ?? created?.orderStatus ?? "CREATED",
      postageAmount: created?.postageAmount ?? null,
      productAmount: created?.productAmount ?? null,
      paid: payment.paid,
      cjPayUrl: payment.cjPayUrl ?? (created?.cjPayUrl?.trim() || null),
      paymentError: payment.paymentError,
    };
  } catch (err) {
    return {
      ok: false,
      code: "cj_api_error",
      message: err instanceof Error ? err.message : "CJ order creation failed",
    };
  }
}

export async function getCjAccountBalance(): Promise<number | null> {
  const token = await getCjAccessToken();
  if (!token) return null;

  try {
    const json = await cjRequest<{ amount?: number }>("/shopping/pay/getBalance", {
      token,
      method: "GET",
    });
    return typeof json.data?.amount === "number" ? json.data.amount : null;
  } catch {
    return null;
  }
}
