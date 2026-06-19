using Microsoft.EntityFrameworkCore;
using SmartWarehouse.Core.Entities;
using SmartWarehouse.Data;

namespace SmartWarehouse.Service.Repositories.Implementations;

public class ProductRepository : IProductRepository
{
    private readonly AppDbContext _context;

    public ProductRepository(AppDbContext context)
    {
        _context = context;
    }

    public Task<(int totalCount, IQueryable<Product> query)> GetPagedBaseQueryAsync(string companyId, string? searchTerm)
    {
        // query is returned as IQueryable; caller must materialize.
        var query = _context.Products
            .AsNoTracking()
            .Where(x => x.CompanyId == companyId && !x.IsDeleted);

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            query = query.Where(x => x.Name.Contains(searchTerm) || x.SKU.Contains(searchTerm));
        }

        // totalCount must be computed before materialization
        return Task.FromResult((totalCount: query.Count(), query: query));
    }

    public Task<Product?> GetByIdAsync(int id, string companyId)
    {
        return _context.Products
            .FirstOrDefaultAsync(x => x.Id == id && x.CompanyId == companyId && !x.IsDeleted);
    }


    public async Task<Product> CreateAsync(Product entity)
    {
        _context.Products.Add(entity);
        await _context.SaveChangesAsync();
        return entity;
    }

    public async Task<bool> UpdateAsync(Product entity)
    {
        _context.Entry(entity).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> SoftDeleteAsync(int id, string companyId)
    {
        var entity = await _context.Products.FirstOrDefaultAsync(x => x.Id == id && x.CompanyId == companyId);
        if (entity == null) return false;
        entity.IsDeleted = true;
        _context.Entry(entity).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ExistsAsync(int id)
    {
        return await _context.Products.AnyAsync(p => p.Id == id);
    }
}

