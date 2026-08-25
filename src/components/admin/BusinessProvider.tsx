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
import {
  emptyBusiness,
  normalizeBusiness,
  type BusinessData,
  type CajaSnapshot,
  type CostoRow,
  type EcommerceRow,
  type GastoFijo,
  type GastoMensual,
  type GastoPago,
  type PlanillaRow,
  type TalleMedida,
  type VentaRow,
} from "@/lib/mock/business";
import { enrichVentaCosts } from "@/lib/mock/resolveVenta";
import {
  BUSINESS_CHANGED_EVENT,
  BUSINESS_KEY,
  BUSINESS_VENTAS_EVENT,
  ventasToPlanilla,
} from "@/lib/mock/orderVentas";
import { uid } from "@/lib/mock/money";
import { readJson, writeJson } from "@/lib/mock/storage";
import {
  fetchBusinessBook,
  getBackendUrl,
  saveBusinessBook,
  type BusinessBookResponse,
} from "@/lib/api/backend";
import { EXCEL_COSTOS, withExcelCostosIfEmpty } from "@/lib/mock/costosSeed";

type BusinessContextValue = {
  ready: boolean;
  data: BusinessData;
  /** Vacía todas las hojas del libro (no repone datos de ejemplo). */
  clearBusiness: () => void;
  addVenta: (row: Omit<VentaRow, "id">) => void;
  deleteVenta: (id: string) => void;
  /** Completa costo/ganancia faltantes desde hoja COSTOS (marca + modelo + color) */
  fillVentaCosts: () => number;
  addGasto: (row: Omit<GastoPago, "id">) => void;
  deleteGasto: (id: string) => void;
  addPlanilla: (row: Omit<PlanillaRow, "id">) => void;
  deletePlanilla: (id: string) => void;
  addCaja: (row: Omit<CajaSnapshot, "id">) => void;
  deleteCaja: (id: string) => void;
  saveCosto: (row: CostoRow) => void;
  deleteCosto: (id: string) => void;
  /** Reemplaza la hoja COSTOS por la del Excel original. */
  restoreExcelCostos: () => void;
  saveTalle: (row: TalleMedida) => void;
  saveEcommerce: (row: EcommerceRow) => void;
  deleteEcommerce: (id: string) => void;
  saveGastoFijo: (row: GastoFijo) => void;
  deleteGastoFijo: (id: string) => void;
  saveGastoMensual: (row: GastoMensual) => void;
  setGastosMensualesIngresos: (
    next: NonNullable<BusinessData["gastosMensualesIngresos"]>
  ) => void;
};

const BusinessContext = createContext<BusinessContextValue | null>(null);

export function BusinessProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<BusinessData>(() => emptyBusiness());
  /** Versión del libro en el servidor: la mandamos al guardar para que detecte copias viejas. */
  const revRef = useRef<number | undefined>(undefined);
  /** Último libro que sabemos que está en el servidor: evita reenviar lo que ya llegó de ahí. */
  const syncedRef = useRef<string | null>(null);
  const dataRef = useRef(data);
  dataRef.current = data;

  const markSynced = useCallback((book: BusinessData, rev?: number) => {
    revRef.current = rev;
    syncedRef.current = JSON.stringify(book);
  }, []);

  /** Adopta el libro que mandó el servidor sin rebotarlo de vuelta. */
  const applyRemote = useCallback(
    (remote: BusinessBookResponse) => {
      const next = withExcelCostosIfEmpty(normalizeBusiness(remote));
      markSynced(normalizeBusiness(remote), remote.rev);
      setData(next);
      writeJson(BUSINESS_KEY, next);
      return next;
    },
    [markSynced]
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (getBackendUrl()) {
        try {
          const remote = await fetchBusinessBook();
          if (cancelled) return;
          if (remote) {
            applyRemote(remote);
            setReady(true);
            return;
          }
        } catch {
          /* seguimos con localStorage */
        }
      }
      if (cancelled) return;
      const stored = readJson<BusinessData | null>(BUSINESS_KEY, null);
      const vacio = emptyBusiness();
      // Los libros viejos traían los datos del Excel: se descartan por versión.
      if (stored?.version && stored.version >= vacio.version) {
        setData(withExcelCostosIfEmpty(normalizeBusiness(stored)));
      } else {
        const seeded = withExcelCostosIfEmpty(vacio);
        writeJson(BUSINESS_KEY, seeded);
        setData(seeded);
      }
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [applyRemote]);

  useEffect(() => {
    if (!ready) return;
    writeJson(BUSINESS_KEY, data);
    if (!getBackendUrl()) return;
    if (JSON.stringify(data) === syncedRef.current) return;
    const timer = window.setTimeout(() => {
      saveBusinessBook(data, revRef.current)
        .then((saved) => {
          // Si guardamos sobre una copia vieja, el backend devuelve las ventas
          // de pedidos que nuestra copia no tenía: adoptamos su versión.
          if (saved.recoveredRows) applyRemote(saved);
          else markSynced(data, saved.rev);
        })
        .catch(() => {});
    }, 700);
    return () => window.clearTimeout(timer);
  }, [data, ready, applyRemote, markSynced]);

  useEffect(() => {
    const onVentas = (ev: Event) => {
      const detail = (ev as CustomEvent<{ ventas: VentaRow[] }>).detail;
      const incoming = detail?.ventas;
      if (!incoming?.length) {
        if (getBackendUrl()) {
          fetchBusinessBook()
            .then((remote) => {
              if (remote) applyRemote(remote);
            })
            .catch(() => {
              const stored = readJson<BusinessData | null>(BUSINESS_KEY, null);
              if (stored?.ventas) setData(normalizeBusiness(stored));
            });
          return;
        }
        const stored = readJson<BusinessData | null>(BUSINESS_KEY, null);
        if (stored?.ventas) setData(normalizeBusiness(stored));
        return;
      }
      setData((prev) => {
        const ids = new Set(prev.ventas.map((v) => v.id));
        const fresh = incoming.filter((v) => !ids.has(v.id));
        if (!fresh.length) return prev;
        const planillaIds = new Set(prev.planilla.map((r) => r.id));
        const planillaFresh = ventasToPlanilla(fresh).filter(
          (r) => !planillaIds.has(r.id)
        );
        return {
          ...prev,
          ventas: [...prev.ventas, ...fresh],
          planilla: [...prev.planilla, ...planillaFresh],
        };
      });
    };
    const onChanged = () => {
      if (getBackendUrl()) {
        const dirty =
          syncedRef.current != null &&
          JSON.stringify(dataRef.current) !== syncedRef.current;
        // Hay un gasto o venta a medio cargar: no pises. El PUT con rev vieja
        // reattachea las ventas del pedido.
        if (dirty) return;
        fetchBusinessBook()
          .then((remote) => {
            if (remote) applyRemote(remote);
          })
          .catch(() => {
            const stored = readJson<BusinessData | null>(BUSINESS_KEY, null);
            if (stored) setData(normalizeBusiness(stored));
          });
        return;
      }
      const stored = readJson<BusinessData | null>(BUSINESS_KEY, null);
      if (stored) setData(normalizeBusiness(stored));
    };
    window.addEventListener(BUSINESS_VENTAS_EVENT, onVentas);
    window.addEventListener(BUSINESS_CHANGED_EVENT, onChanged);
    return () => {
      window.removeEventListener(BUSINESS_VENTAS_EVENT, onVentas);
      window.removeEventListener(BUSINESS_CHANGED_EVENT, onChanged);
    };
  }, [applyRemote]);

  const patch = useCallback((fn: (prev: BusinessData) => BusinessData) => {
    setData((prev) => fn(prev));
  }, []);

  /** Deja el libro en cero conservando las hojas. El backend se actualiza por el efecto de guardado. */
  const clearBusiness = useCallback(() => {
    const vacio = emptyBusiness();
    setData(vacio);
    writeJson(BUSINESS_KEY, vacio);
  }, []);

  const value = useMemo<BusinessContextValue>(
    () => ({
      ready,
      data,
      clearBusiness,
      addVenta: (row) =>
        patch((p) => {
          const venta: VentaRow = { ...row, id: uid("ven") };
          return {
            ...p,
            ventas: [...p.ventas, venta],
            planilla: [
              ...p.planilla,
              ...ventasToPlanilla([venta]).map((r) => ({
                ...r,
                id: uid("pla"),
              })),
            ],
          };
        }),
      deleteVenta: (id) =>
        patch((p) => ({ ...p, ventas: p.ventas.filter((r) => r.id !== id) })),
      fillVentaCosts: () => {
        const result = enrichVentaCosts(
          data.ventas,
          data.costos,
          data.ecommerce
        );
        setData((prev) => ({ ...prev, ventas: result.ventas }));
        return result.filled;
      },
      addGasto: (row) =>
        patch((p) => ({
          ...p,
          gastos: [{ ...row, id: uid("gas") }, ...p.gastos],
        })),
      deleteGasto: (id) =>
        patch((p) => ({ ...p, gastos: p.gastos.filter((r) => r.id !== id) })),
      addPlanilla: (row) =>
        patch((p) => ({
          ...p,
          planilla: [...p.planilla, { ...row, id: uid("pla") }],
        })),
      deletePlanilla: (id) =>
        patch((p) => ({
          ...p,
          planilla: p.planilla.filter((r) => r.id !== id),
        })),
      addCaja: (row) =>
        patch((p) => ({
          ...p,
          caja: [{ ...row, id: uid("caj") }, ...p.caja],
        })),
      deleteCaja: (id) =>
        patch((p) => ({ ...p, caja: p.caja.filter((r) => r.id !== id) })),
      saveCosto: (row) =>
        patch((p) => {
          const idx = p.costos.findIndex((r) => r.id === row.id);
          if (idx < 0) return { ...p, costos: [row, ...p.costos] };
          const next = [...p.costos];
          next[idx] = row;
          return { ...p, costos: next };
        }),
      deleteCosto: (id) =>
        patch((p) => ({ ...p, costos: p.costos.filter((r) => r.id !== id) })),
      restoreExcelCostos: () =>
        patch((p) => ({
          ...p,
          costos: EXCEL_COSTOS.map((row) => ({ ...row })),
        })),
      saveTalle: (row) =>
        patch((p) => {
          const idx = p.talles.findIndex((r) => r.id === row.id);
          if (idx < 0) return { ...p, talles: [...p.talles, row] };
          const next = [...p.talles];
          next[idx] = row;
          return { ...p, talles: next };
        }),
      saveEcommerce: (row) =>
        patch((p) => {
          const idx = p.ecommerce.findIndex((r) => r.id === row.id);
          if (idx < 0) return { ...p, ecommerce: [row, ...p.ecommerce] };
          const next = [...p.ecommerce];
          next[idx] = row;
          return { ...p, ecommerce: next };
        }),
      deleteEcommerce: (id) =>
        patch((p) => ({
          ...p,
          ecommerce: p.ecommerce.filter((r) => r.id !== id),
        })),
      saveGastoFijo: (row) =>
        patch((p) => {
          const idx = p.gastosFijos.findIndex((r) => r.id === row.id);
          if (idx < 0) return { ...p, gastosFijos: [...p.gastosFijos, row] };
          const next = [...p.gastosFijos];
          next[idx] = row;
          return { ...p, gastosFijos: next };
        }),
      deleteGastoFijo: (id) =>
        patch((p) => ({
          ...p,
          gastosFijos: p.gastosFijos.filter((r) => r.id !== id),
        })),
      saveGastoMensual: (row) =>
        patch((p) => {
          const idx = p.gastosMensuales.findIndex((r) => r.id === row.id);
          if (idx < 0) {
            return { ...p, gastosMensuales: [...p.gastosMensuales, row] };
          }
          const next = [...p.gastosMensuales];
          next[idx] = row;
          return { ...p, gastosMensuales: next };
        }),
      setGastosMensualesIngresos: (next) =>
        patch((p) => ({ ...p, gastosMensualesIngresos: next })),
    }),
    [ready, data, clearBusiness, patch]
  );

  return (
    <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>
  );
}

export function useBusiness() {
  const ctx = useContext(BusinessContext);
  if (!ctx) {
    throw new Error("useBusiness must be used within BusinessProvider");
  }
  return ctx;
}
