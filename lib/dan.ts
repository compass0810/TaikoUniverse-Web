// dan_defs.dan_hash は固定キー "<unidanの内部名称>#<danIndex>#<段位タイトル>"
export type DanDef = { dan_hash: string; name: string; song_count: number | null };

export type DanInfo = DanDef & { season: string; index: number };

export function toDanInfo(d: DanDef): DanInfo {
  const parts = d.dan_hash.split("#");
  const index = Number(parts[1]);
  return { ...d, season: parts[0] ?? "", index: Number.isFinite(index) ? index : 9999 };
}

export function sortDans(list: DanDef[]): DanInfo[] {
  return list
    .map(toDanInfo)
    .sort((a, b) => a.season.localeCompare(b.season) || a.index - b.index);
}

export type RankRow = {
  dan_hash: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  passed: boolean;
  score: number;
  total_ryo: number;
  total_ka: number;
  total_fuka: number;
  total_renda: number;
  created_at: string;
  source: "play" | "import";
  songs: SongBreakdown[];
};

export type SongBreakdown = {
  ryo: number;
  ryo_plus: number;
  ka: number;
  fuka: number;
  renda: number;
  max_combo: number;
  completed: boolean;
};

export type ResultRow = {
  run_id: string;
  dan_hash: string;
  passed: boolean;
  score: number;
  songs: SongBreakdown[];
  total_ryo: number;
  total_ka: number;
  total_fuka: number;
  total_renda: number;
  pause_total_ms: number;
  elapsed_ms: number;
  flagged: boolean;
  flag_reasons: string[];
  source: "play" | "import";
  created_at: string;
};

// ランキングの並び(合格 → スコア高い順 → 早い順)。ビューの distinct on と同じ基準
export function compareRank(a: { passed: boolean; score: number; created_at: string }, b: typeof a): number {
  if (a.passed !== b.passed) return a.passed ? -1 : 1;
  if (a.score !== b.score) return b.score - a.score;
  return a.created_at.localeCompare(b.created_at);
}

export function fmtDate(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function fmtDuration(ms: number): string {
  if (!ms) return "-";
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}分${String(s % 60).padStart(2, "0")}秒`;
}
