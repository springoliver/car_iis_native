using System;

namespace ADVMobileApi.Core.Models.Responses.Core;

public class AppointmentEvent
{
	public int WebEventId { get; set; }

	public string EventStatus { get; set; }

	public int EmployeeId { get; set; }

	public DateTime DueDate { get; set; }

	public string Address { get; set; }

	public int Duration { get; set; }

	public string Time { get; set; }

	public string FullName { get; set; }

	public string StartTime { get; set; }

	public string EndTime { get; set; }

	public int TennantId { get; set; }

	public string HomePhone { get; set; }
}
