# Akıllı Depo Yönetimi (Smart Warehouse Management)

Bu proje, modern web teknolojileri (**.NET 9** ve **React 18**) kullanılarak geliştirilmiş, Multi-Tenant (çoklu firma) destekli, JWT tabanlı güvenlik sunan ve gelişmiş bir kullanıcı deneyimi (Glassmorphism Dark UI) barındıran tam teşekküllü bir depo yönetim sistemidir.

## 🚀 Teknolojiler ve Mimari

Proje, katmanlı mimari prensiplerine (Clean Architecture benzeri) tam uyum sağlayacak şekilde modüler olarak geliştirilmiştir:
- `Controller` → `Manager` (İş Kuralları) → `Repository` (Veritabanı) → `Entity`

### Backend
- **Framework:** .NET 9.0 (ASP.NET Core Web API)
- **Veritabanı:** MS SQL Server
- **ORM:** Entity Framework Core (Raw SQL kullanılmamıştır)
- **Güvenlik:** JWT tabanlı kimlik doğrulama ve Rol bazlı yetkilendirme (Role-Based Authorization)
- **Mimari Özellikler:**
  - Tüm HTTP metodları `POST` ve `GET` olarak kurgulanmıştır (PUT/DELETE yasaklarına uygun).
  - Her endpoint, istek yapan kullanıcının `CompanyId`'sini kontrol eder (Multi-Tenant).
  - Güncellemelerde `EntityState.Modified` zorunluluğuna tam uyum.
  - Server-side (Sunucu taraflı) sayfalama (Pagination).
  - Veri kaybını önleyen **Soft Delete** (IsDeleted) mekanizması.

### Frontend
- **Framework:** React 18 & Vite
- **Dil:** TypeScript (Sıkı tip güvenliği)
- **UI Kütüphanesi:** Material-UI (MUI)
- **Stil & UX:** Modern "Glassmorphism" (Cam efekti) ve Karanlık Tema (Dark Mode).
- **Ekstralar:**
  - `axios` interceptor'ları ile Backend'den gelen `PascalCase` verileri otomatik `camelCase`'e dönüştürme.
  - `React-CountUp` ve `Recharts` ile animasyonlu özet kartları ve grafikler.
  - `@mui/x-data-grid` ile server-side destekli, performanslı tablo (DataGrid) kullanımı.
  - Özel kurgulanmış bildirim (Snackbar) ve onay (Dialog) Provider'ları.

---

## 📦 Temel Özellikler (Core Features)

1. **Çoklu Firma Desteği (Multi-Tenant):** Sistemdeki her kayıt (Ürün, Raf, Kategori, Personel) `CompanyId` bazında izole edilir. Bir firma, diğer firmanın verisine kesinlikle erişemez.
2. **Kapsamlı Rol Yönetimi:** Mağaza Müdürü (`MagazaMuduru`) tam yetkiye sahipken, Depo Görevlisi (`DepoGorevlisi`) yalnızca ürün görüntüleyip stok hareketi yapabilir; ürün/personel silemez veya güncelleyemez.
3. **Akıllı Stok Hareketleri (Inventory Movements):**
   - **Giriş (In):** Rafın kapasitesine (Capacity) bakılarak yeni stok eklenir. Kapasite aşımına izin verilmez.
   - **Çıkış (Out):** Mevcut stok miktarının altına (eksi stoğa) inilmesi sistem tarafından engellenir.
   - **Transfer:** Mevcut bir ürünün bir raftan diğerine, güvenli şekilde (Transaction ile) taşınması sağlanır.
4. **Güvenlik ve Veri Bütünlüğü (Data Integrity):** Hata anında tüm stok hareketleri `IDbContextTransaction.Rollback()` ile geri alınarak tutarsız veri oluşumu engellenir.

---

## 🛠️ Kurulum ve Çalıştırma (Getting Started)

Projeyi yerel makinenizde çalıştırmak için aşağıdaki adımları izleyin:

### Ön Gereksinimler
- [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
- [Node.js](https://nodejs.org/) (v18+)
- MS SQL Server (veya LocalDB)

### 1. Backend (API) Kurulumu

```bash
# Backend dizinine geçin
cd SmartWarehouse.API

# Gerekli paketleri indirin
dotnet restore

# Veritabanı Migration'larını uygulayın
dotnet ef database update

# Uygulamayı çalıştırın
dotnet run
```
API varsayılan olarak `http://localhost:5055` üzerinden hizmet verir. Swagger dökümantasyonu için `http://localhost:5055/swagger` adresine gidebilirsiniz.

### 2. Frontend Kurulumu

```bash
# Frontend dizinine geçin
cd frontend

# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu başlatın
npm run dev
```
Frontend uygulamasına tarayıcınızdan (genellikle) `http://localhost:5173` adresinden ulaşabilirsiniz.

---

## 📂 Proje Dizin Yapısı

```text
├── frontend/                     # React (Vite) + TypeScript tabanlı önyüz
│   ├── src/
│   │   ├── api/                  # Axios interceptor ve yapılandırmaları
│   │   ├── components/           # React Bileşenleri (Dashboard, Yönetim vb.)
│   │   ├── theme/                # Custom MUI Tema ve Glassmorphism ayarları
│   │   └── App.tsx               # Ana uygulama rotaları ve Auth mekanizması
├── SmartWarehouse.Core/          # Domain katmanı, Entity modelleri
├── SmartWarehouse.Data/          # EF Core DbContext ve Migration dosyaları
├── SmartWarehouse.Service/       # İş kuralları (Managers) ve Repository'ler
├── SmartWarehouse.API/           # Controller'lar ve API uç noktaları (Endpoints)
└── README.md                     # Proje dokümantasyonu
```

---

## 📝 Ek Dokümanlar
* **[DEVELOPER_TEST.pdf](DEVELOPER_TEST.pdf):** Projenin temel gereksinimlerini belirleyen test dokümanı.
* **[CALISMA_RAPORU.md](CALISMA_RAPORU.md):** Proje bitiminde geliştirme süreci, mimari kararlar ve kullanılan araçların özetlendiği detaylı rapor.
* **[benim_eklediklerim.md](benim_eklediklerim.md):** Gereksinimlerin ötesine geçerek mülakat için hazırlanan ekstra özellikler ve bu özellikleri tercih etme nedenlerinin dökümü.

---
*Bu proje, belirtilen kurallar çerçevesinde ve "Clean Code" prensipleri doğrultusunda Berkay Binici tarafından geliştirilmiştir.*
