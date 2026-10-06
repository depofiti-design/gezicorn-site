# Şablon 2: Bold sarı bar

Bold: koyu lacivert zemin, sari hook bari, sari sol serit. Enerjik ve net.

Format: 1080x1920 (9:16), 30 fps. Sample: 9 sn, sessiz (ses yok).

## Renkler
Koyu lacivert #0B1B33 (plaka, hook metni), Sari #FFC93C (hook bari, aksan), Beyaz #FFFFFF, Siyah kontur #000000

## Fontlar
Hook: Montserrat (wght 900). Altyazi: Manrope (wght 600). Lisans: OFL (fonts/OFL-manrope.txt, fonts/Manrope.ttf)

## Logo
Dosya: brand/gezicorn-logo-seffaf-512.png (renk ve plaka bu pakete gore). Boyut: 96px logo, 132px plaka. Konum: sag ust (x=908, y=56). Metin olarak "gezicorn" YOK.
Logo: koyu lacivert plaka uzerinde beyaz logo (logo rengi bu pakete ozel).

## Hook (0.0 sn)
BUYUK HARF, her satir kendi sari dolu barinda, lacivert metin. Sol x=60, y=330.
Hook 0.0 sn'de ekranda, narasyon da ilk 1 sn icinde baslamali. Hook ilk 3 sn gosterilir.

## Altyazi
Manrope 600, 42-56px, beyaz dolgu, siyah 9px kontur. Golge YOK (sadece kontur). Kutu YOK. Ortali, alt sinir y=1470.
Kucuk harf Turkce. Konversiyon: I -> ı, İ -> i (once), sonra lower().

## Aksan cizgileri ve alt bolge
Sol kenarda sari serit 16x700 (y=300-1000). Lower-third: ortada sari 200x12 bar (y=1262).

## Guvenli alanlar (9:16)
- Ust 220px: logo ve ust cizgi disinda icerik yok.
- Hook alani: y 260-800.
- Altyazi alani: y 1280-1470 (alt sinir y=1470). Alttaki 450px Instagram arayuzu icin bos kalir.
- Yan kenar bosluk: 80px (sol/sag).

## Dosyalar
- logo-overlay.png: logo + plaka (1080x1920, seffaf)
- accent-overlay.png: aksan cizgileri/serit (1080x1920, seffaf)
- lower-third-overlay.png: alt bolge cizgisi/bari (1080x1920, seffaf)
- sample.mp4: 9 sn ornek (hook 0-3 sn, altyazi 1-9 sn)
- preview.jpg: 1.0 sn kare
