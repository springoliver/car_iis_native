using System;

namespace ADVMobileApi.Core.Models.Requests;

public class ADVLogCoordinatesRequest
{
	public int TenantId { get; set; }

	public DateTime LogDate { get; set; }

	public string Longitude { get; set; }

	public string Latitude { get; set; }

	public string Action { get; set; }

	public string Role { get; set; }

	public string UserName { get; set; }

	public int EventId { get; set; }
}
