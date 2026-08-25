import type { CatalogProduct, ColorVariant, ProductSize } from "@/data/catalog";
import { fillEmptyVariantImages } from "@/data/catalog";
import type {
  CartItem,
  CartShippingPref,
  MockOrder,
  OrderStatus,
  SavedAddress,
  ShopProduct,
  TrackingCarrier,
} from "@/lib/mock/types";
import type { PromoCode } from "@/lib/mock/promos";
import type { BusinessData } from "@/lib/mock/business";
import {
  formatMoney,
  installmentFromPrice,
  installmentLabelFromPrice,
  uid,
} from "@/lib/mock/money";

export const SIZES = ["34", "35", "36", "37", "38", "39", "40", "41", "42", "43"];

const COLOR_HEX: Record<string, string> = {
  blanca: "#f5f4f0",
  white: "#f5f4f0",
  negra: "#111111",
  black: "#111111",
  panda: "#1a1a1a",
  "grey fog": "#9aa0a6",
  navy: "#1e3a5f",
  "white grey": "#d9d6d0",
  pink: "#e8a0b4",
  green: "#3f6b4f",
  brown: "#6b4a32",
};

type ApiStock = { size: string; qty: number };
type ApiVariant = {
  id: number;
  slug: string;
  name: string;
  color: string | null;
  colorHex: string | null;
  priceWeb: string | number;
  priceTransfer: string | number;
  compareAtPrice?: string | number | null;
  salePercent?: number | null;
  installments?: number | null;
  images: string[];
  stocks?: ApiStock[];
};
type ApiProduct = {
  id: number;
  name: string;
  modelo: string;
  brand: string;
  genero?: string;
  tipo?: string;
  description?: string | null;
  storeCategories?: string[];
  tags?: string[];
  primaryCategorySlug?: string | null;
  active?: boolean;
  megaSale?: boolean;
  megaSalePercent?: number | null;
  megaSaleStartsAt?: string | null;
  megaSaleEndsAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  variants?: ApiVariant[];
};

export function getBackendUrl(): string {
  return String(process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");
}

export function resolveMediaUrl(src: string): string {
  if (!src) return "/assets/products/product-1.webp";
  if (
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("data:")
  ) {
    return src;
  }
  if (src.startsWith("/uploads")) {
    const base = getBackendUrl();
    return base ? `${base}${src}` : src;
  }
  return src;
}

export function slugify(text: string): string {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function money(value: string | number | null | undefined): string {
  return formatMoney(Number(value) || 0);
}

function sizesFromStocks(stocks: ApiStock[] = []): ProductSize[] {
  const bySize = new Map(stocks.map((s) => [String(s.size), Number(s.qty) || 0]));
  return SIZES.map((label) => {
    const stock = bySize.get(label) ?? 0;
    return { label, stock, inStock: stock > 0 };
  });
}

function mapVariant(v: ApiVariant): ColorVariant {
  const images = (v.images || []).filter(Boolean).map(resolveMediaUrl);
  const image = images[0] || "/assets/products/product-1.webp";
  const price = money(v.priceWeb);
  const colorName = (v.color || v.name || "").trim();
  return {
    id: v.slug || slugify(colorName),
    name: colorName || v.name,
    color:
      v.colorHex ||
      COLOR_HEX[colorName.toLowerCase()] ||
      "#888888",
    image,
    images: images.length ? images : [image],
    price,
    transfer: money(v.priceTransfer),
    installments: installmentFromPrice(price),
    installmentsLabel: installmentLabelFromPrice(price),
    sizes: sizesFromStocks(v.stocks),
    salePercent: v.salePercent ?? undefined,
    compareAtPrice:
      v.compareAtPrice != null ? money(v.compareAtPrice) : undefined,
  };
}

export function mapApiProduct(p: ApiProduct): ShopProduct {
  const slug = slugify(p.name) || slugify(`${p.brand}-${p.modelo}`);
  const category: CatalogProduct["category"] =
    p.tipo === "OTRO" ? "sandalias" : "zapatillas";
  return fillEmptyVariantImages({
    id: p.id,
    slug,
    name: p.name,
    modelo: p.modelo,
    brand: p.brand,
    category,
    storeCategories: p.storeCategories || [],
    primaryCategory: p.primaryCategorySlug || slugify(p.brand),
    description: p.description || "",
    tags: p.tags || [],
    megaSale: Boolean(p.megaSale),
    megaSalePercent: p.megaSalePercent ?? null,
    megaSaleStartsAt: p.megaSaleStartsAt ?? null,
    megaSaleEndsAt: p.megaSaleEndsAt ?? null,
    variants: (p.variants || []).map(mapVariant),
    active: p.active !== false,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  });
}

export function findShopProduct(
  products: ShopProduct[],
  slug: string
): ShopProduct | undefined {
  return (
    products.find((p) => p.slug === slug) ||
    products.find((p) => p.variants.some((v) => v.id === slug))
  );
}

export async function fetchShopProducts(): Promise<ShopProduct[] | null> {
  const base = getBackendUrl();
  if (!base) return null;
  try {
    const token = readToken();
    const res = await fetch(
      `${base}/api/products${token ? "?all=1" : ""}`,
      {
        cache: "no-store",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as ApiProduct[];
    if (!Array.isArray(data)) return null;
    return data.map(mapApiProduct).filter((p) => p.variants.length > 0);
  } catch {
    return null;
  }
}

const TOKEN_KEY = "rastro_api_token";

export type CreateProductPayload = {
  brand: string;
  modelo: string;
  genero: "HOMBRE" | "MUJER" | "UNISEX" | "NINOS";
  tipo?: "ZAPATILLA" | "OTRO";
  description?: string;
  storeCategories?: string[];
  tags?: string[];
  megaSale?: boolean;
  megaSalePercent?: number | null;
  megaSaleStartsAt?: string | null;
  megaSaleEndsAt?: string | null;
  variants: Array<{
    slug?: string;
    color: string;
    colorHex?: string;
    priceWeb: number;
    priceTransfer: number;
    images?: string[];
    stock?: Record<string, number>;
  }>;
};

export type UpsertVariantPayload = CreateProductPayload["variants"][number];

function readToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(TOKEN_KEY) || "";
}

async function loginAdmin(): Promise<string> {
  const data = await loginShopUser("admin@rastro.com", "admin123");
  return data.token;
}

export type ShopAuthUser = {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "CUSTOMER" | "STAFF";
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  dni?: string | null;
  addresses?: SavedAddress[];
  createdAt?: string;
};

export async function loginShopUser(
  email: string,
  password: string
): Promise<{
  token: string;
  user: ShopAuthUser;
}> {
  const base = getBackendUrl();
  if (!base) throw new Error("Falta NEXT_PUBLIC_BACKEND_URL");
  const res = await fetch(`${base}/api/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok || !data.token) {
    throw new Error(data.message || "Email o contraseña incorrectos.");
  }
  localStorage.setItem(TOKEN_KEY, data.token);
  return data;
}

export async function registerShopUser(input: {
  name: string;
  email: string;
  password: string;
  phone: string;
}): Promise<{
  token: string;
  user: ShopAuthUser;
  /** Cupón personal emitido por el backend al crear la cuenta. */
  welcomePromo?: { code: string; value: number; type: string } | null;
}> {
  const base = getBackendUrl();
  if (!base) throw new Error("Falta NEXT_PUBLIC_BACKEND_URL");
  const res = await fetch(`${base}/api/users/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!res.ok || !data.token) {
    throw new Error(data.message || "No se pudo crear la cuenta.");
  }
  localStorage.setItem(TOKEN_KEY, data.token);
  return data;
}

export async function requestPasswordReset(email: string): Promise<{
  message: string;
  devResetUrl?: string;
}> {
  const base = getBackendUrl();
  if (!base) throw new Error("Falta NEXT_PUBLIC_BACKEND_URL");
  const res = await fetch(`${base}/api/users/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "No se pudo enviar el enlace.");
  }
  return data;
}

export async function resetShopPassword(
  token: string,
  password: string
): Promise<{ message: string }> {
  const base = getBackendUrl();
  if (!base) throw new Error("Falta NEXT_PUBLIC_BACKEND_URL");
  const res = await fetch(`${base}/api/users/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "No se pudo actualizar la contraseña.");
  }
  return data;
}

export async function fetchShopMe(): Promise<ShopAuthUser> {
  const base = getBackendUrl();
  if (!base) throw new Error("Falta NEXT_PUBLIC_BACKEND_URL");
  const token = readToken();
  if (!token) throw new Error("No hay sesión");
  const res = await fetch(`${base}/api/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "No se pudo cargar el perfil.");
  }
  return data;
}

export async function updateShopProfile(
  userId: string | number,
  payload: {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    province?: string;
    dni?: string;
    addresses?: SavedAddress[];
    whatsapp?: string;
  }
): Promise<ShopAuthUser> {
  const base = getBackendUrl();
  if (!base) throw new Error("Falta NEXT_PUBLIC_BACKEND_URL");
  const token = readToken();
  if (!token) throw new Error("No hay sesión");
  const res = await fetch(`${base}/api/users/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "No se pudo guardar el perfil.");
  }
  return data;
}

type ApiOrderItem = {
  id: string;
  productSlug: string;
  productName: string;
  brand: string;
  variantId: string;
  variantName: string;
  size: string;
  qty: number;
  price: number | string;
  transfer: number | string;
  image?: string;
};

export type ApiOrder = {
  id: string;
  numericId?: number;
  userId: string;
  userName: string;
  userEmail: string;
  items: ApiOrderItem[];
  subtotal: number;
  transferTotal: number;
  shipping: number;
  discount: number;
  promoCode?: string;
  total: number;
  paymentMethod: MockOrder["paymentMethod"];
  status: OrderStatus;
  shippingAddress: string;
  shippingDetails?: MockOrder["shippingDetails"];
  trackingCarrier?: TrackingCarrier;
  trackingCode?: string;
  createdAt: string;
  updatedAt: string;
  auth?: { token: string; user: ShopAuthUser };
};

function moneyFromApi(value: number | string | null | undefined): string {
  if (typeof value === "string" && value.includes("$")) return value;
  return formatMoney(Number(value) || 0);
}

export function mapApiOrder(order: ApiOrder): MockOrder {
  return {
    id: order.id,
    userId: String(order.userId),
    userName: order.userName,
    userEmail: order.userEmail,
    items: (order.items || []).map((item) => ({
      id: String(item.id),
      productSlug: item.productSlug,
      productName: item.productName,
      brand: item.brand,
      variantId: item.variantId,
      variantName: item.variantName,
      size: item.size,
      qty: item.qty,
      price: moneyFromApi(item.price),
      transfer: moneyFromApi(item.transfer),
      image: resolveMediaUrl(item.image || ""),
    })),
    subtotal: Number(order.subtotal) || 0,
    transferTotal: Number(order.transferTotal) || 0,
    shipping: Number(order.shipping) || 0,
    discount: Number(order.discount) || 0,
    promoCode: order.promoCode,
    total: Number(order.total) || 0,
    paymentMethod: order.paymentMethod,
    status: order.status,
    shippingAddress: order.shippingAddress || "",
    shippingDetails: order.shippingDetails,
    trackingCarrier: order.trackingCarrier,
    trackingCode: order.trackingCode,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

async function shopJson<T>(path: string, init?: RequestInit): Promise<T> {
  const base = getBackendUrl();
  if (!base) throw new Error("Falta NEXT_PUBLIC_BACKEND_URL");
  const token = readToken();
  const send = () =>
    fetch(`${base}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers as Record<string, string> | undefined),
      },
      cache: "no-store",
    });

  let res: Response;
  try {
    res = await send();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      /failed to fetch|networkerror|load failed/i.test(msg)
        ? "No pudimos confirmar con el servidor. Si te llegó el mail, el pedido ya está."
        : msg
    );
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.message || "Error de API") as Error & {
      code?: string;
      status?: number;
    };
    error.code = data.code;
    error.status = res.status;
    throw error;
  }
  return data as T;
}

async function shopAuthJson<T>(path: string, init?: RequestInit): Promise<T> {
  if (!readToken()) throw new Error("No hay sesión");
  return shopJson<T>(path, init);
}

export async function fetchShopOrders(): Promise<MockOrder[]> {
  const data = await shopAuthJson<ApiOrder[]>("/api/orders");
  return (Array.isArray(data) ? data : []).map(mapApiOrder);
}

export async function fetchShopOrder(id: string): Promise<MockOrder> {
  const data = await shopAuthJson<ApiOrder>(
    `/api/orders/${encodeURIComponent(id)}`
  );
  return mapApiOrder(data);
}

export function newCheckoutIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `chk_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

export async function createShopOrder(
  payload: {
    items: Array<{
      productSlug: string;
      variantId: string;
      size: string;
      qty: number;
    }>;
    paymentMethod: MockOrder["paymentMethod"];
    shippingAddress: string;
    shippingDetails?: MockOrder["shippingDetails"];
    shippingCost?: number;
    promoCode?: string;
    guest?: {
      name: string;
      email: string;
      phone: string;
      password?: string;
    };
  },
  options?: { idempotencyKey?: string }
): Promise<MockOrder> {
  const idempotencyKey = options?.idempotencyKey || newCheckoutIdempotencyKey();
  const post = () =>
    shopJson<ApiOrder>("/api/orders", {
      method: "POST",
      headers: {
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(payload),
    });

  try {
    const data = await post();
    if (data.auth?.token) {
      localStorage.setItem(TOKEN_KEY, data.auth.token);
    }
    return mapApiOrder(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (!/No pudimos confirmar con el servidor/i.test(msg)) throw err;
    try {
      const data = await post();
      if (data.auth?.token) {
        localStorage.setItem(TOKEN_KEY, data.auth.token);
      }
      return mapApiOrder(data);
    } catch {
      if (readToken()) {
        const orders = await fetchShopOrders();
        const recent = orders.find((order) => {
          const created = new Date(order.createdAt).getTime();
          return Date.now() - created < 5 * 60 * 1000;
        });
        if (recent) return recent;
      }
      throw err;
    }
  }
}

export async function updateShopOrder(
  id: string,
  payload: {
    status?: OrderStatus;
    trackingCarrier?: TrackingCarrier;
    trackingCode?: string;
  }
): Promise<MockOrder> {
  const data = await shopAuthJson<ApiOrder>(
    `/api/orders/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    }
  );
  return mapApiOrder(data);
}

export function mapApiPromo(p: PromoCode): PromoCode {
  return {
    code: String(p.code || "").toUpperCase(),
    label: p.label,
    type: p.type === "fixed" ? "fixed" : "percent",
    value: Number(p.value) || 0,
    minPurchase: p.minPurchase ? Number(p.minPurchase) : undefined,
    oncePerUser: p.oncePerUser || undefined,
    maxUses: p.maxUses ? Number(p.maxUses) : undefined,
    expiresAt: p.expiresAt || undefined,
    active: p.active !== false,
  };
}

export async function fetchShopPromos(all = false): Promise<PromoCode[] | null> {
  const base = getBackendUrl();
  if (!base) return null;
  try {
    const token = readToken();
    const params = all ? "?all=1" : "";
    const res = await fetch(`${base}/api/promos${params}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data)) return null;
    return data.map(mapApiPromo);
  } catch {
    return null;
  }
}

export async function validateShopPromo(
  code: string,
  merchandise: number
): Promise<PromoCode> {
  const data = await shopJson<{ ok: boolean; promo: PromoCode; message?: string }>(
    "/api/promos/validate",
    {
      method: "POST",
      body: JSON.stringify({ code, merchandise }),
    }
  );
  if (!data.ok || !data.promo) {
    throw new Error(data.message || "Cupón inválido.");
  }
  return mapApiPromo(data.promo);
}

export async function saveShopPromo(promo: PromoCode): Promise<PromoCode> {
  const data = await shopAuthJson<PromoCode>("/api/promos", {
    method: "POST",
    body: JSON.stringify(promo),
  });
  return mapApiPromo(data);
}

export async function deleteShopPromo(code: string): Promise<void> {
  await shopAuthJson(`/api/promos/${encodeURIComponent(code)}`, {
    method: "DELETE",
  });
}

export function clearApiToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

export function hasApiAuth(): boolean {
  return Boolean(getBackendUrl() && readToken());
}

export type AccountBagPayload = {
  cart: CartItem[];
  wishlist: string[];
  shipping: CartShippingPref | null;
};

type ApiBagLine = {
  id?: string;
  productSlug?: string;
  variantSlug?: string;
  variantId?: string;
  variantName?: string;
  productName?: string;
  brand?: string;
  size?: string;
  qty?: number;
  price?: string | number;
  transfer?: string | number;
  image?: string;
  product?: { name?: string; brand?: string } | null;
  variant?: {
    slug?: string;
    color?: string | null;
    images?: string[];
    priceWeb?: number | string;
    priceTransfer?: number | string;
  } | null;
};

function bagMoney(value: unknown): string {
  if (typeof value === "string" && value.includes("$")) return value;
  return formatMoney(Number(value) || 0);
}

/** GET /me/bag hidrata variantSlug + precios; el front usa CartItem.variantId = slug. */
export function mapApiBagCart(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      const item = (row || {}) as ApiBagLine;
      const variantSlug = String(
        item.variantSlug || item.variantId || item.variant?.slug || ""
      ).trim();
      const productSlug = String(item.productSlug || "").trim();
      const size = String(item.size || "").trim();
      const qty = Number(item.qty) || 1;
      const images = item.variant?.images;
      return {
        id: item.id || uid("cart"),
        productSlug,
        productName: item.product?.name || item.productName || "",
        brand: item.product?.brand || item.brand || "",
        variantId: variantSlug,
        variantName:
          item.variant?.color || item.variantName || variantSlug,
        size,
        qty,
        price: bagMoney(item.variant?.priceWeb ?? item.price),
        transfer: bagMoney(item.variant?.priceTransfer ?? item.transfer),
        listPrice: bagMoney(item.variant?.priceWeb ?? item.price),
        image: resolveMediaUrl(
          (Array.isArray(images) && images[0]) || item.image || ""
        ),
      } satisfies CartItem;
    })
    .filter((item) => item.productSlug && item.variantId && item.size);
}

async function bagRequest(
  method: "GET" | "PUT",
  body?: AccountBagPayload
): Promise<AccountBagPayload> {
  const base = getBackendUrl();
  if (!base) throw new Error("Falta NEXT_PUBLIC_BACKEND_URL");
  const token = readToken();
  if (!token) throw new Error("Sesión expirada");

  const payload =
    method === "PUT" && body
      ? {
          wishlist: body.wishlist,
          shipping: body.shipping,
          cart: (body.cart || []).map((item) => ({
            productSlug: item.productSlug,
            variantSlug: item.variantId,
            size: item.size,
            qty: item.qty,
          })),
        }
      : undefined;

  const res = await fetch(`${base}/api/users/me/bag`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: payload ? JSON.stringify(payload) : undefined,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "No se pudo sincronizar el carrito.");
  }
  return {
    cart: mapApiBagCart(data.cart),
    wishlist: Array.isArray(data.wishlist) ? data.wishlist : [],
    shipping: data.shipping ?? null,
  };
}

export async function fetchAccountBag(): Promise<AccountBagPayload> {
  return bagRequest("GET");
}

export async function saveAccountBag(
  bag: AccountBagPayload
): Promise<AccountBagPayload> {
  return bagRequest("PUT", bag);
}

async function adminToken(): Promise<string> {
  return readToken() || loginAdmin();
}

export async function uploadShopImages(files: File[]): Promise<string[]> {
  const base = getBackendUrl();
  if (!base) throw new Error("Falta NEXT_PUBLIC_BACKEND_URL");
  if (!files.length) return [];

  const body = new FormData();
  for (const file of files) body.append("files", file);

  const post = async (token: string) =>
    fetch(`${base}/api/uploads`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body,
    });

  let res = await post(await adminToken());
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem(TOKEN_KEY);
    res = await post(await loginAdmin());
  }
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "No se pudieron subir las imágenes");
  }
  return data.urls as string[];
}

export async function createShopProduct(
  payload: CreateProductPayload
): Promise<ShopProduct> {
  const base = getBackendUrl();
  if (!base) throw new Error("Falta NEXT_PUBLIC_BACKEND_URL");

  const post = async (token: string) =>
    fetch(`${base}/api/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

  let res = await post(await adminToken());
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem(TOKEN_KEY);
    res = await post(await loginAdmin());
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "No se pudo crear el producto");
  }
  return mapApiProduct(data);
}

async function authedJson(
  method: string,
  path: string,
  payload: unknown,
  errorMessage: string
): Promise<unknown> {
  const base = getBackendUrl();
  if (!base) throw new Error("Falta NEXT_PUBLIC_BACKEND_URL");

  const send = async (token: string) =>
    fetch(`${base}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

  let res = await send(await adminToken());
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem(TOKEN_KEY);
    res = await send(await loginAdmin());
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || errorMessage);
  }
  return data;
}

export async function updateShopProduct(
  id: number,
  payload: Partial<CreateProductPayload>
): Promise<ShopProduct> {
  const data = await authedJson(
    "PUT",
    `/api/products/${id}`,
    payload,
    "No se pudo actualizar el producto"
  );
  return mapApiProduct(data as ApiProduct);
}

export async function upsertShopVariant(
  productId: number,
  payload: UpsertVariantPayload
): Promise<ShopProduct> {
  const data = await authedJson(
    "POST",
    `/api/products/${productId}/variants`,
    payload,
    "No se pudo actualizar la variante"
  );
  return mapApiProduct(data as ApiProduct);
}

export async function setShopUserRole(
  email: string,
  role: "ADMIN" | "STAFF" | "CUSTOMER"
): Promise<{ id: number; email: string; name: string; role: string }> {
  return shopAuthJson("/api/users/role", {
    method: "PUT",
    body: JSON.stringify({ email, role }),
  });
}

export type ShippingRate = {
  id: string;
  name: string;
  price: number;
  daysMin: string;
  daysMax: string;
  deliveredType: "D" | "S" | string;
  productType: string;
  carrier?: "correo_argentino" | "andreani" | string;
};

export type ShippingQuoteResult = {
  /** Referencia de la cotización guardada en el backend; el checkout la usa para cobrar. */
  quoteId?: string | null;
  expiresAt?: string | null;
  origin: { city: string; postalCode: string };
  destination: { postalCode: string };
  packages?: number;
  declaredValue?: {
    total: number;
    perPackage: number;
  };
  package: {
    length: number;
    width: number;
    height: number;
    weightGrams: number;
  };
  source: "micorreo" | "tarifario";
  andreani?: "api" | "error" | "unconfigured";
  rates: ShippingRate[];
};

export async function quoteCorreoShipping(
  postalCode: string,
  packages = 1
): Promise<ShippingQuoteResult> {
  const base = getBackendUrl();
  if (!base) throw new Error("Falta NEXT_PUBLIC_BACKEND_URL");
  const cp = String(postalCode || "").replace(/\D/g, "").slice(0, 4);
  const qty = Math.min(30, Math.max(1, Math.floor(Number(packages) || 1)));
  const params = new URLSearchParams({
    postalCode: cp,
    packages: String(qty),
  });
  const res = await fetch(
    `${base}/api/shipping/quote?${params.toString()}`,
    { cache: "no-store" }
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "No se pudo cotizar el envío.");
  }
  return data as ShippingQuoteResult;
}

export type BusinessBookResponse = BusinessData & {
  /** Versión del libro en el servidor. Se devuelve al guardar para detectar copias viejas. */
  rev?: number;
  /** Ventas de pedidos que el backend volvió a pegar porque el panel guardó una copia vieja. */
  recoveredRows?: number;
};

export async function fetchBusinessBook(): Promise<BusinessBookResponse | null> {
  const base = getBackendUrl();
  if (!base) return null;
  try {
    const token = readToken();
    const res = await fetch(`${base}/api/business`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || typeof data !== "object" || !Array.isArray(data.ventas)) {
      return null;
    }
    return data as BusinessBookResponse;
  } catch {
    return null;
  }
}

export async function saveBusinessBook(
  book: BusinessData,
  rev?: number
): Promise<BusinessBookResponse> {
  const data = await shopAuthJson<BusinessBookResponse>("/api/business", {
    method: "PUT",
    body: JSON.stringify(rev == null ? book : { ...book, rev }),
  });
  return data;
}
