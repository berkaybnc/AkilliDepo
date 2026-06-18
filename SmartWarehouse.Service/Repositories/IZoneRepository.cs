using SmartWarehouse.Core.Entities;

namespace SmartWarehouse.Service.Repositories;

public interface IZoneRepository
{
    Task<List<Zone>> GetAllByCompanyAsync(string companyId);

    Task<Zone?> GetByIdAsync(int id, string companyId);

    Task<Zone> CreateAsync(Zone entity);

    Task<bool> UpdateAsync(Zone entity);

    Task<bool> SoftDeleteAsync(int id, string companyId);
}

