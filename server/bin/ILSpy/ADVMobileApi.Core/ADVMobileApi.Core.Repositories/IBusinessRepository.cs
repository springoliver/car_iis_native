using System.Collections.Generic;
using ADVMobileApi.Core.Models.Requests;
using ADVMobileApi.Core.Models.Responses;
using ADVMobileApi.Core.Models.Responses.Core;

namespace ADVMobileApi.Core.Repositories;

public interface IBusinessRepository
{
	ADVLoginResponse ValidateLogin(ADVLoginRequest aDVLoginRequest);

	ADVLogCoordinatesResponse InsertLogCoordinates(ADVLogCoordinatesRequest aDVCoordinatesRequest);

	List<DriverEvent> GetDriverEvents(string userName, string userID, int tennantId);

	List<AppointmentEvent> GetApplicationEvents(string userName);

	bool UpdateAppointmentStatus(ADVUpdateAppointmentStatusRequest request);

	bool UpdateDriverEventStatus(ADVUpdateDriverEventStatusRequest request);

	bool UpdateDriverCallStatus(ADVUpdateDriverCallRequest request);

	void StartTrip(ADVStartTripRequest request);

	void EndTrip(ADVEndTripRequest request);

	bool UpdateUserCallStatus(ADVUpdateUserCallRequest request);
}
