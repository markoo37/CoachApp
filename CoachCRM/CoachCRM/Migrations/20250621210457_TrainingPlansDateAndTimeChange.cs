using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CoachCRM.Migrations
{
    /// <inheritdoc />
    public partial class TrainingPlansDateAndTimeChange : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EndDate",
                table: "TrainingPlans");

            migrationBuilder.RenameColumn(
                name: "StartDate",
                table: "TrainingPlans",
                newName: "Date");

            migrationBuilder.AddColumn<TimeOnly>(
                name: "EndTime",
                table: "TrainingPlans",
                type: "time",
                nullable: true);

            migrationBuilder.AddColumn<TimeOnly>(
                name: "StartTime",
                table: "TrainingPlans",
                type: "time",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EndTime",
                table: "TrainingPlans");

            migrationBuilder.DropColumn(
                name: "StartTime",
                table: "TrainingPlans");

            migrationBuilder.RenameColumn(
                name: "Date",
                table: "TrainingPlans",
                newName: "StartDate");

            migrationBuilder.AddColumn<DateTime>(
                name: "EndDate",
                table: "TrainingPlans",
                type: "date",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));
        }
    }
}
