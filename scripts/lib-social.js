// Shared Composio MCP posting logic, used by post-social.js and post-next-social.js.
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Yerelde composio-key.local.txt'den (gitignore'da), cloud rutininde COMPOSIO_API_KEY ortam değişkeninden okunur.
const API_KEY = process.env.COMPOSIO_API_KEY || readFileSync(path.join(__dirname, 'composio-key.local.txt'), 'utf-8').trim();
const MCP_URL = 'https://connect.composio.dev/mcp';

export const IG_USER_ID = '28470759025941073';
export const IG_ACCOUNT = 'instagram_warmus-musery';
export const FB_PAGE_ID = '144062395450039';
export const FB_ACCOUNT = 'facebook_harr-iao';

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

export async function postInstagram({ image_url, caption }) {
  const container = await multiExecute([{
    tool_slug: 'INSTAGRAM_POST_IG_USER_MEDIA',
    arguments: { ig_user_id: IG_USER_ID, image_url, caption, graph_api_version: 'v21.0' },
    account: IG_ACCOUNT
  }]);
  const published = await multiExecute([{
    tool_slug: 'INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH',
    arguments: { ig_user_id: IG_USER_ID, creation_id: container.id, max_wait_seconds: 60 },
    account: IG_ACCOUNT
  }]);
  return published.id;
}

export async function postInstagramStory({ image_url }) {
  const container = await multiExecute([{
    tool_slug: 'INSTAGRAM_POST_IG_USER_MEDIA',
    arguments: { ig_user_id: IG_USER_ID, image_url, media_type: 'STORIES', graph_api_version: 'v21.0' },
    account: IG_ACCOUNT
  }]);
  const published = await multiExecute([{
    tool_slug: 'INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH',
    arguments: { ig_user_id: IG_USER_ID, creation_id: container.id, max_wait_seconds: 60 },
    account: IG_ACCOUNT
  }]);
  return published.id;
}

export async function postFacebook({ image_url, caption_facebook, caption }) {
  const result = await multiExecute([{
    tool_slug: 'FACEBOOK_CREATE_PHOTO_POST',
    arguments: { page_id: FB_PAGE_ID, url: image_url, message: caption_facebook || caption },
    account: FB_ACCOUNT
  }]);
  return result.post_id || result.id;
}

// Instagram carousel'in Facebook karşılığı: tek /feed gönderisi içinde birden fazla kaydırmalı foto.
// IG'deki gibi ayrı ayrı kart değil, tek post ama kullanıcı feed'de kaydırarak tüm fotoları görebiliyor.
export async function postFacebookCarousel({ image_urls, caption_facebook, caption }) {
  const result = await multiExecute([{
    tool_slug: 'FACEBOOK_CREATE_MULTI_PHOTO_POST',
    arguments: { page_id: FB_PAGE_ID, photo_urls: image_urls, message: caption_facebook || caption },
    account: FB_ACCOUNT
  }]);
  return result.post_id || result.id;
}
