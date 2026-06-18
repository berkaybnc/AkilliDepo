namespace SmartWarehouse.Core.Entities;

public class Product : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    
    public int CategoryId { get; set; }
    public Category Category { get; set; } = null!;

    /// <summary>Ürünün varsayılan rafı (isteğe bağlı).</summary>
    public int? ZoneId { get; set; }
    public Zone? Zone { get; set; }

    public int TotalStock { get; set; }
    
    public ICollection<InventoryMovement> InventoryMovements { get; set; } = new List<InventoryMovement>();
}
