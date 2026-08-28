import type { OrderStatus } from "@/lib/mock/types";
import type { SelectOption } from "@/components/ui/FancySelect";
import { TRACKING_CARRIERS } from "@/lib/mock/tracking";

export const ORDER_STATUSES: OrderStatus[] = [
  "pendiente",
  "pagado",
  "preparando",
  "enviado",
  "entregado",
  "cancelado",
];

export const orderStatusOptions: SelectOption[] = ORDER_STATUSES.map((s) => ({
  value: s,
  label: s,
}));

export const orderStatusFilterOptions: SelectOption[] = [
  { value: "all", label: "Todos" },
  ...orderStatusOptions,
];

export const trackingCarrierOptions: SelectOption[] = TRACKING_CARRIERS.map(
  (c) => ({
    value: c.id,
    label: c.label,
  })
);
