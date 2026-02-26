namespace CRM.API.DTOs
{
    public class ClientResponseDto
    {
        public string Id { get; set; } = string.Empty;

        public string CompanyName { get; set; } = string.Empty;

        public string ContactName { get; set; } = string.Empty;

        public string SalesTeam { get; set; } = string.Empty;

        public string Urgency { get; set; } = string.Empty;

        public DateTime ContractStartDate { get; set; }

        public DateTime ContractEndDate { get; set; }

        public string SalesContactName { get; set; } = string.Empty;

        public List<string> Features { get; set; } = new();

        public List<string> Upsells { get; set; } = new();

        public string LatestComment { get; set; } = string.Empty;

        public string LatestCommentBy { get; set; } = string.Empty;

        public DateTime? LatestCommentDate { get; set; }

        public int DocumentsCount { get; set; }
    }
}
