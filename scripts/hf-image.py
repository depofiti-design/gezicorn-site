# Higgsfield API ile görsel üretimi. Anahtar: scripts/higgsfield-key.local.txt (gitignore, sohbete yazma).
# Kullanım: python hf-image.py "prompt" cikti.jpg [model]   (varsayılan model higgsfield-ai/soul/v2/standard)
import os, sys, urllib.request
here = os.path.dirname(os.path.abspath(__file__))
os.environ['HF_KEY'] = open(os.path.join(here, 'higgsfield-key.local.txt'), encoding='utf-8').read().strip()
import higgsfield_client
prompt, out = sys.argv[1], sys.argv[2]
model = sys.argv[3] if len(sys.argv) > 3 else 'higgsfield-ai/soul/v2/standard'
try:
    r = higgsfield_client.subscribe(model, arguments={'prompt': prompt})
except Exception as e:
    print('HATA (başarısız/iptal/moderasyon olabilir):', str(e)[:300]); sys.exit(1)
imgs = (r or {}).get('images') or []
if not imgs:
    print('Görsel dönmedi:', str(r)[:300]); sys.exit(1)
urllib.request.urlretrieve(imgs[0]['url'], out)
print('OK', imgs[0]['url'][:80], '->', out)
