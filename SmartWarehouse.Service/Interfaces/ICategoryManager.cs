using SmartWarehouse.Service.DTOs;

namespace SmartWarehouse.Service.Interfaces;

public interface ICategoryManager
{
    Task<List<CategoryDto>> GetAllAsync(string companyId);
    Task<CategoryDto?> GetByIdAsync(int id, string companyId);
    Task<CategoryDto> CreateAsync(CreateCategoryDto dto);
    Task<CategoryDto> UpdateAsync(UpdateCategoryDto dto);
    Task<bool> DeleteAsync(int id, string companyId);
}
