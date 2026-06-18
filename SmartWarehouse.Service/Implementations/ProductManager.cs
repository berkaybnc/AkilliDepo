using Microsoft.EntityFrameworkCore;
using SmartWarehouse.Core.Entities;
using SmartWarehouse.Data;
using SmartWarehouse.Service.DTOs;
using SmartWarehouse.Service.Interfaces;

namespace SmartWarehouse.Service.Implementations;

public class ProductManager : IProductManager
{
    private readonly AppDbContext _context;

    public ProductManager(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<ProductDto>> GetListAsync(PagedRequestDto request)
    {
        var query = _context.Products.AsNoTracking()
            .Where(x => x.CompanyId == request.CompanyId);

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            query = query.Where(x => x.Name.Contains(request.SearchTerm) || x.SKU.Contains(request.SearchTerm));
        }

        var totalCount = await query.CountAsync();
        
        var data = await query
            .OrderByDescending(x => x.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(x => new ProductDto
            {
                Id = x.Id,
                CompanyId = x.CompanyId,
                Name = x.Name,
                SKU = x.SKU,
                Description = x.Description,
                CategoryId = x.CategoryId,
                ZoneId = x.ZoneId,
                TotalStock = x.TotalStock
            })
            .ToListAsync();

        return new PagedResult<ProductDto>
        {
            Success = true,
            Data = data,
            TotalCount = totalCount,
            Page = request.Page,
            PageSize = request.PageSize,
            TotalPages = (int)Math.Ceiling((double)totalCount / request.PageSize)
        };
    }

    public async Task<ProductDto?> GetByIdAsync(int id, string companyId)
    {
        var entity = await _context.Products.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id && x.CompanyId == companyId);

        if (entity == null) return null;

        return new ProductDto
        {
            Id = entity.Id,
            CompanyId = entity.CompanyId,
            Name = entity.Name,
            SKU = entity.SKU,
            Description = entity.Description,
            CategoryId = entity.CategoryId,
            ZoneId = entity.ZoneId,
            TotalStock = entity.TotalStock
        };
    }

    public async Task<ProductDto> CreateAsync(CreateProductDto dto)
    {
        var entity = new Product
        {
            CompanyId = dto.CompanyId,
            Name = dto.Name,
            SKU = dto.SKU,
            Description = dto.Description,
            CategoryId = dto.CategoryId,
            ZoneId = dto.ZoneId,
            TotalStock = 0
        };

        _context.Products.Add(entity);
        await _context.SaveChangesAsync();

        return new ProductDto
        {
            Id = entity.Id,
            CompanyId = entity.CompanyId,
            Name = entity.Name,
            SKU = entity.SKU,
            Description = entity.Description,
            CategoryId = entity.CategoryId,
            ZoneId = entity.ZoneId,
            TotalStock = entity.TotalStock
        };
    }

    public async Task<bool> UpdateAsync(UpdateProductDto dto)
    {
        var entity = await _context.Products.FirstOrDefaultAsync(x => x.Id == dto.Id);
        
        if (entity == null) return false;
        if (entity.CompanyId != dto.CompanyId) throw new UnauthorizedAccessException("Company mismatch");

        entity.Name = dto.Name;
        entity.SKU = dto.SKU;
        entity.Description = dto.Description;
        entity.CategoryId = dto.CategoryId;
        entity.ZoneId = dto.ZoneId;
        
        // RULE 4: EntityState.Modified is mandatory
        _context.Entry(entity).State = EntityState.Modified;
        
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(DeleteDto dto)
    {
        var entity = await _context.Products.FirstOrDefaultAsync(x => x.Id == dto.Id);
        
        if (entity == null) return false;
        if (entity.CompanyId != dto.CompanyId) throw new UnauthorizedAccessException("Company mismatch");

        // Soft delete
        entity.IsDeleted = true;
        
        _context.Entry(entity).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        
        return true;
    }
}
