namespace CRM.API.DTOs
{
    public class CommentResponseDto
    {
        public string Id { get; set; } = string.Empty;
        public string ClientId { get; set; } = string.Empty;
        public string Text { get; set; } = string.Empty;
        public string CommentedByUserId { get; set; } = string.Empty;
        public string CommentedByName { get; set; } = string.Empty;
        public DateTime CommentDate { get; set; }
    }
}
