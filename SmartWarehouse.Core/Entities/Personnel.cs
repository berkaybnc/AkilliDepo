namespace SmartWarehouse.Core.Entities;

public class Personnel : BaseEntity
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    
    // Yardımcı property: Tam ad
    public string FullName => $"{FirstName} {LastName}";
}
