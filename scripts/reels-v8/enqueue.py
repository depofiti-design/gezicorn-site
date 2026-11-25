"""v8 reels'i reels-web'e kopyalar ve reels-queue.json'a ekler.
Kullanım: python enqueue.py 83:2026-11-28T13:21 87:2026-11-29T13:47 ...   (saat UTC)
Var olan id tekrar eklenmez. Web kopyası 720x1280'e küçültülür (eski reels ile aynı boyut sınıfı).
"""
import json, os, shutil, subprocess, sys
from render import SRC, ROOT, ffmpeg

specs = {r['n']: r for r in json.load(open(os.path.join(os.path.dirname(__file__), 'specs.json'), encoding='utf8'))['reels']}
QP = os.path.join(ROOT, 'scripts', 'reels-queue.json')
WEB = os.path.join(ROOT, 'img', 'social', 'reels-web')
raw = json.load(open(QP, encoding='utf8'))
L = raw if isinstance(raw, list) else next(v for v in raw.values() if isinstance(v, list))
ids = {x['id'] for x in L}
for arg in sys.argv[1:]:
    n, when = arg.split(':', 1); r = specs[int(n)]
    name = f"reel-v8-{r['n']}-{r['slug']}"
    rid = f"reel-{r['n']}-{name}"
    if rid in ids:
        print('zaten var', rid); continue
    src = os.path.join(SRC, 'out', name + '.mp4')
    dst = os.path.join(WEB, name + '.mp4')
    subprocess.run([ffmpeg(), '-y', '-v', 'error', '-i', src, '-vf', 'scale=720:1280:flags=lanczos', '-c:v', 'libx264', '-crf', '23',
                    '-preset', 'slow', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-movflags', '+faststart', dst], check=True)
    os.makedirs(os.path.join(WEB, 'covers'), exist_ok=True)
    shutil.copy(os.path.join(SRC, 'out', name + '-cover.jpg'), os.path.join(WEB, 'covers', r['slug'] + '-cover.jpg'))
    L.append({
        'id': rid, 'platform': 'reel_both', 'publish_at': when + ':00.000Z',
        'video_url': f'https://www.gezicorn.com/img/social/reels-web/{name}.mp4',
        'title': r['title'], 'caption_ig': r['caption'],
        'caption_fb': r['caption'] + '\n\nDaha fazla rehber için: https://www.gezicorn.com',
        'published_id': None, 'published_at': None, 'article_slug': r['slug'],
        'cover_url': f"https://www.gezicorn.com/img/social/reels-web/covers/{r['slug']}-cover.jpg",
    })
    print('eklendi', rid, when, round(os.path.getsize(dst) / 1e6, 1), 'MB')
json.dump(raw, open(QP, 'w', encoding='utf8'), ensure_ascii=False, indent=2)
