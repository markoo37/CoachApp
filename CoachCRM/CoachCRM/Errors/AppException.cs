namespace CoachCRM.Errors;

public abstract class AppException : Exception
{
    public string Code {get;}
    public int StatusCode {get;}
    
    public AppException(string code, int statusCode)
    {
        Code = code;
        StatusCode = statusCode;
    }
}

public sealed class NotFoundAppException : AppException
{
    public NotFoundAppException(string code) : base(code, StatusCodes.Status404NotFound){}
}

public sealed class ForbiddenAppException : AppException
{
    public ForbiddenAppException(string code) : base(code, StatusCodes.Status403Forbidden){}
}

public sealed class UnauthorizedAppException : AppException
{
    public UnauthorizedAppException(string code) : base(code, StatusCodes.Status401Unauthorized){}
}

public sealed class ConflictAppException : AppException
{
    public ConflictAppException(string code) : base(code, StatusCodes.Status409Conflict){}
}

public sealed class ValidationAppException : AppException
{
    public ValidationAppException(string code = ErrorCodes.InvalidRequest) : base(code, StatusCodes.Status400BadRequest){}
}