using CRM.API.Models;
using CRM.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CRM.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UpsellController : ControllerBase
    {
        private readonly UpsellService _upsellService;

        public UpsellController(UpsellService upsellService)
        {
            _upsellService = upsellService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            return Ok(await _upsellService.GetAllAsync());
        }

        [HttpPost]
        public async Task<IActionResult> Create(Upsell upsell)
        {
            await _upsellService.CreateAsync(upsell);
            return Ok(upsell);
        }
    }
}
