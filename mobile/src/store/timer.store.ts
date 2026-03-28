import { create } from "zustand";

interface TimerState {
  // Config
  durationSec: number;
  // Runtime
  remaining: number;
  running: boolean;
  intervalId: ReturnType<typeof setInterval> | null;
  // Actions
  start: (durationSec?: number) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  setDuration: (sec: number) => void;
  tick: () => void;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  durationSec: 90,
  remaining: 90,
  running: false,
  intervalId: null,

  setDuration: (sec) => set({ durationSec: sec, remaining: sec }),

  start: (durationSec) => {
    const { intervalId } = get();
    if (intervalId) clearInterval(intervalId);
    const dur = durationSec ?? get().durationSec;
    const id = setInterval(() => get().tick(), 1000);
    set({ durationSec: dur, remaining: dur, running: true, intervalId: id });
  },

  pause: () => {
    const { intervalId } = get();
    if (intervalId) clearInterval(intervalId);
    set({ running: false, intervalId: null });
  },

  resume: () => {
    const { intervalId, remaining } = get();
    if (intervalId) clearInterval(intervalId);
    if (remaining <= 0) return;
    const id = setInterval(() => get().tick(), 1000);
    set({ running: true, intervalId: id });
  },

  reset: () => {
    const { intervalId, durationSec } = get();
    if (intervalId) clearInterval(intervalId);
    set({ remaining: durationSec, running: false, intervalId: null });
  },

  tick: () => {
    const { remaining, intervalId } = get();
    if (remaining <= 1) {
      if (intervalId) clearInterval(intervalId);
      set({ remaining: 0, running: false, intervalId: null });
    } else {
      set({ remaining: remaining - 1 });
    }
  },
}));
