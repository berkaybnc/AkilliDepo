using SmartWarehouse.Service.DTOs;

namespace SmartWarehouse.Service.Interfaces;

public interface IProductManager
{
    Task<PagedResult<ProductDto>> GetListAsync(PagedRequestDto request);
    Task<ProductDto?> GetByIdAsync(int id, string companyId);
    Task<ProductDto> CreateAsync(CreateProductDto dto);
    Task<bool> UpdateAsync(UpdateProductDto dto);
    Task<bool> DeleteAsync(DeleteDto dto);
}
