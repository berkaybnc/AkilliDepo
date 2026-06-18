using SmartWarehouse.Core.Entities;

namespace SmartWarehouse.Service.DTOs;

public class MovementHistoryDto
{
    public int Id { get; set; }
    public MovementType Type { get; set; }
    public int Quantity { get; set; }
    
    public string ZoneName { get; set; } = string.Empty;
    public string? FromZoneName { get; set; }
    
    public string PersonnelName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
