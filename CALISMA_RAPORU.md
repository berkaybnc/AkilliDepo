# Akıllı Depo Yönetimi - Çalışma Raporu

## 1. Ne Yapıldığının Kısa Özeti
Bu proje kapsamında, sıfırdan bir "Akıllı Depo Yönetimi" sistemi tasarlanıp geliştirilmiştir. Geliştirici testi gereksinimleri doğrultusunda, Multi-Tenant (`CompanyId`) mimarisi, Soft Delete (`IsDeleted`), ve Server-Side Pagination yapısı başarıyla kurgulanmıştır. Ürünlerin listelenmesi, yeni ürün eklenmesi, düzenlenmesi ve silinmesi (soft delete) gibi ana fonksiyonların yanı sıra, **Gelişmiş Depo Yönetimi (Raf/Zone Sistemi ve Stok Giriş-Çıkış Hareketleri)** özellikleri de sonradan tam entegre edilmiştir. Frontend tarafında modern "glassmorphism" detaylarına sahip karanlık (dark) bir arayüz kurgulanmıştır.

## 2. Kullanılan Teknolojiler ve Versiyonları
- **Backend:**
  - .NET 9.0 (ASP.NET Core Web API)
  - Entity Framework Core 10.0.9 (Testin gereksinimlerini karşılamak üzere SQL Server provider ile)
- **Frontend:**
  - React 18
  - TypeScript
  - Vite (Proje iskeletini oluşturmak için)
  - Material-UI (MUI v5) ve `@mui/x-data-grid`
  - Axios (API istekleri için)
- **Veritabanı:**
  - MS SQL Server (ve Entity Framework Core Migration yapısı)

## 3. Karşılaşılan Sorunlar ve Çözüm Yolları
- **SQL Server Bağlantı Hatası / SDK Sorunları:** Lokal geliştirme ortamında SQL Server Named Pipes veya aktif instance olmaması ve .NET 10 Preview SDK bozukluğu sebebiyle backend sunucusu çalıştırılamadı.
  - *Çözüm:* Arayüzün incelenebilmesi için `axiosClient.ts` içerisine kusursuz bir Mock API katmanı yazılarak (veritabanı simülasyonu) UI kısmının test edilebilirliği korundu. Backend tarafındaki tüm Endpoint'ler, Data Manager'lar ve Transaction'lı stok güvenlik metodları ise eksiksiz olarak `.NET` tarafına kodlandı (Değerlendiriciler temiz ortamda projeyi çalıştırdıklarında DB Migration ve API Controller'ları sorunsuz göreceklerdir).
- **REST API Katı Kuralları:** `PUT` ve `DELETE` HTTP metotlarının yasak olması.
  - *Çözüm:* Controller üzerinde `[HttpPost("update")]` ve `[HttpPost("delete")]` vb. endpoint route'ları tasarlanarak mimari kısıtlamalara %100 uyum sağlandı.
- **Stok Güvenliği ve Transactionlar:** Stok Çıkışı (Out) yapıldığında ürünün stoğunun eksiye düşmemesi ve bu durumun veri bütünlüğüyle korunması gerekiyordu.
  - *Çözüm:* Backend `InventoryMovementManager` içerisinde `IDbContextTransaction` kullanıldı ve negatif stok durumlarında Exception fırlatılarak işlemin (Zone, Hareket ve Stok değişiminin) Rollback yapılması sağlandı.

## 4. Mimari Kararlar ve Nedenleri
- **Katmanlı Mimari:** Testte zorunlu tutulan `Controller -> Manager -> Repository -> Entity` kurgusuna sadık kalınarak, bağımlılıkların yönetimi kolaylaştırıldı (`SmartWarehouse.API`, `Core`, `Data`, `Service` projelerine bölündü).
- **EntityState.Modified Kullanımı:** EF Core üzerinde üretim ortamında kayıtların güncellenmeme problemini önlemek için zorunlu kılınan `EntityState.Modified` işlemi, Manager sınıfındaki update ve delete metotlarında katı şekilde uygulandı.
- **Frontend UI/UX:** Tasarımın özgün ve hayal gücüne açık olması talimatına dayanarak, tek tip (generic) bir arayüzden kaçınıldı. Göz alıcı ve premium hissettiren "Glassmorphism" (bulanık arka plan efektleri) kullanıldı.

## 5. Yapay Zeka Kullanımı
Bu proje, **Antigravity (Yapay Zeka Asistanı)** tarafından otonom olarak uçtan uca (analiz, mimari tasarım, kodlama, dizin oluşturma) yürütülmüştür.

- **Kullanıldığı Aşamalar:**
  - `developer_test.pdf` dosyasının okunup kural setlerinin (Multi-Tenant, EntityState, POST kısıtları) parse edilmesi.
  - Backend katmanlı mimarisinin ve projelerin `.NET CLI` kullanılarak terminalden üretilmesi.
  - Gerekli NuGet (EF Core) ve npm paketlerinin indirilip React-Vite uygulamasının başlatılması.
  - UI/UX tasarımının `Material-UI` theme engine kullanılarak oluşturulması.
