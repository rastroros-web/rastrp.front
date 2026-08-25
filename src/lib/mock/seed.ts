import type { MockOrder, MockUser, ShopProduct } from "@/lib/mock/types";
import { catalog } from "@/data/catalog";
import {
  formatMoney,
  installmentFromPrice,
  installmentLabelFromPrice,
  parseMoney,
  uid,
} from "@/lib/mock/money";

export const SEED_USERS: MockUser[] = [
  {
    id: "user_admin",
    name: "Admin Rastro",
    email: "admin@rastro.com",
    password: "admin123",
    role: "admin",
    phone: "+54 341 555-0100",
    address: "Oficina central",
    city: "Rosario",
    createdAt: "2026-01-10T10:00:00.000Z",
  },
  {
    id: "user_demo",
    name: "Martina Demo",
    email: "demo@rastro.com",
    password: "demo123",
    role: "customer",
    phone: "+54 341 555-0199",
    address: "San Martín 1234",
    city: "Rosario",
    createdAt: "2026-02-01T12:00:00.000Z",
  },
  {
    id: "user_lucas",
    name: "Lucas Gómez",
    email: "lucas@email.com",
    password: "demo123",
    role: "customer",
    phone: "+54 341 555-0188",
    address: "Córdoba 500",
    city: "Rosario",
    createdAt: "2026-03-15T09:00:00.000Z",
  },
];

/** Inventario mock: cantidades por talle (algunos 0 / bajos para alertas). */
function withRealisticStock(product: ShopProduct): ShopProduct {
  return {
    ...product,
    variants: product.variants.map((variant, vi) => ({
      ...variant,
      sizes: variant.sizes.map((size) => {
        const n =
          (product.slug.length * 11 +
            Number(size.label || 0) * 7 +
            vi * 13 +
            size.label.charCodeAt(0)) %
          17;
        const extreme =
          size.label === "34" ||
          size.label === "35" ||
          size.label === "43" ||
          size.label === "44" ||
          size.label === "45";

        let stock: number;
        if (n === 0 || n === 1) stock = 0;
        else if (n === 2 || n === 3) stock = 1;
        else if (n === 4 || n === 5) stock = 2;
        else if (n === 6) stock = 3;
        else if (extreme) stock = 2 + (n % 4); // 2–5
        else stock = 4 + (n % 9); // 4–12

        return { ...size, stock, inStock: stock > 0 };
      }),
    })),
  };
}

/** % de oferta por color (Adidas Samba) y otros modelos destacados. */
const SAMBA_SALE_BY_COLOR: Record<string, number> = {
  Chocolate: 20,
  "Black Off": 25,
  "Off White": 30,
  "V. Chocolate": 35,
  Cherry: 20,
  "Beige Tex": 15,
  Green: 25,
  "Rosa Tex": 20,
  Caramelo: 40,
  Classic: 15,
  Black: 20,
};

const PRODUCT_SALE_PERCENT: Record<string, number> = {
  "nike-dunk-low": 25,
  "nike-air-force-1": 20,
  "vans-ultrarange": 30,
  "vans-old-skool": 20,
  "adidas-campus": 25,
  "adidas-gazelle": 15,
  "new-balance-574": 20,
  "converse-all-star": 30,
  "adidas-samba-xlg": 20,
};

function applySaleToVariant(
  variant: ShopProduct["variants"][number],
  percent: number
): ShopProduct["variants"][number] {
  const price = parseMoney(variant.price);
  if (price <= 0 || percent <= 0) return variant;
  const compare = Math.round(price / (1 - percent / 100));
  return {
    ...variant,
    salePercent: percent,
    compareAtPrice: formatMoney(compare),
  };
}

function withSaleOffers(product: ShopProduct): ShopProduct {
  if (product.slug === "adidas-samba") {
    return {
      ...product,
      tags: Array.from(
        new Set(["Liquidación", "Oferta", ...product.tags])
      ),
      variants: product.variants.map((v) => {
        const pct = SAMBA_SALE_BY_COLOR[v.name] ?? 20;
        return applySaleToVariant(v, pct);
      }),
    };
  }

  const pct = PRODUCT_SALE_PERCENT[product.slug];
  if (!pct) return product;

  return {
    ...product,
    tags: product.tags.includes("Oferta")
      ? product.tags
      : ["Oferta", ...product.tags],
    variants: product.variants.map((v) => applySaleToVariant(v, pct)),
  };
}

function withThreeInstallments(product: ShopProduct): ShopProduct {
  return {
    ...product,
    variants: product.variants.map((v) => ({
      ...v,
      installments: installmentFromPrice(v.price),
      installmentsLabel: installmentLabelFromPrice(v.price),
    })),
  };
}

export function seedProducts(): ShopProduct[] {
  return catalog.map((p, i) =>
    withThreeInstallments(
      withSaleOffers(
        withRealisticStock({
          ...p,
          active: true,
          createdAt: new Date(Date.UTC(2026, 0, 1 + (i % 28))).toISOString(),
          updatedAt: "2026-03-01T00:00:00.000Z",
        })
      )
    )
  );
}

export function seedOrders(): MockOrder[] {
  const af1 = catalog.find((p) => p.slug === "nike-air-force-1");
  const dunk = catalog.find((p) => p.slug === "nike-dunk-low");
  const samba = catalog.find((p) => p.slug === "adidas-samba");

  const mkItem = (
    product: (typeof catalog)[0] | undefined,
    size: string,
    qty = 1
  ) => {
    if (!product) return null;
    const v = product.variants[0];
    return {
      id: uid("item"),
      productSlug: product.slug,
      productName: product.name,
      brand: product.brand,
      variantId: v.id,
      variantName: v.name,
      size,
      price: v.price,
      transfer: v.transfer,
      image: v.image,
      qty,
    };
  };

  const items1 = [mkItem(af1, "39"), mkItem(dunk, "40")].filter(
    Boolean
  ) as MockOrder["items"];
  const items2 = [mkItem(samba, "38")].filter(Boolean) as MockOrder["items"];
  const items3 = [mkItem(af1, "41", 1)].filter(Boolean) as MockOrder["items"];

  const totalOf = (items: MockOrder["items"], transfer = false) =>
    items.reduce(
      (sum, i) => sum + parseMoney(transfer ? i.transfer : i.price) * i.qty,
      0
    );

  const now = Date.now();
  const day = 86400000;

  return [
    {
      id: "ORD-1001",
      userId: "user_demo",
      userName: "Martina Demo",
      userEmail: "demo@rastro.com",
      items: items1,
      subtotal: totalOf(items1),
      transferTotal: totalOf(items1, true),
      shipping: 0,
      discount: 0,
      total: totalOf(items1, true),
      paymentMethod: "transferencia",
      status: "enviado",
      shippingAddress: "San Martín 1234, 4° B, Rosario, Santa Fe (2000)",
      shippingDetails: {
        zone: "rosario",
        fullName: "Martina Demo",
        phone: "3415551234",
        email: "demo@rastro.com",
        street: "San Martín",
        number: "1234",
        floor: "4° B",
        city: "Rosario",
        province: "Santa Fe",
        postalCode: "2000",
        dni: "35111222",
        sameDayEligible: true,
      },
      trackingCarrier: "andreani",
      trackingCode: "360000098765432",
      createdAt: new Date(now - 5 * day).toISOString(),
      updatedAt: new Date(now - 2 * day).toISOString(),
    },
    {
      id: "ORD-1002",
      userId: "user_lucas",
      userName: "Lucas Gómez",
      userEmail: "lucas@email.com",
      items: items2,
      subtotal: totalOf(items2),
      transferTotal: totalOf(items2, true),
      shipping: 3500,
      discount: 0,
      total: totalOf(items2) + 3500,
      paymentMethod: "mercadopago",
      status: "preparando",
      shippingAddress: "Córdoba 500, Rosario, Santa Fe (2000)",
      shippingDetails: {
        zone: "rosario",
        fullName: "Lucas Gómez",
        phone: "3414449988",
        email: "lucas@email.com",
        street: "Córdoba",
        number: "500",
        city: "Rosario",
        province: "Santa Fe",
        postalCode: "2000",
        dni: "30999888",
        notes: "Portero eléctrico",
      },
      createdAt: new Date(now - 2 * day).toISOString(),
      updatedAt: new Date(now - 1 * day).toISOString(),
    },
    {
      id: "ORD-1003",
      userId: "user_demo",
      userName: "Martina Demo",
      userEmail: "demo@rastro.com",
      items: items3,
      subtotal: totalOf(items3),
      transferTotal: totalOf(items3, true),
      shipping: 0,
      discount: 5000,
      promoCode: "BIENVENIDA",
      total: Math.max(0, totalOf(items3, true) - 5000),
      paymentMethod: "transferencia",
      status: "pendiente",
      shippingAddress: "San Martín 1234, 4° B, Rosario, Santa Fe (2000)",
      shippingDetails: {
        zone: "rosario",
        fullName: "Martina Demo",
        phone: "3415551234",
        email: "demo@rastro.com",
        street: "San Martín",
        number: "1234",
        floor: "4° B",
        city: "Rosario",
        province: "Santa Fe",
        postalCode: "2000",
        dni: "35111222",
      },
      createdAt: new Date(now - 0.5 * day).toISOString(),
      updatedAt: new Date(now - 0.5 * day).toISOString(),
    },
  ];
}

export const DEMO_HINTS = {
  admin: { email: "admin@rastro.com", password: "admin123" },
  customer: { email: "demo@rastro.com", password: "demo123" },
};

export { formatMoney, parseMoney };
