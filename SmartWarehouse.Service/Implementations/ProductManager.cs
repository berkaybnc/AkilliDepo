using Microsoft.EntityFrameworkCore;
using SmartWarehouse.Core.Entities;
using SmartWarehouse.Data;
using SmartWarehouse.Service.DTOs;
using SmartWarehouse.Service.Interfaces;
using SmartWarehouse.Service.Repositories;


namespace SmartWarehouse.Service.Implementations;

public class ProductManager : IProductManager
{
    private readonly AppDbContext _context;
    private readonly IProductRepository _repository;


    public ProductManager(AppDbContext context, IProductRepository repository)
    {
        _context = context;
        _repository = repository;
    }

    public async Task<PagedResult<ProductDto>> GetListAsync(PagedRequestDto request)
    {
        var (_, baseQuery) = await _repository.GetPagedBaseQueryAsync(request.CompanyId, request.SearchTerm);
        var query = baseQuery;

        var totalCount = query.Count();

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
        var entity = await _repository.GetByIdAsync(id, companyId);
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

        await _repository.CreateAsync(entity);

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
        var entity = await _repository.GetByIdAsync(dto.Id, dto.CompanyId);
        if (entity == null)
        {
            // Farklı tenant'ta kayıt olabilir -> 403 akışı için UnauthorizedAccessException.
            var existingAnyCompany = await _context.Products.FirstOrDefaultAsync(x => x.Id == dto.Id);
            if (existingAnyCompany != null && existingAnyCompany.CompanyId != dto.CompanyId)
                throw new UnauthorizedAccessException("Company mismatch");

            return false;
        }

        entity.Name = dto.Name;
        entity.SKU = dto.SKU;
        entity.Description = dto.Description;
        entity.CategoryId = dto.CategoryId;
        entity.ZoneId = dto.ZoneId;

        return await _repository.UpdateAsync(entity);
    }

    public async Task<bool> DeleteAsync(DeleteDto dto)
    {
        return await _repository.SoftDeleteAsync(dto.Id, dto.CompanyId);
    }
}

