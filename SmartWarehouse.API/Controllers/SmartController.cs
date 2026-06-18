using Microsoft.AspNetCore.Mvc;
using SmartWarehouse.Service.Interfaces;

namespace SmartWarehouse.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SmartController : ControllerBase
{
    private readonly ISmartManager _smartManager;

    public SmartController(ISmartManager smartManager)
    {
        _smartManager = smartManager;
    }

    [HttpGet("restock-predictions")]
    public async Task<IActionResult> GetRestockPredictions([FromQuery] string companyId)
    {
        if (string.IsNullOrEmpty(companyId)) return BadRequest("CompanyId gereklidir.");
        var predictions = await _smartManager.GetRestockPredictionsAsync(companyId);
        return Ok(predictions);
    }

    [HttpGet("suggest-zone")]
    public async Task<IActionResult> GetZoneSuggestion([FromQuery] int categoryId, [FromQuery] string companyId)
    {
        if (string.IsNullOrEmpty(companyId)) return BadRequest("CompanyId gereklidir.");
        var suggestion = await _smartManager.GetZoneSuggestionAsync(categoryId, companyId);
        if (suggestion == null) return NotFound("Öneri bulunamadı.");
        
        return Ok(suggestion);
    }
}
