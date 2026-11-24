"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { loginWithDiscord, useSession } from "@/lib/useSession";
import SongBreakdownView from "@/components/SongBreakdown";
import { compareRank, fmtDate, fmtDuration, sortDans, type DanInfo, type RankRow, type ResultRow } from "@/lib/dan";

type Best = { result: ResultRow; tries: number; passes: number; rank: number | null; players: number };

export default function MyPage() {
  const { session, loading: sessionLoading } = useSession();
  const [dans, setDans] = useState<DanInfo[]>([]);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [rankings, setRankings] = useState<RankRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [open, setOpen] = useState<string>("");

  const userId = session?.user.id;

  useEffect(() => {
    if (!userId) return;
    const sb = getSupabase();
    setLoading(true);

    Promise.all([
      sb.from("dan_played").select("dan_hash, name, song_count"), // 挑戦者のいる段位だけ(ネタバレ防止)
      sb.from("dan_results").select("*").order("created_at", { ascending: false }).limit(1000),
      sb.from("dan_rankings").select("*").limit(10000),
    ]).then(([d, r, k]) => {
      const err = d.error ?? r.error ?? k.error;
      if (err) setError(err.message);
      const mine = (r.data ?? []) as ResultRow[];
      const list = sortDans(d.data ?? []);

      // 自分の記録がある段位は、ランキング除外などで一覧に無くても出す(名前はキーの末尾から)
      const known = new Set(list.map((x) => x.dan_hash));
      const extra = Array.from(new Set(mine.map((x) => x.dan_hash)))
        .filter((h) => !known.has(h))
        .map((h) => ({ dan_hash: h, name: h.split("#").slice(2).join("#") || h, song_count: null }));

      setDans(sortDans([...list, ...extra]));
      setResults(mine);
      setRankings((k.data ?? []) as RankRow[]);
      setLoading(false);
    });
  }, [userId]);

  const danName = useMemo(() => new Map(dans.map((d) => [d.dan_hash, d.name])), [dans]);

  // 段位ごとのベスト(ランキングと同じ基準。除外中の記録は数えない)・挑戦回数・順位
  const bests = useMemo(() => {
    const out: { dan: DanInfo; best: Best }[] = [];

    for (const dan of dans) {
      const mine = results.filter((r) => r.dan_hash === dan.dan_hash);
      if (mine.length === 0) continue;

      const counted = mine.filter((r) => !r.flagged);
      const pool = counted.length > 0 ? counted : mine;
      const top = [...pool].sort(compareRank)[0];

      const board = rankings.filter((x) => x.dan_hash === dan.dan_hash).sort(compareRank);
      const idx = board.findIndex((x) => x.user_id === userId);

      out.push({
        dan,
        best: {
          result: top,
          tries: mine.length,
          passes: mine.filter((r) => r.passed).length,
          rank: idx >= 0 ? idx + 1 : null,
          players: board.length,
        },
      });
    }
    return out;
  }, [dans, results, rankings, userId]);

  const history = filter ? results.filter((r) => r.dan_hash === filter) : results;

  if (sessionLoading) return <p className="empty">読み込み中…</p>;

  if (!session) {
    return (
      <>
        <h1>マイページ</h1>
        <p className="empty">自分の記録を見るには、Discordでログインしてください。</p>
        <button className="primary" onClick={() => loginWithDiscord()}>Discordでログイン</button>
      </>
    );
  }

  return (
    <>
      <h1>マイページ</h1>
      {error ? <p className="empty">読み込みに失敗しました: {error}</p> : null}
      {loading ? <p className="empty">読み込み中…</p> : null}

      <h2>段位ごとの自己ベスト</h2>
      {bests.length === 0 && !loading ? <p className="empty">まだ記録がありません。ゲームでログインして段位に挑戦すると、ここに表示されます。</p> : null}
      <div className="cards">
        {bests.map(({ dan, best }) => (
          <div className="card" key={dan.dan_hash}>
            <div className="t">
              {dan.name}{" "}
              <span className={"badge " + (best.result.passed ? "ok" : "ng")}>{best.result.passed ? "合格" : "未合格"}</span>
            </div>
            <div>スコア {best.result.score.toLocaleString()}</div>
            <div className="m">
              良 {best.result.total_ryo} / 可 {best.result.total_ka} / 不可 {best.result.total_fuka} / 連打 {best.result.total_renda}
            </div>
            <div className="m">
              挑戦 {best.tries}回 / 合格 {best.passes}回
              {best.rank ? ` / ランキング ${best.rank}位(${best.players}人中)` : " / ランキング対象外"}
            </div>
            <div className="m">
              {fmtDate(best.result.created_at)}
              {best.result.source === "import" ? " ・引き継ぎ記録" : ""}
            </div>
          </div>
        ))}
      </div>

      <h2>プレイ履歴</h2>
      <p>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">すべての段位</option>
          {dans.map((d) => <option key={d.dan_hash} value={d.dan_hash}>{d.name}</option>)}
        </select>
      </p>
      {history.length === 0 ? <p className="empty">履歴がありません。</p> : (
        <div className="wrap">
          <table>
            <thead>
              <tr>
                <th>日時</th><th>段位</th><th>結果</th><th className="num">スコア</th>
                <th className="num">良</th><th className="num">可</th><th className="num">不可</th><th className="num">連打</th><th></th>
              </tr>
            </thead>
            <tbody>
              {history.map((r) => (
                <Fragment key={r.run_id}>
                  <tr className="click" onClick={() => setOpen(open === r.run_id ? "" : r.run_id)}>
                    <td>{fmtDate(r.created_at)}</td>
                    <td>{danName.get(r.dan_hash) ?? r.dan_hash}</td>
                    <td><span className={"badge " + (r.passed ? "ok" : "ng")}>{r.passed ? "合格" : "不合格"}</span></td>
                    <td className="num">{r.score.toLocaleString()}</td>
                    <td className="num">{r.total_ryo}</td><td className="num">{r.total_ka}</td>
                    <td className="num">{r.total_fuka}</td><td className="num">{r.total_renda}</td>
                    <td>
                      {r.source === "import" ? <span className="badge warn">引き継ぎ</span> : null}{" "}
                      {r.flagged ? <span className="badge ng">ランキング除外</span> : null}
                    </td>
                  </tr>
                  {open === r.run_id ? (
                    <tr className="sub-row">
                      <td colSpan={9}>
                        <SongBreakdownView songs={r.songs} />
                        <div className="note">所要時間 {fmtDuration(r.elapsed_ms)} / ポーズ {fmtDuration(r.pause_total_ms)}</div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="note">最新1000件まで表示します。行をクリックすると曲ごとの内訳が開きます。</p>
    </>
  );
}
