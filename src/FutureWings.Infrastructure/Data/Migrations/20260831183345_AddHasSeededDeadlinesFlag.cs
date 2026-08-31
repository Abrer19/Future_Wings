using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FutureWings.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddHasSeededDeadlinesFlag : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "HasSeededDeadlines",
                table: "Users",
                type: "bit",
                nullable: false,
                defaultValue: false);

            // Every account that exists at this point has already been through the old
            // seed-on-empty-read path, so mark them all as seeded. This is deliberately
            // unconditional rather than "only users who currently have deadlines":
            // a user who genuinely deleted all of theirs must stay empty, not have the
            // defaults handed back to them by this migration.
            migrationBuilder.Sql("UPDATE [Users] SET [HasSeededDeadlines] = 1;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HasSeededDeadlines",
                table: "Users");
        }
    }
}
