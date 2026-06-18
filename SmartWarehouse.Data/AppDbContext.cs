using Microsoft.EntityFrameworkCore;
using SmartWarehouse.Core.Entities;

namespace SmartWarehouse.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Category> Categories { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<Zone> Zones { get; set; }
    public DbSet<InventoryMovement> InventoryMovements { get; set; }
    public DbSet<Personnel> Personnels { get; set; }
    public DbSet<User> Users { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Global soft delete filters
        modelBuilder.Entity<Category>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Product>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Zone>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<InventoryMovement>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Personnel>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<User>().HasQueryFilter(e => !e.IsDeleted);

        // Product → Zone (varsayılan raf, isteğe bağlı)
        modelBuilder.Entity<Product>()
            .HasOne(p => p.Zone)
            .WithMany(z => z.Products)
            .HasForeignKey(p => p.ZoneId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired(false);

        // InventoryMovement → Zone (ToZone) — cascade engellemek için
        modelBuilder.Entity<InventoryMovement>()
            .HasOne(im => im.Zone)
            .WithMany(z => z.InventoryMovements)
            .HasForeignKey(im => im.ZoneId)
            .OnDelete(DeleteBehavior.Restrict);

        // InventoryMovement → FromZone (nullable)
        modelBuilder.Entity<InventoryMovement>()
            .HasOne(im => im.FromZone)
            .WithMany()
            .HasForeignKey(im => im.FromZoneId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired(false);

        // Seed Users
        modelBuilder.Entity<User>().HasData(
            new User 
            { 
                Id = 1, 
                CompanyId = "COMPANY-ABC-123", 
                Username = "admin", 
                PasswordHash = "123456", // Test için düz metin
                Role = "DepoGorevlisi", 
                FullName = "Ahmet Depocu",
                CreatedAt = new DateTime(2023, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new User 
            { 
                Id = 2, 
                CompanyId = "COMPANY-ABC-123", 
                Username = "satici", 
                PasswordHash = "123456", // Test için düz metin
                Role = "SatisDanismani", 
                FullName = "Ayşe Satış",
                CreatedAt = new DateTime(2023, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new User 
            { 
                Id = 3, 
                CompanyId = "COMPANY-ABC-123", 
                Username = "mudur", 
                PasswordHash = "123456", // Test için düz metin
                Role = "MagazaMuduru", 
                FullName = "Mehmet Müdür",
                CreatedAt = new DateTime(2023, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            }
        );
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var entries = ChangeTracker.Entries<BaseEntity>();

        foreach (var entry in entries)
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = DateTime.UtcNow;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = DateTime.UtcNow;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
