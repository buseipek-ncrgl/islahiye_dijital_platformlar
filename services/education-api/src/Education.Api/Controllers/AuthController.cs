using Education.Api.Security;
using Education.Application;
using Education.Infrastructure;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Education.Api.Controllers;

[ApiController, Route("api/v1/auth")]
public sealed class AuthController(UserManager<ApplicationUser> users, SignInManager<ApplicationUser> signIn, PermissionService permissions, IAntiforgery antiforgery) : ControllerBase
{
    [HttpGet("csrf"), AllowAnonymous] public ActionResult GetCsrf() { var tokens = antiforgery.GetAndStoreTokens(HttpContext); return Ok(new { token = tokens.RequestToken }); }
    [HttpPost("register"), AllowAnonymous, EnableRateLimiting("auth")]
    public async Task<ActionResult<UserResponse>> Register(RegisterRequest request)
    {
        var user = new ApplicationUser { UserName = request.Email.Trim(), Email = request.Email.Trim(), DisplayName = request.DisplayName.Trim() };
        var result = await users.CreateAsync(user, request.Password);
        if (!result.Succeeded) return ValidationProblem(new ValidationProblemDetails(result.Errors.GroupBy(x => x.Code).ToDictionary(x => x.Key, x => x.Select(y => y.Description).ToArray())));
        await users.AddToRoleAsync(user, "Applicant"); await signIn.SignInAsync(user, false);
        return Created("/api/v1/auth/me", new UserResponse(user.Id, user.Email!, user.DisplayName, ["Applicant"], []));
    }
    [HttpPost("login"), AllowAnonymous, EnableRateLimiting("auth")]
    public async Task<ActionResult<UserResponse>> Login(LoginRequest request)
    {
        var user = await users.FindByEmailAsync(request.Email); if (user is null || !user.IsActive) return Unauthorized();
        var result = await signIn.PasswordSignInAsync(user, request.Password, false, true); if (!result.Succeeded) return Unauthorized();
        return Ok(await ToResponse(user));
    }
    [HttpPost("logout"), Authorize] public async Task<IActionResult> Logout() { await signIn.SignOutAsync(); return NoContent(); }
    [HttpGet("me"), Authorize]
    public async Task<ActionResult<UserResponse>> Me() { var user = await users.GetUserAsync(User); return user is null || !user.IsActive ? Unauthorized() : Ok(await ToResponse(user)); }
    private async Task<UserResponse> ToResponse(ApplicationUser user) => new(user.Id, user.Email!, user.DisplayName, (await users.GetRolesAsync(user)).ToArray(), await permissions.GetPermissionsAsync(user));
}
