// YouTube OAuth (bir kerelik): tarayıcıda balbenimyerim@gmail.com ile izin verilir, refresh token youtube-token.local.json'a yazılır.
// Kullanım: node youtube-auth.mjs   (yerel dosyalar gitignore'da, sohbete yapıştırma)
import { readFileSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import { exec } from 'node:child_process';
import { randomBytes } from 'node:crypto';

const c = JSON.parse(readFileSync('youtube-client.local.json', 'utf8')).installed;
const state = randomBytes(8).toString('hex');
const SCOPE = 'https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.force-ssl';
const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://localhost');
  if (u.pathname !== '/') { res.end('ok'); return; }
  if (u.searchParams.get('state') !== state) { res.end('state hatalı'); return; }
  const code = u.searchParams.get('code');
  if (!code) { res.end('Yetki verilmedi: ' + (u.searchParams.get('error') || '')); process.exit(1); }
  const r = await fetch(c.token_uri, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id: c.client_id, client_secret: c.client_secret, redirect_uri: `http://localhost:${server.address().port}`, grant_type: 'authorization_code' }) });
  const t = await r.json();
  if (!t.refresh_token) { res.end('Token alınamadı: ' + JSON.stringify(t)); console.log('HATA', JSON.stringify(t)); process.exit(1); }
  writeFileSync('youtube-token.local.json', JSON.stringify({ refresh_token: t.refresh_token, scope: t.scope }));
  res.end('<h2>Tamam, Gezicorn YouTube yetkisi verildi. Bu sekmeyi kapatabilirsin.</h2>');
  console.log('TOKEN_KAYDEDILDI');
  setTimeout(() => process.exit(0), 500);
});
server.listen(0, '127.0.0.1', () => {
  const port = server.address().port;
  const url = `${c.auth_uri}?client_id=${encodeURIComponent(c.client_id)}&redirect_uri=${encodeURIComponent('http://localhost:' + port)}&response_type=code&scope=${encodeURIComponent(SCOPE)}&access_type=offline&prompt=consent&state=${state}`;
  console.log('Tarayıcı açılıyor, port', port);
  exec(`start "" "${url}"`);
});
setTimeout(() => { console.log('ZAMAN_ASIMI'); process.exit(1); }, 600000);
