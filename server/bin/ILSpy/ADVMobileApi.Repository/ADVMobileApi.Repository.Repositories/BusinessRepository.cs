using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;
using ADVMobileApi.Core.Enums;
using ADVMobileApi.Core.Models.DbModels;
using ADVMobileApi.Core.Models.Requests;
using ADVMobileApi.Core.Models.Responses;
using ADVMobileApi.Core.Models.Responses.Core;
using ADVMobileApi.Core.Repositories;
using ADVMobileApi.Core.Utilities;
using Dapper;

namespace ADVMobileApi.Repository.Repositories;

public class BusinessRepository : IBusinessRepository
{
	public ADVLoginResponse ValidateLogin(ADVLoginRequest aDVLoginRequest)
	{
		ADVLoginResponse aDVLoginResponse = new ADVLoginResponse();
		using (SqlConnection connection = new SqlConnection(Utility.GetConfig("ConnectionString")))
		{
			string validateQry = "select au.Tennantid TennantId,au.UserId,ut.UserType RoleType,au.UserName from aspnet_Membership am\r\n                                    join aspnet_Users au on au.UserId = am.UserId\r\n\t\t\t\t\t\t\t\t\tjoin ADV_TennantUser at on au.UserId = at.UserId\r\n\t\t\t\t\t\t\t\t\tjoin ADV_Tennant att on at.TennantId = att.TennantId\r\n\t\t\t\t\t\t\t\t\tjoin ADV_UserTypes ut on ut.USERTypeID = at.UserType\r\n                                    where au.LoweredUserName = @UserName and am.Password=@Password and att.Suffix =@TenantCode";
			string tenantCode = aDVLoginRequest.UserName.Substring(aDVLoginRequest.UserName.Length - 3);
			aDVLoginRequest.UserName = aDVLoginRequest.UserName.Remove(aDVLoginRequest.UserName.Length - 3);
			ADVLoginResponse validateResp = connection.Query<ADVLoginResponse>(validateQry, new
			{
				UserName = aDVLoginRequest.UserName,
				Password = aDVLoginRequest.Password,
				TenantCode = tenantCode
			}).SingleOrDefault();
			if (validateResp == null || validateResp.UserId == Guid.Empty)
			{
				aDVLoginResponse.LoginStatus = LoginStatus.INVALID;
			}
			else
			{
				aDVLoginResponse = validateResp;
				aDVLoginResponse.LoginStatus = LoginStatus.VALID;
			}
		}
		return aDVLoginResponse;
	}

	public ADVLogCoordinatesResponse InsertLogCoordinates(ADVLogCoordinatesRequest aDVCoordinatesRequest)
	{
		ADVLogCoordinatesResponse aDVCoordinatesResponse = new ADVLogCoordinatesResponse();
		using SqlConnection connection = new SqlConnection(Utility.GetConfig("ConnectionString"));
		string insertQry = "UpdateMobileLog @tennantid,@dt,@longitude,@userLogon,@action,@Latitude,@role,@eventid,@Logid";
		connection.Query(insertQry, new
		{
			tennantid = aDVCoordinatesRequest.TenantId,
			dt = aDVCoordinatesRequest.LogDate,
			longitude = aDVCoordinatesRequest.Longitude,
			action = aDVCoordinatesRequest.Action,
			Latitude = aDVCoordinatesRequest.Latitude,
			role = aDVCoordinatesRequest.Role,
			userLogon = aDVCoordinatesRequest.UserName,
			eventid = aDVCoordinatesRequest.EventId,
			Logid = 0
		}).SingleOrDefault();
		aDVCoordinatesResponse.OperationStatus = OperationStatus.SUCCESS;
		return aDVCoordinatesResponse;
	}

	public List<DriverEvent> GetDriverEvents(string userName, string userID, int tennantId)
	{
		List<DriverEvent> driverEvents = new List<DriverEvent>();
		using (SqlConnection connection = new SqlConnection(Utility.GetConfig("ConnectionString")))
		{
			string getDriverEventsSp = "sp_getMobileData @userName,'SelectClientsONRoute'";
			List<DriverEventDbModel> dbDriverEvents = connection.Query<DriverEventDbModel>(getDriverEventsSp, new { userName }).ToList();
			if (dbDriverEvents != null)
			{
				string insertQry = "INSERT INTO ADV_Driver_Events(DriverId,SrcEventId,DriverUserName,TennantId,Address,City,Gender,FullName,HomePhone,Route,EventStatus,Event) OUTPUT INSERTED.Driver_Event_Id VALUES(@DriverId,@SrcEventId,@DriverUserName,@TennantId,@Address,@City,@Gender,@FullName,@HomePhone,@Route,@EventStatus,@Event)";
				string updateQry = "UPDATE ADV_Driver_Events set Address=@Address,City=@City,Gender=@Gender,FullName=@FullName,HomePhone=@HomePhone,Route=@Route,EventStatus=@EventStatus,Event=@Event where SrcEventId = @EventId";
				dbDriverEvents = (dbDriverEvents.Any((DriverEventDbModel x) => x.@event.ToLower() == "pickup" && (x.eventstatus == 1 || x.eventstatus == 19)) ? dbDriverEvents.Where((DriverEventDbModel x) => x.@event.ToLower() == "pickup").ToList() : dbDriverEvents.Where((DriverEventDbModel x) => x.@event.ToLower() == "drop off").ToList());
				foreach (DriverEventDbModel item in dbDriverEvents)
				{
					if (connection.Query<int>("SELECT SrcEventId from ADV_Driver_Events where SrcEventId = @EventId", new
					{
						EventId = item.eventid
					}).SingleOrDefault() == 0)
					{
						connection.Query<int>(insertQry, new
						{
							DriverId = userID,
							SrcEventId = item.eventid,
							DriverUserName = userName,
							TennantId = tennantId,
							Address = item.cAddress,
							City = item.city,
							Gender = item.gender,
							FullName = item.fullname,
							HomePhone = item.homephone,
							Route = item.route,
							EventStatus = item.eventstatus,
							Event = item.@event
						}).SingleOrDefault();
					}
					else
					{
						connection.Query(updateQry, new
						{
							EventId = item.eventid,
							Address = item.cAddress,
							City = item.city,
							Gender = item.gender,
							FullName = item.fullname,
							HomePhone = item.homephone,
							Route = item.route,
							EventStatus = item.eventstatus,
							Event = item.@event
						});
					}
				}
				driverEvents = dbDriverEvents.Select((DriverEventDbModel x) => new DriverEvent
				{
					City = x.city,
					CustomerAddress = x.cAddress,
					EventId = x.eventid,
					EventStatus = GetStatus(x.eventstatus),
					FullName = x.fullname,
					Gender = x.gender,
					HomePhone = x.homephone,
					Route = x.route,
					Event = x.@event
				}).ToList();
			}
		}
		return driverEvents;
	}

	public List<AppointmentEvent> GetApplicationEvents(string userName)
	{
		List<AppointmentEvent> applicationEvents = new List<AppointmentEvent>();
		using (SqlConnection connection = new SqlConnection(Utility.GetConfig("ConnectionString")))
		{
			string getDriverEventsSp = "sp_getMobileData @userName,'SelectAppointmentsUser'";
			List<AppointmentEventDbModel> dbDriverEvents = connection.Query<AppointmentEventDbModel>(getDriverEventsSp, new { userName }).ToList();
			if (dbDriverEvents != null)
			{
				applicationEvents = dbDriverEvents.Select((AppointmentEventDbModel x) => new AppointmentEvent
				{
					Address = x.Address,
					DueDate = x.DueDate,
					Duration = x.duration,
					EmployeeId = x.employeeid,
					EndTime = x.endtime,
					EventStatus = GetStatus(x.EventStatus),
					FullName = x.FullName,
					StartTime = x.starttime,
					TennantId = x.Tennantid,
					Time = x.Time,
					WebEventId = x.webeventid,
					HomePhone = x.HomePhone
				}).ToList();
			}
		}
		return applicationEvents;
	}

	public bool UpdateAppointmentStatus(ADVUpdateAppointmentStatusRequest request)
	{
		ADVLogCoordinatesRequest logData = new ADVLogCoordinatesRequest();
		using (SqlConnection connection = new SqlConnection(Utility.GetConfig("ConnectionString")))
		{
			logData.Action = request.EventStatus;
			logData.Latitude = request.Latitude;
			logData.Longitude = request.Longitude;
			logData.TenantId = request.TenantId;
			logData.LogDate = DateTime.Now;
			logData.Role = "Employee";
			logData.UserName = request.UserName;
			logData.EventId = request.WebEventId;
			InsertLogCoordinates(logData);
			if (request.EventStatus == "STARTED")
			{
				int statusId = 19;
				string updateQry = "UPDATE ADV_Events set starttime=getdate(), EventStatus = @EventStatus,StartLatitude= @StartLatitude,StartLongitue = @StartLongitude  where webeventid = @webeventid";
				connection.Query(updateQry, new
				{
					webeventid = request.WebEventId,
					EventStatus = statusId,
					StartLatitude = request.Latitude,
					StartLongitude = request.Longitude
				}).SingleOrDefault();
				return true;
			}
			if (request.EventStatus == "COMPLETED")
			{
				int statusId2 = 30;
				string updateQry2 = "UPDATE ADV_Events set endtime=getdate(), EventStatus = @EventStatus,StopLatitude= @StopLatitude,StopLongitue = @StopLongitude  where webeventid = @webeventid";
				connection.Query(updateQry2, new
				{
					webeventid = request.WebEventId,
					EventStatus = statusId2,
					StopLatitude = request.Latitude,
					StopLongitude = request.Longitude
				}).SingleOrDefault();
				return true;
			}
			if (request.EventStatus == "NOSHOW")
			{
				int statusId3 = 21;
				string updateQry3 = "UPDATE ADV_Events set EventStatus = @EventStatus where webeventid = @webeventid";
				connection.Query(updateQry3, new
				{
					webeventid = request.WebEventId,
					EventStatus = statusId3
				}).SingleOrDefault();
				return true;
			}
			if (request.EventStatus == "CANCELALL")
			{
				string updateQry4 = "UPDATE ADV_Events set starttime=null,endtime=null, EventStatus = @EventStatus,StopLatitude= null,StopLongitue = null,StartLatitude= null,StartLongitue = null where webeventid = @webeventid";
				connection.Query(updateQry4, new
				{
					webeventid = request.WebEventId,
					EventStatus = 1
				}).SingleOrDefault();
				return true;
			}
		}
		return false;
	}

	public bool UpdateDriverEventStatus(ADVUpdateDriverEventStatusRequest request)
	{
		ADVLogCoordinatesRequest logData = new ADVLogCoordinatesRequest();
		using (SqlConnection connection = new SqlConnection(Utility.GetConfig("ConnectionString")))
		{
			logData.Action = request.EventStatus;
			logData.Latitude = request.Latitude;
			logData.Longitude = request.Longitude;
			logData.TenantId = request.TenantId;
			logData.LogDate = DateTime.Now;
			logData.Role = "DRIVER";
			logData.UserName = request.UserName;
			logData.EventId = request.EventId;
			InsertLogCoordinates(logData);
			if (request.EventStatus == "CHECKEDIN")
			{
				int statusId = 19;
				string updateQry = "UPDATE adv_driver_events set EventStatus = @EventStatus,StartLatitude= @StartLatitude,StartLongitude = @StartLongitude  where SrcEventId = @eventid";
				connection.Query(updateQry, new
				{
					eventid = request.EventId,
					EventStatus = statusId,
					StartLatitude = request.Latitude,
					StartLongitude = request.Longitude
				}).SingleOrDefault();
				return true;
			}
			if (request.EventStatus == "CHECKEDOUT")
			{
				int statusId2 = 30;
				string updateQry2 = "UPDATE adv_driver_events set EventStatus = @EventStatus,StopLatitude= @StopLatitude,StopLongitude = @StopLongitude  where SrcEventId = @eventid";
				connection.Query(updateQry2, new
				{
					eventid = request.EventId,
					EventStatus = statusId2,
					StopLatitude = request.Latitude,
					StopLongitude = request.Longitude
				}).SingleOrDefault();
				return true;
			}
			if (request.EventStatus == "NOSHOW")
			{
				int statusId3 = 21;
				string updateQry3 = "UPDATE adv_driver_events set EventStatus = @EventStatus where SrcEventId = @eventid";
				connection.Query(updateQry3, new
				{
					eventid = request.EventId,
					EventStatus = statusId3
				}).SingleOrDefault();
				return true;
			}
			if (request.EventStatus == "CANCELALL")
			{
				string updateQry4 = "UPDATE adv_driver_events set EventStatus = @EventStatus,StopLatitude= null,StopLongitude = null,StartLatitude= null,StartLongitude = null where SrcEventId = @eventid";
				connection.Query(updateQry4, new
				{
					eventid = request.EventId,
					EventStatus = 1
				}).SingleOrDefault();
				return true;
			}
			if (request.EventStatus == "CANCELDROPOFF")
			{
				string updateQry5 = "UPDATE adv_driver_events set EventStatus = @EventStatus,StopLatitude= null,StopLongitude = null where SrcEventId = @eventid";
				connection.Query(updateQry5, new
				{
					eventid = request.EventId,
					EventStatus = 19
				}).SingleOrDefault();
				return true;
			}
		}
		return false;
	}

	public bool UpdateDriverCallStatus(ADVUpdateDriverCallRequest request)
	{
		ADVLogCoordinatesRequest logData = new ADVLogCoordinatesRequest();
		using SqlConnection connection = new SqlConnection(Utility.GetConfig("ConnectionString"));
		string updateQry = "UPDATE adv_driver_events set IsCall=1 where SrcEventId = @eventid";
		connection.Query(updateQry, new
		{
			eventid = request.EventId
		}).SingleOrDefault();
		logData.Action = "CALL";
		logData.TenantId = request.TennantId;
		logData.LogDate = DateTime.Now;
		logData.Role = "Driver";
		logData.UserName = request.UserName;
		logData.EventId = request.EventId;
		InsertLogCoordinates(logData);
		return true;
	}

	public bool UpdateUserCallStatus(ADVUpdateUserCallRequest request)
	{
		ADVLogCoordinatesRequest logData = new ADVLogCoordinatesRequest();
		using SqlConnection connection = new SqlConnection(Utility.GetConfig("ConnectionString"));
		string updateQry = "UPDATE adv_events set IsCall=1 where webeventid = @eventid";
		connection.Query(updateQry, new
		{
			eventid = request.WebEventId
		}).SingleOrDefault();
		logData.Action = "CALL";
		logData.TenantId = request.TennantId;
		logData.LogDate = DateTime.Now;
		logData.Role = "User";
		logData.UserName = request.UserName;
		logData.EventId = request.WebEventId;
		InsertLogCoordinates(logData);
		return true;
	}

	private string GetStatus(int stausID)
	{
		string Status = string.Empty;
		switch (stausID)
		{
		case 19:
			Status = "CHECKEDIN";
			break;
		case 30:
			Status = "CHECKEDOUT";
			break;
		case 21:
			Status = "NOSHOW";
			break;
		case 1:
			Status = "READY";
			break;
		}
		return Status;
	}

	public void StartTrip(ADVStartTripRequest request)
	{
		ADVLogCoordinatesRequest logData = new ADVLogCoordinatesRequest();
		logData.Action = "TRIPSTARTED_" + request.RouteNo;
		logData.Latitude = request.Latitude;
		logData.Longitude = request.Longitude;
		logData.Role = "DRIVER";
		logData.TenantId = request.TenantId;
		logData.UserName = request.UserName;
		logData.LogDate = DateTime.Now;
		InsertLogCoordinates(logData);
	}

	public void EndTrip(ADVEndTripRequest request)
	{
		ADVLogCoordinatesRequest logData = new ADVLogCoordinatesRequest();
		logData.Action = "TRIPENDED_" + request.RouteNo;
		logData.Latitude = request.Latitude;
		logData.Longitude = request.Longitude;
		logData.Role = "DRIVER";
		logData.TenantId = request.TenantId;
		logData.UserName = request.UserName;
		logData.LogDate = DateTime.Now;
		InsertLogCoordinates(logData);
		List<string> eventIds = request.EventIds.Split(',').ToList();
		using SqlConnection connection = new SqlConnection(Utility.GetConfig("ConnectionString"));
		foreach (string strEventId in eventIds)
		{
			if (!string.IsNullOrEmpty(strEventId))
			{
				int eventId = Convert.ToInt32(strEventId);
				int statusId = 30;
				string tmpEventIdqry = "select SrcEventId from adv_driver_events where SrcEventId = @eventid and EventStatus=19";
				int num = connection.Query<int>(tmpEventIdqry, new
				{
					eventid = eventId,
					EventStatus = statusId
				}).SingleOrDefault();
				string updateQry = "UPDATE adv_driver_events set EventStatus = @EventStatus,StopLatitude= @StopLatitude,StopLongitude = @StopLongitude  where SrcEventId = @eventid and EventStatus=19";
				connection.Query<int>(updateQry, new
				{
					eventid = eventId,
					EventStatus = statusId,
					StopLatitude = request.Latitude,
					StopLongitude = request.Longitude
				}).SingleOrDefault();
				if (num > 0)
				{
					ADVLogCoordinatesRequest logDataEvent = new ADVLogCoordinatesRequest();
					logDataEvent.Action = "CHECKEDOUT";
					logDataEvent.Latitude = request.Latitude;
					logDataEvent.Longitude = request.Longitude;
					logDataEvent.TenantId = request.TenantId;
					logDataEvent.LogDate = DateTime.Now;
					logDataEvent.Role = "DRIVER";
					logDataEvent.UserName = request.UserName;
					logDataEvent.EventId = eventId;
					InsertLogCoordinates(logDataEvent);
				}
			}
		}
	}
}
