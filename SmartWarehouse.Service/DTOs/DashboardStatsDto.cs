namespace SmartWarehouse.Service.DTOs;

public class DailyTrendDto
{
    public string DateLabel { get; set; } = string.Empty;
    public int In { get; set; }
    public int Out { get; set; }
}

public class DashboardStatsDto
{
    public int TotalProducts { get; set; }
    public int DailyIn { get; set; }
    public int DailyOut { get; set; }
    public int CriticalStock { get; set; }

    public List<DailyTrendDto> MovementTrends { get; set; } = new();
}

