using SmartWarehouse.Core.Entities;

namespace SmartWarehouse.Service.DTOs;

public class ZoneDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string CompanyId { get; set; } = string.Empty;
    public int Capacity { get; set; }
}

public class CreateZoneDto
{
    public string CompanyId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Capacity { get; set; } = 0;
}

public class UpdateZoneDto
{
    public int Id { get; set; }
    public string CompanyId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Capacity { get; set; } = 0;
}

public class CreateInventoryMovementDto
{
    public string CompanyId { get; set; } = string.Empty;
    public int ProductId { get; set; }
    public int ZoneId { get; set; }          // Hedef raf (Transfer'de gidilen raf, In/Out'da işlem yapılan raf)
    public int? FromZoneId { get; set; }     // Kaynak raf (sadece Transfer tipinde kullanılır)
    public MovementType Type { get; set; }
    public int Quantity { get; set; }
    public string ReferenceNumber { get; set; } = string.Empty;
}

