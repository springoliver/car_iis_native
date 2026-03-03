using System;

namespace ADVMobileApi.Core.Models.DbModels;

public class AppointmentEventDbModel
{
	public int webeventid { get; set; }

	public int EventStatus { get; set; }

	public int employeeid { get; set; }

	public DateTime DueDate { get; set; }

	public string Address { get; set; }

	public int duration { get; set; }

	public string Time { get; set; }

	public string FullName { get; set; }

	public string starttime { get; set; }

	public string endtime { get; set; }

	public int Tennantid { get; set; }

	public string HomePhone { get; set; }
}
