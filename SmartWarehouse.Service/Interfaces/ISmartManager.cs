using SmartWarehouse.Core.Entities;

namespace SmartWarehouse.Service.Interfaces;

public class RestockPredictionDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;
    public int CurrentStock { get; set; }
    public double AverageDailyOutflow { get; set; }
    public int EstimatedDaysRemaining { get; set; }
    public bool IsCritical { get; set; }
}

public class ZoneSuggestionDto
{
    public int RecommendedZoneId { get; set; }
    public string RecommendedZoneName { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
}

public interface ISmartManager
{
    Task<List<RestockPredictionDto>> GetRestockPredictionsAsync(string companyId);
    Task<ZoneSuggestionDto?> GetZoneSuggestionAsync(int categoryId, string companyId);
}
