using Microsoft.EntityFrameworkCore;
using SmartWarehouse.Core.Entities;
using SmartWarehouse.Data;
using SmartWarehouse.Service.DTOs;
using SmartWarehouse.Service.Interfaces;
using SmartWarehouse.Service.Repositories;

namespace SmartWarehouse.Service.Implementations;

public class ZoneManager : IZoneManager
{
    private readonly AppDbContext _context;
    private readonly IZoneRepository _repository;

    public ZoneManager(AppDbContext context, IZoneRepository repository)
    {
        _context = context;
        _repository = repository;
    }

    public async Task<List<ZoneDto>> GetAllAsync(string companyId)
    {
        var zones = await _repository.GetAllByCompanyAsync(companyId);
        return zones.Select(z => new ZoneDto
        {
            Id = z.Id,
            Name = z.Name,
            Description = z.Description,
            CompanyId = z.CompanyId,
            Capacity = z.Capacity
        }).ToList();
    }

    public async Task<ZoneDto> CreateAsync(CreateZoneDto dto)
    {
        var entity = new Zone
        {
            CompanyId = dto.CompanyId,
            Name = dto.Name,
            Description = dto.Description,
            Capacity = dto.Capacity
        };

        await _repository.CreateAsync(entity);

        return new ZoneDto
        {
            Id = entity.Id,
            CompanyId = entity.CompanyId,
            Name = entity.Name,
            Description = entity.Description,
            Capacity = entity.Capacity
        };
    }

    public async Task<bool> UpdateAsync(UpdateZoneDto dto)
    {
        var entity = await _repository.GetByIdAsync(dto.Id, dto.CompanyId);
        if (entity == null)
        {
            if (await _repository.ExistsAsync(dto.Id))
                throw new UnauthorizedAccessException("Company mismatch.");

            return false;
        }

        entity.Name = dto.Name;
        entity.Description = dto.Description;
        entity.Capacity = dto.Capacity;

        return await _repository.UpdateAsync(entity);
    }

    public async Task<bool> DeleteAsync(DeleteDto dto)
    {
        var success = await _repository.SoftDeleteAsync(dto.Id, dto.CompanyId);
        if (!success)
        {
            if (await _repository.ExistsAsync(dto.Id))
                throw new UnauthorizedAccessException("Company mismatch.");
            return false;
        }
        return true;
    }
}

