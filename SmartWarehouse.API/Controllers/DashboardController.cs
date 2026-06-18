using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using SmartWarehouse.Data;
using SmartWarehouse.Service.DTOs;

namespace SmartWarehouse.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _context;

    public DashboardController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("stats")]
    public async Task<ActionResult<DashboardStatsDto>> GetStats([FromQuery] string companyId)
    {
        if (string.IsNullOrWhiteSpace(companyId))
            return BadRequest(new { Message = "CompanyId is required." });

        var totalProducts = await _context.Products
            .Where(p => !p.IsDeleted && p.CompanyId == companyId)
            .CountAsync();

        // Bugün: UTC referansı ile sayma
        var todayStartUtc = DateTime.UtcNow.Date;
        var tomorrowStartUtc = todayStartUtc.AddDays(1);

        var dailyIn = await _context.InventoryMovements
            .Where(m => !m.IsDeleted && m.CompanyId == companyId && m.Type == SmartWarehouse.Core.Entities.MovementType.In)
            .Where(m => m.CreatedAt >= todayStartUtc && m.CreatedAt < tomorrowStartUtc)
            .SumAsync(m => (int?)m.Quantity) ?? 0;

        var dailyOut = await _context.InventoryMovements
            .Where(m => !m.IsDeleted && m.CompanyId == companyId && m.Type == SmartWarehouse.Core.Entities.MovementType.Out)
            .Where(m => m.CreatedAt >= todayStartUtc && m.CreatedAt < tomorrowStartUtc)
            .SumAsync(m => (int?)m.Quantity) ?? 0;


        // Kritik stok: mevcut stok <= 10
        var criticalStock = await _context.Products
            .Where(p => !p.IsDeleted && p.CompanyId == companyId && p.TotalStock <= 10)
            .CountAsync();

        // Son 7 Günlük Trend Verisi
        var sevenDaysAgo = todayStartUtc.AddDays(-6);
        
        var movements = await _context.InventoryMovements
            .Where(m => !m.IsDeleted && m.CompanyId == companyId && m.CreatedAt >= sevenDaysAgo && m.CreatedAt < tomorrowStartUtc)
            .Select(m => new { m.Type, m.Quantity, m.CreatedAt })
            .ToListAsync();

        var trends = new List<DailyTrendDto>();
        for (int i = 0; i < 7; i++)
        {
            var date = sevenDaysAgo.AddDays(i);
            var dateStr = date.ToString("dd.MM");

            var dayMovements = movements.Where(m => m.CreatedAt >= date && m.CreatedAt < date.AddDays(1)).ToList();
            var dayIn = dayMovements.Where(m => m.Type == SmartWarehouse.Core.Entities.MovementType.In).Sum(m => m.Quantity);
            var dayOut = dayMovements.Where(m => m.Type == SmartWarehouse.Core.Entities.MovementType.Out).Sum(m => m.Quantity);

            trends.Add(new DailyTrendDto
            {
                DateLabel = dateStr,
                In = dayIn,
                Out = dayOut
            });
        }

        return Ok(new DashboardStatsDto
        {
            TotalProducts = totalProducts,
            DailyIn = dailyIn,
            DailyOut = dailyOut,
            CriticalStock = criticalStock,
            MovementTrends = trends
        });
    }
}

