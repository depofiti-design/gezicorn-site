# Gezicorn: Firestore Koleksiyon Şeması

## `posts`
| Alan | Tip | Açıklama |
|---|---|---|
| title | string | Yazı başlığı |
| slug | string | URL slug'ı |
| category | string | `vize` \| `firsat` \| `rehber` \| `haber` |
| excerpt | string | Kart üzerinde görünen kısa özet |
| content | string | Yazı içeriği |
| cover_image | string\|null | Kapak görsel URL |
| published | boolean | Yayında mı |
| created_at | timestamp | serverTimestamp |

## `deals`
| Alan | Tip | Açıklama |
|---|---|---|
| type | string | `gear` (ürün) \| `flight` (manuel uçuş fırsatı) |
| title | string | Ürün / fırsat adı |
| route_from | string\|null | Uçuşsa kalkış noktası |
| route_to | string\|null | Uçuşsa varış noktası |
| old_price | number\|null | Eski fiyat |
| new_price | number | Yeni fiyat |
| discount_label | string\|null | Rozet metni (örn: "%28 indirim") |
| affiliate_url | string\|null | Affiliate link |
| active | boolean | Sitede gösterilsin mi |
| created_at | timestamp | serverTimestamp |

## `banners` — sabit 2 doküman: `banner_1`, `banner_2`
| Alan | Tip |
|---|---|
| image_url | string |
| link_url | string |
| alt_text | string |
| active | boolean |

## `social_links` — sabit 4 doküman: `telegram`, `instagram`, `youtube`, `kick`
| Alan | Tip |
|---|---|
| url | string |
| follower_label | string |
| active | boolean |

## `countries`
| Alan | Tip | Açıklama |
|---|---|---|
| name | string | Ülke adı |
| visited | boolean | Gidildi mi |
| visa_status | string | Vize durumu (örn: "vizesiz", "e-vize") |
| duration_days | number\|null | İzin verilen kalış süresi |
| pin_x, pin_y | number | Globe SVG üzerindeki pin koordinatı |

## `route_recommendations`
| Alan | Tip | Açıklama |
|---|---|---|
| budget_min | number | Bütçe aralığı alt sınır |
| budget_max | number | Bütçe aralığı üst sınır |
| destination | string | Önerilen destinasyon |
| note | string | Kısa not |
| estimated_price | number | Tahmini bilet fiyatı |
| active | boolean | Öneri havuzunda mı |

Rota planlayıcı client-side çalışır: tüm `active:true` kayıtlar çekilip bütçe aralığına göre JS ile filtrelenir (Firestore aralık sorgusu / composite index gerektirmemesi için). Bütçe "uçak bileti hariç" anlamındadır.

## `settings/consultancy` (tek doküman)
| Alan | Tip | Açıklama |
|---|---|---|
| whatsapp_url, telegram_url, email, instagram_url, tiktok_url, x_url | string | Hepsi boşsa ilgili buton/ikon sitede gizli, admin panelin "Danışmanlık" sekmesinden yönetilir |

## `settings/branding` (tek doküman)
| Alan | Tip | Açıklama |
|---|---|---|
| logo_url | string | Boşsa "G" rozeti kullanılır, admin panelin "Site Ayarları" sekmesinden yönetilir |
