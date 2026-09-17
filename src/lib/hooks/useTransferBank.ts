"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_TRANSFER_BANK,
  type TransferBankConfig,
} from "@/lib/mock/payment";
import { fetchTransferBank, getBackendUrl } from "@/lib/api/backend";

export function useTransferBank() {
  const [config, setConfig] = useState<TransferBankConfig>(DEFAULT_TRANSFER_BANK);
  const [loading, setLoading] = useState(Boolean(getBackendUrl()));

  useEffect(() => {
    if (!getBackendUrl()) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetchTransferBank()
      .then((data) => {
        if (!cancelled) setConfig(data);
      })
      .catch(() => {
        /* keep defaults */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { config, loading };
}
