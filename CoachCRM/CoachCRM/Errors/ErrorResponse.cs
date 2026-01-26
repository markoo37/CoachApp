namespace CoachCRM.Errors;

public sealed class ErrorResponse
{
    public required string Code { get; init; }
    public string? TraceId { get; init; }
}