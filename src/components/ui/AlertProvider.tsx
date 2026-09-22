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

export type AlertTone = "neutral" | "danger" | "success";

export type AlertOptions = {
  title: string;
  message?: string;
  eyebrow?: string;
  confirmLabel?: string;
  tone?: AlertTone;
};

export type ConfirmOptions = AlertOptions & {
  cancelLabel?: string;
};

type DialogKind = "alert" | "confirm";

type DialogRequest = {
  id: number;
  kind: DialogKind;
  options: ConfirmOptions;
  resolve: (value: boolean) => void;
};

type AlertContextValue = {
  alert: (options: AlertOptions | string) => Promise<void>;
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
};

const AlertContext = createContext<AlertContextValue | null>(null);

function normalize(
  options: AlertOptions | ConfirmOptions | string,
  fallbackTitle: string
): ConfirmOptions {
  if (typeof options === "string") {
    return { title: fallbackTitle, message: options };
  }
  return options;
}

const TONE_STYLES: Record<
  AlertTone,
  { eyebrow: string; confirm: string }
> = {
  neutral: {
    eyebrow: "text-brand",
    confirm: "bg-[#222222] text-white hover:bg-black",
  },
  success: {
    eyebrow: "text-[#16a34a]",
    confirm: "bg-[#16a34a] text-white hover:bg-[#15803d]",
  },
  danger: {
    eyebrow: "text-red-700",
    confirm: "bg-[#b91c1c] text-white hover:bg-[#991b1b]",
  },
};

export function AppDialog({
  eyebrow,
  title,
  message,
  children,
  tone = "neutral",
  cancelLabel,
  confirmLabel = "Entendido",
  onCancel,
  onConfirm,
  busy = false,
  hideCancel = false,
  className = "",
}: {
  eyebrow?: string;
  title: string;
  message?: string;
  children?: ReactNode;
  tone?: AlertTone;
  cancelLabel?: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
  busy?: boolean;
  hideCancel?: boolean;
  className?: string;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const styles = TONE_STYLES[tone];

  useEffect(() => {
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [busy, onCancel]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/45 p-4 sm:items-center"
      role="presentation"
      onClick={() => {
        if (!busy) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-dialog-title"
        className={`w-full max-w-md border border-black/10 bg-white p-5 shadow-[0_24px_80px_rgba(0,0,0,0.25)] sm:p-6 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {eyebrow ? (
          <p
            className={`text-[11px] font-semibold tracking-[0.16em] uppercase ${styles.eyebrow}`}
          >
            {eyebrow}
          </p>
        ) : null}
        <h2
          id="app-dialog-title"
          className="mt-2 font-display text-2xl font-bold tracking-wide uppercase"
        >
          {title}
        </h2>
        {message ? (
          <p className="mt-3 text-sm leading-relaxed text-soft">{message}</p>
        ) : null}
        {children}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {!hideCancel ? (
            <button
              type="button"
              disabled={busy}
              onClick={onCancel}
              className="btn-press border border-black/15 px-5 py-3 text-[11px] font-semibold tracking-[0.14em] uppercase disabled:opacity-50"
            >
              {cancelLabel || "Cancelar"}
            </button>
          ) : null}
          <button
            ref={confirmRef}
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={`btn-press px-5 py-3 text-[11px] font-semibold tracking-[0.14em] uppercase disabled:opacity-50 ${styles.confirm}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AlertProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<DialogRequest[]>([]);
  const idRef = useRef(0);
  const current = queue[0] ?? null;

  const enqueue = useCallback(
    (kind: DialogKind, options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        idRef.current += 1;
        setQueue((prev) => [
          ...prev,
          { id: idRef.current, kind, options, resolve },
        ]);
      }),
    []
  );

  const finish = useCallback((value: boolean) => {
    setQueue((prev) => {
      const [head, ...rest] = prev;
      head?.resolve(value);
      return rest;
    });
  }, []);

  const alertFn = useCallback(
    async (options: AlertOptions | string) => {
      await enqueue(
        "alert",
        normalize(options, "Aviso")
      );
    },
    [enqueue]
  );

  const confirmFn = useCallback(
    (options: ConfirmOptions | string) =>
      enqueue("confirm", {
        tone: "danger",
        confirmLabel: "Confirmar",
        cancelLabel: "Cancelar",
        ...normalize(options, "¿Confirmás?"),
      }),
    [enqueue]
  );

  const value = useMemo(
    () => ({ alert: alertFn, confirm: confirmFn }),
    [alertFn, confirmFn]
  );

  const opts = current?.options;
  const tone = opts?.tone ?? (current?.kind === "confirm" ? "danger" : "neutral");

  return (
    <AlertContext.Provider value={value}>
      {children}
      {current && opts ? (
        <AppDialog
          eyebrow={
            opts.eyebrow ||
            (current.kind === "confirm" ? "Confirmar" : "Aviso")
          }
          title={opts.title}
          message={opts.message}
          tone={tone}
          hideCancel={current.kind === "alert"}
          cancelLabel={opts.cancelLabel}
          confirmLabel={
            opts.confirmLabel ||
            (current.kind === "alert" ? "Entendido" : "Confirmar")
          }
          onCancel={() => finish(false)}
          onConfirm={() => finish(true)}
        />
      ) : null}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const ctx = useContext(AlertContext);
  if (!ctx) {
    throw new Error("useAlert debe usarse dentro de AlertProvider");
  }
  return ctx;
}
