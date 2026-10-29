"use client";
import { useEffect, useRef, useState } from "react";
import {
  completeDemoSync,
  linkDemoProfile,
  createDemoState,
  restoreDemoState,
  type DemoState,
} from "./model";
export type SyncPhase = "idle" | "queued" | "fetching" | "saving";
export const DEMO_STORAGE_KEY = "arcade-atlas.demo.v1";
export function useDemoTracker() {
  const [state, setState] = useState<DemoState>(() => createDemoState());
  const [ready, setReady] = useState(false),
    [storageNotice, setStorageNotice] = useState("");
  const [phase, setPhase] = useState<SyncPhase>("idle");
  const running = useRef(false);
  const mounted = useRef(true);
  const runId = useRef(0);
  useEffect(() => {
    mounted.current = true;
    try {
      const raw = localStorage.getItem(DEMO_STORAGE_KEY);
      const restored = restoreDemoState(raw);
      setState(restored ?? createDemoState(new Date().toISOString()));
      if (raw && !restored)
        setStorageNotice("Old demo data was reset because its format changed.");
    } catch {
      setStorageNotice(
        "Browser storage is unavailable. This session will work, but changes will not survive a reload.",
      );
    }
    setReady(true);
    return () => {
      mounted.current = false;
      runId.current++;
      running.current = false;
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
    } catch {
      setStorageNotice(
        "Your browser could not save this demo. Changes work for this session.",
      );
    }
  }, [state, ready]);
  useEffect(() => {
    function receive(event: StorageEvent) {
      if (
        event.key === DEMO_STORAGE_KEY &&
        event.newValue &&
        !running.current
      ) {
        const next = restoreDemoState(event.newValue);
        if (next) setState(next);
      }
    }
    window.addEventListener("storage", receive);
    return () => window.removeEventListener("storage", receive);
  }, []);
  async function sync(
    outcome: "success" | "private" | "rate_limit" = "success",
    prepare?: (value: DemoState) => DemoState,
  ) {
    if (
      running.current ||
      (!prepare && (!state.signedIn || !state.profile.linked))
    )
      return;
    if (prepare) setState(prepare);
    running.current = true;
    const id = ++runId.current;
    const pause = () => new Promise((resolve) => setTimeout(resolve, 550));
    for (const next of ["queued", "fetching", "saving"] as const) {
      if (!mounted.current || id !== runId.current) return;
      setPhase(next);
      await pause();
    }
    if (!mounted.current || id !== runId.current) return;
    setState((s) => completeDemoSync(s, outcome));
    setPhase("idle");
    running.current = false;
  }
  function trackProfile(url: string) {
    return sync("success", (current) => ({
      ...(current.profile.url === url
        ? current
        : linkDemoProfile(current, "Demo learner", url)),
      signedIn: true,
    }));
  }
  function reset() {
    runId.current++;
    running.current = false;
    setPhase("idle");
    setState(createDemoState(new Date().toISOString()));
  }
  return {
    state,
    setState,
    ready,
    storageNotice,
    phase,
    sync,
    trackProfile,
    reset,
  };
}
