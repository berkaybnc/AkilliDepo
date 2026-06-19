using SmartWarehouse.Core.Entities;

namespace SmartWarehouse.Service.Repositories;

public interface IProductRepository
{
    Task<(int totalCount, IQueryable<Product> query)> GetPagedBaseQueryAsync(string companyId, string? searchTerm);

    Task<Product?> GetByIdAsync(int id, string companyId);

    Task<Product> CreateAsync(Product entity);

    Task<bool> UpdateAsync(Product entity);

    Task<bool> SoftDeleteAsync(int id, string companyId);

    Task<bool> ExistsAsync(int id);
}

