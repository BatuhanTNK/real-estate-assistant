# İlan Asistanı — Tasarım

[Figma tasarım dosyası](https://www.figma.com/design/tr0wKoHDlM1kqbA4RerOXM)

## Görsel yön
Antrasit zemin, adaçayı yeşili vurgular, Inter arayüz yazısı ve Lora editoryal başlıklar.
Renkler ve form bileşenleri globals.css üzerinden paylaşılır. Ana sayfa düzeni landing.module.css içinde kapsamlanır.
Fontlar public/fonts içinde lisanslarıyla birlikte yerel sunulur; harici font isteği gerekmez.

## Figma
Masaüstü (1440 px) ve mobil (390 px) ana sayfalar düzenlenebilir katmanlardan oluşur.
Marka renkleri değişkenlere bağlıdır; logo, birincil eylem, adım ve fiyat kartları yeniden kullanılabilir bileşenlerdir.

## Uygulanan ekranlar
- Ana sayfa: ürün örneği, üç ton seçimi, çalışan kopyalama, kullanım adımları, Instagram tanıtımı, fiyat planları.
- Ortak logo, üst gezinme, mobil menü ve alt bilgi.
- Panelde masaüstü yan gezinme ve mobil yatay gezinme.
- Giriş, fiyatlandırma ve diğer mevcut ekranlarda ortak marka paleti; daha rahat düğme ve alan boyutları.

## Doğrulama
Üretim derlemesi, TypeScript ve değiştirilen dosyaların ESLint kontrolü geçti.
Tarayıcıda 320, 390, 768, 1024 ve 1440 px genişliklerinde yatay taşma kontrol edildi.
Ton seçimi, pano kopyalama, mobil gezinme, fiyatlandırma, giriş ve yasal sayfalar doğrulandı.
Oturum gerektiren panel ekranları gerçek kullanıcı hesabıyla görsel olarak doğrulanmadı.
