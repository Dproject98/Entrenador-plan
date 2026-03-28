import { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { useTimerStore } from "@/store/timer.store";
import { colors } from "@/lib/theme";

const PRESETS = [60, 90, 120, 180];

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function RestTimer() {
  const { remaining, running, durationSec, start, pause, resume, reset, setDuration } = useTimerStore();
  const prevRunning = useRef(running);

  // Haptic feedback when timer reaches 0
  useEffect(() => {
    if (prevRunning.current && !running && remaining === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    prevRunning.current = running;
  }, [running, remaining]);

  const pct = durationSec > 0 ? remaining / durationSec : 0;
  const isDone = remaining === 0 && !running;
  const isIdle = remaining === durationSec && !running;

  return (
    <View style={s.container}>
      {/* Countdown display */}
      <View style={s.timeRow}>
        <Text style={[s.time, isDone && s.timeDone]}>
          {isDone ? "¡Listo!" : fmtTime(remaining)}
        </Text>
        {/* Progress arc (simple linear bar) */}
        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: `${pct * 100}%` }, isDone && s.progressDone]} />
        </View>
      </View>

      {/* Controls */}
      <View style={s.controls}>
        {isIdle ? (
          <TouchableOpacity style={s.btnPrimary} onPress={() => start()}>
            <Text style={s.btnPrimaryText}>▶ Iniciar</Text>
          </TouchableOpacity>
        ) : running ? (
          <TouchableOpacity style={s.btnSecondary} onPress={pause}>
            <Text style={s.btnSecondaryText}>⏸ Pausar</Text>
          </TouchableOpacity>
        ) : (
          <View style={s.btnRow}>
            <TouchableOpacity style={s.btnSecondary} onPress={resume}>
              <Text style={s.btnSecondaryText}>▶ Continuar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btnGhost} onPress={reset}>
              <Text style={s.btnGhostText}>↺ Reset</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Duration presets */}
      <View style={s.presets}>
        {PRESETS.map((sec) => (
          <TouchableOpacity
            key={sec}
            style={[s.preset, durationSec === sec && s.presetActive]}
            onPress={() => { setDuration(sec); start(sec); }}
          >
            <Text style={[s.presetText, durationSec === sec && s.presetTextActive]}>
              {sec < 60 ? `${sec}s` : `${sec / 60}min`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
  },

  timeRow: { alignItems: "center", gap: 8 },
  time: { fontSize: 40, fontWeight: "700", color: colors.textPrimary, letterSpacing: 2 },
  timeDone: { color: colors.success },

  progressTrack: {
    width: "100%", height: 4, backgroundColor: colors.bgInput,
    borderRadius: 2, overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: colors.primary, borderRadius: 2 },
  progressDone: { backgroundColor: colors.success },

  controls: { alignItems: "center" },
  btnRow: { flexDirection: "row", gap: 10 },

  btnPrimary: {
    backgroundColor: colors.primary, borderRadius: 999,
    paddingHorizontal: 28, paddingVertical: 10,
  },
  btnPrimaryText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  btnSecondary: {
    backgroundColor: colors.bgInput, borderRadius: 999, borderWidth: 1,
    borderColor: colors.border, paddingHorizontal: 20, paddingVertical: 8,
  },
  btnSecondaryText: { color: colors.textPrimary, fontWeight: "600", fontSize: 14 },

  btnGhost: { paddingHorizontal: 16, paddingVertical: 8 },
  btnGhostText: { color: colors.textMuted, fontSize: 14 },

  presets: { flexDirection: "row", gap: 8, justifyContent: "center" },
  preset: {
    paddingHorizontal: 14, paddingVertical: 6,
    backgroundColor: colors.bgInput, borderRadius: 999,
    borderWidth: 1, borderColor: colors.border,
  },
  presetActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  presetText: { fontSize: 12, color: colors.textSecondary, fontWeight: "600" },
  presetTextActive: { color: colors.primaryDark },
});
