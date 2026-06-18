using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartWarehouse.Service.DTOs;
using SmartWarehouse.Service.Interfaces;

namespace SmartWarehouse.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ZonesController : ControllerBase
{
    private readonly IZoneManager _manager;

    public ZonesController(IZoneManager manager)
    {
        _manager = manager;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string companyId)
    {
        if (string.IsNullOrEmpty(companyId))
            return BadRequest(new { Message = "CompanyId is required." });

        try
        {
            var result = await _manager.GetAllAsync(companyId);
            return Ok(result);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }


    [Authorize(Roles = "DepoGorevlisi")]
    [HttpPost("create")]
    public async Task<IActionResult> Create([FromBody] CreateZoneDto dto)
    {
        if (string.IsNullOrEmpty(dto.CompanyId)) return BadRequest(new { Message = "CompanyId is required." });
        if (string.IsNullOrWhiteSpace(dto.Name)) return BadRequest(new { Message = "Zone name is required." });

        var result = await _manager.CreateAsync(dto);
        return Ok(result);
    }

    [Authorize(Roles = "DepoGorevlisi")]
    [HttpPost("update")]
    public async Task<IActionResult> Update([FromBody] UpdateZoneDto dto)
    {
        if (string.IsNullOrEmpty(dto.CompanyId)) return BadRequest(new { Message = "CompanyId is required." });

        try
        {
            var success = await _manager.UpdateAsync(dto);
            if (!success) return NotFound();
            return Ok(new { Success = true });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [Authorize(Roles = "DepoGorevlisi")]
    [HttpPost("delete")]
    public async Task<IActionResult> Delete([FromBody] DeleteDto dto)
    {
        if (string.IsNullOrEmpty(dto.CompanyId)) return BadRequest(new { Message = "CompanyId is required." });

        try
        {
            var success = await _manager.DeleteAsync(dto);
            if (!success) return NotFound();
            return Ok(new { Success = true });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }
}

