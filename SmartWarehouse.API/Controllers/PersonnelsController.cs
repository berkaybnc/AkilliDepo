using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartWarehouse.Service.DTOs;
using SmartWarehouse.Service.Interfaces;

namespace SmartWarehouse.API.Controllers;

[Authorize]
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
    // Hem Mağaza Müdürü hem Depo Görevlisi personelleri listeleyebilsin (Stok hareketi yaparken vs.)
    public async Task<IActionResult> GetAll([FromQuery] string companyId)
    {
        if (string.IsNullOrEmpty(companyId)) return BadRequest("CompanyId gereklidir.");
        var list = await _personnelManager.GetAllPersonnelsAsync(companyId);
        return Ok(list);
    }

    [Authorize(Roles = "MagazaMuduru")]
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

    [Authorize(Roles = "MagazaMuduru")]
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

    [Authorize(Roles = "MagazaMuduru")]
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
