namespace SmartWarehouse.Service.DTOs;

public class PagedResult<T>
{
    public bool Success { get; set; } = true;
    public IEnumerable<T> Data { get; set; } = Enumerable.Empty<T>();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}

public class PagedRequestDto
{
    public string CompanyId { get; set; } = string.Empty;
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 25;
    public string? SearchTerm { get; set; }
    public string? FilterType { get; set; } // "critical", "dailyIn", "dailyOut"
}
