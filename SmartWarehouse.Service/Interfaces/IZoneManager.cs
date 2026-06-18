using SmartWarehouse.Service.DTOs;

namespace SmartWarehouse.Service.Interfaces;

public interface IZoneManager
{
    Task<List<ZoneDto>> GetAllAsync(string companyId);
    Task<ZoneDto> CreateAsync(CreateZoneDto dto);
    Task<bool> UpdateAsync(UpdateZoneDto dto);
    Task<bool> DeleteAsync(DeleteDto dto);
}
