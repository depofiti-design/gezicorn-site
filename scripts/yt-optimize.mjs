// Gezicorn YouTube kanal optimizasyonu v2: başlık (yalnızca zayıfsa), ilk satır kancası (hook), açıklama, etiket, ilgili blog yazıları,
// küçük resim metni önerisi. Gemini üretir, YouTube Data API uygular. Yerel dosyalar gitignore'da.
// Kullanım:
//   node yt-optimize.mjs --ids ID1,ID2 --dry|--apply
//   node yt-optimize.mjs --batch 170 --apply        (v2'ye geçmemiş ilk N video, izlenmeye göre)
// Kurallar: kullanıcının orijinal metni silinmez (sadece başına "▶ hook" satırı, sonuna site bloğu eklenir; boşsa Gemini özeti yazılır).
// Başlık sadece zayıfsa ve izlenme < 5000 ise değişir (kanıtlanmış başlıklara dokunulmaz). Uydurma bilgi yok. Em dash yok.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { api } from './yt-lib.mjs';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase-client.js';

const KEY = readFileSync(new URL('./gemini-key.local.txt', import.meta.url), 'utf8').trim();
const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const val = (f) => (args.includes(f) ? args[args.indexOf(f) + 1] : null);
const dry = has('--dry'), apply = has('--apply');
if (!dry && !apply) { console.log('--dry ya da --apply ver'); process.exit(1); }

const POSTS = (await getDocs(collection(db, 'posts'))).docs.map((d) => d.data()).filter((p) => p.published && !p.noindex).map((p) => ({ slug: p.slug, title: p.title }));
const POSTLIST = POSTS.map((p) => `${p.slug} | ${p.title}`).join('\n');
const SLUGS = new Set(POSTS.map((p) => p.slug));

// durum: youtube-backup/state.json { id: { v: 2, thumb_text, ... } }; eski done.json (v1) varsa içe aktar
const statePath = 'youtube-backup/state.json';
const state = existsSync(statePath) ? JSON.parse(readFileSync(statePath, 'utf8')) : {};
if (existsSync('youtube-backup/done.json')) for (const id of JSON.parse(readFileSync('youtube-backup/done.json', 'utf8'))) state[id] ??= { v: 1 };
const save = () => writeFileSync(statePath, JSON.stringify(state));

// güncel kanal verisi
const ch = await api('channels', { part: 'contentDetails', mine: 'true' });
const up = ch.items[0].contentDetails.relatedPlaylists.uploads;
let ids = [], pt = '';
do { const r = await api('playlistItems', { part: 'contentDetails', playlistId: up, maxResults: '50', ...(pt ? { pageToken: pt } : {}) }); ids.push(...r.items.map((i) => i.contentDetails.videoId)); pt = r.nextPageToken || ''; } while (pt);
const all = [];
for (let i = 0; i < ids.length; i += 50) all.push(...(await api('videos', { part: 'snippet,contentDetails,statistics,status', id: ids.slice(i, i + 50).join(',') })).items);
const pub = all.filter((v) => v.status.privacyStatus === 'public');
const dur = (s) => { const m = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(s || ''); return m ? (+m[1] || 0) * 86400 + (+m[2] || 0) * 3600 + (+m[3] || 0) * 60 + (+m[4] || 0) : 0; };

const MAP = [
  [/pasaport.*(kayb|kaybol|çal)|kayıp pasaport/i, 'pasaport-kaybolursa-calinirsa-yurt-disinda-ne-yapmali'],
  [/kırgızistan|kirgizistan|bişkek|biskek|manas|issık|ısık|song köl/i, 'kirgizistan-vizesi-turkler-icin-ne-gerekiyor'],
  [/özbekistan|ozbekistan|taşkent|taskent|semerkant|buhara/i, 'ozbekistan-vize-kurallari-kalis-suresi'],
  [/kazakistan|almatı|almaty|astana/i, 'kazakistana-vizesiz-girmek-mumkun-mu'],
  [/rusya|moskova|petersburg/i, 'rusya-e-vize-basvurusu-nasil-yapilir'],
  [/tayland|pattaya|bangkok|phuket|thailand/i, 'tayland-vize-muafiyeti-kuru-sezon-rehberi'],
  [/malezya|kuala lumpur|malaysia/i, 'malezyaya-kac-gun-vizesiz-kalinabilir'],
  [/hong kong|hongkong/i, 'hong-konga-giriste-vize-gerekiyor-mu'],
  [/kamboçya|kambocya|phnom|siem reap|angkor/i, 'kambocya-vizesi-turkler-icin-e-vize-sureci'],
  [/vietnam|hanoi|ha long/i, 'vietnam-vizesi-turkler-icin-e-vize-sureci'],
  [/japonya|tokyo|japan/i, 'japonya-vizesi-turkler-icin-zor-mu'],
  [/e-?vize|elektronik vize/i, 'e-vize-nedir-hangi-ulkelerde-var'],
  [/pasaport/i, 'pasaport-turleri-bordo-yesil-hususi-gri-fark'],
];
const related = (v) => { const t = v.snippet.title + ' ' + (v.snippet.description || '').slice(0, 300); const m = MAP.find(([re]) => re.test(t)); return m ? `https://www.gezicorn.com/yazi/${m[1]}/` : null; };

const MODELS = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.6-flash', 'gemini-3-flash-preview', 'gemini-2.5-flash', 'gemini-3.8-flash', 'gemini-3.7-flash'];
const dead = new Set();
async function geminiBatch(vs) {
  const items = vs.map((v) => {
    const cur = (v.snippet.description || '').replace(/\n\n🔗[\s\S]*$/, '').replace(/^▶ [^\n]*\n\n?/, '').slice(0, 500) || '(boş)';
    return `ID: ${v.id}\nBaşlık: ${v.snippet.title}\nSüre: ${Math.round(dur(v.contentDetails.duration) / 60)} dk | İzlenme: ${v.statistics.viewCount}\nMevcut açıklama: ${cur}\nMevcut etiketler: ${(v.snippet.tags || []).join(', ') || '(yok)'}`;
  }).join('\n\n---\n\n');
  const text = `Sen YouTube SEO uzmanısın (VidIQ mantığı: ana anahtar kelime başlığın başında, ilk 2 satırda kanca + anahtar kelime, alakalı etiketler, 50-70 karakter başlık). Kanal: Gezicorn, Türkçe solo gezi ve vize kanalı.
Aşağıdaki videoların her biri için metadata üret. Sadece verilen başlık, açıklama ve etiketlere dayan.
KURALLAR: Uydurma rakam, ücret, tarih, iddia yazma; emin olmadığını yazma. Em dash (—) kullanma. Türkçe karakterleri (ç ğ ı ö ş ü İ) doğru yaz, yazım hatası yapma. Yalancı clickbait yok, ama merak uyandır.
Her video için alanlar:
"id": verilen ID aynen,
"title": başlık iyiyse AYNEN aynısı; zayıfsa (hashtag dolu, İngilizce karışık, anahtar kelime yok, çok uzun/kısa) iyileştir: ana anahtar kelime başta, en fazla 70 karakter, en fazla 1 emoji, orijinal anlamı koru,
"hook": ilk satırda gösterilecek tek cümle kanca (en fazla 120 karakter, ana anahtar kelimeyi içersin),
"description": yalnızca mevcut açıklama (boş) ise başlık ve etiketlere dayanan 2 cümlelik nötr özet (videoda ne olduğunu bilmiyorsan genel kal), doluysa boş string,
"tags": FİNAL etiket listesi, 8-15 adet, küçük harf, # yok; mevcut alakalı etiketleri koru, alakasız/spam olanları çıkar, eksik arama sorgularını ekle,
"hashtags": en fazla 2, # işaretsiz, boşluksuz,
"related_slugs": aşağıdaki listeden GERÇEKTEN ilgili 0-2 blog slug'ı, yoksa boş dizi,
"thumb_text": küçük resme yazılacak en fazla 3 kelimelik çarpıcı kanca (Türkçe, doğru yazım).
ÇIKTI: JSON dizisi, her video için bir nesne.

VİDEOLAR:
${items}

Gezicorn blog yazıları (slug | başlık):
${POSTLIST}`;
  for (let round = 0; round < 3; round++) {
    for (const m of MODELS) {
      if (dead.has(m)) continue;
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': KEY },
        body: JSON.stringify({ contents: [{ parts: [{ text }] }], generationConfig: { responseMimeType: 'application/json' } }) });
      const j = await r.json();
      if (j.error) {
        if (j.error.code === 429) { dead.add(m); console.log('  model günlük limiti doldu:', m); continue; }
        await new Promise((s) => setTimeout(s, 3000)); continue;
      }
      const txt = j.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
      try { const arr = JSON.parse(txt); if (Array.isArray(arr)) { console.log('  model:', m, '|', arr.length, 'sonuç'); return arr; } } catch { /* sonraki model */ }
    }
    if (dead.size >= MODELS.length) break;
    await new Promise((s) => setTimeout(s, 8000));
  }
  return null;
}

const FOOT = (urls, tags) => `\n\n${(urls.length ? urls : ['https://www.gezicorn.com/yazi/']).map((u, i) => (i ? '🔗 Bu konuda daha fazlası: ' : '🔗 Yazılı rehber: ') + u).join('\n')}\n🗺 Pasaportuna göre vize tablosu: https://www.gezicorn.com/vize-tablosu/\n🌐 Gezicorn: https://www.gezicorn.com\n📷 Instagram: https://www.instagram.com/gezicorn/\n\n#gezicorn ${tags.map((t) => '#' + t).join(' ')}`.trimEnd();
const toArr = (x) => (Array.isArray(x) ? x : typeof x === 'string' ? x.split(/[,;\n]+/) : []);
const clean = (s) => String(s || '').replace(/—/g, ',').replace(/\s+/g, ' ').trim();

let targets;
if (val('--ids')) targets = val('--ids').split(',').map((id) => pub.find((v) => v.id === id)).filter(Boolean);
else targets = pub.filter((v) => (state[v.id]?.v || 0) < 2).sort((a, b) => b.statistics.viewCount - a.statistics.viewCount).slice(0, +val('--batch') || 20);

const out = [];
const CH = 8;
let stop = false;
for (let ci = 0; ci < targets.length && !stop; ci += CH) {
  const chunk = targets.slice(ci, ci + CH);
  const arr = await geminiBatch(chunk);
  if (!arr) { console.log('TÜM MODELLERİN GÜNLÜK LİMİTİ DOLDU, yarın devam edilecek.'); break; }
  const byId = new Map(arr.map((x) => [x.id, x]));
  for (const v of chunk) {
    const g = byId.get(v.id);
    if (!g) { console.log('ATLANDI (sonuç yok):', v.id); continue; }
    const cur = v.snippet.description || '';
    const stripped = cur.replace(/\n\n🔗[\s\S]*$/, '').replace(/^▶ [^\n]*\n\n?/, '').trim();
    const needDesc = stripped.length < 80;
    const views = +v.statistics.viewCount;
    let title = v.snippet.title;
    const nt = clean(g.title);
    if (nt && nt !== title && views < 5000 && nt.length >= 20 && nt.length <= 75) title = nt;
    const hook = clean(g.hook).slice(0, 130);
    const body = needDesc ? [stripped, clean(g.description)].filter(Boolean).join('\n\n') : stripped;
    const tags = []; let tl = 0;
    for (const t0 of toArr(g.tags)) { const t = String(t0).replace(/#/g, '').toLowerCase().trim(); if (!t || tags.includes(t)) continue; if (tl + t.length + 1 > 450) break; tags.push(t); tl += t.length + 1; }
    const finalTags = tags.length >= 5 ? tags : (v.snippet.tags || tags);
    const hashtags = toArr(g.hashtags).map((h) => String(h).replace(/[^\p{L}\p{N}]/gu, '')).filter(Boolean).slice(0, 2);
    const rel = toArr(g.related_slugs).map((x) => String(x).trim()).filter((x) => SLUGS.has(x)).slice(0, 2).map((x) => `https://www.gezicorn.com/yazi/${x}/`);
    const urls = rel.length ? rel : (related(v) ? [related(v)] : []);
    const newDesc = ((hook ? `▶ ${hook}\n\n` : '') + body + FOOT(urls, hashtags)).slice(0, 4900);
    out.push({ id: v.id, oldTitle: v.snippet.title, title, views, hook, tags: finalTags, oldTags: v.snippet.tags || [], thumb_text: clean(g.thumb_text), urls });
    console.log(`${dry ? 'ÖNERİ' : 'HAZIR'} ${v.id} | ${views} izl | ${title !== v.snippet.title ? 'BAŞLIK: ' + v.snippet.title.slice(0, 40) + ' => ' + title.slice(0, 60) : 'başlık aynı'} | etiket ${finalTags.length} | ilgili ${urls.length}`);
    if (apply) {
      try {
        await api('videos', { part: 'snippet' }, { method: 'PUT', body: { id: v.id, snippet: { title, description: newDesc, tags: finalTags, categoryId: v.snippet.categoryId, defaultLanguage: v.snippet.defaultLanguage || 'tr' } } });
      } catch (e) {
        console.log('YAZILAMADI', v.id, String(e.message).slice(0, 120));
        if (/quota/i.test(e.message)) { console.log('YOUTUBE GÜNLÜK KOTA DOLDU, yarın devam edilecek.'); stop = true; break; }
        continue;
      }
      state[v.id] = { ...(state[v.id] || {}), v: 2, thumb_text: clean(g.thumb_text), title };
      save();
    }
  }
}
writeFileSync('youtube-backup/proposals.json', JSON.stringify(out, null, 1));
console.log('bitti', out.length, 'video', apply ? "(YouTube'a yazıldı)" : '(sadece öneri)');
