using Microsoft.EntityFrameworkCore;
using SmartWarehouse.Data;
using SmartWarehouse.Service.Implementations;
using SmartWarehouse.Service.Interfaces;
using SmartWarehouse.Service.Repositories;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;


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
builder.Services.AddScoped<IProductRepository, SmartWarehouse.Service.Repositories.Implementations.ProductRepository>();
builder.Services.AddScoped<IZoneRepository, SmartWarehouse.Service.Repositories.Implementations.ZoneRepository>();
builder.Services.AddScoped<IInventoryMovementRepository, SmartWarehouse.Service.Repositories.Implementations.InventoryMovementRepository>();
builder.Services.AddScoped<ICategoryRepository, SmartWarehouse.Service.Repositories.Implementations.CategoryRepository>();

builder.Services.AddScoped<IProductManager, ProductManager>();
builder.Services.AddScoped<IZoneManager, ZoneManager>();
builder.Services.AddScoped<IInventoryMovementManager, InventoryMovementManager>();
builder.Services.AddScoped<ICategoryManager, CategoryManager>();

builder.Services.AddScoped<IPersonnelRepository, PersonnelRepository>();
builder.Services.AddScoped<IPersonnelManager, PersonnelManager>();
builder.Services.AddScoped<ISmartManager, SmartManager>();
builder.Services.AddScoped<IAuthManager, AuthManager>();


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

// JWT Authentication Configuration
var jwtKey = builder.Configuration["Jwt:Key"] ?? "SuperSecretKeyForSmartWarehouse!1234567890";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "SmartWarehouseApp";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "SmartWarehouseUsers";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors("AllowAll");

app.UseAuthentication();
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
        var zoneA = new SmartWarehouse.Core.Entities.Zone { Name = "A Rafı", Description = "Kuzey Depo", CompanyId = "COMPANY-ABC-123", Capacity = 500 };
        var zoneB = new SmartWarehouse.Core.Entities.Zone { Name = "B Rafı", Description = "Güney Depo", CompanyId = "COMPANY-ABC-123", Capacity = 300 };
        var zoneC = new SmartWarehouse.Core.Entities.Zone { Name = "C Rafı", Description = "Karantina Bölgesi", CompanyId = "COMPANY-ABC-123", Capacity = 50 };
        var zoneD = new SmartWarehouse.Core.Entities.Zone { Name = "D Rafı", Description = "Hızlı Tüketim", CompanyId = "COMPANY-ABC-123", Capacity = 1000 };
        
        context.Zones.AddRange(zoneA, zoneB, zoneC, zoneD);
        context.SaveChanges();

        // Seed some products assigned to these zones
        var category = context.Categories.First();
        context.Products.AddRange(
            new SmartWarehouse.Core.Entities.Product { Name = "Lojistik Koli M", SKU = "KOL-M-01", Description = "Orta Boy Taşıma Kolisi", CompanyId = "COMPANY-ABC-123", TotalStock = 250, CategoryId = category.Id, ZoneId = zoneA.Id },
            new SmartWarehouse.Core.Entities.Product { Name = "Lojistik Koli L", SKU = "KOL-L-01", Description = "Büyük Boy Taşıma Kolisi", CompanyId = "COMPANY-ABC-123", TotalStock = 100, CategoryId = category.Id, ZoneId = zoneA.Id },
            new SmartWarehouse.Core.Entities.Product { Name = "Palet Shrink", SKU = "SHR-100", Description = "Streç Film", CompanyId = "COMPANY-ABC-123", TotalStock = 50, CategoryId = category.Id, ZoneId = zoneB.Id }
        );
        context.SaveChanges();
    }
}

app.Run();
