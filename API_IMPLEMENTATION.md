# API Implementation Guide

## Overview
This document describes how the mobile app integrates with the IIS Web Service and SQL Server database using the `UpdateMobileLog` stored procedure.

## Stored Procedure: UpdateMobileLog

### Parameters
The stored procedure accepts the following parameters matching `server/update.sql`:

```sql
@tennantid int
@dt datetime
@longitude varchar(50)
@userLogon nvarchar(20)  -- Format: DRITLC (e.g., DR1TLC)
@action varchar(20)       -- 'Checkedin', 'Checkedout', 'NoShow', 'CancelALL', 'CancelDropOff', 'started', 'completed'
@Latitude varchar(20)
@role nchar(10)           -- 'Driver' or 'User'
@eventid int              -- webeventid from adv_events table
@Logid int OUTPUT         -- Returns the log ID
```

### Action Mapping

#### For Driver Role:
- **'Checkedin'** → Pick-up action (eventstatusid = 19)
- **'Checkedout'** → Drop-off action (eventstatusid = 30)
- **'NoShow'** → No-show action (eventstatusid = 21)
- **'CancelALL'** → Cancel all (eventstatusid = 1)
- **'CancelDropOff'** → Cancel drop-off (eventstatusid = 19)

#### For User Role:
- **'started'** → Service started (eventstatus = 14, sets starttime, StartLatitude, StartLongitue)
- **'completed'** → Service completed (eventstatus = 16, sets endtime, StopLatitude, StopLongitue)
- **'NoShow'** → No-show (eventstatus = 21)
- **'CancelALL'** → Cancel all (eventstatus = 1)

## API Endpoints

### Base URL
```
https://advantecis-csmwebservicebus.com
```

### 1. Login
**Endpoint:** `POST /api/login`

**Request:**
```
Content-Type: application/x-www-form-urlencoded

username=DR1TLC
password=N0WayJ0se##
```

**Response:**
```json
{
  "success": true,
  "authToken": "token_here",
  "tennantid": 1,
  "userLogon": "DR1TLC",
  "role": "Driver"
}
```

### 2. Get Today's Jobs
**Endpoint:** `GET /api/jobs/today`

**Headers:**
```
Authorization: Bearer {authToken}
```

**Response:**
```json
{
  "jobs": [
    {
      "webeventid": 190556,
      "name": "Adam Ahmed",
      "location": "595 Monroe Ave Elizabeth, NJ 07201",
      "date": "08-27-2021",
      "appointmentTime": "01:30:00 PM",
      "duration": "01:15:00",
      "eventstatus": 1,
      "action": null
    }
  ]
}
```

### 3. Update Job Status
**Endpoint:** `POST /api/UpdateMobileLog`

**Headers:**
```
Authorization: Bearer {authToken}
Content-Type: application/x-www-form-urlencoded
```

**Request Body:**
```
tennantid=1
dt=2026-03-06 14:30:00
longitude=-74.0060
userLogon=DR1TLC
action=Checkedin
Latitude=40.7128
role=Driver
eventid=190556
```

**Response:**
```json
{
  "success": true,
  "logid": 12345
}
```

## User Logon Format

The user logon follows the format: **DRITLC**

- **DR** = Driver prefix
- **I** = Driver number/identifier
- **TLC** = Tenant identifier (3 characters)

Example: `DR1TLC` means Driver 1 for Tenant TLC

The stored procedure extracts the user part by removing the last 3 characters:
```sql
set @usr = (select left(@userLogon,len(@userLogon)-3))
```

## GPS Coordinates

The app captures GPS coordinates when updating job status:
- **Latitude** and **Longitude** are sent as strings
- Coordinates are captured using `expo-location` (to be installed)
- Format: Decimal degrees (e.g., "40.7128", "-74.0060")

## Database Tables

### ADV_MobilelAppLog
Stores all mobile app actions with:
- Tennantid
- Dt (datetime)
- Longitude
- Userlogon
- Action
- Latitude
- Role
- eventid
- Logid (auto-generated)

### adv_events
Main events table updated by the stored procedure:
- webeventid (primary key, used as eventid)
- eventstatus (1, 14, 16, 19, 21, 30)
- action
- starttime / endtime
- StartLatitude / StartLongitue
- StopLatitude / StopLongitue
- lastupdateuser

## Implementation Notes

1. **Authentication**: Store authToken securely using `expo-secure-store`
2. **GPS**: Install `expo-location` for GPS tracking
3. **Offline Support**: Cache jobs locally and sync when connection returns
4. **Error Handling**: All API calls include try-catch with user-friendly error messages
5. **Real-time Updates**: Each action immediately calls the stored procedure

## Next Steps

1. Install required packages:
   ```bash
   npx expo install expo-location expo-secure-store
   ```

2. Update API endpoints in `services/api.ts` with actual IIS server endpoints

3. Implement secure token storage in login flow

4. Test with actual IIS server and database
