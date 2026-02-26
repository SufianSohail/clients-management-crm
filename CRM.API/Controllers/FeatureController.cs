using CRM.API.Models;
using CRM.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace CRM.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FeatureController : ControllerBase
    {
        private readonly FeatureService _featureService;

        public FeatureController(FeatureService featureService)
        {
            _featureService = featureService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            return Ok(await _featureService.GetAllAsync());
        }

        [HttpPost]
        public async Task<IActionResult> Create(Feature feature)
        {
            await _featureService.CreateAsync(feature);
            return Ok(feature);
        }
    }
}
