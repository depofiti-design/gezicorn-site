// Usage: node post-social.js post.json
// post.json: { "image_url": "https://...png", "caption": "...", "caption_facebook"?: "...", "platforms"?: ["instagram","facebook"] }
// Ek modlar: "carousel_images": [url,...] (kaydırmalı) ya da "video_url": url (reel); bu modlarda sadece Instagram'a gider.
// caption_facebook overrides caption for the Facebook post (e.g. drop hashtags, add a link).
// Posts via Composio MCP (https://connect.composio.dev/mcp) using the API key in composio-key.local.txt
// (gitignored, never commit it). Instagram account: instagram_warmus-musery (ig_user_id 28470759025941073).
// Facebook page: 144062395450039 ("Yol Var Nizam Var"), account: facebook_harr-iao.
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Yerelde composio-key.local.txt'den (gitignore'da), cloud rutininde COMPOSIO_API_KEY ortam değişkeninden okunur.
const API_KEY = process.env.COMPOSIO_API_KEY || readFileSync(path.join(__dirname, 'composio-key.local.txt'), 'utf-8').trim();
const MCP_URL = 'https://connect.composio.dev/mcp';

const IG_USER_ID = '28470759025941073';
const IG_ACCOUNT = 'instagram_warmus-musery';
const FB_PAGE_ID = '144062395450039';
const FB_ACCOUNT = 'facebook_harr-iao';

const jsonPath = process.argv[2];
if (!jsonPath) {
  console.error('Usage: node post-social.js post.json');
  process.exit(1);
}
const post = JSON.parse(readFileSync(jsonPath, 'utf-8'));
const mode = post.carousel_images ? 'carousel' : post.video_url ? 'reel' : 'photo';
if (!post.caption || (mode === 'photo' && !post.image_url)) {
  console.error('post.json needs caption and image_url (or carousel_images: [jpg urls] for a swipe post, or video_url for a reel)');
  process.exit(1);
}
const platforms = post.platforms || ['instagram', 'facebook'];

async function callMcp(toolCallParams) {
  const res = await fetch(MCP_URL, {
    method: 'POST',
    headers: {
      'x-consumer-api-key': API_KEY,
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream'
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method: 'tools/call', params: toolCallParams })
  });
  const raw = await res.text();
  const line = raw.split('\n').find(l => l.startsWith('data: '));
  const payload = JSON.parse((line || raw).replace(/^data: /, ''));
  if (payload.error) throw new Error(JSON.stringify(payload.error));
  const text = payload.result.content[0].text;
  const parsed = JSON.parse(text);
  if (!parsed.successful) throw new Error(JSON.stringify(parsed));
  return parsed.data;
}

async function multiExecute(tools) {
  const data = await callMcp({
    name: 'COMPOSIO_MULTI_EXECUTE_TOOL',
    arguments: { tools, sync_response_to_workbench: false, memory: {}, session_id: 'gezicorn-social' }
  });
  const result = data.results[0];
  if (result.error) throw new Error(result.error);
  return result.response.data;
}

async function postInstagram() {
  const container = await multiExecute([{
    tool_slug: 'INSTAGRAM_POST_IG_USER_MEDIA',
    arguments: { ig_user_id: IG_USER_ID, image_url: post.image_url, caption: post.caption, graph_api_version: 'v21.0' },
    account: IG_ACCOUNT
  }]);
  const creationId = container.id;
  const published = await multiExecute([{
    tool_slug: 'INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH',
    arguments: { ig_user_id: IG_USER_ID, creation_id: creationId, max_wait_seconds: 60 },
    account: IG_ACCOUNT
  }]);
  console.log('Instagram published:', published.id);
}

// Kaydırmalı gönderi: post.carousel_images = 2-10 adet herkese açık JPEG URL (4:5 ile 1.91:1)
async function postInstagramCarousel() {
  const container = await multiExecute([{
    tool_slug: 'INSTAGRAM_CREATE_CAROUSEL_CONTAINER',
    arguments: { ig_user_id: IG_USER_ID, child_image_urls: post.carousel_images, caption: post.caption, graph_api_version: 'v21.0' },
    account: IG_ACCOUNT
  }]);
  const published = await multiExecute([{
    tool_slug: 'INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH',
    arguments: { ig_user_id: IG_USER_ID, creation_id: container.id, max_wait_seconds: 120 },
    account: IG_ACCOUNT
  }]);
  console.log('Instagram carousel published:', published.id);
}

// Reel: post.video_url = herkese açık MP4 (9:16). Müzik videonun içinde olmalı.
async function postInstagramReel() {
  const container = await multiExecute([{
    tool_slug: 'INSTAGRAM_POST_IG_USER_MEDIA',
    arguments: { ig_user_id: IG_USER_ID, video_url: post.video_url, media_type: 'REELS', caption: post.caption, share_to_feed: true, graph_api_version: 'v21.0' },
    account: IG_ACCOUNT
  }]);
  const published = await multiExecute([{
    tool_slug: 'INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH',
    arguments: { ig_user_id: IG_USER_ID, creation_id: container.id, max_wait_seconds: 240 },
    account: IG_ACCOUNT
  }]);
  console.log('Instagram reel published:', published.id);
}

async function postFacebook() {
  const result = await multiExecute([{
    tool_slug: 'FACEBOOK_CREATE_PHOTO_POST',
    arguments: { page_id: FB_PAGE_ID, url: post.image_url, message: post.caption_facebook || post.caption },
    account: FB_ACCOUNT
  }]);
  console.log('Facebook published:', result.post_id || result.id);
}

// Instagram carousel'in Facebook karşılığı: tek /feed gönderisi, kaydırmalı çoklu foto (ayrı kart değil).
async function postFacebookCarousel() {
  const result = await multiExecute([{
    tool_slug: 'FACEBOOK_CREATE_MULTI_PHOTO_POST',
    arguments: { page_id: FB_PAGE_ID, photo_urls: post.carousel_images, message: post.caption_facebook || post.caption },
    account: FB_ACCOUNT
  }]);
  console.log('Facebook carousel published:', result.post_id || result.id);
}

if (platforms.includes('instagram')) await (mode === 'carousel' ? postInstagramCarousel() : mode === 'reel' ? postInstagramReel() : postInstagram());
// Reel modunda Facebook'a video atmıyoruz (ayrı bir yükleme/format işi gerektirir), sadece photo ve carousel modunda paylaşıyoruz.
if (platforms.includes('facebook') && mode === 'photo') await postFacebook();
if (platforms.includes('facebook') && mode === 'carousel') await postFacebookCarousel();
process.exit(0);
