using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FutureWings.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddProgramDetailsFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Programs",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OfficialLink",
                table: "Programs",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Requirements",
                table: "Programs",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Description",
                table: "Programs");

            migrationBuilder.DropColumn(
                name: "OfficialLink",
                table: "Programs");

            migrationBuilder.DropColumn(
                name: "Requirements",
                table: "Programs");
        }
    }
}
