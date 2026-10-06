# Şablon 4: Turuncu blok

Turuncu blok: tam genislik turuncu hook blogu, beyaz konturlu altyazi. Guclu ve dikkat ceken.

Format: 1080x1920 (9:16), 30 fps. Sample: 9 sn, sessiz (ses yok).

## Renkler
Turuncu #FF5A1F (hook blogu, aksan), Beyaz #FFFFFF (hook, altyazi dolgu), Ink #111111 (kontur, ust serit)

## Fontlar
Hook: Bricolage Grotesque (wght 800, opsz 96, wdth 100). Altyazi: Manrope (wght 700). Lisans: OFL (fonts/OFL-manrope.txt, fonts/Manrope.ttf)

## Logo
Dosya: brand/gezicorn-logo-seffaf-512.png (renk ve plaka bu pakete gore). Boyut: 96px logo, 132px plaka. Konum: sag ust (x=908, y=56). Metin olarak "gezicorn" YOK.
Logo: beyaz plaka, lacivert logo, sag ust.

## Hook (0.0 sn)
Tam genislik turuncu blok (opak), beyaz metin, x=80, y=300, blok ic bosluk 46px.
Hook 0.0 sn'de ekranda, narasyon da ilk 1 sn icinde baslamali. Hook ilk 3 sn gosterilir.

## Altyazi
Manrope 700, 42-56px, beyaz dolgu, ink 12px kontur, golge yok (outlined beyaz). Ortali, alt sinir y=1470.
Kucuk harf Turkce. Konversiyon: I -> ı, İ -> i (once), sonra lower().

## Aksan cizgileri ve alt bolge
Ust ink serit (14px), sol alt turuncu cubuk 180x8 (y=1822). Lower-third: turuncu 6px tam cizgi (y=1292).

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
