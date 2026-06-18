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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Global soft delete filters
        modelBuilder.Entity<Category>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Product>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Zone>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<InventoryMovement>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Personnel>().HasQueryFilter(e => !e.IsDeleted);

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
