"use client";

import { useCallback, useSyncExternalStore } from "react";

export const DISMISSIBLE_PROMPT_COOLDOWN_DAYS = 3;
export const DISMISSIBLE_PROMPT_COOLDOWN_MS = DISMISSIBLE_PROMPT_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

const PROMPT_STORAGE_EVENT = "likelyr:dismissible-prompt";
const memoryDismissals = new Map<string, number>();

function isPromptVisible(storageKey: string, cooldownMs: number) {
  const memoryDismissedAt = memoryDismissals.get(storageKey);
  if (memoryDismissedAt && Date.now() - memoryDismissedAt < cooldownMs) return false;

  try {
    const dismissedAt = Number(window.localStorage.getItem(storageKey));
    return !(Number.isFinite(dismissedAt) && Date.now() - dismissedAt < cooldownMs);
  } catch {
    return true;
  }
}

export function useDismissiblePrompt(storageKey: string, cooldownMs = DISMISSIBLE_PROMPT_COOLDOWN_MS) {
  const subscribe = useCallback((onStoreChange: () => void) => {
    function handleDismiss(event: Event) {
      if (event instanceof CustomEvent && event.detail?.storageKey !== storageKey) return;
      onStoreChange();
    }

    window.addEventListener("storage", onStoreChange);
    window.addEventListener(PROMPT_STORAGE_EVENT, handleDismiss);

    return () => {
      window.removeEventListener("storage", onStoreChange);
      window.removeEventListener(PROMPT_STORAGE_EVENT, handleDismiss);
    };
  }, [storageKey]);

  const getSnapshot = useCallback(() => {
    return isPromptVisible(storageKey, cooldownMs);
  }, [cooldownMs, storageKey]);

  const visible = useSyncExternalStore(subscribe, getSnapshot, () => false);

  const dismiss = useCallback(() => {
    memoryDismissals.set(storageKey, Date.now());
    try {
      window.localStorage.setItem(storageKey, String(Date.now()));
    } catch {}
    window.dispatchEvent(new CustomEvent(PROMPT_STORAGE_EVENT, { detail: { storageKey } }));
  }, [storageKey]);

  return {
    cooldownDays: DISMISSIBLE_PROMPT_COOLDOWN_DAYS,
    dismiss,
    visible,
  };
}
