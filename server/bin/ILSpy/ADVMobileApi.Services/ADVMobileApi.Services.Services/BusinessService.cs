using System.Collections.Generic;
using ADVMobileApi.Core.Models.Requests;
using ADVMobileApi.Core.Models.Responses;
using ADVMobileApi.Core.Models.Responses.Core;
using ADVMobileApi.Core.Repositories;
using ADVMobileApi.Core.Services;

namespace ADVMobileApi.Services.Services;

public class BusinessService : IBusinessService
{
	private IBusinessRepository _businessRepository;

	public BusinessService(IBusinessRepository businessRepository)
	{
		_businessRepository = businessRepository;
	}

	public ADVLoginResponse ValidateLogin(ADVLoginRequest aDVLoginRequest)
	{
		return _businessRepository.ValidateLogin(aDVLoginRequest);
	}

	public ADVLogCoordinatesResponse InsertLogCoordinates(ADVLogCoordinatesRequest aDVCoordinatesRequest)
	{
		return _businessRepository.InsertLogCoordinates(aDVCoordinatesRequest);
	}

	public List<DriverEvent> GetDriverEvents(string userName, string userID, int tennantId)
	{
		return _businessRepository.GetDriverEvents(userName, userID, tennantId);
	}

	public List<AppointmentEvent> GetApplicationEvents(string userName)
	{
		return _businessRepository.GetApplicationEvents(userName);
	}

	public bool UpdateAppointmentStatus(ADVUpdateAppointmentStatusRequest request)
	{
		return _businessRepository.UpdateAppointmentStatus(request);
	}

	public bool UpdateDriverEventStatus(ADVUpdateDriverEventStatusRequest request)
	{
		return _businessRepository.UpdateDriverEventStatus(request);
	}

	public bool UpdateDriverCallStatus(ADVUpdateDriverCallRequest request)
	{
		return _businessRepository.UpdateDriverCallStatus(request);
	}

	public void StartTrip(ADVStartTripRequest request)
	{
		_businessRepository.StartTrip(request);
	}

	public void EndTrip(ADVEndTripRequest request)
	{
		_businessRepository.EndTrip(request);
	}

	public bool UpdateUserCallStatus(ADVUpdateUserCallRequest request)
	{
		return _businessRepository.UpdateUserCallStatus(request);
	}
}
