using Microsoft.EntityFrameworkCore;
using SmartWarehouse.Core.Entities;
using SmartWarehouse.Data;

namespace SmartWarehouse.Service.Repositories;

public class PersonnelRepository : IPersonnelRepository
{
    private readonly AppDbContext _context;

    public PersonnelRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<Personnel>> GetAllAsync(string companyId)
    {
        return await _context.Personnels
            .Where(p => p.CompanyId == companyId)
            .OrderBy(p => p.FirstName).ThenBy(p => p.LastName)
            .ToListAsync();
    }

    public async Task<Personnel?> GetByIdAsync(int id, string companyId)
    {
        return await _context.Personnels
            .FirstOrDefaultAsync(p => p.Id == id && p.CompanyId == companyId);
    }

    public async Task<Personnel> AddAsync(Personnel personnel)
    {
        _context.Personnels.Add(personnel);
        await _context.SaveChangesAsync();
        return personnel;
    }

    public async Task UpdateAsync(Personnel personnel)
    {
        _context.Personnels.Update(personnel);
        await _context.SaveChangesAsync();
    }
}
