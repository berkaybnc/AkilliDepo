using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartWarehouse.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddMagazaMuduruRole : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "CompanyId", "CreatedAt", "FullName", "IsDeleted", "PasswordHash", "Role", "UpdatedAt", "Username" },
                values: new object[] { 3, "COMPANY-ABC-123", new DateTime(2023, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Mehmet Müdür", false, "123456", "MagazaMuduru", null, "mudur" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 3);
        }
    }
}
