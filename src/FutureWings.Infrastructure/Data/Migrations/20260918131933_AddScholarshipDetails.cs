using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FutureWings.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddScholarshipDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Scholarships_CountryId",
                table: "Scholarships");

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Scholarships",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AddColumn<decimal>(
                name: "AwardAmount",
                table: "Scholarships",
                type: "decimal(12,2)",
                precision: 12,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "Deadline",
                table: "Scholarships",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EligibilityCriteria",
                table: "Scholarships",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Scholarships_CountryId_Name",
                table: "Scholarships",
                columns: new[] { "CountryId", "Name" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Scholarships_CountryId_Name",
                table: "Scholarships");

            migrationBuilder.DropColumn(
                name: "AwardAmount",
                table: "Scholarships");

            migrationBuilder.DropColumn(
                name: "Deadline",
                table: "Scholarships");

            migrationBuilder.DropColumn(
                name: "EligibilityCriteria",
                table: "Scholarships");

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Scholarships",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(200)",
                oldMaxLength: 200);

            migrationBuilder.CreateIndex(
                name: "IX_Scholarships_CountryId",
                table: "Scholarships",
                column: "CountryId");
        }
    }
}
