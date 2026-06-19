# Akıllı Depo Yönetimi - Çalışma Raporu

## 1. Ne Yapıldığının Kısa Özeti
Bu proje kapsamında, sıfırdan bir "Akıllı Depo Yönetimi" sistemi tasarlanıp geliştirilmiştir. Geliştirici testi gereksinimleri doğrultusunda, Multi-Tenant (`CompanyId`) mimarisi, Soft Delete (`IsDeleted`), ve Server-Side Pagination yapısı başarıyla kurgulanmıştır. 

Sistem sadece temel CRUD gereksinimlerini sağlamakla kalmamış; **Rol Bazlı Yetkilendirme (Depo Görevlisi, Mağaza Müdürü, Satış Danışmanı)**, **Gelişmiş Depo Yönetimi (Raf/Zone Sistemi, Akıllı Raf Önerisi ve Stok Giriş-Çıkış Hareketleri)**, **Akıllı Uyarı Sistemi (Kritik Stok Alarmları)** ve **Gelişmiş İstatistik Dashboard'u (Recharts ile Sparklines, Animasyonlu sayılar ve tıklanabilir filtreler)** ile zenginleştirilmiştir. 

Frontend tarafında modern "glassmorphism" detaylarına sahip karanlık (dark) bir arayüz kurgulanmıştır.

## 2. Kullanılan Teknolojiler ve Versiyonları
- **Backend:**
  - .NET 9.0 (ASP.NET Core Web API)
  - Entity Framework Core 9 (SQL Server provider ile)
  - JWT Authentication
- **Frontend:**
  - React 18
  - TypeScript
  - Vite
  - Material-UI (MUI v5) ve `@mui/x-data-grid`
  - Recharts ve React-CountUp
  - Axios
- **Veritabanı:**
  - MS SQL Server (EF Core Migration yapısı ile)

## 3. Karşılaşılan Sorunlar ve Çözüm Yolları
- **REST API Katı Kuralları:** `PUT` ve `DELETE` HTTP metotlarının yasak olması.
  - *Çözüm:* Controller üzerinde `[HttpPost("update")]` ve `[HttpPost("delete")]` vb. endpoint route'ları tasarlanarak mimari kısıtlamalara %100 uyum sağlandı.
- **Stok Güvenliği ve Transactionlar:** Stok Çıkışı (Out) yapıldığında ürünün stoğunun eksiye düşmemesi ve bu durumun veri bütünlüğüyle korunması.
  - *Çözüm:* Backend `InventoryMovementManager` içerisinde `IDbContextTransaction` kullanıldı ve negatif stok durumlarında Exception fırlatılarak işlemin (Zone, Hareket ve Stok değişiminin) Rollback yapılması sağlandı.
- **Frontend-Backend Naming Convention Uyumu:** Backend'in gelen request'leri ve giden response'ları `PascalCase` beklemesi, TypeScript'in ise `camelCase` kullanması.
  - *Çözüm:* API tarafında `Program.cs`'de `PropertyNamingPolicy = null` (PascalCase döner) yapıldı. Axios tarafında yazılan `interceptors.request.use` ile Frontend'in gönderdiği veriler (Request Body) API'ye gitmeden önce `PascalCase`'e çevrildi, response objeleri ise UI bazlı okunurken otomatik dönüştürüldü.

## 4. Mimari Kararlar ve Nedenleri
- **Katmanlı Mimari:** Testte zorunlu tutulan `Controller -> Manager -> Repository -> Entity` kurgusuna sadık kalınarak projeler ayrıştırıldı (`SmartWarehouse.API`, `Core`, `Data`, `Service`).
- **EntityState.Modified Kullanımı:** EF Core güncellemelerinde problem yaşanmaması için istenen `EntityState.Modified` işlemi Repository sınıflarındaki update ve delete metotlarında katı şekilde uygulandı (Raw SQL / Dapper vb. kesinlikle kullanılmadı).
- **Rol ve Tenant (Multi-Tenant) İzolasyonu:** Her endpoint'te (GetById, Update, Delete dahil) gelen `companyId` request eşleştirmeleri yapıldı (`Forbid` kullanılarak yetkisiz erişim kapatıldı). 
- **Server-Side Pagination:** Tüm listeleme işlemlerinde Frontend'den gelen sayfalama (Skip, Take) ve Filtre verileri EF Core `IQueryable` üzerinden değerlendirildi. Toplu çekim yapılıp Client tarafında işleme hatasına düşülmedi.
- **Frontend UI/UX:** Testte belirtilen "özgün tasarım ve hayal gücü" kriterine uygun şekilde, tek tip MUI kullanmak yerine "Glassmorphism" (bulanık arka plan efektleri) kullanıldı. İstatistik kartları sparklines ve count-up animasyonları ile donatıldı.

## 5. Yapay Zeka Kullanımı
Bu proje, **Antigravity (Yapay Zeka Asistanı)** tarafından otonom olarak uçtan uca yürütülmüştür.

- **Kullanıldığı Aşamalar:**
  - `DEVELOPER_TEST.pdf` dosyasının okunup tüm kural setlerinin (Multi-Tenant, EntityState, POST kısıtları, Katmanlı Mimari, Naming Convention) projeye birebir kurgulanması.
  - Katmanlı mimari iskeletinin oluşturulması ve EF Core Migration'larının yapılandırılması.
  - Özgün "Karanlık Tema ve Glassmorphism" UI/UX tasarımının Material UI System ile oluşturulup, modern dashboard'un ayağa kaldırılması.
  - Hata (bug) tespiti, linter hatalarının çözümü ve performans iyileştirmelerinin (sayfalama, token yönetimi, memoization) gerçekleştirilmesi.
