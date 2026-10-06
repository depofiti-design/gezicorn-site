# Şablon 1: Editoryal

Editoryal: krem zemin, lacivert metin, turuncu kisa cizgi. Sakin ve gazete tarzi.

Format: 1080x1920 (9:16), 30 fps. Sample: 9 sn, sessiz (ses yok).

## Renkler
Krem #F3EBDD (plaka), Lacivert #14213D (hook, metin), Turuncu #E8772E (aksan), Logo #14345F

## Fontlar
Hook: Fraunces (wght 620, opsz 72) | Altyazi: Inter (wght 600). Lisans: OFL

## Logo
Dosya: brand/gezicorn-logo-seffaf-512.png (renk ve plaka bu pakete gore). Boyut: 96px logo, 132px plaka. Konum: sag ust (x=908, y=56). Metin olarak "gezicorn" YOK.
Logo: krem yuvarlak plaka (132px), sag ust (x=908, y=56).

## Hook (0.0 sn)
Buyuk serif, lacivert dolgu, krem 9px kontur. Sol hizali, y=330 ustten baslar, en fazla 3 satir.
Hook 0.0 sn'de ekranda, narasyon da ilk 1 sn icinde baslamali. Hook ilk 3 sn gosterilir.

## Altyazi
Inter 600, 42-56px, beyaz dolgu, lacivert 8px kontur + yumusak golge. Kutu YOK. Ortali, alt sinir y=1470.
Kucuk harf Turkce. Konversiyon: I -> ı, İ -> i (once), sonra lower().

## Aksan cizgileri ve alt bolge
Turuncu 160x6 kisa cizgi (y=268). Lower-third: lacivert 2px yatay cizgi (y=1292).

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
