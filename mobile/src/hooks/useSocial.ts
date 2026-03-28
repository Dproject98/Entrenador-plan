import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { socialApi } from "@/services/api";

// ─── Query keys ──────────────────────────────────────────────────────────────

export const socialKeys = {
  feed: ["social", "feed"] as const,
  leaderboardVolume: (period?: string) => ["social", "leaderboard", "volume", period] as const,
  leaderboardStreak: ["social", "leaderboard", "streak"] as const,
  challenges: ["social", "challenges"] as const,
  comments: (sessionId: string) => ["social", "comments", sessionId] as const,
};

// ─── Feed ─────────────────────────────────────────────────────────────────────

export function useFeed() {
  return useQuery({
    queryKey: socialKeys.feed,
    queryFn: () => socialApi.feed(),
  });
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

export function useLeaderboardVolume(period?: "week" | "month" | "all") {
  return useQuery({
    queryKey: socialKeys.leaderboardVolume(period),
    queryFn: () => socialApi.leaderboardVolume(period),
  });
}

export function useLeaderboardStreak() {
  return useQuery({
    queryKey: socialKeys.leaderboardStreak,
    queryFn: () => socialApi.leaderboardStreak(),
  });
}

// ─── Challenges ───────────────────────────────────────────────────────────────

export function useChallenges() {
  return useQuery({
    queryKey: socialKeys.challenges,
    queryFn: () => socialApi.challenges(),
  });
}

export function useJoinChallenge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (challengeId: string) => socialApi.joinChallenge(challengeId),
    onSuccess: () => qc.invalidateQueries({ queryKey: socialKeys.challenges }),
  });
}

export function useCreateChallenge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof socialApi.createChallenge>[0]) =>
      socialApi.createChallenge(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: socialKeys.challenges }),
  });
}

// ─── Likes ────────────────────────────────────────────────────────────────────

export function useLikeSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, liked }: { sessionId: string; liked: boolean }) =>
      liked ? socialApi.unlikeSession(sessionId) : socialApi.likeSession(sessionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: socialKeys.feed }),
  });
}

// ─── Follow ───────────────────────────────────────────────────────────────────

export function useFollow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, following }: { userId: string; following: boolean }) =>
      following ? socialApi.unfollow(userId) : socialApi.follow(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: socialKeys.feed }),
  });
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export function useComments(sessionId: string) {
  return useQuery({
    queryKey: socialKeys.comments(sessionId),
    queryFn: () => socialApi.getComments(sessionId),
    enabled: !!sessionId,
  });
}

export function useAddComment(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => socialApi.addComment(sessionId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: socialKeys.comments(sessionId) });
      qc.invalidateQueries({ queryKey: socialKeys.feed });
    },
  });
}
