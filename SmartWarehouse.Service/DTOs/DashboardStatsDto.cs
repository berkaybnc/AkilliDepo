namespace SmartWarehouse.Service.DTOs;

public class DashboardStatsDto
{
    public int TotalProducts { get; set; }
    public int DailyIn { get; set; }
    public int DailyOut { get; set; }
    public int CriticalStock { get; set; }
}

