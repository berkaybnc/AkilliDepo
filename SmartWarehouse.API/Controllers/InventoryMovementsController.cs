using Microsoft.AspNetCore.Mvc;
using SmartWarehouse.Service.DTOs;
using SmartWarehouse.Service.Interfaces;

namespace SmartWarehouse.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InventoryMovementsController : ControllerBase
{
    private readonly IInventoryMovementManager _manager;

    public InventoryMovementsController(IInventoryMovementManager manager)
    {
        _manager = manager;
    }

    [HttpPost("create")]
    public async Task<IActionResult> Create([FromBody] CreateInventoryMovementDto dto)
    {
        if (string.IsNullOrEmpty(dto.CompanyId)) return BadRequest();

        try
        {
            var success = await _manager.AddMovementAsync(dto);
            return Ok(new { Success = success });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            // unexpected errors: 500 değil, UI'nin okuyabileceği hata ile 400 dönelim
            return BadRequest(new { Message = ex.Message });
        }

    }
}
