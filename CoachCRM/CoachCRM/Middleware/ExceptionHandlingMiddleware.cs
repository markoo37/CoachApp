using System.Text.Json;
using CoachCRM.Errors;

namespace CoachCRM.Middleware;

public sealed class ExceptionHandlingMiddleware : IMiddleware
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        try
        {
            await next(context);
        }
        catch (AppException ex)
        {
            await WriteErrorAsync(context, ex.StatusCode, ex.Code);
        }
        catch (Exception)
        {
            await WriteErrorAsync(context, StatusCodes.Status500InternalServerError, ErrorCodes.UnknownError);
        }
    }

    private static async Task WriteErrorAsync(HttpContext context, int statusCode, string code)
    {
        if (context.Response.HasStarted) return;

        context.Response.Clear();
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json";

        var payload = new ErrorResponse
        {
            Code = code,
            TraceId = context.TraceIdentifier
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(payload, JsonOptions));
    }
}