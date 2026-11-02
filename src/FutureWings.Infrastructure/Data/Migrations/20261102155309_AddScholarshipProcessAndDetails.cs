using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FutureWings.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddScholarshipProcessAndDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Scholarships",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FieldOfStudy",
                table: "Scholarships",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OfficialLink",
                table: "Scholarships",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RequiredDocuments",
                table: "Scholarships",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "StudyLevel",
                table: "Scholarships",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ProcessedWebhookEvents",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    StripeEventId = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    EventType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ProcessedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProcessedWebhookEvents", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ScholarshipInterests",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    ScholarshipId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ScholarshipInterests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ScholarshipInterests_Scholarships_ScholarshipId",
                        column: x => x.ScholarshipId,
                        principalTable: "Scholarships",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ScholarshipInterests_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ScholarshipChecklistSteps",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ScholarshipInterestId = table.Column<int>(type: "int", nullable: false),
                    StepKey = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    StepOrder = table.Column<int>(type: "int", nullable: false),
                    IsCompleted = table.Column<bool>(type: "bit", nullable: false),
                    CompletedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ScholarshipChecklistSteps", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ScholarshipChecklistSteps_ScholarshipInterests_ScholarshipInterestId",
                        column: x => x.ScholarshipInterestId,
                        principalTable: "ScholarshipInterests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProcessedWebhookEvents_StripeEventId",
                table: "ProcessedWebhookEvents",
                column: "StripeEventId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ScholarshipChecklistSteps_ScholarshipInterestId_StepOrder",
                table: "ScholarshipChecklistSteps",
                columns: new[] { "ScholarshipInterestId", "StepOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_ScholarshipInterests_ScholarshipId",
                table: "ScholarshipInterests",
                column: "ScholarshipId");

            migrationBuilder.CreateIndex(
                name: "IX_ScholarshipInterests_UserId_ScholarshipId",
                table: "ScholarshipInterests",
                columns: new[] { "UserId", "ScholarshipId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProcessedWebhookEvents");

            migrationBuilder.DropTable(
                name: "ScholarshipChecklistSteps");

            migrationBuilder.DropTable(
                name: "ScholarshipInterests");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "Scholarships");

            migrationBuilder.DropColumn(
                name: "FieldOfStudy",
                table: "Scholarships");

            migrationBuilder.DropColumn(
                name: "OfficialLink",
                table: "Scholarships");

            migrationBuilder.DropColumn(
                name: "RequiredDocuments",
                table: "Scholarships");

            migrationBuilder.DropColumn(
                name: "StudyLevel",
                table: "Scholarships");
        }
    }
}
