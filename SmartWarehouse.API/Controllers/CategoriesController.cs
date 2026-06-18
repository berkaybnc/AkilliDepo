using Microsoft.AspNetCore.Mvc;
using SmartWarehouse.Service.DTOs;
using SmartWarehouse.Service.Interfaces;

namespace SmartWarehouse.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly ICategoryManager _manager;

    public CategoriesController(ICategoryManager manager)
    {
        _manager = manager;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string companyId)
    {
        if (string.IsNullOrEmpty(companyId)) return BadRequest();

        var result = await _manager.GetAllAsync(companyId);
        return Ok(new { success = true, data = result });
    }

    [HttpPost("create")]
    public async Task<IActionResult> Create([FromBody] CreateCategoryDto dto)
    {
        if (string.IsNullOrEmpty(dto.CompanyId)) return BadRequest();

        try
        {
            var result = await _manager.CreateAsync(dto);
            return Ok(new { success = true, data = result });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    [HttpPost("update")]
    public async Task<IActionResult> Update([FromBody] UpdateCategoryDto dto)
    {
        if (string.IsNullOrEmpty(dto.CompanyId)) return BadRequest();

        try
        {
            var result = await _manager.UpdateAsync(dto);
            return Ok(new { success = true, data = result });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    [HttpPost("delete")]
    public async Task<IActionResult> Delete([FromBody] DeleteDto dto)
    {
        if (string.IsNullOrEmpty(dto.CompanyId)) return BadRequest();

        var success = await _manager.DeleteAsync(dto.Id, dto.CompanyId);
        if (!success) return NotFound();

        return Ok(new { success = true });
    }
}
