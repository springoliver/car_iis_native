using System;

namespace ADVMobileApi.Core.Models.Requests;

public class ADVEndTripRequest
{
	public int TenantId { get; set; }

	public DateTime LogDate { get; set; }

	public string Longitude { get; set; }

	public string Latitude { get; set; }

	public string UserName { get; set; }

	public string EventIds { get; set; }

	public string RouteNo { get; set; }
}
