"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  CartItem,
  CartShippingPref,
  MockOrder,
  MockUser,
  OrderStatus,
  SessionUser,
  ShippingDetails,
  ShippingZone,
  ShopProduct,
  TrackingCarrier,
} from "@/lib/mock/types";
import { parseMoney, uid } from "@/lib/mock/money";
import { calcPromoDiscount, SEED_PROMO_CODES, validatePromo, type PromoCode } from "@/lib/mock/promos";
import { quoteShipping } from "@/lib/mock/shipping";
import {
  getSizeStock,
  normalizeProductStock,
  sizeQty,
  syncSizeStock,
} from "@/lib/mock/stock";
import { DEMO_HINTS, SEED_USERS, seedOrders, seedProducts } from "@/lib/mock/seed";
import { readJson, STORAGE_KEYS, writeJson } from "@/lib/mock/storage";
import {
  syncEcommerceToProducts,
  type SyncEcommerceResult,
} from "@/lib/mock/syncEcommerce";
import type { EcommerceRow } from "@/lib/mock/business";
import {
  ventasToStockDeductions,
  type StockDeduction,
} from "@/lib/mock/resolveVenta";
import type { VentaRow } from "@/lib/mock/business";
import {
  appendVentasFromOrder,
  BUSINESS_CHANGED_EVENT,
  BUSINESS_KEY,
  deductEcommerceFromOrder,
  orderCountsInLedger,
  pushProductStockToEcommerce,
  removeVentasOfOrder,
} from "@/lib/mock/orderVentas";
import { emptyBusiness, type BusinessData } from "@/lib/mock/business";
import {
  fetchAccountBag,
  fetchShopMe,
  fetchShopOrders,
  fetchShopProducts,
  invalidateShopProductsCache,
  fetchShopPromos,
  getBackendUrl,
  hasApiAuth,
  loginShopUser,
  registerShopUser,
  clearApiToken,
  saveAccountBag,
  updateShopProfile,
  createShopOrder,
  updateShopOrder,
  saveShopPromo,
  deleteShopPromo,
} from "@/lib/api/backend";
import { fillEmptyVariantImages, pricedForMegaSale } from "@/data/catalog";
import {
  bagOwnerId,
  clearAllBags,
  emptyBag,
  EMPTY_SHIPPING,
  GUEST_BAG_ID,
  mergeBags,
  migrateLegacyBag,
  normalizeBag,
  readBag,
  writeBag,
  type AccountBag,
} from "@/lib/mock/accountBags";

function remoteBagKey(bag: AccountBag): string {
  return JSON.stringify({
    cart: bag.cart.map((item) => ({
      productSlug: item.productSlug,
      variantId: item.variantId,
      size: item.size,
      qty: item.qty,
    })),
    wishlist: bag.wishlist,
    shipping: bag.shipping,
  });
}

function withLiveCartPrices(item: CartItem, products: ShopProduct[]): CartItem {
  const product = products.find((p) => p.slug === item.productSlug);
  const variant = product?.variants.find((v) => v.id === item.variantId);
  if (!product || !variant) return item;
  const priced = pricedForMegaSale(variant.price, variant.transfer, product);
  if (!priced.active) return item;
  return {
    ...item,
    price: priced.price,
    transfer: priced.transfer,
    listPrice: priced.price,
  };
}

/** Avisa al panel de gestión que el backend pudo haber cambiado la planilla. */
function notifyBusinessChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(BUSINESS_CHANGED_EVENT));
}

type LoginResult =
  | { ok: true; welcomeCoupon?: string; role?: SessionUser["role"] }
  | { ok: false; error: string };
type PlaceOrderResult =
  | { ok: true; order: MockOrder }
  | { ok: false; error: string };

type StoreContextValue = {
  ready: boolean;
  session: SessionUser | null;
  users: MockUser[];
  products: ShopProduct[];
  cart: CartItem[];
  orders: MockOrder[];
  promos: PromoCode[];
  wishlist: string[];
  recentlyViewed: string[];
  cartCount: number;
  cartSubtotal: number;
  cartTransferTotal: number;
  cartShipping: CartShippingPref;
  setCartShipping: (next: Partial<CartShippingPref>) => void;
  demoHints: typeof DEMO_HINTS;
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    phone: string;
  }) => Promise<LoginResult>;
  logout: () => void;
  updateProfile: (
    data: Partial<Pick<MockUser, "name" | "phone" | "address" | "city">>
  ) => Promise<{ ok: boolean; error?: string }>;
  addToCart: (item: Omit<CartItem, "id" | "qty"> & { qty?: number }) => void;
  updateCartQty: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  toggleWishlist: (slug: string) => void;
  isWishlisted: (slug: string) => boolean;
  trackView: (slug: string) => void;
  placeOrder: (input: {
    paymentMethod: MockOrder["paymentMethod"];
    shippingAddress: string;
    shippingDetails?: ShippingDetails;
    promoCode?: string;
    shippingCost?: number;
    discount?: number;
    idempotencyKey?: string;
    guest?: {
      name: string;
      email: string;
      phone: string;
      password?: string;
    };
  }) => Promise<PlaceOrderResult>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
  updateOrderTracking: (
    id: string,
    data: {
      trackingCarrier: TrackingCarrier;
      trackingCode: string;
      status?: OrderStatus;
    }
  ) => Promise<void>;
  getProduct: (slug: string) => ShopProduct | undefined;
  getOrder: (id: string) => MockOrder | undefined;
  saveProduct: (product: ShopProduct) => void;
  reloadProducts: () => Promise<void>;
  deleteProduct: (slug: string) => void;
  toggleProductActive: (slug: string) => void;
  savePromo: (
    promo: PromoCode
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  deletePromo: (code: string) => Promise<void>;
  syncFromEcommerce: (rows: EcommerceRow[]) => SyncEcommerceResult;
  /** Descuenta stock del catálogo según ventas de la planilla */
  applyVentasToStock: (ventas: VentaRow[]) => {
    deductions: StockDeduction[];
    applied: number;
    skipped: number;
  };
  resetDemoData: () => void;
};

const StoreContext = createContext<StoreContextValue | null>(null);

function toSession(user: MockUser): SessionUser {
  const { password: _, ...rest } = user;
  return rest;
}

function sessionFromApi(user: {
  id: number | string;
  name: string;
  email: string;
  role: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  dni?: string | null;
  addresses?: SessionUser["addresses"];
  createdAt?: string;
}): SessionUser {
  return {
    id: String(user.id),
    name: user.name,
    email: user.email,
    role: user.role === "ADMIN" ? "admin" : user.role === "STAFF" ? "staff" : "customer",
    phone: user.phone || undefined,
    address: user.address || undefined,
    city: user.city || undefined,
    province: user.province || undefined,
    dni: user.dni || undefined,
    addresses: user.addresses || undefined,
    createdAt: user.createdAt || new Date().toISOString(),
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [users, setUsers] = useState<MockUser[]>(SEED_USERS);
  const [session, setSession] = useState<SessionUser | null>(null);
  const [products, setProducts] = useState<ShopProduct[]>(seedProducts());
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<MockOrder[]>([]);
  const [promos, setPromos] = useState<PromoCode[]>(SEED_PROMO_CODES);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
  const [cartShipping, setCartShippingState] =
    useState<CartShippingPref>(EMPTY_SHIPPING);
  const bagOwnerRef = useRef(GUEST_BAG_ID);
  const lastRemoteBagKeyRef = useRef("");
  const [bagSynced, setBagSynced] = useState(false);

  useEffect(() => {
    const storedUsers = readJson<MockUser[] | null>(STORAGE_KEYS.users, null);
    const storedProducts = readJson<ShopProduct[] | null>(
      STORAGE_KEYS.products,
      null
    );
    const storedOrders = readJson<MockOrder[] | null>(STORAGE_KEYS.orders, null);
    const storedSession = readJson<SessionUser | null>(STORAGE_KEYS.session, null);
    const storedRecent = readJson<string[]>(STORAGE_KEYS.recentlyViewed, []);
    const storedPromos = readJson<PromoCode[] | null>(STORAGE_KEYS.promos, null);

    const owner = bagOwnerId(storedSession?.id);
    bagOwnerRef.current = owner;
    const storedBag = migrateLegacyBag(owner);

    setUsers(storedUsers?.length ? storedUsers : SEED_USERS);
    setOrders(
      storedSession && getBackendUrl()
        ? []
        : storedOrders?.length
          ? storedOrders
          : seedOrders()
    );
    setPromos(
      (storedPromos?.length ? storedPromos : SEED_PROMO_CODES)
        .filter((p) => p.type === "percent" || p.type === "fixed")
        .map((p) =>
          p.code === "BIENVENIDA"
            ? SEED_PROMO_CODES.find((s) => s.code === "BIENVENIDA") ?? p
            : p
        )
    );
    setCart(storedBag.cart);
    setSession(storedSession);
    setWishlist(storedBag.wishlist);
    setRecentlyViewed(storedRecent);
    setCartShippingState(storedBag.shipping);

    if (!storedUsers?.length) writeJson(STORAGE_KEYS.users, SEED_USERS);
    if (!storedOrders?.length) writeJson(STORAGE_KEYS.orders, seedOrders());
    if (!storedPromos?.length) writeJson(STORAGE_KEYS.promos, SEED_PROMO_CODES);
    if (!readJson<BusinessData | null>(BUSINESS_KEY, null)) {
      writeJson(BUSINESS_KEY, emptyBusiness());
    }

    let cancelled = false;
    (async () => {
      try {
        const fromApi = await fetchShopProducts();
        if (cancelled) return;

        if (fromApi?.length) {
          setProducts(fromApi.map((p) => fillEmptyVariantImages(normalizeProductStock(p))));
        } else {
          const biz =
            readJson<BusinessData | null>(BUSINESS_KEY, null) ?? emptyBusiness();
          const base = (
            storedProducts?.length ? storedProducts : seedProducts()
          ).map((p) => fillEmptyVariantImages(normalizeProductStock(p)));
          const synced = syncEcommerceToProducts(biz.ecommerce ?? [], base);
          setProducts(
            synced.updatedProducts.map((p) => fillEmptyVariantImages(p))
          );
          writeJson(STORAGE_KEYS.products, synced.updatedProducts);
        }

        let sessionNow = storedSession;
        if (hasApiAuth()) {
          try {
            const me = await fetchShopMe();
            if (cancelled) return;
            sessionNow = sessionFromApi(me);
            setSession(sessionNow);
            writeJson(STORAGE_KEYS.session, sessionNow);
          } catch {
            if (!storedSession) {
              clearApiToken();
              if (!cancelled) setSession(null);
              sessionNow = null;
            }
          }
        }

        if (sessionNow && hasApiAuth()) {
          try {
            const remote = normalizeBag(await fetchAccountBag());
            if (cancelled) return;
            const local = readBag(bagOwnerId(sessionNow.id));
            const remoteEmpty =
              remote.cart.length === 0 && remote.wishlist.length === 0;
            const bag =
              remoteEmpty && (local.cart.length > 0 || local.wishlist.length > 0)
                ? local
                : remote;
            writeBag(sessionNow.id, bag);
            bagOwnerRef.current = sessionNow.id;
            setCart(bag.cart);
            setWishlist(bag.wishlist);
            setCartShippingState(bag.shipping);
            if (bag !== remote) {
              saveAccountBag(bag).catch(() => {});
            }
          } catch {
            /* seguimos con el carrito local de esa cuenta */
          }

          try {
            const remoteOrders = await fetchShopOrders();
            if (cancelled) return;
            setOrders(remoteOrders);
          } catch {
            /* sin pedidos de API */
          }
        }

        const fromPromos = await fetchShopPromos(
          sessionNow?.role === "admin" || sessionNow?.role === "staff"
        );
        if (cancelled) return;
        if (fromPromos) setPromos(fromPromos);
      } catch {
        /* la tienda tiene que abrir igual */
      } finally {
        if (!cancelled) {
          setBagSynced(true);
          setReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    writeJson(STORAGE_KEYS.users, users);
  }, [users, ready]);

  useEffect(() => {
    if (!ready) return;
    writeJson(STORAGE_KEYS.products, products);
  }, [products, ready]);

  useEffect(() => {
    if (!ready) return;
    if (getBackendUrl()) return;
    writeJson(STORAGE_KEYS.orders, orders);
  }, [orders, ready]);

  useEffect(() => {
    if (!ready) return;
    writeBag(bagOwnerRef.current, {
      cart,
      wishlist,
      shipping: cartShipping,
    });
  }, [cart, wishlist, cartShipping, ready]);

  useEffect(() => {
    if (!ready || !bagSynced || !session || !hasApiAuth()) return;
    const payload: AccountBag = { cart, wishlist, shipping: cartShipping };
    const key = remoteBagKey(payload);
    if (key === lastRemoteBagKeyRef.current) return;
    const timer = window.setTimeout(() => {
      saveAccountBag(payload)
        .then(() => {
          lastRemoteBagKeyRef.current = key;
        })
        .catch(() => {});
    }, 600);
    return () => window.clearTimeout(timer);
  }, [cart, wishlist, cartShipping, ready, bagSynced, session]);

  useEffect(() => {
    if (!ready) return;
    writeJson(STORAGE_KEYS.session, session);
  }, [session, ready]);

  useEffect(() => {
    if (!ready) return;
    writeJson(STORAGE_KEYS.recentlyViewed, recentlyViewed);
  }, [recentlyViewed, ready]);

  useEffect(() => {
    if (!ready) return;
    if (getBackendUrl()) return;
    writeJson(STORAGE_KEYS.promos, promos);
  }, [promos, ready]);

  const login = useCallback(
    async (email: string, password: string): Promise<LoginResult> => {
      const currentBag: AccountBag = {
        cart,
        wishlist,
        shipping: cartShipping,
      };
      writeBag(bagOwnerRef.current, currentBag);
      const guestBag =
        bagOwnerRef.current === GUEST_BAG_ID
          ? currentBag
          : readBag(GUEST_BAG_ID);

      const attachAccount = (userId: string, incoming: AccountBag) => {
        const merged = mergeBags(incoming, guestBag);
        writeBag(GUEST_BAG_ID, emptyBag());
        bagOwnerRef.current = userId;
        writeBag(userId, merged);
        setCart(merged.cart);
        setWishlist(merged.wishlist);
        setCartShippingState(merged.shipping);
        return merged;
      };

      if (getBackendUrl()) {
        try {
          const data = await loginShopUser(email, password);
          const nextSession = sessionFromApi(data.user);
          writeJson(STORAGE_KEYS.session, nextSession);
          setBagSynced(false);
          setSession(nextSession);
          try {
            const remote = normalizeBag(await fetchAccountBag());
            const merged = attachAccount(nextSession.id, remote);
            await saveAccountBag(merged);
          } catch {
            attachAccount(nextSession.id, readBag(nextSession.id));
          }
          setBagSynced(true);
          try {
            setOrders(await fetchShopOrders());
          } catch {
            setOrders([]);
          }
          try {
            const fromPromos = await fetchShopPromos(
              nextSession.role === "admin" || nextSession.role === "staff"
            );
            if (fromPromos) setPromos(fromPromos);
          } catch {
            /* seguimos con los cupones locales */
          }
          return { ok: true, role: nextSession.role };
        } catch (err) {
          return {
            ok: false,
            error:
              err instanceof Error
                ? err.message
                : "Email o contraseña incorrectos",
          };
        }
      }
      const user = users.find(
        (u) =>
          u.email.toLowerCase() === email.trim().toLowerCase() &&
          u.password === password
      );
      if (!user) return { ok: false, error: "Email o contraseña incorrectos" };
      attachAccount(user.id, readBag(user.id));
      const nextSession = toSession(user);
      writeJson(STORAGE_KEYS.session, nextSession);
      setSession(nextSession);
      setBagSynced(true);
      return { ok: true, role: nextSession.role };
    },
    [users, cart, wishlist, cartShipping]
  );

  const register = useCallback(
    async (data: {
      name: string;
      email: string;
      password: string;
      phone: string;
    }): Promise<LoginResult> => {
      const currentBag: AccountBag = {
        cart,
        wishlist,
        shipping: cartShipping,
      };
      writeBag(bagOwnerRef.current, currentBag);
      const guestBag =
        bagOwnerRef.current === GUEST_BAG_ID
          ? currentBag
          : readBag(GUEST_BAG_ID);

      const attachAccount = (userId: string, incoming: AccountBag) => {
        const merged = mergeBags(incoming, guestBag);
        writeBag(GUEST_BAG_ID, emptyBag());
        bagOwnerRef.current = userId;
        writeBag(userId, merged);
        setCart(merged.cart);
        setWishlist(merged.wishlist);
        setCartShippingState(merged.shipping);
        return merged;
      };

      if (getBackendUrl()) {
        try {
          const result = await registerShopUser({
            name: data.name,
            email: data.email,
            password: data.password,
            phone: data.phone,
          });
          const nextSession = sessionFromApi(result.user);
          writeJson(STORAGE_KEYS.session, nextSession);
          setBagSynced(false);
          setSession(nextSession);
          try {
            const remote = normalizeBag(await fetchAccountBag());
            const merged = attachAccount(nextSession.id, remote);
            await saveAccountBag(merged);
          } catch {
            attachAccount(nextSession.id, emptyBag());
          }
          setBagSynced(true);
          try {
            setOrders(await fetchShopOrders());
          } catch {
            setOrders([]);
          }
          try {
            const fromPromos = await fetchShopPromos(false);
            if (fromPromos) setPromos(fromPromos);
          } catch {
            /* seguimos con los cupones locales */
          }
          return { ok: true, welcomeCoupon: result.welcomePromo?.code };
        } catch (err) {
          return {
            ok: false,
            error:
              err instanceof Error
                ? err.message
                : "No se pudo crear la cuenta",
          };
        }
      }

      const exists = users.some(
        (u) => u.email.toLowerCase() === data.email.trim().toLowerCase()
      );
      if (exists) return { ok: false, error: "Ese email ya está registrado" };
      const user: MockUser = {
        id: uid("user"),
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
        phone: data.phone.trim(),
        role: "customer",
        createdAt: new Date().toISOString(),
      };
      const merged = mergeBags(emptyBag(), guestBag);
      writeBag(GUEST_BAG_ID, emptyBag());
      bagOwnerRef.current = user.id;
      writeBag(user.id, merged);
      setUsers((prev) => [...prev, user]);
      const nextSession = toSession(user);
      writeJson(STORAGE_KEYS.session, nextSession);
      setSession(nextSession);
      setCart(merged.cart);
      setWishlist(merged.wishlist);
      setCartShippingState(merged.shipping);
      setBagSynced(true);
      return { ok: true };
    },
    [users, cart, wishlist, cartShipping]
  );

  const logout = useCallback(() => {
    const currentBag: AccountBag = {
      cart,
      wishlist,
      shipping: cartShipping,
    };
    writeBag(bagOwnerRef.current, currentBag);
    if (hasApiAuth()) {
      saveAccountBag(currentBag).catch(() => {});
    }
    clearApiToken();
    writeJson(STORAGE_KEYS.session, null);
    bagOwnerRef.current = GUEST_BAG_ID;
    const guest = readBag(GUEST_BAG_ID);
    setSession(null);
    setCart(guest.cart);
    setWishlist(guest.wishlist);
    setCartShippingState(guest.shipping);
    if (getBackendUrl()) setOrders([]);
    setBagSynced(true);
  }, [cart, wishlist, cartShipping]);

  const updateProfile = useCallback(
    async (
      data: Partial<Pick<MockUser, "name" | "phone" | "address" | "city">>
    ): Promise<{ ok: boolean; error?: string }> => {
      if (!session) return { ok: false, error: "No hay sesión." };

      if (hasApiAuth()) {
        try {
          const user = await updateShopProfile(session.id, {
            ...data,
            whatsapp: data.phone,
          });
          setSession(sessionFromApi(user));
          return { ok: true };
        } catch (err) {
          return {
            ok: false,
            error:
              err instanceof Error
                ? err.message
                : "No se pudo guardar el perfil.",
          };
        }
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === session.id ? { ...u, ...data } : u))
      );
      setSession((prev) => (prev ? { ...prev, ...data } : prev));
      return { ok: true };
    },
    [session]
  );

  const addToCart = useCallback(
    (item: Omit<CartItem, "id" | "qty"> & { qty?: number }) => {
      const addQty = item.qty ?? 1;
      setCart((prev) => {
        const max = getSizeStock(
          products.find((p) => p.slug === item.productSlug),
          item.variantId,
          item.size
        );
        if (max <= 0) return prev;

        const existing = prev.find(
          (c) =>
            c.productSlug === item.productSlug &&
            c.variantId === item.variantId &&
            c.size === item.size
        );
        if (existing) {
          const nextQty = Math.min(max, existing.qty + addQty);
          return prev.map((c) =>
            c.id === existing.id ? { ...c, qty: nextQty } : c
          );
        }
        return [
          ...prev,
          { ...item, id: uid("cart"), qty: Math.min(max, addQty) },
        ];
      });
    },
    [products]
  );

  const updateCartQty = useCallback(
    (id: string, qty: number) => {
      setCart((prev) =>
        prev
          .map((c) => {
            if (c.id !== id) return c;
            const max = getSizeStock(
              products.find((p) => p.slug === c.productSlug),
              c.variantId,
              c.size
            );
            const next = Math.min(Math.max(0, qty), max || 0);
            return { ...c, qty: next };
          })
          .filter((c) => c.qty > 0)
      );
    },
    [products]
  );

  const removeFromCart = useCallback((id: string) => {
    setCart((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const setCartShipping = useCallback((next: Partial<CartShippingPref>) => {
    setCartShippingState((prev) => {
      const zone = (next.zone ?? prev.zone) as ShippingZone;
      const postalCode =
        next.postalCode !== undefined ? next.postalCode : prev.postalCode;
      const rate =
        next.rate !== undefined
          ? next.rate
          : zone !== "interior" ||
              (next.postalCode !== undefined &&
                next.postalCode !== prev.postalCode)
            ? null
            : prev.rate;
      const deliveryDate =
        zone === "rosario"
          ? next.deliveryDate !== undefined
            ? next.deliveryDate
            : prev.deliveryDate
          : "";
      const deliverySlot =
        zone === "rosario"
          ? next.deliverySlot !== undefined
            ? next.deliverySlot
            : prev.deliverySlot
          : "";
      const storeId =
        zone === "retiro"
          ? next.storeId !== undefined
            ? next.storeId
            : prev.storeId
          : "";
      return { zone, postalCode, rate, deliveryDate, deliverySlot, storeId };
    });
  }, []);

  const toggleWishlist = useCallback((slug: string) => {
    setWishlist((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [slug, ...prev]
    );
  }, []);

  const isWishlisted = useCallback(
    (slug: string) => wishlist.includes(slug),
    [wishlist]
  );

  const trackView = useCallback((slug: string) => {
    setRecentlyViewed((prev) => {
      const next = [slug, ...prev.filter((s) => s !== slug)];
      return next.slice(0, 8);
    });
  }, []);

  const placeOrder = useCallback(
    async (input: {
      paymentMethod: MockOrder["paymentMethod"];
      shippingAddress: string;
      shippingDetails?: ShippingDetails;
      promoCode?: string;
      shippingCost?: number;
      discount?: number;
      idempotencyKey?: string;
      guest?: {
        name: string;
        email: string;
        phone: string;
        password?: string;
      };
    }): Promise<PlaceOrderResult> => {
      if (cart.length === 0) {
        return { ok: false, error: "El carrito está vacío." };
      }

      if (hasApiAuth() || getBackendUrl()) {
        try {
          const order = await createShopOrder(
            {
              items: cart.map((c) => ({
                productSlug: c.productSlug,
                variantId: c.variantId,
                size: c.size,
                qty: c.qty,
              })),
              paymentMethod: input.paymentMethod,
              shippingAddress: input.shippingAddress,
              shippingDetails: input.shippingDetails,
              shippingCost: input.shippingCost ?? 0,
              promoCode: input.promoCode,
              guest: session ? undefined : input.guest,
            },
            { idempotencyKey: input.idempotencyKey }
          );
          if (!session && hasApiAuth()) {
            try {
              const me = await fetchShopMe();
              const nextSession = sessionFromApi(me);
              writeJson(STORAGE_KEYS.session, nextSession);
              setSession(nextSession);
            } catch {
              /* el pedido ya está */
            }
          }
          setOrders((prev) => [order, ...prev.filter((o) => o.id !== order.id)]);
          setCart([]);
          invalidateShopProductsCache();
          fetchShopProducts({ force: true })
            .then((fromApi) => {
              if (fromApi?.length) {
                setProducts(fromApi.map(normalizeProductStock));
              }
            })
            .catch(() => {});
          return { ok: true, order };
        } catch (err) {
          return {
            ok: false,
            error:
              err instanceof Error
                ? err.message
                : "No se pudo confirmar el pedido.",
          };
        }
      }

      let mockSession = session;
      if (!mockSession) {
        const guestName = input.guest?.name || input.shippingDetails?.fullName;
        const guestEmail = input.guest?.email || input.shippingDetails?.email;
        const guestPhone = input.guest?.phone || input.shippingDetails?.phone;
        if (!guestName || !guestEmail || !guestPhone) {
          return {
            ok: false,
            error: "Completá nombre, email y teléfono para confirmar el pedido.",
          };
        }
        const created: MockUser = {
          id: uid("user"),
          name: guestName,
          email: guestEmail,
          password: input.guest?.password || uid("pass"),
          role: "customer",
          phone: guestPhone,
          createdAt: new Date().toISOString(),
        };
        setUsers((prev) => [...prev, created]);
        mockSession = toSession(created);
        writeJson(STORAGE_KEYS.session, mockSession);
        setSession(mockSession);
      }

      const subtotal = cart.reduce(
        (s, i) => s + parseMoney(i.price) * i.qty,
        0
      );
      const transferTotal = cart.reduce(
        (s, i) => s + parseMoney(i.transfer) * i.qty,
        0
      );
      const useTransfer = input.paymentMethod === "transferencia";
      const merchandise = useTransfer ? transferTotal : subtotal;

      const promoCheck = input.promoCode
        ? validatePromo(input.promoCode, {
            merchandise,
            userId: mockSession.id,
            orders,
            catalog: promos,
          })
        : null;
      if (promoCheck && !promoCheck.ok) {
        return { ok: false, error: promoCheck.error };
      }
      const promo = promoCheck?.ok ? promoCheck.promo : null;
      const discount =
        input.discount ?? calcPromoDiscount(promo, merchandise);

      for (const item of cart) {
        const available = getSizeStock(
          products.find((p) => p.slug === item.productSlug),
          item.variantId,
          item.size
        );
        if (item.qty > available) {
          return {
            ok: false,
            error: `No hay stock suficiente de ${item.productName} talle ${item.size}.`,
          };
        }
      }

      const zone = input.shippingDetails?.zone ?? "rosario";
      const shipping =
        input.shippingCost ?? quoteShipping(zone, merchandise).cost;

      const total = Math.max(0, merchandise - discount + shipping);

      setProducts((prev) =>
        prev.map((p) => {
          const touches = cart.filter((c) => c.productSlug === p.slug);
          if (!touches.length) return p;
          return {
            ...p,
            updatedAt: new Date().toISOString(),
            variants: p.variants.map((v) => ({
              ...v,
              sizes: v.sizes.map((s) => {
                const sold = touches
                  .filter((c) => c.variantId === v.id && c.size === s.label)
                  .reduce((sum, c) => sum + c.qty, 0);
                if (!sold) return syncSizeStock(s);
                const next = Math.max(0, sizeQty(s) - sold);
                return syncSizeStock({ ...s, stock: next });
              }),
            })),
          };
        })
      );

      const order: MockOrder = {
        id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        userId: mockSession.id,
        userName: mockSession.name,
        userEmail: mockSession.email,
        items: cart.map((c) => ({ ...c, id: uid("item") })),
        subtotal,
        transferTotal,
        shipping,
        discount,
        promoCode: promo?.code,
        total,
        paymentMethod: input.paymentMethod,
        status: useTransfer ? "pendiente" : "pagado",
        shippingAddress: input.shippingAddress,
        shippingDetails: input.shippingDetails,
        trackingCarrier: input.shippingDetails?.shippingCarrier,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setOrders((prev) => [order, ...prev]);
      setCart([]);
      try {
        appendVentasFromOrder(order);
        deductEcommerceFromOrder(order);
      } catch {
        /* noop */
      }
      return { ok: true, order };
    },
    [session, cart, orders, promos, products]
  );

  const updateOrderStatus = useCallback(
    async (id: string, status: OrderStatus) => {
      if (hasApiAuth()) {
        try {
          const updated = await updateShopOrder(id, { status });
          setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
          if (status === "cancelado") {
            invalidateShopProductsCache();
            fetchShopProducts({ force: true })
              .then((fromApi) => {
                if (fromApi?.length) {
                  setProducts(fromApi.map(normalizeProductStock));
                }
              })
              .catch(() => {});
          }
          notifyBusinessChanged();
        } catch {
          /* el admin puede reintentar */
        }
        return;
      }
      const current = orders.find((o) => o.id === id);
      const updated = current
        ? { ...current, status, updatedAt: new Date().toISOString() }
        : null;
      setOrders((prev) =>
        prev.map((o) =>
          o.id === id
            ? { ...o, status, updatedAt: new Date().toISOString() }
            : o
        )
      );
      if (!updated) return;
      try {
        if (orderCountsInLedger(status)) {
          appendVentasFromOrder(updated);
          deductEcommerceFromOrder(updated);
        } else if (status === "cancelado") {
          removeVentasOfOrder(updated);
        }
      } catch {
        /* noop */
      }
    },
    [orders]
  );

  const updateOrderTracking = useCallback(
    async (
      id: string,
      data: {
        trackingCarrier: TrackingCarrier;
        trackingCode: string;
        status?: OrderStatus;
      }
    ) => {
      const code = data.trackingCode.trim();
      if (hasApiAuth()) {
        try {
          const updated = await updateShopOrder(id, {
            trackingCarrier: data.trackingCarrier,
            trackingCode: code,
            status: data.status,
          });
          setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
          notifyBusinessChanged();
        } catch {
          /* el admin puede reintentar */
        }
        return;
      }
      const current = orders.find((o) => o.id === id);
      const nextStatus: OrderStatus =
        data.status ??
        (code &&
        current &&
        (current.status === "pendiente" ||
          current.status === "pagado" ||
          current.status === "preparando")
          ? "enviado"
          : current?.status ?? "pendiente");
      const updated = current
        ? {
            ...current,
            trackingCarrier: data.trackingCarrier,
            trackingCode: code || undefined,
            status: nextStatus,
            updatedAt: new Date().toISOString(),
          }
        : null;
      setOrders((prev) =>
        prev.map((o) => (o.id === id && updated ? updated : o))
      );
      if (updated && orderCountsInLedger(updated.status)) {
        try {
          appendVentasFromOrder(updated);
          deductEcommerceFromOrder(updated);
        } catch {
          /* noop */
        }
      }
    },
    [orders]
  );

  const getProduct = useCallback(
    (slug: string) => products.find((p) => p.slug === slug),
    [products]
  );

  const getOrder = useCallback(
    (id: string) => orders.find((o) => o.id === id),
    [orders]
  );

  const saveProduct = useCallback((product: ShopProduct) => {
    const now = new Date().toISOString();
    const normalized = fillEmptyVariantImages(normalizeProductStock(product));
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.slug === normalized.slug);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...normalized, updatedAt: now };
        return next;
      }
      return [
        {
          ...normalized,
          active: normalized.active ?? true,
          createdAt: now,
          updatedAt: now,
        },
        ...prev,
      ];
    });
    // Mantener planilla E-commerce alineada (stock real)
    try {
      pushProductStockToEcommerce({ ...normalized, updatedAt: now });
    } catch {
      /* noop */
    }
  }, []);

  const reloadProducts = useCallback(async () => {
    invalidateShopProductsCache();
    const fromApi = await fetchShopProducts({ force: true });
    if (fromApi?.length) {
      setProducts(fromApi.map((p) => fillEmptyVariantImages(normalizeProductStock(p))));
    }
  }, []);

  const deleteProduct = useCallback((slug: string) => {
    setProducts((prev) => prev.filter((p) => p.slug !== slug));
  }, []);

  const toggleProductActive = useCallback((slug: string) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.slug === slug
          ? {
              ...p,
              active: !(p.active ?? true),
              updatedAt: new Date().toISOString(),
            }
          : p
      )
    );
  }, []);

  const savePromo = useCallback(
    async (
      promo: PromoCode
    ): Promise<{ ok: true } | { ok: false; error: string }> => {
      const code = promo.code.trim().toUpperCase();
      if (!/^[A-Z0-9_-]{3,20}$/.test(code)) {
        return {
          ok: false,
          error: "Código: 3–20 caracteres (A-Z, 0-9, _ o -)",
        };
      }
      if (!promo.label.trim()) {
        return { ok: false, error: "Completá la descripción" };
      }
      if (!(promo.value > 0)) {
        return { ok: false, error: "El valor debe ser mayor a 0" };
      }
      const next: PromoCode = {
        ...promo,
        code,
        label: promo.label.trim(),
        value: promo.value,
        active: promo.active !== false,
      };

      if (hasApiAuth()) {
        try {
          const saved = await saveShopPromo(next);
          setPromos((prev) => {
            const idx = prev.findIndex((p) => p.code === saved.code);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = saved;
              return copy;
            }
            return [saved, ...prev];
          });
          return { ok: true };
        } catch (err) {
          return {
            ok: false,
            error:
              err instanceof Error ? err.message : "No se pudo guardar el cupón.",
          };
        }
      }

      setPromos((prev) => {
        const idx = prev.findIndex((p) => p.code === code);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = next;
          return copy;
        }
        return [next, ...prev];
      });
      return { ok: true };
    },
    []
  );

  const deletePromo = useCallback(async (code: string) => {
    const normalized = code.trim().toUpperCase();
    if (hasApiAuth()) {
      try {
        await deleteShopPromo(normalized);
      } catch {
        return;
      }
    }
    setPromos((prev) => prev.filter((p) => p.code !== normalized));
  }, []);

  const syncFromEcommerce = useCallback((rows: EcommerceRow[]) => {
    const result = syncEcommerceToProducts(rows, products);
    setProducts(result.updatedProducts);
    return result;
  }, [products]);

  const applyVentasToStock = useCallback((ventas: VentaRow[]) => {
    const deductions = ventasToStockDeductions(ventas);
    let applied = 0;
    let skipped = 0;
    const now = new Date().toISOString();
    const touched: ShopProduct[] = [];
    setProducts((prev) =>
      prev.map((p) => {
        const hits = deductions.filter((d) => d.slug === p.slug);
        if (!hits.length) return p;
        let changed = false;
        const variants = p.variants.map((v) => {
          const variantHits = hits.filter((h) => h.variantId === v.id);
          if (!variantHits.length) return v;
          const sizes = v.sizes.map((s) => ({ ...s }));
          for (const d of variantHits) {
            let remaining = d.qty;
            const ordered = d.talle
              ? sizes.filter((s) => s.label === d.talle)
              : [...sizes].sort(
                  (a, b) =>
                    (typeof b.stock === "number" ? b.stock : 0) -
                    (typeof a.stock === "number" ? a.stock : 0)
                );
            for (const s of ordered) {
              if (remaining <= 0) break;
              const qty =
                typeof s.stock === "number" ? s.stock : s.inStock ? 1 : 0;
              if (qty <= 0) continue;
              const take = Math.min(qty, remaining);
              s.stock = qty - take;
              s.inStock = s.stock > 0;
              remaining -= take;
              applied += take;
              changed = true;
            }
            if (remaining > 0) skipped += remaining;
          }
          return { ...v, sizes };
        });
        if (!changed) return p;
        const next = normalizeProductStock({ ...p, variants, updatedAt: now });
        touched.push(next);
        return next;
      })
    );
    for (const p of touched) {
      try {
        pushProductStockToEcommerce(p);
      } catch {
        /* noop */
      }
    }
    return { deductions, applied, skipped };
  }, []);

  const resetDemoData = useCallback(() => {
    const biz = emptyBusiness();
    writeJson(BUSINESS_KEY, biz);
    const synced = syncEcommerceToProducts(biz.ecommerce, seedProducts());
    const productsSeed = synced.updatedProducts;
    const ordersSeed = seedOrders();
    setUsers(SEED_USERS);
    setProducts(productsSeed);
    setOrders(ordersSeed);
    setPromos(SEED_PROMO_CODES);
    setCart([]);
    setWishlist([]);
    setRecentlyViewed([]);
    setCartShippingState(EMPTY_SHIPPING);
    setSession(null);
    bagOwnerRef.current = GUEST_BAG_ID;
    setBagSynced(true);
    writeJson(STORAGE_KEYS.users, SEED_USERS);
    writeJson(STORAGE_KEYS.products, productsSeed);
    writeJson(STORAGE_KEYS.orders, ordersSeed);
    writeJson(STORAGE_KEYS.promos, SEED_PROMO_CODES);
    writeJson(STORAGE_KEYS.recentlyViewed, []);
    writeJson(STORAGE_KEYS.session, null);
    clearAllBags();
  }, []);

  const cartCount = useMemo(
    () => cart.reduce((s, i) => s + i.qty, 0),
    [cart]
  );
  const pricedCart = useMemo(
    () => cart.map((item) => withLiveCartPrices(item, products)),
    [cart, products]
  );
  const cartSubtotal = useMemo(
    () => pricedCart.reduce((s, i) => s + parseMoney(i.price) * i.qty, 0),
    [pricedCart]
  );
  const cartTransferTotal = useMemo(
    () => pricedCart.reduce((s, i) => s + parseMoney(i.transfer) * i.qty, 0),
    [pricedCart]
  );

  const value = useMemo<StoreContextValue>(
    () => ({
      ready,
      session,
      users,
      products,
      cart: pricedCart,
      orders,
      promos,
      wishlist,
      recentlyViewed,
      cartCount,
      cartSubtotal,
      cartTransferTotal,
      cartShipping,
      setCartShipping,
      demoHints: DEMO_HINTS,
      login,
      register,
      logout,
      updateProfile,
      addToCart,
      updateCartQty,
      removeFromCart,
      clearCart,
      toggleWishlist,
      isWishlisted,
      trackView,
      placeOrder,
      updateOrderStatus,
      updateOrderTracking,
      getProduct,
      getOrder,
      saveProduct,
      reloadProducts,
      deleteProduct,
      toggleProductActive,
      savePromo,
      deletePromo,
      syncFromEcommerce,
      applyVentasToStock,
      resetDemoData,
    }),
    [
      ready,
      session,
      users,
      products,
      pricedCart,
      orders,
      promos,
      wishlist,
      recentlyViewed,
      cartCount,
      cartSubtotal,
      cartTransferTotal,
      cartShipping,
      setCartShipping,
      login,
      register,
      logout,
      updateProfile,
      addToCart,
      updateCartQty,
      removeFromCart,
      clearCart,
      toggleWishlist,
      isWishlisted,
      trackView,
      placeOrder,
      updateOrderStatus,
      updateOrderTracking,
      getProduct,
      getOrder,
      saveProduct,
      reloadProducts,
      deleteProduct,
      toggleProductActive,
      savePromo,
      deletePromo,
      syncFromEcommerce,
      applyVentasToStock,
      resetDemoData,
    ]
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
