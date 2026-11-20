// AI arama motorlarında (Gemini grounding üzerinden) gercek gorunurluk testi.
// Sabit 10 soruluk "alici niyetli" portfoy, haftada 1 calisir (Gemini ucretsiz kota: model basina 20/gun).
// Rapor: seo-reports/ai-visibility-latest.md. Yontem: ai-seo skill'inin prompt-portfolio.md referansi.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const KEY = process.env.GEMINI_API_KEY || (existsSync('./gemini-key.local.txt') ? readFileSync('./gemini-key.local.txt', 'utf8').trim() : '');
if (!KEY) { console.error('Gemini anahtari yok (GEMINI_API_KEY ya da scripts/gemini-key.local.txt)'); process.exit(1); }

// Sabit "stable core" portfoy: gercek Turkce alici sorulari, glossary degil, karisik eski/yeni konu.
const PORTFOLIO = [
  'pasaportumun suresi 6 aydan az kaldi, ucaga binebilir miyim',
  'icra takibim var diye yurt disina cikis yasagim olur mu',
  'turk pasaportuyla kazakistana vizesiz kac gun kalinir',
  'schengen vizesi 2026 ucreti ne kadar',
  'tayland vizesi turkler icin kac gun vizesiz',
  'kamboc ya e vize nasil alinir turkler icin',
  'pasaportum calinirsa yurt disinda ne yapmaliyim',
  'bordo pasaport ile yesil pasaport arasindaki fark ne',
  'ikamet izni ile vize arasindaki fark nedir',
  'fransa schengen vizesinde bekleme listesi sistemi nedir',
];

// Tek model: 'gemini-flash-latest' bazen yogunluktan surekli hata veriyor, 10 cagri zaten
// gunluk 20 cagri kotasinin icinde kaliyor, rotasyona gerek yok.
const MODELS = ['gemini-2.5-flash'];

async function ask(prompt, model) {
  for (let i = 0; i < 3; i++) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': KEY },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], tools: [{ google_search: {} }] }),
    });
    const j = await r.json();
    if (j.error) {
      if ([429, 500, 503].includes(j.error.code)) { await new Promise((s) => setTimeout(s, 2000 * (i + 1))); continue; }
      return { error: j.error.message || String(j.error) };
    }
    const cand = j.candidates?.[0];
    const text = cand?.content?.parts?.map((p) => p.text || '').join('') || '';
    const chunks = cand?.groundingMetadata?.groundingChunks || [];
    const sources = chunks.map((c) => c.web?.uri || c.web?.title).filter(Boolean);
    return { text, sources };
  }
  return { error: 'yoğunluk, 3 denemede yanıt yok' };
}

const rows = [];
for (let i = 0; i < PORTFOLIO.length; i++) {
  const prompt = PORTFOLIO[i];
  const model = MODELS[i % MODELS.length];
  const res = await ask(prompt, model);
  if (res.error) { rows.push({ prompt, model, error: res.error }); continue; }
  const cited = res.sources.some((s) => /gezicorn/i.test(s)) || /gezicorn/i.test(res.text);
  rows.push({ prompt, model, cited, sources: res.sources, textSnippet: res.text.slice(0, 180) });
}

const citedCount = rows.filter((r) => r.cited).length;
const date = new Date().toISOString().slice(0, 10);
let md = `# Gezicorn AI gorunurluk testi\nOlusturulma: ${date}\n\nYontem: Gemini (google_search grounding) uzerinden sabit 10 soruluk alici-niyetli portfoy, her soru 1 kez calistirildi. Bu SADECE Gemini'yi olcer, ChatGPT/Perplexity ayri API anahtari gerektirir (henuz yok), onlar icin bu rapor temsili degil.\n\n**Sonuc: ${citedCount}/10 soruda gezicorn.com kaynak olarak gecti.**\n\n| Soru | Model | Gezicorn gecti mi | Gercek kaynaklar |\n|---|---|---|---|\n`;
for (const r of rows) {
  if (r.error) { md += `| ${r.prompt} | ${r.model} | HATA: ${r.error} | - |\n`; continue; }
  md += `| ${r.prompt} | ${r.model} | ${r.cited ? '✅' : '❌'} | ${(r.sources || []).slice(0, 3).join(', ') || '(kaynak yok)'} |\n`;
}
md += `\n## Not\n- Bu rapor haftalik cesitlilikle degisebilir, tek calistirma bir trendin kaniti degil, zaman icinde ayni 10 soruyla karsilastir (portfoy sabit tutuluyor).\n- 0/10 ya da dusuk sayi domain yasi/backlink eksikligiyle tutarli, mutlaka bir icerik hatasi anlamina gelmez.\n- Yeni konu eklenince (${PORTFOLIO.length}. soru fransa ornegi gibi) portfoye eklenebilir ama trend karsilastirmasi icin eski sorular silinmemeli.\n`;

writeFileSync('../seo-reports/ai-visibility-latest.md', md, 'utf-8');
console.log(`ai-visibility-latest.md yazildi: ${citedCount}/10 sorguda gezicorn gecti.`);
