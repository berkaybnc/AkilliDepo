namespace SmartWarehouse.Core.Entities;

public enum MovementType
{
    In = 1,
    Out = 2,
    Transfer = 3  // Raflar arası transfer
}

public class InventoryMovement : BaseEntity
{
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;

    // Transfer işlemlerinde hedef raf
    public int ZoneId { get; set; }
    public Zone Zone { get; set; } = null!;

    // Transfer işlemlerinde kaynak raf (In/Out için null)
    public int? FromZoneId { get; set; }
    public Zone? FromZone { get; set; }

    public MovementType Type { get; set; }
    public int Quantity { get; set; }
    
    public string ReferenceNumber { get; set; } = string.Empty;
}
