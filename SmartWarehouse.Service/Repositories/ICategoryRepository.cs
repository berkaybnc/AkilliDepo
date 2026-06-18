using SmartWarehouse.Core.Entities;

namespace SmartWarehouse.Service.Repositories;

public interface ICategoryRepository
{
    Task<List<Category>> GetAllAsync(string companyId);
    Task<Category?> GetByIdAsync(int id, string companyId);
    Task<Category> AddAsync(Category category);
    Task UpdateAsync(Category category);
}
