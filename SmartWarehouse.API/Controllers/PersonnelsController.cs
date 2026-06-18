using Microsoft.AspNetCore.Mvc;
using SmartWarehouse.Service.DTOs;
using SmartWarehouse.Service.Interfaces;

namespace SmartWarehouse.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PersonnelsController : ControllerBase
{
    private readonly IPersonnelManager _personnelManager;

    public PersonnelsController(IPersonnelManager personnelManager)
    {
        _personnelManager = personnelManager;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string companyId)
    {
        if (string.IsNullOrEmpty(companyId)) return BadRequest("CompanyId gereklidir.");
        var list = await _personnelManager.GetAllPersonnelsAsync(companyId);
        return Ok(list);
    }

    [HttpPost("create")]
    public async Task<IActionResult> Create([FromBody] CreatePersonnelDto dto)
    {
        if (string.IsNullOrEmpty(dto.CompanyId)) return BadRequest();
        try
        {
            var created = await _personnelManager.CreatePersonnelAsync(dto);
            return Ok(created);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("update")]
    public async Task<IActionResult> Update([FromBody] UpdatePersonnelDto dto)
    {
        if (string.IsNullOrEmpty(dto.CompanyId)) return BadRequest();
        try
        {
            await _personnelManager.UpdatePersonnelAsync(dto);
            return Ok(new { success = true });
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("delete")]
    public async Task<IActionResult> Delete([FromBody] DeleteDto dto)
    {
        if (string.IsNullOrEmpty(dto.CompanyId)) return BadRequest();
        try
        {
            await _personnelManager.DeletePersonnelAsync(dto.Id, dto.CompanyId);
            return Ok(new { success = true });
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
