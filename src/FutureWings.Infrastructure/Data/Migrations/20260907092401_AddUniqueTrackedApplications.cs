using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FutureWings.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueTrackedApplications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Applications_UserId",
                table: "Applications");

            migrationBuilder.CreateIndex(
                name: "IX_Applications_UserId_ProgramId",
                table: "Applications",
                columns: new[] { "UserId", "ProgramId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Applications_UserId_ProgramId",
                table: "Applications");

            migrationBuilder.CreateIndex(
                name: "IX_Applications_UserId",
                table: "Applications",
                column: "UserId");
        }
    }
}
