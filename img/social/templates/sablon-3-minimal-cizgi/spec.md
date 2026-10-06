# Şablon 3: Minimal çizgi

Minimal: beyaz/acik zemin, ust ve alt ince turkuaz cizgiler, sticker tarzi altyazi.

Format: 1080x1920 (9:16), 30 fps. Sample: 9 sn, sessiz (ses yok).

## Renkler
Turkuaz #0F766E (cizgiler, aksan), Koyu gri #1F2937 (hook), Ink #111827 (altyazi), Beyaz (halo, plaka)

## Fontlar
Hook + altyazi: Plus Jakarta Sans (wght 800 hook, 600 altyazi). Lisans: OFL

## Logo
Dosya: brand/gezicorn-logo-seffaf-512.png (renk ve plaka bu pakete gore). Boyut: 96px logo, 132px plaka. Konum: sag ust (x=908, y=56). Metin olarak "gezicorn" YOK.
Logo: beyaz plaka, turkuaz 3px kontur, sag ust.

## Hook (0.0 sn)
Koyu gri dolgu, beyaz 12px halo (acik ve koyu zeminde okunur). Sol x=80, y=330.
Hook 0.0 sn'de ekranda, narasyon da ilk 1 sn icinde baslamali. Hook ilk 3 sn gosterilir.

## Altyazi
Plus Jakarta Sans 600, 42-54px, koyu dolgu + beyaz 10px halo, golge yok. Ortali, alt sinir y=1470.
Kucuk harf Turkce. Konversiyon: I -> ı, İ -> i (once), sonra lower().

## Aksan cizgileri ve alt bolge
Tam genislik ust ve alt turkuaz bantlar (10px). Lower-third: ortada 100x4 turkuaz cizgi (y=1290).

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
