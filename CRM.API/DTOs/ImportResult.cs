using CRM.API.Models;
namespace CRM.API.DTOs
{
    public class ImportResultDto
    {
        public int Imported { get; set; } = 0;
        public int Skipped { get; set; } = 0;
    }
}
