namespace SmartWarehouse.Core.Entities;

public class User : BaseEntity
{
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    
    // Roller: "DepoGorevlisi", "SatisDanismani"
    public string Role { get; set; } = string.Empty;
    
    // Opsiyonel olarak, işlem yapan personelin adı ile eşleştirmek için
    public string FullName { get; set; } = string.Empty;
}
