using Microsoft.EntityFrameworkCore;
using SmartWarehouse.Data;
using SmartWarehouse.Service.Implementations;
using SmartWarehouse.Service.Interfaces;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers().AddJsonOptions(options =>
{
    // Kural 6: Response'lar PascalCase dönmeli
    options.JsonSerializerOptions.PropertyNamingPolicy = null;
});
builder.Services.AddOpenApi();

// DbContext configuration
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Server=localhost;Database=SmartWarehouseDb;Trusted_Connection=True;MultipleActiveResultSets=true;Encrypt=False"));

// DI container
builder.Services.AddScoped<IProductManager, ProductManager>();
builder.Services.AddScoped<IZoneManager, ZoneManager>();
builder.Services.AddScoped<IInventoryMovementManager, InventoryMovementManager>();

// CORS for Frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();

// Seed Database for test
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    if (!context.Categories.Any(c => c.CompanyId == "COMPANY-ABC-123"))
    {
        context.Categories.Add(new SmartWarehouse.Core.Entities.Category { 
            Name = "Genel Kategori", 
            Description = "Sistem Kategorisi", 
            CompanyId = "COMPANY-ABC-123" 
        });
        context.SaveChanges();
    }
    
    if (!context.Zones.Any(z => z.CompanyId == "COMPANY-ABC-123"))
    {
        context.Zones.AddRange(
            new SmartWarehouse.Core.Entities.Zone { Name = "A Rafı", Description = "Kuzey Depo", CompanyId = "COMPANY-ABC-123", Capacity = 500 },
            new SmartWarehouse.Core.Entities.Zone { Name = "B Rafı", Description = "Güney Depo", CompanyId = "COMPANY-ABC-123", Capacity = 300 }
        );
        context.SaveChanges();
    }
}

app.Run();
