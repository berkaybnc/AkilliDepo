using Microsoft.AspNetCore.Mvc;
using SmartWarehouse.Service.Interfaces;

namespace SmartWarehouse.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthManager _authManager;

    public AuthController(IAuthManager authManager)
    {
        _authManager = authManager;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto request, [FromQuery] string companyId)
    {
        if (string.IsNullOrEmpty(companyId))
            return BadRequest(new { Message = "CompanyId zorunludur." });

        var response = await _authManager.LoginAsync(request, companyId);
        
        if (response == null)
            return Unauthorized(new { Message = "Geçersiz kullanıcı adı veya şifre." });

        return Ok(response);
    }
}
