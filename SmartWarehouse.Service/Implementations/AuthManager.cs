using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using SmartWarehouse.Data;
using SmartWarehouse.Service.Interfaces;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace SmartWarehouse.Service.Implementations;

public class AuthManager : IAuthManager
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthManager(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<LoginResponseDto?> LoginAsync(LoginRequestDto request, string companyId)
    {
        // Basit kontrol (Gerçekte Hash kontrolü yapılmalı)
        var user = await _context.Users.FirstOrDefaultAsync(u => 
            u.CompanyId == companyId && 
            u.Username == request.Username && 
            u.PasswordHash == request.Password);

        if (user == null)
            return null;

        var tokenHandler = new JwtSecurityTokenHandler();
        var keyString = _configuration["Jwt:Key"] ?? "SuperSecretKeyForSmartWarehouse!1234567890";
        var key = Encoding.ASCII.GetBytes(keyString);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim("CompanyId", user.CompanyId),
            new Claim("FullName", user.FullName)
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddHours(8),
            Issuer = _configuration["Jwt:Issuer"] ?? "SmartWarehouseApp",
            Audience = _configuration["Jwt:Audience"] ?? "SmartWarehouseUsers",
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);

        return new LoginResponseDto
        {
            Token = tokenHandler.WriteToken(token),
            Username = user.Username,
            FullName = user.FullName,
            Role = user.Role
        };
    }
}
