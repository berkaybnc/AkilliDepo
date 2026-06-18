using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartWarehouse.Data.Migrations
{
    public partial class AddZoneFeatures : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Capacity",
                table: "Zones",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ZoneId",
                table: "Products",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "FromZoneId",
                table: "InventoryMovements",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Products_ZoneId",
                table: "Products",
                column: "ZoneId");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryMovements_FromZoneId",
                table: "InventoryMovements",
                column: "FromZoneId");

            migrationBuilder.AddForeignKey(
                name: "FK_InventoryMovements_Zones_FromZoneId",
                table: "InventoryMovements",
                column: "FromZoneId",
                principalTable: "Zones",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Products_Zones_ZoneId",
                table: "Products",
                column: "ZoneId",
                principalTable: "Zones",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            // Existing FK constraint update to Restrict
            migrationBuilder.DropForeignKey(
                name: "FK_InventoryMovements_Zones_ZoneId",
                table: "InventoryMovements");

            migrationBuilder.AddForeignKey(
                name: "FK_InventoryMovements_Zones_ZoneId",
                table: "InventoryMovements",
                column: "ZoneId",
                principalTable: "Zones",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_InventoryMovements_Zones_FromZoneId",
                table: "InventoryMovements");

            migrationBuilder.DropForeignKey(
                name: "FK_Products_Zones_ZoneId",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_Products_ZoneId",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_InventoryMovements_FromZoneId",
                table: "InventoryMovements");

            migrationBuilder.DropColumn(
                name: "Capacity",
                table: "Zones");

            migrationBuilder.DropColumn(
                name: "ZoneId",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "FromZoneId",
                table: "InventoryMovements");

            migrationBuilder.DropForeignKey(
                name: "FK_InventoryMovements_Zones_ZoneId",
                table: "InventoryMovements");

            migrationBuilder.AddForeignKey(
                name: "FK_InventoryMovements_Zones_ZoneId",
                table: "InventoryMovements",
                column: "ZoneId",
                principalTable: "Zones",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
