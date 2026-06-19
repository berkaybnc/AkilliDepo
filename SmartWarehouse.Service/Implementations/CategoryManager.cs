using SmartWarehouse.Core.Entities;
using SmartWarehouse.Service.DTOs;
using SmartWarehouse.Service.Interfaces;
using SmartWarehouse.Service.Repositories;

namespace SmartWarehouse.Service.Implementations;

public class CategoryManager : ICategoryManager
{
    private readonly ICategoryRepository _repository;

    public CategoryManager(ICategoryRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<CategoryDto>> GetAllAsync(string companyId)
    {
        var categories = await _repository.GetAllAsync(companyId);
        return categories.Select(c => new CategoryDto
        {
            Id = c.Id,
            Name = c.Name,
            Description = c.Description
        }).ToList();
    }

    public async Task<CategoryDto?> GetByIdAsync(int id, string companyId)
    {
        var category = await _repository.GetByIdAsync(id, companyId);
        if (category == null) return null;

        return new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Description = category.Description
        };
    }

    public async Task<CategoryDto> CreateAsync(CreateCategoryDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            throw new ArgumentException("Category name cannot be empty.");

        var category = new Category
        {
            CompanyId = dto.CompanyId,
            Name = dto.Name,
            Description = dto.Description
        };

        var created = await _repository.AddAsync(category);

        return new CategoryDto
        {
            Id = created.Id,
            Name = created.Name,
            Description = created.Description
        };
    }

    public async Task<CategoryDto> UpdateAsync(UpdateCategoryDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            throw new ArgumentException("Category name cannot be empty.");

        var category = await _repository.GetByIdAsync(dto.Id, dto.CompanyId);
        if (category == null)
        {
            if (await _repository.ExistsAsync(dto.Id))
                throw new UnauthorizedAccessException("Company mismatch");
            throw new Exception("Category not found.");
        }

        category.Name = dto.Name;
        category.Description = dto.Description;

        await _repository.UpdateAsync(category);

        return new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Description = category.Description
        };
    }

    public async Task<bool> DeleteAsync(int id, string companyId)
    {
        var category = await _repository.GetByIdAsync(id, companyId);
        if (category == null)
        {
            if (await _repository.ExistsAsync(id))
                throw new UnauthorizedAccessException("Company mismatch");
            return false;
        }

        category.IsDeleted = true;
        await _repository.UpdateAsync(category);

        return true;
    }
}
