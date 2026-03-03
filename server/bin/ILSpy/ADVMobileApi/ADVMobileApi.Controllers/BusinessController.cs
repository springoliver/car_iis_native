using System.Web.Http;
using ADVMobileApi.Core.Enums;
using ADVMobileApi.Core.Models.Requests;
using ADVMobileApi.Core.Models.Responses;
using ADVMobileApi.Core.Services;

namespace ADVMobileApi.Controllers;

public class BusinessController : ApiController
{
	private IBusinessService _businessService;

	public BusinessController(IBusinessService businessService)
	{
		_businessService = businessService;
	}

	[HttpPost]
	[Route("business/login")]
	public ADVLoginResponse Login(ADVLoginRequest loginRequest)
	{
		return _businessService.ValidateLogin(loginRequest);
	}

	[HttpPost]
	[Route("business/insertcoordinates")]
	public ADVLogCoordinatesResponse InsertCoordinates(ADVLogCoordinatesRequest coordinatesRequest)
	{
		return _businessService.InsertLogCoordinates(coordinatesRequest);
	}

	[HttpGet]
	[Route("business/getdriverevents")]
	public GetDriverEventsResponse GetDriverEvents(string userName, string userID, int tennantId)
	{
		GetDriverEventsResponse getDriverEventsResponse = new GetDriverEventsResponse();
		getDriverEventsResponse.DriverEvents = _businessService.GetDriverEvents(userName, userID, tennantId);
		getDriverEventsResponse.OperationStatus = OperationStatus.SUCCESS;
		return getDriverEventsResponse;
	}

	[HttpGet]
	[Route("business/getapplicationevents")]
	public GetApplicationEventsResponse GetApplicationEvents(string userName)
	{
		GetApplicationEventsResponse getDriverEventsResponse = new GetApplicationEventsResponse();
		getDriverEventsResponse.AppointmentEvents = _businessService.GetApplicationEvents(userName);
		getDriverEventsResponse.OperationStatus = OperationStatus.SUCCESS;
		return getDriverEventsResponse;
	}

	[HttpPost]
	[Route("business/updateappointmentstatus")]
	public ADVUpdateStatusResponse UpdateAppointmentStatus(ADVUpdateAppointmentStatusRequest request)
	{
		ADVUpdateStatusResponse getDriverEventsResponse = new ADVUpdateStatusResponse();
		if (_businessService.UpdateAppointmentStatus(request))
		{
			getDriverEventsResponse.OperationStatus = OperationStatus.SUCCESS;
		}
		else
		{
			getDriverEventsResponse.OperationStatus = OperationStatus.FAILURE;
		}
		return getDriverEventsResponse;
	}

	[HttpPost]
	[Route("business/updatedrivereventstatus")]
	public ADVUpdateStatusResponse UpdateDriverEventStatus(ADVUpdateDriverEventStatusRequest request)
	{
		ADVUpdateStatusResponse getDriverEventsResponse = new ADVUpdateStatusResponse();
		if (_businessService.UpdateDriverEventStatus(request))
		{
			getDriverEventsResponse.OperationStatus = OperationStatus.SUCCESS;
		}
		else
		{
			getDriverEventsResponse.OperationStatus = OperationStatus.FAILURE;
		}
		return getDriverEventsResponse;
	}

	[HttpPost]
	[Route("business/updatedrivercallstatus")]
	public ADVUpdateStatusResponse UpdateDriverCallStatus(ADVUpdateDriverCallRequest request)
	{
		ADVUpdateStatusResponse getDriverEventsResponse = new ADVUpdateStatusResponse();
		if (_businessService.UpdateDriverCallStatus(request))
		{
			getDriverEventsResponse.OperationStatus = OperationStatus.SUCCESS;
		}
		else
		{
			getDriverEventsResponse.OperationStatus = OperationStatus.FAILURE;
		}
		return getDriverEventsResponse;
	}

	[HttpPost]
	[Route("business/starttrip")]
	public ADVUpdateStatusResponse StartTrip(ADVStartTripRequest request)
	{
		_businessService.StartTrip(request);
		return new ADVUpdateStatusResponse
		{
			OperationStatus = OperationStatus.SUCCESS
		};
	}

	[HttpPost]
	[Route("business/endtrip")]
	public ADVUpdateStatusResponse EndTrip(ADVEndTripRequest request)
	{
		_businessService.EndTrip(request);
		return new ADVUpdateStatusResponse
		{
			OperationStatus = OperationStatus.SUCCESS
		};
	}

	[HttpPost]
	[Route("business/updateusercallstatus")]
	public ADVUpdateStatusResponse UpdateUserCallStatus(ADVUpdateUserCallRequest request)
	{
		ADVUpdateStatusResponse getDriverEventsResponse = new ADVUpdateStatusResponse();
		if (_businessService.UpdateUserCallStatus(request))
		{
			getDriverEventsResponse.OperationStatus = OperationStatus.SUCCESS;
		}
		else
		{
			getDriverEventsResponse.OperationStatus = OperationStatus.FAILURE;
		}
		return getDriverEventsResponse;
	}
}
