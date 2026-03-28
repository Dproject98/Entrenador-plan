import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { useAuthStore } from "@/store/auth.store";
import {
  useFeed,
  useLeaderboardVolume,
  useLeaderboardStreak,
  useChallenges,
  useLikeSession,
  useJoinChallenge,
  useCreateChallenge,
} from "@/hooks/useSocial";
import type { FeedPost, LeaderboardVolumeEntry, LeaderboardStreakEntry, Challenge } from "@/types/api.types";
import { colors } from "@/lib/theme";

type SubTab = "feed" | "ranking" | "retos";
type RankingTab = "volumen" | "racha";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDuration(startedAt: string, endedAt: string): string {
  const mins = Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60000);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  return `hace ${Math.floor(hours / 24)}d`;
}

function challengeTypeLabel(type: string): string {
  switch (type) {
    case "VOLUME_KG": return "Volumen total (kg)";
    case "SESSIONS_COUNT": return "Sesiones completadas";
    case "STREAK_DAYS": return "Días seguidos";
    default: return type;
  }
}

// ─── Feed Item ────────────────────────────────────────────────────────────────

function FeedItem({ item }: { item: FeedPost }) {
  const userId = useAuthStore((s) => s.user?.id);
  const likeMutation = useLikeSession();
  const isOwn = item.user.id === userId;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{item.user.name[0].toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardAuthor}>{item.user.name}</Text>
          <Text style={styles.cardMeta}>{timeAgo(item.startedAt)}</Text>
        </View>
      </View>

      <Text style={styles.cardTitle}>{item.name ?? "Sesión de entrenamiento"}</Text>
      {item.notes ? <Text style={styles.cardNotes}>{item.notes}</Text> : null}

      <View style={styles.cardStats}>
        <Text style={styles.statBadge}>⏱ {formatDuration(item.startedAt, item.endedAt)}</Text>
        <Text style={styles.statBadge}>🏋️ {item.setsCount} series</Text>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionBtn, item.likedByMe && styles.actionBtnActive]}
          onPress={() =>
            likeMutation.mutate({ sessionId: item.id, liked: item.likedByMe })
          }
          disabled={isOwn || likeMutation.isPending}
        >
          <Text style={[styles.actionBtnText, item.likedByMe && styles.actionBtnTextActive]}>
            {item.likedByMe ? "❤️" : "🤍"} {item.likesCount}
          </Text>
        </TouchableOpacity>

        <View style={styles.actionBtn}>
          <Text style={styles.actionBtnText}>💬 {item.commentsCount}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Feed Tab ─────────────────────────────────────────────────────────────────

function FeedTab() {
  const { data, isLoading, refetch, isRefetching } = useFeed();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!data || data.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>👥</Text>
        <Text style={styles.emptyTitle}>Tu feed está vacío</Text>
        <Text style={styles.emptySubtitle}>
          Sigue a otros atletas para ver sus entrenamientos aquí
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <FeedItem item={item} />}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={colors.primary}
        />
      }
    />
  );
}

// ─── Ranking Tab ──────────────────────────────────────────────────────────────

function VolumeLeaderboard({ period }: { period: "week" | "month" | "all" }) {
  const userId = useAuthStore((s) => s.user?.id);
  const { data, isLoading } = useLeaderboardVolume(period);

  if (isLoading) return <ActivityIndicator style={{ marginTop: 24 }} color={colors.primary} />;
  if (!data || data.data.length === 0)
    return <Text style={[styles.emptySubtitle, { textAlign: "center", marginTop: 24 }]}>Sin datos aún</Text>;

  return (
    <View>
      {data.data.map((entry: LeaderboardVolumeEntry) => {
        const isMe = entry.userId === userId;
        return (
          <View key={entry.userId} style={[styles.rankRow, isMe && styles.rankRowMe]}>
            <Text style={[styles.rankNum, entry.rank <= 3 && styles.rankNumTop]}>
              {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : `#${entry.rank}`}
            </Text>
            <Text style={[styles.rankName, isMe && styles.rankNameMe]}>
              {entry.name} {isMe ? "(Tú)" : ""}
            </Text>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.rankValue}>{entry.totalVolume.toLocaleString()} kg</Text>
              <Text style={styles.rankSub}>{entry.sessionsCount} sesiones</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function StreakLeaderboard() {
  const userId = useAuthStore((s) => s.user?.id);
  const { data, isLoading } = useLeaderboardStreak();

  if (isLoading) return <ActivityIndicator style={{ marginTop: 24 }} color={colors.primary} />;
  if (!data || data.length === 0)
    return <Text style={[styles.emptySubtitle, { textAlign: "center", marginTop: 24 }]}>Sin datos aún</Text>;

  return (
    <View>
      {data.map((entry: LeaderboardStreakEntry) => {
        const isMe = entry.userId === userId;
        return (
          <View key={entry.userId} style={[styles.rankRow, isMe && styles.rankRowMe]}>
            <Text style={[styles.rankNum, entry.rank <= 3 && styles.rankNumTop]}>
              {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : `#${entry.rank}`}
            </Text>
            <Text style={[styles.rankName, isMe && styles.rankNameMe]}>
              {entry.name} {isMe ? "(Tú)" : ""}
            </Text>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.rankValue}>{entry.streakDays} días</Text>
              <Text style={styles.rankSub}>racha activa 🔥</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function RankingTab() {
  const [activeRanking, setActiveRanking] = useState<RankingTab>("volumen");
  const [period, setPeriod] = useState<"week" | "month" | "all">("week");

  return (
    <ScrollView contentContainerStyle={styles.listContent}>
      {/* Ranking sub-tabs */}
      <View style={styles.segmentRow}>
        {(["volumen", "racha"] as RankingTab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.segmentBtn, activeRanking === tab && styles.segmentBtnActive]}
            onPress={() => setActiveRanking(tab)}
          >
            <Text style={[styles.segmentBtnText, activeRanking === tab && styles.segmentBtnTextActive]}>
              {tab === "volumen" ? "🏋️ Volumen" : "🔥 Racha"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Period selector (only for volume) */}
      {activeRanking === "volumen" && (
        <View style={styles.periodRow}>
          {(["week", "month", "all"] as const).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodBtn, period === p && styles.periodBtnActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.periodBtnText, period === p && styles.periodBtnTextActive]}>
                {p === "week" ? "Semana" : p === "month" ? "Mes" : "Total"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {activeRanking === "volumen" ? (
        <VolumeLeaderboard period={period} />
      ) : (
        <StreakLeaderboard />
      )}
    </ScrollView>
  );
}

// ─── Challenge Card ───────────────────────────────────────────────────────────

function ChallengeCard({ item }: { item: Challenge }) {
  const joinMutation = useJoinChallenge();
  const userId = useAuthStore((s) => s.user?.id);
  const isCreator = item.creatorId === userId;

  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(item.endDate).getTime() - Date.now()) / 86400000)
  );

  return (
    <View style={styles.card}>
      <View style={styles.challengeHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.challengeName}>{item.name}</Text>
          <Text style={styles.challengeType}>{challengeTypeLabel(item.type)}</Text>
        </View>
        <View style={[styles.statusBadge, item.status === "active" ? styles.statusActive : item.status === "upcoming" ? styles.statusUpcoming : styles.statusFinished]}>
          <Text style={styles.statusText}>
            {item.status === "active" ? "Activo" : item.status === "upcoming" ? "Próximo" : "Finalizado"}
          </Text>
        </View>
      </View>

      {item.description ? <Text style={styles.cardNotes}>{item.description}</Text> : null}

      <View style={styles.challengeMeta}>
        {item.goal > 0 && (
          <Text style={styles.challengeMetaText}>🎯 Meta: {item.goal.toLocaleString()}</Text>
        )}
        <Text style={styles.challengeMetaText}>👥 {item.participantsCount} participantes</Text>
        {item.status !== "finished" && (
          <Text style={styles.challengeMetaText}>⏳ {daysLeft}d restantes</Text>
        )}
      </View>

      {!isCreator && item.status !== "finished" && (
        <TouchableOpacity
          style={[styles.joinBtn, item.joinedByMe && styles.joinBtnJoined]}
          onPress={() => !item.joinedByMe && joinMutation.mutate(item.id)}
          disabled={item.joinedByMe || joinMutation.isPending}
        >
          <Text style={[styles.joinBtnText, item.joinedByMe && styles.joinBtnTextJoined]}>
            {item.joinedByMe ? "✓ Participando" : "Unirse al reto"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Create Challenge Modal ───────────────────────────────────────────────────

function CreateChallengeModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const createMutation = useCreateChallenge();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"VOLUME_KG" | "SESSIONS_COUNT" | "STREAK_DAYS">("VOLUME_KG");
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]
  );

  function handleSubmit() {
    if (!name.trim()) {
      Alert.alert("Error", "El nombre es obligatorio");
      return;
    }
    const goalNum = Number(goal);
    if (!goalNum || goalNum <= 0) {
      Alert.alert("Error", "Introduce una meta válida");
      return;
    }
    createMutation.mutate(
      { name: name.trim(), description: description.trim() || undefined, type, goal: goalNum, startDate, endDate, isPublic: true },
      {
        onSuccess: () => {
          onClose();
          setName("");
          setDescription("");
          setGoal("");
        },
        onError: () => Alert.alert("Error", "No se pudo crear el reto"),
      }
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Nuevo reto</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalClose}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalBody}>
          <Text style={styles.inputLabel}>Nombre *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="ej. 5000 kg esta semana"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.inputLabel}>Descripción</Text>
          <TextInput
            style={[styles.input, { minHeight: 72 }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Opcional"
            placeholderTextColor={colors.textMuted}
            multiline
          />

          <Text style={styles.inputLabel}>Tipo de reto</Text>
          <View style={styles.segmentRow}>
            {(["VOLUME_KG", "SESSIONS_COUNT", "STREAK_DAYS"] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.segmentBtn, type === t && styles.segmentBtnActive]}
                onPress={() => setType(t)}
              >
                <Text style={[styles.segmentBtnText, type === t && styles.segmentBtnTextActive]}>
                  {t === "VOLUME_KG" ? "Volumen" : t === "SESSIONS_COUNT" ? "Sesiones" : "Racha"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.inputLabel}>Meta ({type === "VOLUME_KG" ? "kg" : type === "SESSIONS_COUNT" ? "sesiones" : "días"})</Text>
          <TextInput
            style={styles.input}
            value={goal}
            onChangeText={setGoal}
            placeholder="ej. 5000"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
          />

          <Text style={styles.inputLabel}>Fecha inicio (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={startDate}
            onChangeText={setStartDate}
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.inputLabel}>Fecha fin (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={endDate}
            onChangeText={setEndDate}
            placeholderTextColor={colors.textMuted}
          />
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={[styles.joinBtn, { flex: 1 }]}
            onPress={handleSubmit}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.joinBtnText}>Crear reto</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Retos Tab ────────────────────────────────────────────────────────────────

function RetosTab() {
  const [showCreate, setShowCreate] = useState(false);
  const { data, isLoading, refetch, isRefetching } = useChallenges();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={data ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ChallengeCard item={item} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreate(true)}>
            <Text style={styles.createBtnText}>+ Crear reto</Text>
          </TouchableOpacity>
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyIcon}>🏆</Text>
            <Text style={styles.emptyTitle}>Sin retos activos</Text>
            <Text style={styles.emptySubtitle}>¡Crea el primero y desafía a tus amigos!</Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
      />
      <CreateChallengeModal visible={showCreate} onClose={() => setShowCreate(false)} />
    </>
  );
}

// ─── Main Social Screen ───────────────────────────────────────────────────────

export default function SocialScreen() {
  const [activeTab, setActiveTab] = useState<SubTab>("feed");

  return (
    <View style={styles.container}>
      {/* Sub-tab bar */}
      <View style={styles.subTabBar}>
        {(["feed", "ranking", "retos"] as SubTab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.subTab, activeTab === tab && styles.subTabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.subTabText, activeTab === tab && styles.subTabTextActive]}>
              {tab === "feed" ? "Feed" : tab === "ranking" ? "Ranking" : "Retos"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {activeTab === "feed" && <FeedTab />}
        {activeTab === "ranking" && <RankingTab />}
        {activeTab === "retos" && <RetosTab />}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  // Sub-tab bar
  subTabBar: {
    flexDirection: "row",
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  subTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  subTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  subTabText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  subTabTextActive: {
    color: colors.primary,
    fontWeight: "700",
  },

  // Card
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.primaryDark,
    fontWeight: "700",
    fontSize: 16,
  },
  cardAuthor: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  cardMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  cardNotes: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  cardStats: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  statBadge: {
    fontSize: 12,
    color: colors.textSecondary,
    backgroundColor: colors.bgInput,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cardActions: {
    flexDirection: "row",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.bgInput,
  },
  actionBtnActive: {
    backgroundColor: colors.dangerBg,
  },
  actionBtnText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  actionBtnTextActive: {
    color: colors.danger,
  },

  // Leaderboard
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgCard,
    borderRadius: 10,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  rankRowMe: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  rankNum: {
    width: 36,
    fontSize: 14,
    fontWeight: "700",
    color: colors.textSecondary,
    textAlign: "center",
  },
  rankNumTop: {
    fontSize: 18,
  },
  rankName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  rankNameMe: {
    color: colors.primaryDark,
    fontWeight: "700",
  },
  rankValue: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  rankSub: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: "right",
  },

  // Segment + Period pickers
  segmentRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.bgInput,
    alignItems: "center",
  },
  segmentBtnActive: {
    backgroundColor: colors.primary,
  },
  segmentBtnText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  segmentBtnTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
  periodRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.bgInput,
    alignItems: "center",
  },
  periodBtnActive: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  periodBtnText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  periodBtnTextActive: {
    color: colors.primaryDark,
    fontWeight: "600",
  },

  // Challenges
  challengeHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    gap: 8,
  },
  challengeName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  challengeType: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusActive: {
    backgroundColor: colors.successBg,
  },
  statusUpcoming: {
    backgroundColor: colors.warningBg,
  },
  statusFinished: {
    backgroundColor: colors.bgInput,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  challengeMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginVertical: 8,
  },
  challengeMetaText: {
    fontSize: 12,
    color: colors.textSecondary,
    backgroundColor: colors.bgInput,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  joinBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 4,
  },
  joinBtnJoined: {
    backgroundColor: colors.successBg,
    borderWidth: 1,
    borderColor: colors.success,
  },
  joinBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  joinBtnTextJoined: {
    color: colors.success,
  },
  createBtn: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  createBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  modalClose: {
    fontSize: 20,
    color: colors.textSecondary,
    padding: 4,
  },
  modalBody: {
    flex: 1,
    padding: 20,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: "row",
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: colors.bgInput,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },

  // Empty state
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 6,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 32,
  },
});
