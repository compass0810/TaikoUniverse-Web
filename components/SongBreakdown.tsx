import type { SongBreakdown } from "@/lib/dan";

// 曲別の内訳。良+は古い記録(送信が未対応だった頃)では全曲0なので、その場合は出さない
export default function SongBreakdownView({ songs }: { songs: SongBreakdown[] }) {
  if (!songs || songs.length === 0) {
    return <span className="m">曲ごとの内訳はありません(引き継ぎ記録)。</span>;
  }

  const hasPlus = songs.some((s) => s.ryo_plus > 0);

  return (
    <>
      {songs.map((s, i) => (
        <div key={i}>
          {i + 1}曲目: 良 {s.ryo}
          {hasPlus ? `(良+ ${s.ryo_plus})` : ""} / 可 {s.ka} / 不可 {s.fuka} / 連打 {s.renda}
          {s.completed ? "" : "(途中終了)"}
        </div>
      ))}
    </>
  );
}
