using Microsoft.EntityFrameworkCore;
using SmartWarehouse.Core.Entities;
using SmartWarehouse.Data;
using SmartWarehouse.Service.DTOs;
using SmartWarehouse.Service.Interfaces;

namespace SmartWarehouse.Service.Implementations;

public class ZoneManager : IZoneManager
{
    private readonly AppDbContext _context;

    public ZoneManager(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<ZoneDto>> GetAllAsync(string companyId)
    {
        return await _context.Zones
            .Where(z => z.CompanyId == companyId)
            .Select(z => new ZoneDto
            {
                Id = z.Id,
                Name = z.Name,
                Description = z.Description,
                CompanyId = z.CompanyId,
                Capacity = z.Capacity
            })
            .ToListAsync();
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

        _context.Zones.Add(entity);
        await _context.SaveChangesAsync();

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
        var entity = await _context.Zones.FirstOrDefaultAsync(z => z.Id == dto.Id);
        if (entity == null) return false;
        if (entity.CompanyId != dto.CompanyId) throw new UnauthorizedAccessException("Company mismatch.");

        entity.Name = dto.Name;
        entity.Description = dto.Description;
        entity.Capacity = dto.Capacity;

        // KURAL 4: EntityState.Modified zorunlu
        _context.Entry(entity).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(DeleteDto dto)
    {
        var entity = await _context.Zones.FirstOrDefaultAsync(z => z.Id == dto.Id);
        if (entity == null) return false;
        if (entity.CompanyId != dto.CompanyId) throw new UnauthorizedAccessException("Company mismatch.");

        // Soft delete — KURAL 4: EntityState.Modified
        entity.IsDeleted = true;
        _context.Entry(entity).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return true;
    }
}

