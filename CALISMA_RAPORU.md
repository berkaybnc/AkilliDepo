# Akıllı Depo Yönetimi - Çalışma Raporu

## 1. Ne Yapıldığının Kısa Özeti
Bu proje kapsamında, sıfırdan bir "Akıllı Depo Yönetimi" sistemi tasarlayıp geliştirdim. Geliştirici testi gereksinimleri doğrultusunda, Multi-Tenant (`CompanyId`) mimarisi, Soft Delete (`IsDeleted`), ve Server-Side Pagination yapısını başarıyla kurguladım. 

Sistemde sadece temel CRUD gereksinimlerini sağlamakla kalmadım; **Rol Bazlı Yetkilendirme (Depo Görevlisi, Mağaza Müdürü, Satış Danışmanı)**, **Gelişmiş Depo Yönetimi (Raf/Zone Sistemi, Akıllı Raf Önerisi ve Stok Giriş-Çıkış Hareketleri)**, **Akıllı Uyarı Sistemi (Kritik Stok Alarmları)** ve **Gelişmiş İstatistik Dashboard'u (Recharts ile Sparklines, Animasyonlu sayılar ve tıklanabilir filtreler)** ile projeyi zenginleştirdim. 

Frontend tarafında modern "glassmorphism" detaylarına sahip karanlık (dark) bir arayüz tasarladım.

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
  - *Çözüm:* Controller üzerinde `[HttpPost("update")]` ve `[HttpPost("delete")]` vb. endpoint route'ları tasarlayarak mimari kısıtlamalara %100 uyum sağladım.
- **Stok Güvenliği ve Transactionlar:** Stok Çıkışı (Out) yapıldığında ürünün stoğunun eksiye düşmemesi ve bu durumun veri bütünlüğüyle korunması gerekliliği.
  - *Çözüm:* Backend `InventoryMovementManager` içerisinde `IDbContextTransaction` kullandım ve negatif stok durumlarında Exception fırlatarak işlemin (Zone, Hareket ve Stok değişiminin) Rollback yapılmasını sağladım.
- **Frontend-Backend Naming Convention Uyumu:** Backend'in gelen request'leri ve giden response'ları `PascalCase` beklemesi, TypeScript'in ise `camelCase` kullanması.
  - *Çözüm:* API tarafında `Program.cs`'de `PropertyNamingPolicy = null` (PascalCase döner) ayarını yaptım. Axios tarafında yazdığım `interceptors.request.use` ile Frontend'in gönderdiği verileri (Request Body) API'ye gitmeden önce `PascalCase`'e çevirdim, response objelerini ise UI bazlı okunurken otomatik dönüştürdüm.

## 4. Mimari Kararlar ve Nedenleri
- **Katmanlı Mimari:** Testte zorunlu tutulan `Controller -> Manager -> Repository -> Entity` kurgusuna sadık kalarak projeleri ayrıştırdım (`SmartWarehouse.API`, `Core`, `Data`, `Service`).
- **EntityState.Modified Kullanımı:** EF Core güncellemelerinde problem yaşanmaması için istenen `EntityState.Modified` işlemini Repository sınıflarındaki update ve delete metotlarında katı şekilde uyguladım (Raw SQL / Dapper vb. kesinlikle kullanmadım).
- **Rol ve Tenant (Multi-Tenant) İzolasyonu:** Her endpoint'te (GetById, Update, Delete dahil) gelen `companyId` request eşleştirmelerini yaptım (`Forbid` kullanarak yetkisiz erişimi kapattım). 
- **Server-Side Pagination:** Tüm listeleme işlemlerinde Frontend'den gelen sayfalama (Skip, Take) ve Filtre verilerini EF Core `IQueryable` üzerinden değerlendirdim. Toplu çekim yapıp Client tarafında işleme hatasına düşülmesini engelledim.
- **Frontend UI/UX:** Testte belirtilen "özgün tasarım ve hayal gücü" kriterine uygun şekilde, tek tip MUI kullanmak yerine "Glassmorphism" (bulanık arka plan efektleri) kullandım. İstatistik kartlarını sparklines ve count-up animasyonları ile donattım.

## 5. Yapay Zeka Kullanımı
Proje geliştirme sürecinde, verimliliğimi artırmak, bazı karmaşık yapıların temel iskeletini hızlıca kurmak ve kodlama hatalarını daha hızlı çözümleyebilmek adına yapay zeka araçlarından (kod asistanlarından) destek aldım.

- **Kullanıldığı Aşamalar:**
  - Katmanlı mimari iskeletinin oluşturulması ve boilerplate (tekrarlayan) kodların (Entity, DTO, Repository gibi) yazımında hız kazanmak.
  - "Karanlık Tema ve Glassmorphism" UI/UX tasarımını kurgularken CSS ve Material UI kullanımına dair alternatif çözüm önerileri almak.
  - Karşılaştığım bazı linter hatalarının veya bug'ların hızlıca tespit edilip giderilmesi.
  - Mimari kurgu ve gereksinimlerin kodlamaya yansıtılması sürecinde fikir alışverişi yapmak.
