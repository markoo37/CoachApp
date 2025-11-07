using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace CoachCRM.Migrations
{
    /// <inheritdoc />
    public partial class AddCoachAthletesTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CoachAthletes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CoachId = table.Column<int>(type: "integer", nullable: false),
                    AthleteId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CoachAthletes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CoachAthletes_Athletes_AthleteId",
                        column: x => x.AthleteId,
                        principalTable: "Athletes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CoachAthletes_Coaches_CoachId",
                        column: x => x.CoachId,
                        principalTable: "Coaches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Athletes_Email",
                table: "Athletes",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CoachAthletes_AthleteId",
                table: "CoachAthletes",
                column: "AthleteId");

            migrationBuilder.CreateIndex(
                name: "IX_CoachAthletes_CoachId",
                table: "CoachAthletes",
                column: "CoachId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CoachAthletes");

            migrationBuilder.DropIndex(
                name: "IX_Athletes_Email",
                table: "Athletes");
        }
    }
}
