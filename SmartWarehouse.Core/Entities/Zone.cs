namespace SmartWarehouse.Core.Entities;

public class Zone : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    
    /// <summary>Rafın maksimum stok adedi kapasitesi. 0 = Limitsiz.</summary>
    public int Capacity { get; set; } = 0;
    
    public ICollection<InventoryMovement> InventoryMovements { get; set; } = new List<InventoryMovement>();
    public ICollection<Product> Products { get; set; } = new List<Product>();
}
