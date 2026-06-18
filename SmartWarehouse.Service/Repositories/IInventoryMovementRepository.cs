using SmartWarehouse.Core.Entities;

namespace SmartWarehouse.Service.Repositories;

public interface IInventoryMovementRepository
{
    Task<Product?> GetProductAsync(int productId, string companyId);
    Task<Zone?> GetZoneAsync(int zoneId, string companyId);

    Task<bool> AddMovementAsync(InventoryMovement movement, Product product, CancellationToken cancellationToken = default);
    Task<List<InventoryMovement>> GetHistoryByProductIdAsync(int productId, string companyId);
}

