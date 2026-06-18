using Microsoft.EntityFrameworkCore;
using SmartWarehouse.Core.Entities;
using SmartWarehouse.Data;

namespace SmartWarehouse.Service.Repositories.Implementations;

public class InventoryMovementRepository : IInventoryMovementRepository
{
    private readonly AppDbContext _context;

    public InventoryMovementRepository(AppDbContext context)
    {
        _context = context;
    }

    public Task<Product?> GetProductAsync(int productId, string companyId)
    {
        return _context.Products
            .FirstOrDefaultAsync(p => p.Id == productId && p.CompanyId == companyId);
    }

    public Task<Zone?> GetZoneAsync(int zoneId, string companyId)
    {
        return _context.Zones
            .FirstOrDefaultAsync(z => z.Id == zoneId && z.CompanyId == companyId);
    }

    public async Task<bool> AddMovementAsync(InventoryMovement movement, Product product, CancellationToken cancellationToken = default)
    {
        // Artık InventoryMovementManager tarafında transaction içinde hareket ekleme + SaveChanges tek sefer yapıldığı için,
        // bu metod sadece geriye uyumluluk amacıyla bırakıldı.
        // Kullanılmıyorsa exception üretmemek için no-op dönüyoruz.
        await Task.CompletedTask;
        return true;
    }

}

