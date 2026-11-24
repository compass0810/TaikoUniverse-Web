"use client";

import { Fragment, useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import SongBreakdownView from "@/components/SongBreakdown";
import { compareRank, fmtDate, sortDans, type DanInfo, type RankRow } from "@/lib/dan";

export default function RankingPage() {
  const [dans, setDans] = useState<DanInfo[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [rows, setRows] = useState<RankRow[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string>(""); // 曲別の内訳を開いているプレイヤー(user_id)

  // 段位の一覧
  useEffect(() => {
    getSupabase()
      .from("dan_played") // 挑戦者のいる段位だけ(ネタバレ防止)
      .select("dan_hash, name, song_count")
      .then(({ data, error }) => {
        if (error) { setError(error.message); setLoading(false); return; }
        const list = sortDans(data ?? []);
        setDans(list);
        if (list.length > 0) setSelected(list[0].dan_hash);
        else setLoading(false);
      });
  }, []);

  // 選んだ段位のランキング
  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    setOpen("");
    getSupabase()
      .from("dan_rankings")
      .select("*")
      .eq("dan_hash", selected)
      .limit(1000)
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setRows(((data ?? []) as RankRow[]).sort(compareRank).slice(0, 100));
        setLoading(false);
      });
  }, [selected]);

  return (
    <>
      <h1>ランキング</h1>
      {error ? <p className="empty">読み込みに失敗しました: {error}</p> : null}

      <div className="tabs">
        {dans.map((d) => (
          <button key={d.dan_hash} className={"tab" + (d.dan_hash === selected ? " on" : "")} onClick={() => setSelected(d.dan_hash)}>
            {d.name}
          </button>
        ))}
      </div>

      {loading ? <p className="empty">読み込み中…</p> : rows.length === 0 ? (
        <p className="empty">まだ記録がありません。</p>
      ) : (
        <div className="wrap">
          <table>
            <thead>
              <tr>
                <th className="num">順位</th><th>プレイヤー</th><th>結果</th>
                <th className="num">スコア</th><th className="num">良</th><th className="num">可</th>
                <th className="num">不可</th><th className="num">連打</th><th>日時</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <Fragment key={r.user_id}>
                <tr className="click" onClick={() => setOpen(open === r.user_id ? "" : r.user_id)}>
                  <td className="num">{i + 1}</td>
                  <td>
                    <span className="user">
                      {r.avatar_url ? <img src={r.avatar_url} alt="" className="avatar" /> : null}
                      {r.display_name}
                      {r.source === "import" ? <span className="badge warn">引き継ぎ</span> : null}
                    </span>
                  </td>
                  <td><span className={"badge " + (r.passed ? "ok" : "ng")}>{r.passed ? "合格" : "不合格"}</span></td>
                  <td className="num">{r.score.toLocaleString()}</td>
                  <td className="num">{r.total_ryo}</td><td className="num">{r.total_ka}</td>
                  <td className="num">{r.total_fuka}</td><td className="num">{r.total_renda}</td>
                  <td>{fmtDate(r.created_at)}</td>
                </tr>
                {open === r.user_id ? (
                  <tr className="sub-row">
                    <td colSpan={9}><SongBreakdownView songs={r.songs} /></td>
                  </tr>
                ) : null}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="note">1人につき、その段位のベスト（合格優先 → スコア順）を1件だけ表示します。上位100件まで。行をクリックすると曲ごとの内訳が開きます。「引き継ぎ」は端末内の記録を移した自己申告の記録です。</p>
    </>
  );
}
