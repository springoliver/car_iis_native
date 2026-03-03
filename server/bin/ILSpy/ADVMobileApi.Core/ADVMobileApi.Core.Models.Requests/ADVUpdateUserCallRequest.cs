namespace ADVMobileApi.Core.Models.Requests;

public class ADVUpdateUserCallRequest
{
	public int WebEventId { get; set; }

	public bool IsCall { get; set; }

	public int TennantId { get; set; }

	public string UserName { get; set; }
}
