using Microsoft.EntityFrameworkCore;
using SmartWarehouse.Core.Entities;
using SmartWarehouse.Data;
using SmartWarehouse.Service.Interfaces;

namespace SmartWarehouse.Service.Implementations;

public class SmartManager : ISmartManager
{
    private readonly AppDbContext _context;

    public SmartManager(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<RestockPredictionDto>> GetRestockPredictionsAsync(string companyId)
    {
        var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);

        // Son 30 gündeki tüm çıkışları (Type 2) grupla
        var outflows = await _context.InventoryMovements
            .Where(m => m.CompanyId == companyId && m.Type == MovementType.Out && m.CreatedAt >= thirtyDaysAgo)
            .GroupBy(m => m.ProductId)
            .Select(g => new
            {
                ProductId = g.Key,
                TotalOutflow = g.Sum(m => m.Quantity)
            })
            .ToListAsync();

        var products = await _context.Products
            .Where(p => p.CompanyId == companyId)
            .ToListAsync();

        var predictions = new List<RestockPredictionDto>();

        foreach (var p in products)
        {
            var outflowData = outflows.FirstOrDefault(o => o.ProductId == p.Id);
            if (outflowData == null || outflowData.TotalOutflow == 0) continue;

            double dailyOutflow = outflowData.TotalOutflow / 30.0;
            if (dailyOutflow <= 0) continue;

            int daysRemaining = (int)(p.TotalStock / dailyOutflow);

            if (daysRemaining <= 7) // 7 günden az ömrü kalanları getir
            {
                predictions.Add(new RestockPredictionDto
                {
                    ProductId = p.Id,
                    ProductName = p.Name,
                    SKU = p.SKU,
                    CurrentStock = p.TotalStock,
                    AverageDailyOutflow = Math.Round(dailyOutflow, 2),
                    EstimatedDaysRemaining = daysRemaining,
                    IsCritical = daysRemaining <= 3
                });
            }
        }

        return predictions.OrderBy(p => p.EstimatedDaysRemaining).ToList();
    }

    public async Task<ZoneSuggestionDto?> GetZoneSuggestionAsync(int categoryId, string companyId)
    {
        // Tüm rafları bul
        var zones = await _context.Zones.Where(z => z.CompanyId == companyId).ToListAsync();
        if (!zones.Any()) return null;

        // İlgili kategorideki ürünlerin hangi raflarda olduğunu bul
        var categoryProducts = await _context.Products
            .Where(p => p.CompanyId == companyId && p.CategoryId == categoryId && p.ZoneId != null)
            .GroupBy(p => p.ZoneId)
            .Select(g => new { ZoneId = g.Key, Count = g.Count() })
            .OrderByDescending(g => g.Count)
            .ToListAsync();

        // 1. Kural: Aynı kategoride en çok ürün barındıran rafa öncelik ver
        foreach (var cp in categoryProducts)
        {
            var zone = zones.FirstOrDefault(z => z.Id == cp.ZoneId);
            if (zone != null)
            {
                // Mevcut kapasite doluluk kontrolü eklenebilir. Basitlik adına doğrudan öneriyoruz.
                return new ZoneSuggestionDto
                {
                    RecommendedZoneId = zone.Id,
                    RecommendedZoneName = zone.Name,
                    Reason = $"Bu kategorideki ürünlerin büyük kısmı ({cp.Count} adet) bu rafta bulunuyor."
                };
            }
        }

        // 2. Kural: Eğer o kategoride ürün yoksa, ilk boş/rastgele rafı öner
        var defaultZone = zones.First();
        return new ZoneSuggestionDto
        {
            RecommendedZoneId = defaultZone.Id,
            RecommendedZoneName = defaultZone.Name,
            Reason = "Bu kategoride henüz başka ürün yok. Varsayılan boş raf önerildi."
        };
    }
}
