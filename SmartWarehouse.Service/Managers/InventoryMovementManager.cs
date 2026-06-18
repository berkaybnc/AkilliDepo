using Microsoft.EntityFrameworkCore;
using SmartWarehouse.Core.Entities;
using SmartWarehouse.Data;
using SmartWarehouse.Service.DTOs;
using SmartWarehouse.Service.Interfaces;

namespace SmartWarehouse.Service.Implementations;

public class InventoryMovementManager : IInventoryMovementManager
{
    private readonly AppDbContext _context;

    public InventoryMovementManager(AppDbContext context)
    {
        _context = context;
    }

    public async Task<bool> AddMovementAsync(CreateInventoryMovementDto dto)
    {
        // Yetki Kontrolü
        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == dto.ProductId && p.CompanyId == dto.CompanyId);
        if (product == null) throw new UnauthorizedAccessException("Product not found or access denied.");

        var targetZone = await _context.Zones.FirstOrDefaultAsync(z => z.Id == dto.ZoneId && z.CompanyId == dto.CompanyId);
        if (targetZone == null) throw new UnauthorizedAccessException("Target zone not found or access denied.");

        // Transfer için kaynak raf doğrulaması
        Zone? fromZone = null;
        if (dto.Type == MovementType.Transfer)
        {
            if (!dto.FromZoneId.HasValue)
                throw new ArgumentException("Transfer işlemi için kaynak raf (FromZoneId) zorunludur.");

            fromZone = await _context.Zones.FirstOrDefaultAsync(z => z.Id == dto.FromZoneId.Value && z.CompanyId == dto.CompanyId);
            if (fromZone == null)
                throw new UnauthorizedAccessException("Source zone not found or access denied.");

            if (dto.FromZoneId == dto.ZoneId)
                throw new InvalidOperationException("Kaynak ve hedef raf aynı olamaz.");
        }

        // Transaction başlat (Stok güvenliği için)
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
                ReferenceNumber = dto.ReferenceNumber,
                CompanyId = dto.CompanyId,
                CreatedAt = DateTime.UtcNow
            };

            await _context.InventoryMovements.AddAsync(movement);

            // KURAL: EntityState.Modified kullanarak ürün stoğunu güncelle
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
                // Transfer: toplam stok değişmez, sadece ürünün rafı güncellenir
                // Ürünün varsayılan rafını hedef rafa güncelle
                product.ZoneId = dto.ZoneId;
            }

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
}
