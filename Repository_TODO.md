# Repository_TODO

## Hedef
DEVELOPER_TEST.pdf’teki zorunlu kural setine göre **eksik/olmayan** noktaları kod üzerinde düzeltmek (sadece eksikler).

## Liste (Öncelik sırası)
1. Backend: `Controller → Manager → Repository → Entity` kuralını gerçekten uygulamak için:
   - SmartWarehouse.Service / SmartWarehouse.Data içinde Repository projeleri/klasörleri
   - Her aggregate için (Product, Zone, InventoryMovement) repository interface + impl
   - Manager sınıflarını repository kullanacak şekilde güncellemek (EF işlemleri repository’de olacak)
2. Backend: Multi-tenant CompanyId mismatch durumlarında her endpointte dokümandaki gibi 403/Forbid standardizasyonu.
3. Frontend: Dokümandaki “MUI Dialog” zorunluluğunu birebir sağlamak.
4. Frontend: `axiosClient.ts` içindeki büyük MOCK bloğunu backend ayağa kalktığında devre dışı bırakmak (env/flag ile).

## Durum
- [ ] 1. Repository katmanı gerçek şekilde eklenip manager’lar refactor edilecek.
- [ ] 2. Forbid standardizasyonu.
- [ ] 3. MUI Dialog dönüşümü.
- [ ] 4. Mock conditional.

