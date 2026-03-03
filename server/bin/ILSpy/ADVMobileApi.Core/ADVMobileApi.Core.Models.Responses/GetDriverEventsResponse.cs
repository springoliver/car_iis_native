using System.Collections.Generic;
using ADVMobileApi.Core.Enums;
using ADVMobileApi.Core.Models.Responses.Core;

namespace ADVMobileApi.Core.Models.Responses;

public class GetDriverEventsResponse
{
	public List<DriverEvent> DriverEvents { get; set; }

	public OperationStatus OperationStatus { get; set; }
}
