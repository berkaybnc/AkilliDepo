using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartWarehouse.Service.DTOs;
using SmartWarehouse.Service.Interfaces;

namespace SmartWarehouse.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IProductManager _manager;

    public ProductsController(IProductManager manager)
    {
        _manager = manager;
    }

    [HttpGet]
    public async Task<IActionResult> GetList([FromQuery] PagedRequestDto request)
    {
        if (string.IsNullOrEmpty(request.CompanyId))
        {
            return BadRequest(new { Message = "CompanyId is required." });
        }

        var result = await _manager.GetListAsync(request);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id, [FromQuery] string companyId)
    {
        if (string.IsNullOrEmpty(companyId)) return BadRequest();

        var entity = await _manager.GetByIdAsync(id, companyId);
        
        if (entity == null) return NotFound();
        
        return Ok(entity);
    }

    [Authorize(Roles = "DepoGorevlisi")]
    [HttpPost("create")]
    public async Task<IActionResult> Create([FromBody] CreateProductDto dto)
    {
        if (string.IsNullOrEmpty(dto.CompanyId)) return BadRequest();

        var result = await _manager.CreateAsync(dto);
        return Ok(result);
    }

    [Authorize(Roles = "DepoGorevlisi")]
    [HttpPost("update")]
    public async Task<IActionResult> Update([FromBody] UpdateProductDto dto)
    {
        if (string.IsNullOrEmpty(dto.CompanyId)) return BadRequest();

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
        if (string.IsNullOrEmpty(dto.CompanyId)) return BadRequest();

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
