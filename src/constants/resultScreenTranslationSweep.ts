import type { AppLanguageCode } from './languages';

type TranslationDictionary = Record<string, string>;

const RESULT_SCREEN_TRANSLATION_SWEEP: Partial<
  Record<AppLanguageCode, TranslationDictionary>
> = {
  ar: {
    'High Risk': 'مخاطر عالية',
    Caution: 'تحذير',
    Safe: 'آمن',
    'Needs More Data': 'يحتاج إلى مزيد من البيانات',
    'Great Choice': 'خيار ممتاز',
    Moderate: 'متوسط',
    'Needs Caution': 'يحتاج إلى الحذر',
    'Product loaded.': 'تم تحميل المنتج.',
    'Good regular pick': 'خيار جيد للاستخدام المنتظم',
    'Okay occasionally': 'مناسب أحيانًا',
    'Not ideal often': 'غير مثالي بشكل متكرر',
    'Need better data': 'يحتاج إلى بيانات أفضل',
    'Not scored as food': 'لم يتم تقييمه كغذاء',
    'Needs a closer look': 'يحتاج إلى نظرة أقرب',
    'Use as a rough guide': 'استخدمه كدليل تقريبي',
    'Needs more detail': 'يحتاج إلى مزيد من التفاصيل',
    'Good for regular use': 'جيد للاستخدام المنتظم',
    'Okay in moderation': 'مناسب باعتدال',
    'Best kept occasional': 'الأفضل استخدامه أحيانًا',
    'Not ideal for frequent use': 'غير مثالي للاستخدام المتكرر',
    'High confidence': 'ثقة عالية',
    'Partial data': 'بيانات جزئية',
    'Needs review': 'يحتاج إلى مراجعة',
    'No strong matches found for your selected filters.':
      'لم يتم العثور على تطابقات قوية للفلاتر التي اخترتها.',
    'No strong matches found for {labels}.': 'لم يتم العثور على تطابقات قوية لـ {labels}.',
    'Quick guide only.': 'دليل سريع فقط.',
    'Premium sharing is unlimited and ad-free.': 'المشاركة المميزة غير محدودة وبدون إعلانات.',
    '{remaining} of 5 basic share exports left today.':
      'تبقى اليوم {remaining} من أصل 5 مشاركات أساسية.',
    'Checking your daily share allowance.': 'جارٍ التحقق من حد المشاركة اليومي.',
    'Daily share limit reached': 'تم الوصول إلى حد المشاركة اليومي',
    'Basic includes 5 result-card exports per day. Premium adds unlimited sharing and five extra share-card styles.':
      'تشمل الخطة الأساسية 5 مشاركات لبطاقة النتيجة يوميًا. يضيف Premium مشاركة غير محدودة وخمسة أنماط إضافية لبطاقات المشاركة.',
    'Not now': 'ليس الآن',
    'View Premium': 'عرض Premium',
    'Share unavailable': 'المشاركة غير متاحة',
    'Could not open the share sheet right now. Please try again.':
      'تعذر فتح نافذة المشاركة الآن. يرجى المحاولة مرة أخرى.',
    'Review request sent': 'تم إرسال طلب المراجعة',
    'We queued this product for a manual trust check.':
      'أضفنا هذا المنتج إلى قائمة انتظار لمراجعة ثقة يدوية.',
    'Could not send request': 'تعذر إرسال الطلب',
    'Try again in a moment if this product still looks off.':
      'حاول مرة أخرى بعد قليل إذا كان هذا المنتج لا يزال يبدو غير صحيح.',
    'Thanks for the check': 'شكرًا على التحقق',
    'We flagged this product for a closer review.':
      'قمنا بوضع علامة على هذا المنتج لمراجعته بشكل أدق.',
    'We saved your pack confirmation for future trust checks.':
      'حفظنا تأكيد العبوة لاستخدامه في عمليات التحقق المستقبلية.',
    'Could not save that right now': 'تعذر حفظ ذلك الآن',
    'Try again in a moment if this pack still needs a review.':
      'حاول مرة أخرى بعد قليل إذا كانت هذه العبوة لا تزال بحاجة إلى مراجعة.',
    'N/A': 'غير متاح',
    'Grade {grade} • {label}': 'الدرجة {grade} • {label}',
    'Shows a short explanation for this ingredient': 'يعرض شرحًا قصيرًا لهذا المكوّن',
    'Share result card': 'مشاركة بطاقة النتيجة',
  },
  de: {
    'High Risk': 'Hohes Risiko',
    Caution: 'Vorsicht',
    Safe: 'Sicher',
    'Needs More Data': 'Mehr Daten nötig',
    'Great Choice': 'Sehr gute Wahl',
    Moderate: 'Mittel',
    'Needs Caution': 'Vorsicht nötig',
    'Product loaded.': 'Produkt geladen.',
    'Good regular pick': 'Gut für den regelmäßigen Kauf',
    'Okay occasionally': 'Gelegentlich okay',
    'Not ideal often': 'Nicht ideal bei häufiger Nutzung',
    'Need better data': 'Bessere Daten nötig',
    'Not scored as food': 'Nicht als Lebensmittel bewertet',
    'Needs a closer look': 'Braucht einen genaueren Blick',
    'Use as a rough guide': 'Als grobe Orientierung nutzen',
    'Needs more detail': 'Mehr Details nötig',
    'Good for regular use': 'Gut für den regelmäßigen Gebrauch',
    'Okay in moderation': 'In Maßen okay',
    'Best kept occasional': 'Am besten nur gelegentlich',
    'Not ideal for frequent use': 'Nicht ideal für häufige Nutzung',
    'High confidence': 'Hohe Sicherheit',
    'Partial data': 'Teilweise Daten',
    'Needs review': 'Muss geprüft werden',
    'No strong matches found for your selected filters.':
      'Für deine ausgewählten Filter wurden keine starken Treffer gefunden.',
    'No strong matches found for {labels}.':
      'Für {labels} wurden keine starken Treffer gefunden.',
    'Quick guide only.': 'Nur eine Kurzübersicht.',
    'Premium sharing is unlimited and ad-free.':
      'Premium-Freigaben sind unbegrenzt und werbefrei.',
    '{remaining} of 5 basic share exports left today.':
      'Heute bleiben noch {remaining} von 5 Basis-Freigaben übrig.',
    'Checking your daily share allowance.': 'Tägliches Freigabelimit wird geprüft.',
    'Daily share limit reached': 'Tägliches Freigabelimit erreicht',
    'Basic includes 5 result-card exports per day. Premium adds unlimited sharing and five extra share-card styles.':
      'Basic enthält 5 Ergebnis-Kartenfreigaben pro Tag. Premium bietet unbegrenztes Teilen und fünf zusätzliche Kartenstile.',
    'Not now': 'Nicht jetzt',
    'View Premium': 'Premium ansehen',
    'Share unavailable': 'Teilen nicht verfügbar',
    'Could not open the share sheet right now. Please try again.':
      'Das Teilen konnte gerade nicht geöffnet werden. Bitte versuche es erneut.',
    'Review request sent': 'Prüfanfrage gesendet',
    'We queued this product for a manual trust check.':
      'Wir haben dieses Produkt für eine manuelle Vertrauensprüfung vorgemerkt.',
    'Could not send request': 'Anfrage konnte nicht gesendet werden',
    'Try again in a moment if this product still looks off.':
      'Versuche es gleich noch einmal, wenn dieses Produkt weiterhin falsch aussieht.',
    'Thanks for the check': 'Danke für die Prüfung',
    'We flagged this product for a closer review.':
      'Wir haben dieses Produkt für eine genauere Prüfung markiert.',
    'We saved your pack confirmation for future trust checks.':
      'Deine Packungsbestätigung wurde für künftige Prüfungen gespeichert.',
    'Could not save that right now': 'Das konnte gerade nicht gespeichert werden',
    'Try again in a moment if this pack still needs a review.':
      'Versuche es gleich noch einmal, wenn diese Packung weiterhin geprüft werden muss.',
    'N/A': 'k. A.',
    'Grade {grade} • {label}': 'Note {grade} • {label}',
    'Shows a short explanation for this ingredient':
      'Zeigt eine kurze Erklärung zu dieser Zutat an',
    'Share result card': 'Ergebnis-Karte teilen',
  },
  en: {},
  es: {
    'High Risk': 'Riesgo alto',
    Caution: 'Precaución',
    Safe: 'Seguro',
    'Needs More Data': 'Necesita más datos',
    'Great Choice': 'Muy buena elección',
    Moderate: 'Moderado',
    'Needs Caution': 'Requiere precaución',
    'Product loaded.': 'Producto cargado.',
    'Good regular pick': 'Buena opción habitual',
    'Okay occasionally': 'Bien ocasionalmente',
    'Not ideal often': 'No ideal con frecuencia',
    'Need better data': 'Necesita mejores datos',
    'Not scored as food': 'No puntuado como alimento',
    'Needs a closer look': 'Necesita una revisión más cercana',
    'Use as a rough guide': 'Úsalo como guía aproximada',
    'Needs more detail': 'Necesita más detalle',
    'Good for regular use': 'Bueno para uso regular',
    'Okay in moderation': 'Bien con moderación',
    'Best kept occasional': 'Mejor solo ocasionalmente',
    'Not ideal for frequent use': 'No ideal para uso frecuente',
    'High confidence': 'Alta confianza',
    'Partial data': 'Datos parciales',
    'Needs review': 'Necesita revisión',
    'No strong matches found for your selected filters.':
      'No se encontraron coincidencias fuertes para tus filtros seleccionados.',
    'No strong matches found for {labels}.':
      'No se encontraron coincidencias fuertes para {labels}.',
    'Quick guide only.': 'Guía rápida solamente.',
    'Premium sharing is unlimited and ad-free.':
      'Compartir con Premium es ilimitado y sin anuncios.',
    '{remaining} of 5 basic share exports left today.':
      'Te quedan {remaining} de 5 compartidos básicos hoy.',
    'Checking your daily share allowance.': 'Comprobando tu límite diario de compartidos.',
    'Daily share limit reached': 'Se alcanzó el límite diario de compartidos',
    'Basic includes 5 result-card exports per day. Premium adds unlimited sharing and five extra share-card styles.':
      'Basic incluye 5 exportaciones de tarjetas de resultado por día. Premium agrega uso compartido ilimitado y cinco estilos extra.',
    'Not now': 'Ahora no',
    'View Premium': 'Ver Premium',
    'Share unavailable': 'No se puede compartir',
    'Could not open the share sheet right now. Please try again.':
      'No se pudo abrir la hoja para compartir ahora mismo. Inténtalo de nuevo.',
    'Review request sent': 'Solicitud de revisión enviada',
    'We queued this product for a manual trust check.':
      'Pusimos este producto en cola para una revisión manual de confianza.',
    'Could not send request': 'No se pudo enviar la solicitud',
    'Try again in a moment if this product still looks off.':
      'Inténtalo de nuevo en un momento si este producto aún parece incorrecto.',
    'Thanks for the check': 'Gracias por la comprobación',
    'We flagged this product for a closer review.':
      'Marcamos este producto para una revisión más detallada.',
    'We saved your pack confirmation for future trust checks.':
      'Guardamos tu confirmación del envase para futuras comprobaciones.',
    'Could not save that right now': 'No se pudo guardar eso ahora mismo',
    'Try again in a moment if this pack still needs a review.':
      'Inténtalo de nuevo en un momento si este envase aún necesita revisión.',
    'N/A': 'N/D',
    'Grade {grade} • {label}': 'Grado {grade} • {label}',
    'Shows a short explanation for this ingredient':
      'Muestra una explicación breve de este ingrediente',
    'Share result card': 'Compartir tarjeta de resultado',
  },
  fr: {
    'High Risk': 'Risque élevé',
    Caution: 'Prudence',
    Safe: 'Sûr',
    'Needs More Data': 'Besoin de plus de données',
    'Great Choice': 'Excellent choix',
    Moderate: 'Modéré',
    'Needs Caution': 'Demande de la prudence',
    'Product loaded.': 'Produit chargé.',
    'Good regular pick': 'Bon choix régulier',
    'Okay occasionally': 'Correct occasionnellement',
    'Not ideal often': 'Pas idéal souvent',
    'Need better data': 'Besoin de meilleures données',
    'Not scored as food': 'Non noté comme aliment',
    'Needs a closer look': 'Nécessite une vérification plus précise',
    'Use as a rough guide': 'À utiliser comme guide approximatif',
    'Needs more detail': 'Besoin de plus de détails',
    'Good for regular use': 'Bon pour un usage régulier',
    'Okay in moderation': 'Correct avec modération',
    'Best kept occasional': 'Mieux vaut occasionnellement',
    'Not ideal for frequent use': 'Pas idéal pour un usage fréquent',
    'High confidence': 'Confiance élevée',
    'Partial data': 'Données partielles',
    'Needs review': 'Doit être vérifié',
    'No strong matches found for your selected filters.':
      'Aucune forte correspondance trouvée pour les filtres sélectionnés.',
    'No strong matches found for {labels}.':
      'Aucune forte correspondance trouvée pour {labels}.',
    'Quick guide only.': 'Guide rapide uniquement.',
    'Premium sharing is unlimited and ad-free.':
      'Le partage Premium est illimité et sans publicité.',
    '{remaining} of 5 basic share exports left today.':
      'Il vous reste {remaining} partages basiques sur 5 aujourd’hui.',
    'Checking your daily share allowance.': 'Vérification de votre quota quotidien de partage.',
    'Daily share limit reached': 'Limite quotidienne de partage atteinte',
    'Basic includes 5 result-card exports per day. Premium adds unlimited sharing and five extra share-card styles.':
      'Basic comprend 5 exportations de cartes de résultat par jour. Premium ajoute un partage illimité et cinq styles supplémentaires.',
    'Not now': 'Pas maintenant',
    'View Premium': 'Voir Premium',
    'Share unavailable': 'Partage indisponible',
    'Could not open the share sheet right now. Please try again.':
      'Impossible d’ouvrir la feuille de partage pour le moment. Réessayez.',
    'Review request sent': 'Demande de vérification envoyée',
    'We queued this product for a manual trust check.':
      'Nous avons mis ce produit en file d’attente pour une vérification manuelle.',
    'Could not send request': 'Impossible d’envoyer la demande',
    'Try again in a moment if this product still looks off.':
      'Réessayez dans un instant si ce produit semble toujours incorrect.',
    'Thanks for the check': 'Merci pour la vérification',
    'We flagged this product for a closer review.':
      'Nous avons signalé ce produit pour une vérification plus approfondie.',
    'We saved your pack confirmation for future trust checks.':
      'Votre confirmation d’emballage a été enregistrée pour de futurs contrôles.',
    'Could not save that right now': 'Impossible d’enregistrer cela pour le moment',
    'Try again in a moment if this pack still needs a review.':
      'Réessayez dans un instant si cet emballage a toujours besoin d’une vérification.',
    'N/A': 'N/D',
    'Grade {grade} • {label}': 'Note {grade} • {label}',
    'Shows a short explanation for this ingredient':
      'Affiche une courte explication pour cet ingrédient',
    'Share result card': 'Partager la carte de résultat',
  },
  hi: {
    'High Risk': 'उच्च जोखिम',
    Caution: 'सावधानी',
    Safe: 'सुरक्षित',
    'Needs More Data': 'और डेटा चाहिए',
    'Great Choice': 'बहुत अच्छा विकल्प',
    Moderate: 'मध्यम',
    'Needs Caution': 'सावधानी जरूरी',
    'Product loaded.': 'उत्पाद लोड हो गया।',
    'Good regular pick': 'नियमित उपयोग के लिए अच्छा विकल्प',
    'Okay occasionally': 'कभी-कभी ठीक है',
    'Not ideal often': 'बार-बार उपयोग के लिए आदर्श नहीं',
    'Need better data': 'बेहतर डेटा चाहिए',
    'Not scored as food': 'भोजन के रूप में स्कोर नहीं किया गया',
    'Needs a closer look': 'और ध्यान से देखने की जरूरत है',
    'Use as a rough guide': 'इसे एक सामान्य मार्गदर्शिका की तरह इस्तेमाल करें',
    'Needs more detail': 'और विवरण चाहिए',
    'Good for regular use': 'नियमित उपयोग के लिए अच्छा',
    'Okay in moderation': 'सीमित मात्रा में ठीक',
    'Best kept occasional': 'कभी-कभार ही बेहतर',
    'Not ideal for frequent use': 'बार-बार उपयोग के लिए सही नहीं',
    'High confidence': 'उच्च भरोसा',
    'Partial data': 'आंशिक डेटा',
    'Needs review': 'समीक्षा जरूरी',
    'No strong matches found for your selected filters.':
      'आपके चुने हुए फ़िल्टर के लिए कोई मजबूत मेल नहीं मिला।',
    'No strong matches found for {labels}.': '{labels} के लिए कोई मजबूत मेल नहीं मिला।',
    'Quick guide only.': 'केवल त्वरित मार्गदर्शिका।',
    'Premium sharing is unlimited and ad-free.': 'प्रीमियम शेयरिंग असीमित और विज्ञापन-मुक्त है।',
    '{remaining} of 5 basic share exports left today.':
      'आज 5 बेसिक शेयर में से {remaining} बचे हैं।',
    'Checking your daily share allowance.': 'आपकी दैनिक शेयर सीमा जाँची जा रही है।',
    'Daily share limit reached': 'दैनिक शेयर सीमा पूरी हो गई',
    'Basic includes 5 result-card exports per day. Premium adds unlimited sharing and five extra share-card styles.':
      'बेसिक में रोज़ 5 रिज़ल्ट-कार्ड शेयर शामिल हैं। प्रीमियम में असीमित शेयरिंग और पाँच अतिरिक्त स्टाइल मिलते हैं।',
    'Not now': 'अभी नहीं',
    'View Premium': 'प्रीमियम देखें',
    'Share unavailable': 'शेयर उपलब्ध नहीं',
    'Could not open the share sheet right now. Please try again.':
      'अभी शेयर शीट नहीं खुल सकी। कृपया फिर से कोशिश करें।',
    'Review request sent': 'समीक्षा अनुरोध भेज दिया गया',
    'We queued this product for a manual trust check.':
      'हमने इस उत्पाद को मैनुअल ट्रस्ट जाँच के लिए कतार में डाल दिया है।',
    'Could not send request': 'अनुरोध भेजा नहीं जा सका',
    'Try again in a moment if this product still looks off.':
      'अगर यह उत्पाद अभी भी गलत लग रहा है तो थोड़ी देर में फिर कोशिश करें।',
    'Thanks for the check': 'जाँच के लिए धन्यवाद',
    'We flagged this product for a closer review.':
      'हमने इस उत्पाद को अधिक गहन समीक्षा के लिए चिह्नित किया है।',
    'We saved your pack confirmation for future trust checks.':
      'भविष्य की ट्रस्ट जाँचों के लिए आपकी पैक पुष्टि सहेज ली गई है।',
    'Could not save that right now': 'अभी उसे सहेजा नहीं जा सका',
    'Try again in a moment if this pack still needs a review.':
      'अगर इस पैक की अभी भी समीक्षा चाहिए तो थोड़ी देर में फिर कोशिश करें।',
    'N/A': 'उपलब्ध नहीं',
    'Grade {grade} • {label}': 'ग्रेड {grade} • {label}',
    'Shows a short explanation for this ingredient': 'इस सामग्री के लिए छोटा सा विवरण दिखाता है',
    'Share result card': 'रिज़ल्ट कार्ड शेयर करें',
  },
  id: {
    'High Risk': 'Risiko tinggi',
    Caution: 'Perhatian',
    Safe: 'Aman',
    'Needs More Data': 'Butuh lebih banyak data',
    'Great Choice': 'Pilihan bagus',
    Moderate: 'Sedang',
    'Needs Caution': 'Perlu hati-hati',
    'Product loaded.': 'Produk dimuat.',
    'Good regular pick': 'Pilihan bagus untuk rutin',
    'Okay occasionally': 'Oke sesekali',
    'Not ideal often': 'Kurang ideal jika sering',
    'Need better data': 'Butuh data yang lebih baik',
    'Not scored as food': 'Tidak dinilai sebagai makanan',
    'Needs a closer look': 'Perlu dilihat lebih dekat',
    'Use as a rough guide': 'Gunakan sebagai panduan kasar',
    'Needs more detail': 'Butuh detail lebih banyak',
    'Good for regular use': 'Bagus untuk penggunaan rutin',
    'Okay in moderation': 'Oke jika secukupnya',
    'Best kept occasional': 'Sebaiknya sesekali saja',
    'Not ideal for frequent use': 'Kurang ideal untuk sering digunakan',
    'High confidence': 'Keyakinan tinggi',
    'Partial data': 'Data parsial',
    'Needs review': 'Perlu ditinjau',
    'No strong matches found for your selected filters.':
      'Tidak ada kecocokan kuat untuk filter yang dipilih.',
    'No strong matches found for {labels}.':
      'Tidak ada kecocokan kuat untuk {labels}.',
    'Quick guide only.': 'Panduan singkat saja.',
    'Premium sharing is unlimited and ad-free.': 'Berbagi Premium tidak terbatas dan bebas iklan.',
    '{remaining} of 5 basic share exports left today.':
      '{remaining} dari 5 jatah berbagi dasar tersisa hari ini.',
    'Checking your daily share allowance.': 'Memeriksa batas berbagi harian Anda.',
    'Daily share limit reached': 'Batas berbagi harian tercapai',
    'Basic includes 5 result-card exports per day. Premium adds unlimited sharing and five extra share-card styles.':
      'Basic mencakup 5 ekspor kartu hasil per hari. Premium menambahkan berbagi tanpa batas dan lima gaya kartu tambahan.',
    'Not now': 'Jangan sekarang',
    'View Premium': 'Lihat Premium',
    'Share unavailable': 'Berbagi tidak tersedia',
    'Could not open the share sheet right now. Please try again.':
      'Lembar berbagi tidak bisa dibuka sekarang. Coba lagi.',
    'Review request sent': 'Permintaan peninjauan dikirim',
    'We queued this product for a manual trust check.':
      'Kami memasukkan produk ini ke antrean untuk pemeriksaan kepercayaan manual.',
    'Could not send request': 'Permintaan tidak dapat dikirim',
    'Try again in a moment if this product still looks off.':
      'Coba lagi sebentar lagi jika produk ini masih terlihat bermasalah.',
    'Thanks for the check': 'Terima kasih sudah memeriksa',
    'We flagged this product for a closer review.':
      'Kami menandai produk ini untuk peninjauan lebih dekat.',
    'We saved your pack confirmation for future trust checks.':
      'Konfirmasi kemasan Anda disimpan untuk pemeriksaan berikutnya.',
    'Could not save that right now': 'Tidak bisa menyimpan itu sekarang',
    'Try again in a moment if this pack still needs a review.':
      'Coba lagi sebentar lagi jika kemasan ini masih perlu ditinjau.',
    'N/A': 'N/A',
    'Grade {grade} • {label}': 'Nilai {grade} • {label}',
    'Shows a short explanation for this ingredient':
      'Menampilkan penjelasan singkat untuk bahan ini',
    'Share result card': 'Bagikan kartu hasil',
  },
  ja: {
    'High Risk': '高リスク',
    Caution: '注意',
    Safe: '安全',
    'Needs More Data': 'さらにデータが必要',
    'Great Choice': 'とても良い選択',
    Moderate: '中程度',
    'Needs Caution': '注意が必要',
    'Product loaded.': '商品を読み込みました。',
    'Good regular pick': '普段使いに良い選択',
    'Okay occasionally': 'たまになら可',
    'Not ideal often': '頻繁にはおすすめしません',
    'Need better data': 'より良いデータが必要',
    'Not scored as food': '食品として採点されていません',
    'Needs a closer look': 'もう少し詳しく見る必要があります',
    'Use as a rough guide': '目安として使ってください',
    'Needs more detail': 'さらに詳しい情報が必要',
    'Good for regular use': '日常的に使いやすい',
    'Okay in moderation': '適度なら問題なし',
    'Best kept occasional': 'たまに使うのがよい',
    'Not ideal for frequent use': '頻繁な使用には向きません',
    'High confidence': '高い信頼度',
    'Partial data': '一部データのみ',
    'Needs review': '要確認',
    'No strong matches found for your selected filters.':
      '選択したフィルターに強い一致は見つかりませんでした。',
    'No strong matches found for {labels}.':
      '{labels} に強い一致は見つかりませんでした。',
    'Quick guide only.': '簡易ガイドのみです。',
    'Premium sharing is unlimited and ad-free.': 'Premium 共有は無制限で広告もありません。',
    '{remaining} of 5 basic share exports left today.':
      '今日は基本共有 5 回のうち残り {remaining} 回です。',
    'Checking your daily share allowance.': '1日の共有上限を確認しています。',
    'Daily share limit reached': '1日の共有上限に達しました',
    'Basic includes 5 result-card exports per day. Premium adds unlimited sharing and five extra share-card styles.':
      'Basic では1日5回まで結果カードを共有できます。Premium では無制限共有と追加スタイル5種が利用できます。',
    'Not now': '今はしない',
    'View Premium': 'Premiumを見る',
    'Share unavailable': '共有できません',
    'Could not open the share sheet right now. Please try again.':
      '今は共有シートを開けませんでした。もう一度お試しください。',
    'Review request sent': '確認依頼を送信しました',
    'We queued this product for a manual trust check.':
      'この商品を手動の信頼チェック待ちに追加しました。',
    'Could not send request': '依頼を送信できませんでした',
    'Try again in a moment if this product still looks off.':
      'この商品がまだおかしく見える場合は、少ししてからもう一度お試しください。',
    'Thanks for the check': '確認ありがとうございます',
    'We flagged this product for a closer review.':
      'この商品をより詳しい確認の対象として記録しました。',
    'We saved your pack confirmation for future trust checks.':
      '今後の信頼チェック用にパック確認を保存しました。',
    'Could not save that right now': '今は保存できませんでした',
    'Try again in a moment if this pack still needs a review.':
      'このパックにまだ確認が必要なら、少ししてからもう一度お試しください。',
    'N/A': '該当なし',
    'Grade {grade} • {label}': 'グレード {grade} • {label}',
    'Shows a short explanation for this ingredient': 'この原材料の短い説明を表示します',
    'Share result card': '結果カードを共有',
  },
  ko: {
    'High Risk': '높은 위험',
    Caution: '주의',
    Safe: '안전',
    'Needs More Data': '더 많은 데이터 필요',
    'Great Choice': '아주 좋은 선택',
    Moderate: '보통',
    'Needs Caution': '주의 필요',
    'Product loaded.': '제품을 불러왔습니다.',
    'Good regular pick': '일상적으로 고르기 좋은 선택',
    'Okay occasionally': '가끔은 괜찮음',
    'Not ideal often': '자주 쓰기엔 적절하지 않음',
    'Need better data': '더 나은 데이터 필요',
    'Not scored as food': '식품으로 점수화되지 않음',
    'Needs a closer look': '더 자세히 볼 필요가 있음',
    'Use as a rough guide': '대략적인 가이드로 사용하세요',
    'Needs more detail': '더 자세한 정보 필요',
    'Good for regular use': '일상적으로 사용하기 좋음',
    'Okay in moderation': '적당히는 괜찮음',
    'Best kept occasional': '가끔만 사용하는 편이 좋음',
    'Not ideal for frequent use': '자주 사용하기엔 적절하지 않음',
    'High confidence': '높은 신뢰도',
    'Partial data': '부분 데이터',
    'Needs review': '검토 필요',
    'No strong matches found for your selected filters.':
      '선택한 필터에 대한 강한 일치 항목이 없습니다.',
    'No strong matches found for {labels}.':
      '{labels} 에 대한 강한 일치 항목이 없습니다.',
    'Quick guide only.': '빠른 가이드 전용입니다.',
    'Premium sharing is unlimited and ad-free.': '프리미엄 공유는 무제한이며 광고가 없습니다.',
    '{remaining} of 5 basic share exports left today.':
      '오늘 기본 공유 5회 중 {remaining}회가 남았습니다.',
    'Checking your daily share allowance.': '일일 공유 한도를 확인하는 중입니다.',
    'Daily share limit reached': '일일 공유 한도에 도달했습니다',
    'Basic includes 5 result-card exports per day. Premium adds unlimited sharing and five extra share-card styles.':
      'Basic에는 하루 5회의 결과 카드 공유가 포함됩니다. Premium은 무제한 공유와 추가 스타일 5가지를 제공합니다.',
    'Not now': '지금은 아님',
    'View Premium': '프리미엄 보기',
    'Share unavailable': '공유 불가',
    'Could not open the share sheet right now. Please try again.':
      '지금은 공유 시트를 열 수 없습니다. 다시 시도해 주세요.',
    'Review request sent': '검토 요청을 보냈습니다',
    'We queued this product for a manual trust check.':
      '이 제품을 수동 신뢰 확인 대기열에 추가했습니다.',
    'Could not send request': '요청을 보낼 수 없습니다',
    'Try again in a moment if this product still looks off.':
      '이 제품이 계속 이상해 보이면 잠시 후 다시 시도해 주세요.',
    'Thanks for the check': '확인해 주셔서 감사합니다',
    'We flagged this product for a closer review.':
      '이 제품을 더 자세히 검토하도록 표시했습니다.',
    'We saved your pack confirmation for future trust checks.':
      '향후 신뢰 확인을 위해 포장 확인 내용을 저장했습니다.',
    'Could not save that right now': '지금은 저장할 수 없습니다',
    'Try again in a moment if this pack still needs a review.':
      '이 포장이 여전히 검토가 필요하면 잠시 후 다시 시도해 주세요.',
    'N/A': '해당 없음',
    'Grade {grade} • {label}': '등급 {grade} • {label}',
    'Shows a short explanation for this ingredient': '이 성분에 대한 짧은 설명을 보여줍니다',
    'Share result card': '결과 카드 공유',
  },
  pt: {
    'High Risk': 'Alto risco',
    Caution: 'Cuidado',
    Safe: 'Seguro',
    'Needs More Data': 'Precisa de mais dados',
    'Great Choice': 'Ótima escolha',
    Moderate: 'Moderado',
    'Needs Caution': 'Precisa de cuidado',
    'Product loaded.': 'Produto carregado.',
    'Good regular pick': 'Boa escolha para o dia a dia',
    'Okay occasionally': 'Ok ocasionalmente',
    'Not ideal often': 'Não é ideal com frequência',
    'Need better data': 'Precisa de dados melhores',
    'Not scored as food': 'Não pontuado como alimento',
    'Needs a closer look': 'Precisa de uma análise mais próxima',
    'Use as a rough guide': 'Use como orientação geral',
    'Needs more detail': 'Precisa de mais detalhes',
    'Good for regular use': 'Bom para uso regular',
    'Okay in moderation': 'Ok com moderação',
    'Best kept occasional': 'Melhor manter ocasional',
    'Not ideal for frequent use': 'Não ideal para uso frequente',
    'High confidence': 'Alta confiança',
    'Partial data': 'Dados parciais',
    'Needs review': 'Precisa de revisão',
    'No strong matches found for your selected filters.':
      'Nenhuma correspondência forte foi encontrada para os filtros selecionados.',
    'No strong matches found for {labels}.':
      'Nenhuma correspondência forte foi encontrada para {labels}.',
    'Quick guide only.': 'Apenas um guia rápido.',
    'Premium sharing is unlimited and ad-free.':
      'O compartilhamento Premium é ilimitado e sem anúncios.',
    '{remaining} of 5 basic share exports left today.':
      'Restam {remaining} de 5 compartilhamentos básicos hoje.',
    'Checking your daily share allowance.': 'Verificando seu limite diário de compartilhamento.',
    'Daily share limit reached': 'Limite diário de compartilhamento atingido',
    'Basic includes 5 result-card exports per day. Premium adds unlimited sharing and five extra share-card styles.':
      'O Basic inclui 5 exportações de cartão de resultado por dia. O Premium adiciona compartilhamento ilimitado e cinco estilos extras.',
    'Not now': 'Agora não',
    'View Premium': 'Ver Premium',
    'Share unavailable': 'Compartilhamento indisponível',
    'Could not open the share sheet right now. Please try again.':
      'Não foi possível abrir a folha de compartilhamento agora. Tente novamente.',
    'Review request sent': 'Solicitação de revisão enviada',
    'We queued this product for a manual trust check.':
      'Colocamos este produto na fila para uma verificação manual de confiança.',
    'Could not send request': 'Não foi possível enviar a solicitação',
    'Try again in a moment if this product still looks off.':
      'Tente novamente em instantes se este produto ainda parecer incorreto.',
    'Thanks for the check': 'Obrigado pela verificação',
    'We flagged this product for a closer review.':
      'Marcamos este produto para uma revisão mais detalhada.',
    'We saved your pack confirmation for future trust checks.':
      'Salvamos sua confirmação da embalagem para futuras verificações.',
    'Could not save that right now': 'Não foi possível salvar isso agora',
    'Try again in a moment if this pack still needs a review.':
      'Tente novamente em instantes se esta embalagem ainda precisar de revisão.',
    'N/A': 'N/D',
    'Grade {grade} • {label}': 'Nota {grade} • {label}',
    'Shows a short explanation for this ingredient':
      'Mostra uma explicação curta para este ingrediente',
    'Share result card': 'Compartilhar cartão de resultado',
  },
  ru: {
    'High Risk': 'Высокий риск',
    Caution: 'Осторожно',
    Safe: 'Безопасно',
    'Needs More Data': 'Нужно больше данных',
    'Great Choice': 'Отличный выбор',
    Moderate: 'Умеренно',
    'Needs Caution': 'Нужна осторожность',
    'Product loaded.': 'Продукт загружен.',
    'Good regular pick': 'Хороший выбор для регулярного использования',
    'Okay occasionally': 'Иногда допустимо',
    'Not ideal often': 'Не лучший вариант для частого использования',
    'Need better data': 'Нужны более точные данные',
    'Not scored as food': 'Не оценено как еда',
    'Needs a closer look': 'Нужно рассмотреть внимательнее',
    'Use as a rough guide': 'Используйте как приблизительный ориентир',
    'Needs more detail': 'Нужно больше деталей',
    'Good for regular use': 'Подходит для регулярного использования',
    'Okay in moderation': 'Подходит в умеренном количестве',
    'Best kept occasional': 'Лучше оставить для редкого использования',
    'Not ideal for frequent use': 'Не подходит для частого использования',
    'High confidence': 'Высокая уверенность',
    'Partial data': 'Частичные данные',
    'Needs review': 'Нужно проверить',
    'No strong matches found for your selected filters.':
      'Для выбранных фильтров не найдено сильных совпадений.',
    'No strong matches found for {labels}.':
      'Для {labels} не найдено сильных совпадений.',
    'Quick guide only.': 'Только краткая подсказка.',
    'Premium sharing is unlimited and ad-free.':
      'Премиум-обмен не ограничен и без рекламы.',
    '{remaining} of 5 basic share exports left today.':
      'Сегодня осталось {remaining} из 5 базовых отправок.',
    'Checking your daily share allowance.': 'Проверяем ваш дневной лимит отправки.',
    'Daily share limit reached': 'Дневной лимит отправки достигнут',
    'Basic includes 5 result-card exports per day. Premium adds unlimited sharing and five extra share-card styles.':
      'Basic включает 5 отправок карточки результата в день. Premium добавляет безлимитную отправку и ещё пять стилей.',
    'Not now': 'Не сейчас',
    'View Premium': 'Открыть Premium',
    'Share unavailable': 'Поделиться нельзя',
    'Could not open the share sheet right now. Please try again.':
      'Не удалось открыть меню отправки. Попробуйте ещё раз.',
    'Review request sent': 'Запрос на проверку отправлен',
    'We queued this product for a manual trust check.':
      'Мы поставили этот продукт в очередь на ручную проверку.',
    'Could not send request': 'Не удалось отправить запрос',
    'Try again in a moment if this product still looks off.':
      'Попробуйте ещё раз чуть позже, если продукт всё ещё выглядит неверно.',
    'Thanks for the check': 'Спасибо за проверку',
    'We flagged this product for a closer review.':
      'Мы пометили этот продукт для более внимательной проверки.',
    'We saved your pack confirmation for future trust checks.':
      'Мы сохранили ваше подтверждение упаковки для будущих проверок.',
    'Could not save that right now': 'Сейчас не удалось сохранить',
    'Try again in a moment if this pack still needs a review.':
      'Попробуйте ещё раз чуть позже, если эта упаковка всё ещё требует проверки.',
    'N/A': 'Н/Д',
    'Grade {grade} • {label}': 'Оценка {grade} • {label}',
    'Shows a short explanation for this ingredient':
      'Показывает короткое объяснение для этого ингредиента',
    'Share result card': 'Поделиться карточкой результата',
  },
  'zh-CN': {
    'High Risk': '高风险',
    Caution: '注意',
    Safe: '安全',
    'Needs More Data': '需要更多数据',
    'Great Choice': '很好的选择',
    Moderate: '中等',
    'Needs Caution': '需要谨慎',
    'Product loaded.': '产品已加载。',
    'Good regular pick': '适合日常选择',
    'Okay occasionally': '偶尔可以',
    'Not ideal often': '不适合经常使用',
    'Need better data': '需要更好的数据',
    'Not scored as food': '未按食品评分',
    'Needs a closer look': '需要进一步查看',
    'Use as a rough guide': '可作为大致参考',
    'Needs more detail': '需要更多细节',
    'Good for regular use': '适合经常使用',
    'Okay in moderation': '适量可以',
    'Best kept occasional': '最好偶尔使用',
    'Not ideal for frequent use': '不适合频繁使用',
    'High confidence': '高置信度',
    'Partial data': '部分数据',
    'Needs review': '需要复核',
    'No strong matches found for your selected filters.':
      '未找到与你所选筛选条件强匹配的结果。',
    'No strong matches found for {labels}.':
      '未找到与 {labels} 强匹配的结果。',
    'Quick guide only.': '仅供快速参考。',
    'Premium sharing is unlimited and ad-free.': 'Premium 分享不限次数且无广告。',
    '{remaining} of 5 basic share exports left today.':
      '今天 5 次基础分享中还剩 {remaining} 次。',
    'Checking your daily share allowance.': '正在检查你的每日分享额度。',
    'Daily share limit reached': '已达到每日分享上限',
    'Basic includes 5 result-card exports per day. Premium adds unlimited sharing and five extra share-card styles.':
      'Basic 每天包含 5 次结果卡分享。Premium 增加无限分享和 5 种额外样式。',
    'Not now': '暂时不用',
    'View Premium': '查看 Premium',
    'Share unavailable': '无法分享',
    'Could not open the share sheet right now. Please try again.':
      '当前无法打开分享面板，请稍后再试。',
    'Review request sent': '审核请求已发送',
    'We queued this product for a manual trust check.':
      '我们已将该产品加入人工可信度检查队列。',
    'Could not send request': '无法发送请求',
    'Try again in a moment if this product still looks off.':
      '如果这个产品看起来仍然不对，请稍后再试。',
    'Thanks for the check': '感谢你的确认',
    'We flagged this product for a closer review.':
      '我们已将该产品标记为需要进一步审核。',
    'We saved your pack confirmation for future trust checks.':
      '我们已保存你的包装确认，用于之后的可信度检查。',
    'Could not save that right now': '现在无法保存',
    'Try again in a moment if this pack still needs a review.':
      '如果这款包装仍需要审核，请稍后再试。',
    'N/A': '暂无',
    'Grade {grade} • {label}': '等级 {grade} • {label}',
    'Shows a short explanation for this ingredient': '显示该成分的简短说明',
    'Share result card': '分享结果卡片',
  },
};

export default RESULT_SCREEN_TRANSLATION_SWEEP;
