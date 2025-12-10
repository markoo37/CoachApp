using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CoachCRM.Migrations
{
    /// <inheritdoc />
    public partial class AddPerformanceIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_TeamMemberships_TeamId_AthleteId",
                table: "TeamMemberships",
                columns: new[] { "TeamId", "AthleteId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Coaches_UserId",
                table: "Coaches",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_CoachAthletes_CoachId_AthleteId",
                table: "CoachAthletes",
                columns: new[] { "CoachId", "AthleteId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Athletes_UserId",
                table: "Athletes",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TeamMemberships_TeamId_AthleteId",
                table: "TeamMemberships");

            migrationBuilder.DropIndex(
                name: "IX_Coaches_UserId",
                table: "Coaches");

            migrationBuilder.DropIndex(
                name: "IX_CoachAthletes_CoachId_AthleteId",
                table: "CoachAthletes");

            migrationBuilder.DropIndex(
                name: "IX_Athletes_UserId",
                table: "Athletes");
        }
    }
}
