using Microsoft.EntityFrameworkCore;
using SmartWarehouse.Core.Entities;
using SmartWarehouse.Data;
using SmartWarehouse.Service.DTOs;
using SmartWarehouse.Service.Interfaces;
using SmartWarehouse.Service.Repositories;

namespace SmartWarehouse.Service.Implementations;

public class InventoryMovementManager : IInventoryMovementManager
{
    private readonly AppDbContext _context;
    private readonly IInventoryMovementRepository _repository;

    public InventoryMovementManager(AppDbContext context, IInventoryMovementRepository repository)
    {
        _context = context;
        _repository = repository;
    }

    public async Task<bool> AddMovementAsync(CreateInventoryMovementDto dto)
    {
        var product = await _repository.GetProductAsync(dto.ProductId, dto.CompanyId);
        if (product == null)
        {
            if (await _context.Products.AnyAsync(p => p.Id == dto.ProductId))
                throw new UnauthorizedAccessException("Product Company mismatch.");
            throw new Exception("Product not found.");
        }

        var targetZone = await _repository.GetZoneAsync(dto.ZoneId, dto.CompanyId);
        if (targetZone == null)
        {
            if (await _context.Zones.AnyAsync(z => z.Id == dto.ZoneId))
                throw new UnauthorizedAccessException("Zone Company mismatch.");
            throw new Exception("Target zone not found.");
        }

        // CompanyId mismatch kontrolü (dokümandaki Forbid(403) standardı için)
        // Manager çağırdığında repository zaten company filter uygular; burada exception mesajını standardize ediyoruz.
        Zone? fromZone = null;
        if (dto.Type == MovementType.Transfer)
        {
            if (!dto.FromZoneId.HasValue)
                throw new ArgumentException("Transfer işlemi için kaynak raf (FromZoneId) zorunludur.");

            fromZone = await _repository.GetZoneAsync(dto.FromZoneId.Value, dto.CompanyId);
            if (fromZone == null)
            {
                if (await _context.Zones.AnyAsync(z => z.Id == dto.FromZoneId.Value))
                    throw new UnauthorizedAccessException("CompanyId mismatch (Source zone). Forbid.");
                throw new Exception("Source zone not found.");
            }

            if (dto.FromZoneId.Value == dto.ZoneId)
                throw new InvalidOperationException("Kaynak ve hedef raf aynı olamaz.");
        }


        // Kapasite kontrolü (özellikle In/Out için)
        // Zone.Capacity: 0 = limitsiz
        if (dto.Quantity <= 0)
            throw new ArgumentException("Quantity must be greater than 0.");

        if (dto.Type != MovementType.Transfer)
        {
            if (targetZone.Capacity > 0)
            {
                // Bu zone'daki mevcut ürün stoklarının toplamı + gelecek miktar capacity'yi aşamaz.
                var currentZoneStock = await _context.Products
                    .Where(p => p.CompanyId == dto.CompanyId && !p.IsDeleted && p.ZoneId == dto.ZoneId)
                    .SumAsync(p => (int?)p.TotalStock) ?? 0;

                if (dto.Type == MovementType.In)
                {
                    if (currentZoneStock + dto.Quantity > targetZone.Capacity)
                        throw new InvalidOperationException("Zone capacity exceeded.");
                }
                else if (dto.Type == MovementType.Out)
                {
                    // Out'ta capacity aşımı olmaz; ama istersen TotalStock kontrolü burada da yapılabilir.
                }
            }
        }

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var movement = new InventoryMovement
            {
                ProductId = dto.ProductId,
                ZoneId = dto.ZoneId,
                FromZoneId = dto.FromZoneId,
                Type = dto.Type,
                Quantity = dto.Quantity,
                PersonnelName = dto.PersonnelName,
                CompanyId = dto.CompanyId,
                CreatedAt = DateTime.UtcNow
            };

            // stok güvenliği
            if (dto.Type == MovementType.In)
            {
                product.TotalStock += dto.Quantity;
            }
            else if (dto.Type == MovementType.Out)
            {
                if (product.TotalStock < dto.Quantity)
                    throw new InvalidOperationException("Insufficient stock.");

                product.TotalStock -= dto.Quantity;
            }
            else if (dto.Type == MovementType.Transfer)
            {
                // Transfer: toplam stok değişmez
                product.ZoneId = dto.ZoneId;
            }

            await _context.InventoryMovements.AddAsync(movement);
            _context.Entry(product).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            await transaction.CommitAsync();
            return true;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }

    }

    public async Task<List<MovementHistoryDto>> GetHistoryAsync(int productId, string companyId)
    {
        var movements = await _repository.GetHistoryByProductIdAsync(productId, companyId);
        
        return movements.Select(m => new MovementHistoryDto
        {
            Id = m.Id,
            Type = m.Type,
            Quantity = m.Quantity,
            ZoneName = m.Zone?.Name ?? "Bilinmiyor",
            FromZoneName = m.FromZone?.Name,
            PersonnelName = m.PersonnelName,
            CreatedAt = m.CreatedAt
        }).ToList();
    }
}

