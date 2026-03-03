namespace ADVMobileApi.Core.Models.Requests;

public class ADVUpdateDriverEventStatusRequest
{
	public int EventId { get; set; }

	public string EventStatus { get; set; }

	public string Latitude { get; set; }

	public string Longitude { get; set; }

	public int TenantId { get; set; }

	public string UserName { get; set; }
}
