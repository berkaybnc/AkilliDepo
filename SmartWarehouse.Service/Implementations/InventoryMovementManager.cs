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
        if (product == null) throw new UnauthorizedAccessException("Product not found or access denied.");

        var targetZone = await _repository.GetZoneAsync(dto.ZoneId, dto.CompanyId);
        if (targetZone == null) throw new UnauthorizedAccessException("Target zone not found or access denied.");

        // CompanyId mismatch kontrolü (dokümandaki Forbid(403) standardı için)
        // Manager çağırdığında repository zaten company filter uygular; burada exception mesajını standardize ediyoruz.
        Zone? fromZone = null;
        if (dto.Type == MovementType.Transfer)
        {
            if (!dto.FromZoneId.HasValue)
                throw new ArgumentException("Transfer işlemi için kaynak raf (FromZoneId) zorunludur.");

            fromZone = await _repository.GetZoneAsync(dto.FromZoneId.Value, dto.CompanyId);
            if (fromZone == null)
                throw new UnauthorizedAccessException("CompanyId mismatch (Source zone). Forbid.");

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
                ReferenceNumber = dto.ReferenceNumber,
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

