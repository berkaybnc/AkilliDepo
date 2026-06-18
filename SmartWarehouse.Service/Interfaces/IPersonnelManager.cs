using SmartWarehouse.Service.DTOs;

namespace SmartWarehouse.Service.Interfaces;

public interface IPersonnelManager
{
    Task<List<PersonnelDto>> GetAllPersonnelsAsync(string companyId);
    Task<PersonnelDto?> GetPersonnelByIdAsync(int id, string companyId);
    Task<PersonnelDto> CreatePersonnelAsync(CreatePersonnelDto dto);
    Task UpdatePersonnelAsync(UpdatePersonnelDto dto);
    Task DeletePersonnelAsync(int id, string companyId);
}
