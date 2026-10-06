# Şablon 5: Kum chip

Kum: yumusak kum gradyan zemin, yuvarlak etiket chipleri. Sicak ve sakin.

Format: 1080x1920 (9:16), 30 fps. Sample: 9 sn, sessiz (ses yok).

## Renkler
Kum/krem #F6ECDC (zemin), Krem #FFF8EE (hook chip, altyazi metni), Terrakota #B5523A (altyazi chip, aksan), Kahve #3B2A20 (hook metni), Lacivert logo #14345F

## Fontlar
Hook: Poppins SemiBold. Altyazi: Poppins Medium. Lisans: OFL

## Logo
Dosya: brand/gezicorn-logo-seffaf-512.png (renk ve plaka bu pakete gore). Boyut: 96px logo, 132px plaka. Konum: sag ust (x=908, y=56). Metin olarak "gezicorn" YOK.
Logo: krem yuvarlak plaka, sag ust.

## Hook (0.0 sn)
Her satir krem yuvarlak chip icinde, kahve metin. x=80, y=330.
Hook 0.0 sn'de ekranda, narasyon da ilk 1 sn icinde baslamali. Hook ilk 3 sn gosterilir.

## Altyazi
Poppins Medium 38-50px, krem metin, TERRAKOTA OPAK YUVARLAK CHIP (yari saydam degil). Ortali, alt sinir y=1470.
Kucuk harf Turkce. Konversiyon: I -> ı, İ -> i (once), sonra lower().

## Aksan cizgileri ve alt bolge
Ust sol terrakota yuvarlak cubuk 120x10 (y=268). Lower-third: ortada terrakota 140x10 yuvarlak bar (y=1290).

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
