# Akıllı Depo Yönetimi - Proje Özeti ve Teknolojik Kararlar

Bu belge, Akıllı Depo Yönetimi projesinde istenen zorunlu kuralların neden istendiğini, bizim projeye kendi inisiyatifimizle kattığımız ekstra özelliklerin amacını ve bu süreçte kullanılan teknolojilerin ne işe yaradığını açıklamaktadır. Projenin genel vizyonunu ve mimari kararlarını tek bir noktada toplar.

---

## 1. Test Dökümanında İstenen Özellikler ve Nedenleri

Geliştirici testinde zorunlu kılınan bazı özellikler ve bunların sektörel açıdan neden istendiğinin analizi:

- **Multi-Tenant (CompanyId) İzolasyonu:**
  - *Neden İstendi?* Modern SaaS (Software as a Service) uygulamalarında birden çok şirketin tek bir veritabanını ortak kullanması, ancak kimsenin başkasının verisini görmemesi gerekir. `CompanyId` filtresi, verilerin birbirine karışmamasını ve sistemin yatayda kolayca ölçeklenebilmesini (her şirkete ayrı uygulama kurmak yerine tek uygulama) sağlar.
- **Soft Delete (`IsDeleted`):**
  - *Neden İstendi?* Veritabanından bir kaydın kalıcı olarak (Hard Delete / `DELETE` SQL) silinmesi veri kaybına, istatistiklerin bozulmasına ve geçmiş hareket (log) bütünlüğünün zedelenmesine yol açar. Soft delete, verinin sadece görünmez olmasını sağlayarak hem raporlamaların doğru çalışmasını hem de gerektiğinde verinin kurtarılabilmesini hedefler.
- **EntityState.Modified ile Güncelleme:**
  - *Neden İstendi?* Entity Framework'te bazen veriyi sadece çekip değerlerini değiştirip `SaveChanges` demek, (özellikle `AsNoTracking` kullanılan senaryolarda veya Entity koptuğunda) veritabanına yansımaz. `State = EntityState.Modified` demek, EF Core'a "Bu nesne kesinlikle değişti, gidip SQL tarafında `UPDATE` sorgusu çalıştır" talimatını garantili bir şekilde verir.
- **Server-Side Pagination (Sunucu Taraflı Sayfalama):**
  - *Neden İstendi?* Depoda 1 milyon ürün olduğunda hepsini birden Client'a (Tarayıcıya) göndermek hem sunucu belleğini çökertir hem ağı kilitler hem de tarayıcıyı dondurur. Sadece o sayfada gösterilecek kadar (örn. 25 kayıt) verinin veritabanından `SKIP` ve `TAKE` ile çekilmesi performans için zorunludur.
- **PUT ve DELETE HTTP Metotlarının Yasaklanması:**
  - *Neden İstendi?* Birçok eski tip kurumsal firewall (güvenlik duvarı), Load Balancer veya proxy cihazları sadece `GET` ve `POST` metotlarına izin verecek şekilde konfigüre edilmiştir. Mimariyi her türlü donanımda risksiz çalışır kılmak için güncellemeler ve silmeler `POST` ile yapılmıştır.

---

## 2. Bizim Eklediğimiz Ekstra Özellikler ve Nedenleri

Test sadece 3 adımlı bir ürün yönetim süreci (Ekle, Depoya Koy, Depodan Al) istemişken, tasarımı özgün yapma inisiyatifimizi kullanarak aşağıdaki değerleri ekledik:

- **Gelişmiş Depo Mimarisi (Raf / Zone Sistemi):**
  - *Neden Ekledik?* Gerçek bir depoda ürünler sadece "içeride" veya "dışarıda" olmaz; belli bir rafta/bölgede olurlar. Bu yüzden ürünlerin nerede olduğunu takip etmek ve transfer (raftan rafa taşıma) yapmak için `Zones` konseptini sisteme dâhil ettik.
- **Stok Hareketleri ve İşlem Geçmişi (History):**
  - *Neden Ekledik?* Bir ürünün stoğu azaldığında veya arttığında bunu kimin, ne zaman ve hangi rafa yaptığını loglamak depo yönetiminin kalbidir. Böylece kayıplar engellenir, süreçler şeffaflaşır.
- **Rol Bazlı Yetkilendirme (RBAC):**
  - *Neden Ekledik?* Depo sistemlerinde hiyerarşi şarttır. Bir Satış Danışmanı sadece ürünleri ve stokları (ne kadar kaldığını) görebilmeli, yeni ürün silememelidir. Mağaza Müdürü ise bunlara ek olarak personel ekleyebilmeli/silebilmelidir. Gerçek dünyayı simüle etmek için bu kurguyu yarattık.
- **Kritik Stok Uyarı Sistemi (Smart Alerts):**
  - *Neden Ekledik?* Kullanıcının stoğu 10'un altına düşen ürünleri fark edememesi şirket için satış kaybıdır. Üst barda (Header) veya Dashboard'da bu uyarıları vererek sistemi proaktif hale getirdik.
- **Modern ve Premium Arayüz (Glassmorphism & Neon Hover):**
  - *Neden Ekledik?* İstenen "wow" etkisini (özgün tasarım) verebilmek için sıradan düz beyaz/gri paneller yerine, arka planın bulanık olduğu (backdrop-blur), derinlik hissiyatı yüksek, lüks ve kullanıcıyı yormayan bir tasarım felsefesi seçtik.

---

## 3. Ekstra Kullanılan Teknolojiler, Amaçları ve İşlevleri

Sistemi daha güçlü ve performanslı kılmak için standartların dışında bazı teknoloji ve paketler kullandık:

- **Recharts:**
  - *Ne İşe Yarar?* Dashboard'da verileri çizgi, bar veya pasta grafikler olarak göstermeye yarayan React tabanlı bir kütüphanedir.
  - *Neden Kullanıldı?* Günlük depo giriş-çıkış trendlerini (Sparklines) kartların arkasında saydam bir grafik olarak göstermek, kullanıcıya bir bakışta "artan/azalan" eğilimi sunmak için eklendi.
- **React-CountUp:**
  - *Ne İşe Yarar?* Sayıların doğrudan ekranda belirmesi yerine (örn: 0'dan 1500'e) akıcı bir animasyonla sayarak gelmesini sağlar.
  - *Neden Kullanıldı?* Arayüzün donuk bir sayfa olmadığını, canlı bir yönetim paneli olduğunu hissettirerek "UX (Kullanıcı Deneyimi)" kalitesini artırmak için.
- **@mui/x-data-grid (MUI DataGrid):**
  - *Ne İşe Yarar?* Satır/sütun tabanlı karmaşık tabloları sıralama, filtreleme, sayfalama ve hızlı render yapısıyla sunan çok gelişmiş bir tablo motorudur.
  - *Neden Kullanıldı?* Normal HTML `<table>` etiketleri server-side pagination ve hızlı arama özelliklerinde yetersiz kalır. DataGrid ile ürünleri yönetmek çok daha profesyonel hale getirildi.
- **Axios & Interceptors:**
  - *Ne İşe Yarar?* Tarayıcı üzerinden Backend'e asenkron istek (HTTP request) atılmasını sağlayan standart kütüphanedir.
  - *Neden Kullanıldı?* Backend'in `PascalCase` isteyip Frontend'in `camelCase` kullandığı naming-convention çatışmasını ortadan kaldırmak için araya giren (interceptor) bir katman yazarak otomatik dönüşüm yapması sağlandı. Ayrıca JWT Yetkilendirme token'ını her isteğin başlığına otomatik eklemek için kullanıldı.

---

## 4. Genel Proje Özeti

"Akıllı Depo Yönetimi", sadece bir "veri ekle/çıkar" projesi olmaktan çıkıp; şirket (tenant) izolasyonu sağlayan, tüm süreçleri EF Core ile performansı gözeterek (Server-side pagination, EF migrations) işleyen katı kurallı bir sistemdir. Backend tarafında güvenliğin ön planda olduğu, mimari tasarım desenlerinin (Repository/Manager patterns) kullanıldığı bir iskelet üzerine inşa edilmiştir. 

Frontend tarafında ise kullanıcının sıkıcı bir depo yazılımı yerine adeta geleceğe dönük, pürüzsüz, bol animasyonlu ve "Kritik Stok Uyarısı", "Raf Önerisi", "Grafik Trendleri" gibi akıllı asistan yetenekleriyle desteklendiği bir yönetim portalı tasarlanmıştır. Tüm süreçler, testin istediği bütün kurallara %100 uyumlu kalınarak şekillendirilmiştir.
