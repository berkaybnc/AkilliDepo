using SmartWarehouse.Core.Entities;

namespace SmartWarehouse.Service.Repositories;

public interface IPersonnelRepository
{
    Task<List<Personnel>> GetAllAsync(string companyId);
    Task<Personnel?> GetByIdAsync(int id, string companyId);
    Task<Personnel> AddAsync(Personnel personnel);
    Task UpdateAsync(Personnel personnel);
}
