using Microsoft.EntityFrameworkCore;
using SmartWarehouse.Core.Entities;
using SmartWarehouse.Data;

namespace SmartWarehouse.Service.Repositories.Implementations;

public class ZoneRepository : IZoneRepository
{
    private readonly AppDbContext _context;

    public ZoneRepository(AppDbContext context)
    {
        _context = context;
    }

    public Task<List<Zone>> GetAllByCompanyAsync(string companyId)
    {
        return _context.Zones
            .Where(z => z.CompanyId == companyId && !z.IsDeleted)
            .ToListAsync();
    }


    public Task<Zone?> GetByIdAsync(int id, string companyId)
    {
        return _context.Zones
            .FirstOrDefaultAsync(z => z.Id == id && z.CompanyId == companyId && !z.IsDeleted);
    }


    public async Task<Zone> CreateAsync(Zone entity)
    {
        _context.Zones.Add(entity);
        await _context.SaveChangesAsync();
        return entity;
    }

    public async Task<bool> UpdateAsync(Zone entity)
    {
        _context.Entry(entity).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> SoftDeleteAsync(int id, string companyId)
    {
        var entity = await _context.Zones.FirstOrDefaultAsync(z => z.Id == id && z.CompanyId == companyId);
        if (entity == null) return false;
        entity.IsDeleted = true;
        _context.Entry(entity).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ExistsAsync(int id)
    {
        return await _context.Zones.AnyAsync(z => z.Id == id);
    }
}

