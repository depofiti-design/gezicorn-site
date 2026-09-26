// YouTube Data API yardımcıları (OAuth refresh token ile). Yerel dosyalar gitignore'da.
import { readFileSync } from 'node:fs';
const c = JSON.parse(readFileSync(new URL('./youtube-client.local.json', import.meta.url), 'utf8')).installed;
const t = JSON.parse(readFileSync(new URL('./youtube-token.local.json', import.meta.url), 'utf8'));
let at = null;
export async function token() {
  if (at) return at;
  const r = await (await fetch(c.token_uri, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: c.client_id, client_secret: c.client_secret, refresh_token: t.refresh_token, grant_type: 'refresh_token' }) })).json();
  if (!r.access_token) throw new Error('token alınamadı: ' + JSON.stringify(r));
  return (at = r.access_token);
}
export async function api(path, params = {}, opt = {}) {
  const u = new URL('https://www.googleapis.com/youtube/v3/' + path);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  const r = await fetch(u, { method: opt.method || 'GET', headers: { authorization: 'Bearer ' + await token(), 'content-type': 'application/json' }, body: opt.body ? JSON.stringify(opt.body) : undefined });
  const j = await r.json();
  if (j.error) throw new Error(JSON.stringify(j.error));
  return j;
}
