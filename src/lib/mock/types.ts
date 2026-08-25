import type { CatalogProduct } from "@/data/catalog";

export type UserRole = "customer" | "admin" | "staff";

export type SavedAddress = {
  id: string;
  label?: string;
  fullName?: string;
  phone?: string;
  street: string;
  number: string;
  floor?: string;
  city: string;
  province?: string;
  postalCode?: string;
  dni?: string;
};

export type MockUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  dni?: string;
  addresses?: SavedAddress[];
  createdAt: string;
};

export type CartItem = {
  id: string;
  productSlug: string;
  productName: string;
  brand: string;
  variantId: string;
  variantName: string;
  size: string;
  price: string;
  transfer: string;
  /** Precio web vigente (con Mega Sale si aplica). El 25% OFF transferencia se muestra contra este. */
  listPrice?: string;
  image: string;
  qty: number;
};

export type OrderStatus =
  | "pendiente"
  | "pagado"
  | "preparando"
  | "enviado"
  | "entregado"
  | "cancelado";

export type OrderItem = CartItem;

export type SelectedShippingRate = {
  id: string;
  name: string;
  price: number;
  daysMin: string;
  daysMax: string;
  deliveredType: string;
  productType: string;
  carrier?: TrackingCarrier | string;
  /** Cotización del backend a la que pertenece esta tarifa. */
  quoteId?: string | null;
};

export type CartShippingPref = {
  zone: ShippingZone;
  postalCode: string;
  rate: SelectedShippingRate | null;
  deliveryDate: string;
  deliverySlot: string;
};

export type TrackingCarrier =
  | "andreani"
  | "correo_argentino"
  | "rastro"
  | "otro";

export type ShippingDetails = {
  zone: ShippingZone;
  fullName: string;
  phone: string;
  email: string;
  street: string;
  number: string;
  floor?: string;
  city: string;
  province: string;
  postalCode: string;
  dni?: string;
  notes?: string;
  sameDayEligible?: boolean;
  deliveryDate?: string;
  deliverySlot?: string;
  /** Punto de retiro (si zone === retiro) */
  storeId?: string;
  storeName?: string;
  shippingRateId?: string;
  /** Cotización guardada en el backend: con esto se cobra el envío al interior. */
  shippingQuoteId?: string;
  shippingRateName?: string;
  shippingCarrier?: TrackingCarrier;
};

export type MockOrder = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  items: OrderItem[];
  subtotal: number;
  transferTotal: number;
  shipping: number;
  discount: number;
  promoCode?: string;
  total: number;
  paymentMethod: "transferencia" | "mercadopago";
  status: OrderStatus;
  shippingAddress: string;
  shippingDetails?: ShippingDetails;
  trackingCarrier?: TrackingCarrier;
  trackingCode?: string;
  createdAt: string;
  updatedAt: string;
};

export type SessionUser = Omit<MockUser, "password">;

export type ShopProduct = CatalogProduct & {
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
};
