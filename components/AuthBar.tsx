"use client";

import Link from "next/link";
import { loginWithDiscord, logout, useSession } from "@/lib/useSession";

export default function AuthBar() {
  const { session, loading } = useSession();
  const meta = session?.user.user_metadata as { full_name?: string; name?: string; avatar_url?: string } | undefined;
  const name = meta?.full_name ?? meta?.name ?? "";

  return (
    <header className="bar">
      <Link href="/" className="brand">Unidan ランキング</Link>
      <nav>
        <Link href="/">ランキング</Link>
        <Link href="/me">マイページ</Link>
      </nav>
      <div className="auth">
        {loading ? null : session ? (
          <>
            {meta?.avatar_url ? <img src={meta.avatar_url} alt="" className="avatar" /> : null}
            <span>{name}</span>
            <button onClick={() => logout()}>ログアウト</button>
          </>
        ) : (
          <button className="primary" onClick={() => loginWithDiscord()}>Discordでログイン</button>
        )}
      </div>
    </header>
  );
}
