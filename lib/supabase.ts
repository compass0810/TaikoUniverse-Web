import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

// ブラウザでだけ作る(ビルド時のプリレンダーで環境変数が無くても落ちないよう、使うときに作る)。
// storageKey を分けているのは、同じドメインに置く link.html(ゲーム連携ページ)が
// 「sb-」で始まる保存データを消すため。こちらのログインを巻き込まない。
export function getSupabase(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY が未設定です");

  client = createClient(url, key, {
    auth: { storageKey: "unidan-web-auth", persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return client;
}
