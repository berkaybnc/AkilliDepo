using SmartWarehouse.Core.Entities;
using SmartWarehouse.Service.DTOs;
using SmartWarehouse.Service.Interfaces;
using SmartWarehouse.Service.Repositories;

namespace SmartWarehouse.Service.Implementations;

public class PersonnelManager : IPersonnelManager
{
    private readonly IPersonnelRepository _repository;

    public PersonnelManager(IPersonnelRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<PersonnelDto>> GetAllPersonnelsAsync(string companyId)
    {
        var list = await _repository.GetAllAsync(companyId);
        return list.Select(p => new PersonnelDto
        {
            Id = p.Id,
            FirstName = p.FirstName,
            LastName = p.LastName,
            Title = p.Title,
            FullName = p.FullName
        }).ToList();
    }

    public async Task<PersonnelDto?> GetPersonnelByIdAsync(int id, string companyId)
    {
        var p = await _repository.GetByIdAsync(id, companyId);
        if (p == null) return null;

        return new PersonnelDto
        {
            Id = p.Id,
            FirstName = p.FirstName,
            LastName = p.LastName,
            Title = p.Title,
            FullName = p.FullName
        };
    }

    public async Task<PersonnelDto> CreatePersonnelAsync(CreatePersonnelDto dto)
    {
        var p = new Personnel
        {
            CompanyId = dto.CompanyId,
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Title = dto.Title
        };

        var created = await _repository.AddAsync(p);
        
        return new PersonnelDto
        {
            Id = created.Id,
            FirstName = created.FirstName,
            LastName = created.LastName,
            Title = created.Title,
            FullName = created.FullName
        };
    }

    public async Task UpdatePersonnelAsync(UpdatePersonnelDto dto)
    {
        var p = await _repository.GetByIdAsync(dto.Id, dto.CompanyId);
        if (p == null) throw new Exception("Personel bulunamadı.");

        p.FirstName = dto.FirstName;
        p.LastName = dto.LastName;
        p.Title = dto.Title;

        await _repository.UpdateAsync(p);
    }

    public async Task DeletePersonnelAsync(int id, string companyId)
    {
        var p = await _repository.GetByIdAsync(id, companyId);
        if (p == null) throw new Exception("Personel bulunamadı.");

        p.IsDeleted = true;
        await _repository.UpdateAsync(p);
    }
}
