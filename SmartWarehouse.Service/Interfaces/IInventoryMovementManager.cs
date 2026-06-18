using SmartWarehouse.Service.DTOs;

namespace SmartWarehouse.Service.Interfaces;

public interface IInventoryMovementManager
{
    Task<bool> AddMovementAsync(CreateInventoryMovementDto dto);
    Task<List<MovementHistoryDto>> GetHistoryAsync(int productId, string companyId);
}
