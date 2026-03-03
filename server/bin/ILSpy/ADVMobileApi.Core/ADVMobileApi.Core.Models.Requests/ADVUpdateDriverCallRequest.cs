namespace ADVMobileApi.Core.Models.Requests;

public class ADVUpdateDriverCallRequest
{
	public int EventId { get; set; }

	public bool IsCall { get; set; }

	public int TennantId { get; set; }

	public string UserName { get; set; }
}
