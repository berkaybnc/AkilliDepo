namespace SmartWarehouse.Service.DTOs;

public class ProductDto
{
    public int Id { get; set; }
    public string CompanyId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public int? ZoneId { get; set; }
    public int TotalStock { get; set; }
}

public class CreateProductDto
{
    public string CompanyId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public int? ZoneId { get; set; }
}

public class UpdateProductDto
{
    public int Id { get; set; }
    public string CompanyId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public int? ZoneId { get; set; }
}

public class DeleteDto
{
    public int Id { get; set; }
    public string CompanyId { get; set; } = string.Empty;
}
