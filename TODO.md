# TODO (SmartWarehouse fix)

## Done
- Inventory movements sırasında görülen 500 hatalarını azaltmak / UI’yi korumak:
  - `SmartWarehouse.API/Controllers/InventoryMovementsController.cs`
    - beklenen hataları 400/403’a map’leme
  - `frontend/src/components/ProductManagement.tsx`
    - Transfer tipinde (type=3) `fromZoneId` / `zoneId` boş veya aynı ise UI’den engelleme
    - `parseInt` sonrası NaN guard

## Done (Dashboard)
- `GET /api/dashboard/stats?companyId=...` 404 düzeltildi.
  - `SmartWarehouse.API/Controllers/DashboardController.cs` eklendi.
  - `SmartWarehouse.Service/DTOs/DashboardStatsDto.cs` eklendi.

## Pending
- Multi-tenant 403 standardizasyonu (dokümandaki birebir exception → 403 eşlemesi) tüm endpoint/akışlar için netleştirilecek.

