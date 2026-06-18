using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartWarehouse.Data.Migrations
{
    /// <inheritdoc />
    public partial class RenameReferenceToPersonnel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ReferenceNumber",
                table: "InventoryMovements",
                newName: "PersonnelName");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "PersonnelName",
                table: "InventoryMovements",
                newName: "ReferenceNumber");
        }
    }
}
