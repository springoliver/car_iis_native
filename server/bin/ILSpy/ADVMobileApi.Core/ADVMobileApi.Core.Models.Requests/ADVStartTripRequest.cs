using System;

namespace ADVMobileApi.Core.Models.Requests;

public class ADVStartTripRequest
{
	public int TenantId { get; set; }

	public DateTime LogDate { get; set; }

	public string Longitude { get; set; }

	public string Latitude { get; set; }

	public string UserName { get; set; }

	public string RouteNo { get; set; }
}
