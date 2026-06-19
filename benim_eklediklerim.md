# Ekstra Katkılarım ve Beni Öne Çıkaracak Detaylar

Bu döküman, mülakatta veya kod incelemesi (code review) sırasında projede yaptığım **ekstra işleri** ve **mimari kararlarımı** anlatmak için hazırlanmıştır.

---

## 1. JWT Authentication ve Rol Bazlı Yetkilendirme (Role-Based Authorization)
**PDF'te istenen:** Sadece `CompanyId` ile multi-tenant ayrımı yapılması.
**Benim eklediğim:** Sisteme tam teşekküllü bir giriş (Login) ekranı, JWT token üretimi ve `[Authorize(Roles = "DepoGorevlisi")]` gibi Controller seviyesinde rol kısıtlamaları ekledim.
**"Neden böyle kullandın?" denirse:**
> *"PDF sadece CompanyId ayrımı istemişti ama gerçek dünya senaryolarında bir deponun güvenliği sadece firma ID'si ile sağlanamaz. Depo görevlisi ile mağaza müdürünün yetkilerinin ayrılması gerektiğini düşündüğüm için JWT tabanlı, güvenli ve gerçekçi bir altyapı kurguladım."*

## 2. Axios Interceptors ile Otomatik Case Dönüşümü
**PDF'te istenen:** Backend PascalCase, Frontend camelCase kullanacak. Veriler gönderilirken ve alınırken dönüştürülecek.
**Benim eklediğim:** Her React component'i içinde `data.CompanyId = d.companyId` gibi manuel çeviriler (mapping) yapmak yerine, `axiosClient.ts` içerisine **Request ve Response Interceptor'ları** yazdım.
**"Neden böyle kullandın?" denirse:**
> *"Frontend tarafında her API çağrısında manuel mapping yapmak kod tekrarına (boilerplate) ve çok fazla hata riskine yol açar. Axios interceptor'ları ile bu işi merkezi bir middleware gibi ele aldım. Component'lerim (UI) sadece camelCase biliyor, Backend sadece PascalCase biliyor; aradaki köprüyü interceptor şeffaf bir şekilde kuruyor. Bu, Clean Code prensiplerine çok daha uygun."*

## 3. IDbContextTransaction ile Veri Bütünlüğü (Data Integrity)
**PDF'te istenen:** Depoya giriş ve çıkış yapılabilsin.
**Benim eklediğim:** `InventoryMovementManager` içerisinde Stok Giriş, Çıkış ve Transfer işlemlerini `_context.Database.BeginTransactionAsync()` ile sarmaladım. Ayrıca kapasite ve eksi stok kontrolleri ekledim.
**"Neden böyle kullandın?" denirse:**
> *"Depo hareketleri kritik finansal verilerdir. Veritabanına `InventoryMovement` geçmişini yazarken, ürünün `TotalStock` değerini güncelliyoruz. Eğer hareket kaydı atıldıktan sonra stok güncellenirken bir hata çıkarsa veriler tutarsız olur. Bu yüzden Transaction kullandım (Ya hep ya hiç prensibi). Ayrıca fiziksel bir deponun kapasitesi sonsuz olamaz, bu yüzden Zone (Raf) kapasitesi ve eksi stoğa düşmeyi engelleyen iş kuralları ekleyerek senaryoyu gerçek hayata yaklaştırdım."*

## 4. Modern Glassmorphism UI ve Mikro-Animasyonlar
**PDF'te istenen:** Material-UI (MUI) kullanılması ve özgün tasarım.
**Benim eklediğim:** Standart, sıkıcı kurumsal MUI teması yerine; modern web trendlerine uygun karanlık tema (Dark Mode), Glassmorphism (arkası bulanık/cam efektli paneller) ve sayılar artarken animasyon yapan `React-CountUp` entegrasyonları yaptım.
**"Neden böyle kullandın?" denirse:**
> *"Test dökümanında özgün bir tasarım istendiği özellikle vurgulanmıştı. Kullanıcı deneyimini (UX) üst seviyeye çıkarmak ve sadece bir 'backend developer' olmadığımı, frontend trendlerine (Glassmorphism, Recharts ile Sparkline grafikleri) hakim olduğumu göstermek istedim. Gösterge panellerinin (Dashboard) interaktif ve şık olması projeye her zaman değer katar."*

## 5. Global Exception ve Güvenlik (403/404) Yönetiminin Kusursuzlaştırılması
**PDF'te istenen:** CompanyId uyuşmazlığında 403 (Forbid) dönülmesi.
**Benim eklediğim:** Manager ve Repository katmanları arasına `ExistsAsync` gibi akıllı kontroller koyarak; ürün gerçekten silinmişse 404 (NotFound), ürün var ama başka firmaya aitse 403 (Forbid) dönecek şekilde mimariyi katılaştırdım.
**"Neden böyle kullandın?" denirse:**
> *"Sadece 'kayıt gelmediyse 403 fırlat' demek, silinmiş (404) bir kayıt arandığında da 403 dönmesine sebep oluyordu, bu da yanıltıcı bir HTTP durumu yaratır. Güvenlik ve API dizayn standartları gereği; kaynağın var olup olmadığını ve yetkiyi ayrı ayrı kontrol edip doğru HTTP StatusCode'u dönmeyi tercih ettim."*

## 6. Jenerik Repository Mantığına Hazır Yapı
**Benim eklediğim:** Server-Side pagination yaparken `GetPagedBaseQueryAsync` adında ortak bir `IQueryable` döndüren metot yazıp, Manager içinde filtrelemeleri bu `IQueryable` üzerine ekledim (Deferred Execution).
**"Neden böyle kullandın?" denirse:**
> *"Veritabanından bütün datayı çekip RAM'de filtrelemek (IEnumerable) yerine, IQueryable kullanarak filtreleri doğrudan SQL tarafına yollamak (Server-side) performansı inanılmaz artırır. EF Core'un gücünü göstermek adına LINQ sorgularını Manager'da zincirleyerek (chaining) oluşturdum."*
