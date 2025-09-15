/**
 * API Service for CSM Mobile App
 * Connects to IIS Web Service
 * Base URL can be configured (default: http://localhost for testing)
 */

// API Base URL Configuration
// CORS Issue: When testing on web (browser), CORS blocks requests to different origins
// Solutions:
// 1. Test on mobile device/emulator (iOS/Android) - CORS doesn't apply
// 2. Configure server to allow CORS headers (if you have server access)
// 3. Use a proxy server for web development
import { Platform } from 'react-native';

const getApiBaseUrl = () => {
  // Check for environment variable first (highest priority)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // For web platform, we need to handle CORS
  if (Platform.OS === 'web') {
    // On web, try to use the server URL directly
    // If CORS error occurs, user should test on mobile or configure server CORS
    return 'http://localhost';
  }
  
  // For mobile platforms
  if (__DEV__) {
    // Development mode - use localhost
    if (Platform.OS === 'android') {
      // Android emulator: use 10.0.2.2 to access host machine's localhost
      // For physical Android device: use your computer's IP address (e.g., http://192.168.1.100)
      return 'http://10.0.2.2';
    } else {
      // iOS simulator: localhost works fine
      return 'http://localhost';
    }
  }
  
  // Production mode - use production server
  return 'https://advantecis-csmwebservicebus.com';
};

const API_BASE_URL = getApiBaseUrl();

export interface LoginRequest {
  username: string; // Format: usernameTLC (e.g., adminDMO) - server extracts tenant code
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  TennantId?: number;
  UserId?: string;
  RoleType?: string;
  LoginStatus?: 'VALID' | 'INVALID';
  UserName?: string;
  // Legacy fields for compatibility
  tennantid?: number;
  userLogon?: string;
  role?: 'Driver' | 'User';
}

export interface DriverEvent {
  EventId: number;
  FullName: string;
  CustomerAddress: string;
  City: string;
  HomePhone: string;
  Route: number;
  EventStatus: string; // "CHECKEDIN", "CHECKEDOUT", "NOSHOW", "READY"
  Event: string; // "pickup", "drop off"
  Gender: number;
  Pickup?: string; // starttime from stored procedure (e.g., "2026-03-16T08:00:00" or "08:00:00")
  dropoff?: string; // endtime from stored procedure (e.g., "2026-03-16T09:15:00" or "09:15:00")
}

export interface GetDriverEventsResponse {
  DriverEvents: DriverEvent[];
  OperationStatus: string;
}

export interface AppointmentEvent {
  WebEventId: number;
  EventStatus: string;
  EmployeeId: number;
  DueDate: string; // ISO datetime string
  Address: string;
  Duration: number; // Duration in minutes or similar unit
  Time: string; // Time string (e.g., "08:00:00 AM")
  FullName: string;
  StartTime: string; // Start time string (e.g., "08:00:00 AM" or ISO datetime)
  EndTime: string; // End time string (e.g., "09:15:00 AM" or ISO datetime)
  TennantId: number;
  HomePhone: string;
}

export interface GetApplicationEventsResponse {
  AppointmentEvents: AppointmentEvent[];
  OperationStatus: string;
}

export interface UpdateDriverEventStatusRequest {
  EventId: number;
  EventStatus: string; // "CHECKEDIN", "CHECKEDOUT", "NOSHOW", "CANCELALL", "CANCELDROPOFF"
  Latitude: string;
  Longitude: string;
  TenantId: number;
  UserName: string;
}

export interface UpdateAppointmentStatusRequest {
  WebEventId: number;
  EventStatus: string; // "STARTED", "COMPLETED", "NOSHOW", "CANCELALL"
  Latitude: string;
  Longitude: string;
  TenantId: number;
  UserName: string;
}

export interface UpdateDriverCallRequest {
  EventId: number;
  IsCall: boolean;
  TennantId: number; // Note: API uses "TennantId" (with double 'n')
  UserName: string;
}

export interface UpdateUserCallRequest {
  WebEventId: number;
  IsCall: boolean;
  TennantId: number; // Note: API uses "TennantId" (with double 'n')
  UserName: string;
}

export interface StartTripRequest {
  TenantId: number;
  LogDate: string; // ISO datetime string (e.g., "2026-03-16T02:50:32.1543017-05:00")
  Longitude: string;
  Latitude: string;
  UserName: string;
  RouteNo: string;
}

export interface EndTripRequest {
  TenantId: number;
  LogDate: string; // ISO datetime string (e.g., "2026-03-16T02:54:47.910521-05:00")
  Longitude: string;
  Latitude: string;
  UserName: string;
  EventIds: string; // Comma-separated string of event IDs (e.g., "1,2,3")
  RouteNo: string;
}

export interface UpdateStatusResponse {
  OperationStatus: string; // "SUCCESS" or "FAILURE"
}

// Legacy Job interface for compatibility
export interface Job {
  webeventid?: number;
  EventId?: number; // Driver events use EventId
  requestId?: string;
  name: string;
  FullName?: string;
  location: string;
  CustomerAddress?: string;
  City?: string;
  date: string;
  appointmentTime: string;
  duration: string;
  status?: 'open' | 'in-progress' | 'completed' | 'no-show';
  phone?: string;
  HomePhone?: string;
  EventStatus?: string;
  Event?: string;
  Route?: number;
}

/**
 * Login to the system
 * Endpoint: POST /business/login
 * Request: { username: string, password: string }
 * Response: { TennantId, UserId, RoleType, LoginStatus, UserName }
 * 
 * @param username - Username (e.g., "adminDMO")
 * @param password - Password (required)
 */
export async function login(username: string, password: string): Promise<LoginResponse> {
  try {
    console.log('🔵 Login request:', { username, password: '***', platform: Platform.OS, apiUrl: API_BASE_URL });
    
    const url = `${API_BASE_URL}/business/login`;
    console.log('🔵 Login URL:', url);
    
    // Platform-specific warnings
    if (Platform.OS === 'web') {
      console.warn('⚠️ Running on web platform. CORS errors are expected. Please test on mobile device/emulator for full functionality.');
    } else if (Platform.OS === 'android' && __DEV__) {
      console.log('ℹ️ Android emulator: Using 10.0.2.2 to access host localhost');
      console.log('ℹ️ If using physical Android device, set EXPO_PUBLIC_API_URL to your computer\'s IP (e.g., http://192.168.1.100)');
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username,
        password: password,
      }),
    }).catch((fetchError) => {
      // Catch network/CORS errors specifically
      if (Platform.OS === 'web') {
        throw new Error('CORS_ERROR: Failed to fetch. Please test on mobile device/emulator (iOS/Android) instead of web browser. CORS only affects web browsers.');
      }
      throw fetchError;
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Login error:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Login response:', data);
    
    if (data.LoginStatus === 'VALID') {
      return {
        success: true,
        TennantId: data.TennantId,
        UserId: data.UserId,
        RoleType: data.RoleType,
        LoginStatus: data.LoginStatus,
        UserName: username, // Use original username WITH tenant code (e.g., "JfishXXX", "AdminDMO")
        // Legacy fields for compatibility
        tennantid: data.TennantId,
        userLogon: username, // Keep original username with tenant code
        role: data.RoleType === 'Driver' ? 'Driver' : 'User',
      };
    } else {
      return {
        success: false,
        LoginStatus: 'INVALID',
        message: 'Invalid username or password',
      };
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    let errorMessage = error instanceof Error ? error.message : 'Failed to connect to server';
    
    // Check if it's a CORS error (web browser)
    const isCorsError = Platform.OS === 'web' && (
      errorMessage.includes('CORS') || 
      errorMessage.includes('Failed to fetch') ||
      errorMessage.includes('CORS_ERROR')
    );
    
    // Check if it's a network error on Android
    const isAndroidNetworkError = Platform.OS === 'android' && (
      errorMessage.includes('Network request failed') ||
      errorMessage.includes('Failed to fetch') ||
      errorMessage.includes('NetworkError')
    );
    
    if (isCorsError) {
      errorMessage = 'CORS_ERROR: Please test on mobile device/emulator (iOS/Android) instead of web browser. CORS only affects web browsers. Mobile apps don\'t have CORS restrictions.';
    } else if (isAndroidNetworkError && __DEV__) {
      errorMessage = 'Network Error: Cannot connect to server.\n\n' +
        'Android Emulator: Using http://10.0.2.2 (host localhost)\n' +
        'Physical Android Device: Set EXPO_PUBLIC_API_URL to your computer\'s IP address\n' +
        'Example: EXPO_PUBLIC_API_URL=http://192.168.1.100\n\n' +
        'Make sure:\n' +
        '1. IIS server is running on your computer\n' +
        '2. Firewall allows connections\n' +
        '3. Device/emulator can reach your computer\'s network';
    }
    
    return {
      success: false,
      message: errorMessage,
      LoginStatus: 'INVALID',
    };
  }
}

/**
 * Get application events (appointments) for today
 * Endpoint: GET /business/getapplicationevents?userName={userName}
 * Uses stored procedure: sp_getMobileData @userName,'SelectAppointmentsUser'
 * 
 * API Documentation:
 * - Method: GET
 * - Query Parameters:
 *   - userName (string, required)
 * - Response: GetApplicationEventsResponse
 *   - AppointmentEvents: Collection of AppointmentEvent
 *   - OperationStatus: "SUCCESS" or "FAILURE"
 * 
 * This API returns appointments with StartTime, EndTime, Duration, and Time fields.
 * 
 * @param userName - Username from login (string, required)
 * @returns Promise<AppointmentEvent[]> - Array of appointment events
 */
export async function getApplicationEvents(
  userName: string
): Promise<AppointmentEvent[]> {
  try {
    if (!userName) {
      throw new Error('Missing required parameter: userName is required');
    }

    console.log('🔵 Get application events request:', { 
      userName,
      platform: Platform.OS,
      apiUrl: API_BASE_URL 
    });
    
    const params = new URLSearchParams({
      userName: userName.toString(),
    });
    
    const url = `${API_BASE_URL}/business/getapplicationevents?${params.toString()}`;
    console.log('🔵 Get application events URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/json',
      },
    }).catch((fetchError) => {
      if (Platform.OS === 'web') {
        throw new Error('CORS_ERROR: Failed to fetch. Please test on mobile device/emulator (iOS/Android) instead of web browser.');
      }
      throw fetchError;
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Get application events HTTP error:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data: GetApplicationEventsResponse = await response.json();
    console.log('✅ Get application events response:', {
      operationStatus: data.OperationStatus,
      eventCount: data.AppointmentEvents?.length || 0,
    });
    
    if (data.OperationStatus && data.OperationStatus !== 'SUCCESS') {
      console.warn('⚠️ Get application events returned non-SUCCESS status:', data.OperationStatus);
    }
    
    return data.AppointmentEvents || [];
  } catch (error) {
    console.error('❌ Get application events error:', error);
    let errorMessage = error instanceof Error ? error.message : 'Failed to get application events';
    
    if (Platform.OS === 'web' && errorMessage.includes('CORS')) {
      errorMessage = 'CORS_ERROR: Please test on mobile device/emulator (iOS/Android) instead of web browser.';
    }
    
    console.warn('⚠️ Returning empty array due to error.');
    return [];
  }
}

/**
 * Get driver events for today
 * Endpoint: GET /business/getdriverevents?userName={userName}&userID={userID}&tennantId={tennantId}
 * Uses stored procedure: sp_getMobileData @userName,'SelectClientsONRoute'
 * 
 * API Documentation:
 * - Method: GET
 * - Query Parameters:
 *   - userName (string, required)
 *   - userID (string, required) 
 *   - tennantId (integer, required)
 * - Response: GetDriverEventsResponse
 *   - DriverEvents: Collection of DriverEvent
 *   - OperationStatus: "SUCCESS" or "FAILURE"
 * 
 * @param userName - Username from login (string, required)
 * @param userID - UserId (GUID string) from login response (required)
 * @param tennantId - TennantId (integer) from login response (required)
 * @returns Promise<DriverEvent[]> - Array of driver events
 */
export async function getDriverEvents(
  userName: string,
  userID: string,
  tennantId: number
): Promise<DriverEvent[]> {
  try {
    // Validate required parameters
    if (!userName || !userID || tennantId === undefined || tennantId === null) {
      throw new Error('Missing required parameters: userName, userID, and tennantId are required');
    }

    console.log('🔵 Get driver events request:', { 
      userName, 
      userID, 
      tennantId,
      platform: Platform.OS,
      apiUrl: API_BASE_URL 
    });
    
    // Build query parameters - matching API documentation exactly
    const params = new URLSearchParams({
      userName: userName.toString(),
      userID: userID.toString(),
      tennantId: tennantId.toString(),
    });
    
    const url = `${API_BASE_URL}/business/getdriverevents?${params.toString()}`;
    console.log('🔵 Get driver events URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/json',
      },
    }).catch((fetchError) => {
      // Handle network/CORS errors
      if (Platform.OS === 'web') {
        throw new Error('CORS_ERROR: Failed to fetch. Please test on mobile device/emulator (iOS/Android) instead of web browser.');
      }
      throw fetchError;
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Get driver events HTTP error:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data: GetDriverEventsResponse = await response.json();
    console.log('✅ Get driver events response:', {
      operationStatus: data.OperationStatus,
      eventCount: data.DriverEvents?.length || 0,
    });
    
    // Check OperationStatus from API response
    if (data.OperationStatus && data.OperationStatus !== 'SUCCESS') {
      console.warn('⚠️ Get driver events returned non-SUCCESS status:', data.OperationStatus);
    }
    
    // Return DriverEvents array (empty array if null/undefined)
    return data.DriverEvents || [];
  } catch (error) {
    console.error('❌ Get driver events error:', error);
    
    // Provide helpful error messages
    let errorMessage = error instanceof Error ? error.message : 'Failed to get driver events';
    
    if (Platform.OS === 'web' && errorMessage.includes('CORS')) {
      errorMessage = 'CORS_ERROR: Please test on mobile device/emulator (iOS/Android) instead of web browser.';
    }
    
    // Return empty array on error (caller can check length)
    // Alternatively, you could throw the error if you want callers to handle it
    console.warn('⚠️ Returning empty array due to error. Caller should handle this case.');
    return [];
  }
}

/**
 * Update appointment status
 * Endpoint: POST /business/updateappointmentstatus
 * Updates ADV_Events table using WebEventId
 * 
 * EventStatus mapping:
 * - "CHECKEDIN" -> "STARTED" (statusId: 19)
 * - "CHECKEDOUT" -> "COMPLETED" (statusId: 30)
 * - "NOSHOW" -> "NOSHOW" (statusId: 21)
 * - "CANCELALL" -> "CANCELALL" (statusId: 1)
 * 
 * @param request - Update request with WebEventId, EventStatus, GPS coordinates, etc.
 */
export async function updateAppointmentStatus(
  request: UpdateAppointmentStatusRequest
): Promise<{ success: boolean; message?: string }> {
  try {
    // Map frontend action names to backend EventStatus values
    const statusMap: Record<string, string> = {
      'CHECKEDIN': 'STARTED',
      'CHECKEDOUT': 'COMPLETED',
      'NOSHOW': 'NOSHOW',
      'CANCELALL': 'CANCELALL',
    };
    
    const backendStatus = statusMap[request.EventStatus] || request.EventStatus;
    
    console.log('🔵 Update appointment status:', { 
      WebEventId: request.WebEventId, 
      EventStatus: request.EventStatus,
      BackendStatus: backendStatus,
      Latitude: request.Latitude,
      Longitude: request.Longitude,
    });
    
    const response = await fetch(`${API_BASE_URL}/business/updateappointmentstatus`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        WebEventId: request.WebEventId,
        EventStatus: backendStatus,
        Latitude: request.Latitude,
        Longitude: request.Longitude,
        TenantId: request.TenantId,
        UserName: request.UserName,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Update appointment status error:', response.status, errorText);
      
      // Try to parse error message from JSON response
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.ExceptionMessage) {
          // Extract user-friendly error message
          if (errorJson.ExceptionMessage.includes('Execution Timeout') || errorJson.ExceptionMessage.includes('timeout')) {
            errorMessage = 'Server timeout: The operation took too long. Please try again or contact support if the problem persists.';
          } else {
            errorMessage = errorJson.ExceptionMessage;
          }
        } else if (errorJson.Message) {
          errorMessage = errorJson.Message;
        }
      } catch (e) {
        // If not JSON, use the text as-is
        errorMessage = errorText.length > 200 ? errorText.substring(0, 200) + '...' : errorText;
      }
      
      throw new Error(errorMessage);
    }

    const data: UpdateStatusResponse = await response.json();
    console.log('✅ Update appointment status response:', data);
    
    if (data.OperationStatus === 'SUCCESS') {
      return {
        success: true,
      };
    } else {
      return {
        success: false,
        message: 'Update failed',
      };
    }
  } catch (error) {
    console.error('❌ Update appointment status error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update appointment status',
    };
  }
}

/**
 * Update driver call status
 * Endpoint: POST /business/updatedrivercallstatus
 * Updates adv_driver_events table setting IsCall=1
 * 
 * @param request - Update request with EventId, IsCall flag, TenantId, and UserName
 */
export async function updateDriverCallStatus(
  request: UpdateDriverCallRequest
): Promise<{ success: boolean; message?: string }> {
  try {
    console.log('🔵 Update driver call status:', { 
      EventId: request.EventId, 
      IsCall: request.IsCall,
      TennantId: request.TennantId,
      UserName: request.UserName,
    });
    
    const response = await fetch(`${API_BASE_URL}/business/updatedrivercallstatus`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        EventId: request.EventId,
        IsCall: request.IsCall,
        TennantId: request.TennantId, // Note: API uses "TennantId" (double 'n')
        UserName: request.UserName,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Update driver call status error:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data: UpdateStatusResponse = await response.json();
    console.log('✅ Update driver call status response:', data);
    
    if (data.OperationStatus === 'SUCCESS') {
      return {
        success: true,
      };
    } else {
      return {
        success: false,
        message: 'Update failed',
      };
    }
  } catch (error) {
    console.error('❌ Update driver call status error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update call status',
    };
  }
}

/**
 * Update user call status
 * Endpoint: POST /business/updateusercallstatus
 * Updates adv_events table setting IsCall=1
 * 
 * @param request - Update request with WebEventId, IsCall flag, TenantId, and UserName
 */
export async function updateUserCallStatus(
  request: UpdateUserCallRequest
): Promise<{ success: boolean; message?: string }> {
  try {
    console.log('🔵 Update user call status:', { 
      WebEventId: request.WebEventId, 
      IsCall: request.IsCall,
      TennantId: request.TennantId,
      UserName: request.UserName,
    });
    
    const response = await fetch(`${API_BASE_URL}/business/updateusercallstatus`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        WebEventId: request.WebEventId,
        IsCall: request.IsCall,
        TennantId: request.TennantId, // Note: API uses "TennantId" (double 'n')
        UserName: request.UserName,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Update user call status error:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data: UpdateStatusResponse = await response.json();
    console.log('✅ Update user call status response:', data);
    
    if (data.OperationStatus === 'SUCCESS') {
      return {
        success: true,
      };
    } else {
      return {
        success: false,
        message: 'Update failed',
      };
    }
  } catch (error) {
    console.error('❌ Update user call status error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update call status',
    };
  }
}

/**
 * Update driver event status
 * Endpoint: POST /business/updatedrivereventstatus
 * Calls UpdateMobileLog stored procedure internally
 * 
 * @param request - Update request with EventId, EventStatus, GPS coordinates, etc.
 */
export async function updateDriverEventStatus(
  request: UpdateDriverEventStatusRequest
): Promise<{ success: boolean; message?: string }> {
  try {
    console.log('🔵 Update driver event status:', { 
      EventId: request.EventId, 
      EventStatus: request.EventStatus,
      Latitude: request.Latitude,
      Longitude: request.Longitude,
    });
    
    const response = await fetch(`${API_BASE_URL}/business/updatedrivereventstatus`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        EventId: request.EventId,
        EventStatus: request.EventStatus,
        Latitude: request.Latitude,
        Longitude: request.Longitude,
        TenantId: request.TenantId,
        UserName: request.UserName,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Update driver event status error:', response.status, errorText);
      
      // Try to parse error message from JSON response
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.ExceptionMessage) {
          // Extract user-friendly error message
          if (errorJson.ExceptionMessage.includes('Execution Timeout') || errorJson.ExceptionMessage.includes('timeout')) {
            errorMessage = 'Server timeout: The operation took too long. Please try again or contact support if the problem persists.';
          } else {
            errorMessage = errorJson.ExceptionMessage;
          }
        } else if (errorJson.Message) {
          errorMessage = errorJson.Message;
        }
      } catch (e) {
        // If not JSON, use the text as-is
        errorMessage = errorText.length > 200 ? errorText.substring(0, 200) + '...' : errorText;
      }
      
      throw new Error(errorMessage);
    }

    const data: UpdateStatusResponse = await response.json();
    console.log('✅ Update driver event status response:', data);
    
    if (data.OperationStatus === 'SUCCESS') {
      return {
        success: true,
      };
    } else {
      return {
        success: false,
        message: 'Update failed',
      };
    }
  } catch (error) {
    console.error('❌ Update driver event status error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update event status',
    };
  }
}

/**
 * Start trip
 * Endpoint: POST /business/starttrip
 * Logs trip start coordinates with action "TRIPSTARTED_" + RouteNo
 * 
 * @param request - Start trip request with TenantId, RouteNo, GPS coordinates, etc.
 */
export async function startTrip(
  request: StartTripRequest
): Promise<{ success: boolean; message?: string }> {
  try {
    console.log('🔵 Start trip:', { 
      TenantId: request.TenantId,
      RouteNo: request.RouteNo,
      Latitude: request.Latitude,
      Longitude: request.Longitude,
      UserName: request.UserName,
    });
    
    const response = await fetch(`${API_BASE_URL}/business/starttrip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        TenantId: request.TenantId,
        LogDate: request.LogDate || new Date().toISOString(), // Use provided date or current date
        Longitude: request.Longitude,
        Latitude: request.Latitude,
        UserName: request.UserName,
        RouteNo: request.RouteNo,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Start trip error:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data: UpdateStatusResponse = await response.json();
    console.log('✅ Start trip response:', data);
    
    if (data.OperationStatus === 'SUCCESS') {
      return {
        success: true,
      };
    } else {
      return {
        success: false,
        message: 'Start trip failed',
      };
    }
  } catch (error) {
    console.error('❌ Start trip error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to start trip',
    };
  }
}

/**
 * End trip
 * Endpoint: POST /business/endtrip
 * Logs trip end coordinates with action "TRIPENDED_" + RouteNo
 * Also updates all events in EventIds (comma-separated) from CHECKEDIN (status 19) to CHECKEDOUT (status 30)
 * 
 * @param request - End trip request with TenantId, RouteNo, EventIds (comma-separated), GPS coordinates, etc.
 */
export async function endTrip(
  request: EndTripRequest
): Promise<{ success: boolean; message?: string }> {
  try {
    console.log('🔵 End trip:', { 
      TenantId: request.TenantId,
      RouteNo: request.RouteNo,
      EventIds: request.EventIds,
      Latitude: request.Latitude,
      Longitude: request.Longitude,
      UserName: request.UserName,
    });
    
    const response = await fetch(`${API_BASE_URL}/business/endtrip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        TenantId: request.TenantId,
        LogDate: request.LogDate || new Date().toISOString(), // Use provided date or current date
        Longitude: request.Longitude,
        Latitude: request.Latitude,
        UserName: request.UserName,
        EventIds: request.EventIds, // Comma-separated string of event IDs
        RouteNo: request.RouteNo,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ End trip error:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data: UpdateStatusResponse = await response.json();
    console.log('✅ End trip response:', data);
    
    if (data.OperationStatus === 'SUCCESS') {
      return {
        success: true,
      };
    } else {
      return {
        success: false,
        message: 'End trip failed',
      };
    }
  } catch (error) {
    console.error('❌ End trip error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to end trip',
    };
  }
}

/**
 * Legacy function for compatibility - maps to updateDriverEventStatus
 */
export async function updateJobStatus(update: {
  eventid: number;
  action: 'Checkedin' | 'Checkedout' | 'NoShow' | 'CancelALL' | 'CancelDropOff';
  latitude: string;
  longitude: string;
  userLogon: string;
  tennantid: number;
  role: 'Driver' | 'User';
  authToken?: string;
}): Promise<{ success: boolean; logid?: number; message?: string }> {
  // Map action names to API format
  const actionMap: Record<string, string> = {
    'Checkedin': 'CHECKEDIN',
    'Checkedout': 'CHECKEDOUT',
    'NoShow': 'NOSHOW',
    'CancelALL': 'CANCELALL',
    'CancelDropOff': 'CANCELDROPOFF',
  };
  
  const result = await updateDriverEventStatus({
    EventId: update.eventid,
    EventStatus: actionMap[update.action] || update.action.toUpperCase(),
    Latitude: update.latitude,
    Longitude: update.longitude,
    TenantId: update.tennantid,
    UserName: update.userLogon,
  });
  
  return {
    success: result.success,
    message: result.message,
  };
}

/**
 * Format time string to display format
 * Converts SQL Server time/datetime to readable format (e.g., "08:00:00" -> "08:00:00 AM")
 */
function formatTime(timeStr: string | undefined): string {
  if (!timeStr) return '';
  
  try {
    // Handle different time formats from SQL Server
    // Could be: "08:00:00", "2026-03-16T08:00:00", "08:00:00.0000000", etc.
    const date = new Date(timeStr);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      // If not a valid date, try to parse as time string directly
      const timeMatch = timeStr.match(/(\d{1,2}):(\d{2}):(\d{2})/);
      if (timeMatch) {
        const hours = parseInt(timeMatch[1]);
        const minutes = timeMatch[2];
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours.toString().padStart(2, '0')}:${minutes}:00 ${ampm}`;
      }
      return timeStr; // Return as-is if can't parse
    }
    
    // Format as "HH:MM:SS AM/PM"
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} ${ampm}`;
  } catch (error) {
    console.warn('⚠️ Error formatting time:', timeStr, error);
    return timeStr; // Return original if formatting fails
  }
}

/**
 * Calculate duration between two times
 * Returns formatted duration string (e.g., "01:15:00")
 */
function calculateDuration(startTime: string | undefined, endTime: string | undefined): string {
  if (!startTime || !endTime) return '';
  
  try {
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    // Check if dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      // Try parsing as time strings
      const startMatch = startTime.match(/(\d{1,2}):(\d{2}):(\d{2})/);
      const endMatch = endTime.match(/(\d{1,2}):(\d{2}):(\d{2})/);
      
      if (startMatch && endMatch) {
        const startHours = parseInt(startMatch[1]);
        const startMinutes = parseInt(startMatch[2]);
        const endHours = parseInt(endMatch[1]);
        const endMinutes = parseInt(endMatch[2]);
        
        let totalMinutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
        if (totalMinutes < 0) totalMinutes += 24 * 60; // Handle next day
        
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
      }
      return '';
    }
    
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    return `${diffHours.toString().padStart(2, '0')}:${diffMinutes.toString().padStart(2, '0')}:${diffSeconds.toString().padStart(2, '0')}`;
  } catch (error) {
    console.warn('⚠️ Error calculating duration:', error);
    return '';
  }
}

/**
 * Convert AppointmentEvent to Job format for UI compatibility
 * This API has StartTime, EndTime, Duration, and Time fields
 */
export function appointmentEventToJob(event: AppointmentEvent): Job {
  // Use Time field if available, otherwise format StartTime
  let appointmentTime = event.Time || '';
  if (!appointmentTime && event.StartTime) {
    appointmentTime = formatTime(event.StartTime);
  }
  
  // Format duration from Duration field (number) or calculate from StartTime/EndTime
  let duration = '';
  if (event.Duration && event.Duration > 0) {
    // Duration is in minutes, convert to HH:MM:SS format
    const hours = Math.floor(event.Duration / 60);
    const minutes = event.Duration % 60;
    duration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
  } else if (event.StartTime && event.EndTime) {
    duration = calculateDuration(event.StartTime, event.EndTime);
  }
  
  // Format date from DueDate if available, otherwise use today
  let dateStr = new Date().toISOString().split('T')[0]; // Default to today
  if (event.DueDate) {
    try {
      const date = new Date(event.DueDate);
      if (!isNaN(date.getTime())) {
        // Format as MM-DD-YYYY to match reference app
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const year = date.getFullYear();
        dateStr = `${month}-${day}-${year}`;
      }
    } catch (error) {
      console.warn('⚠️ Error formatting date from DueDate:', error);
    }
  }
  
  // Map EventStatus to job status
  // Note: Appointment events use "STARTED", "COMPLETED" (from updateAppointmentStatus)
  // while driver events use "CHECKEDIN", "CHECKEDOUT"
  const statusMap: Record<string, 'open' | 'in-progress' | 'completed' | 'no-show'> = {
    'READY': 'open',
    'CHECKEDIN': 'in-progress', // For driver events
    'STARTED': 'in-progress', // For appointment events (from updateAppointmentStatus)
    'CHECKEDOUT': 'completed', // For driver events
    'COMPLETED': 'completed', // For appointment events (from updateAppointmentStatus)
    'NOSHOW': 'no-show',
  };
  
  return {
    webeventid: event.WebEventId,
    EventId: event.WebEventId, // Use WebEventId as EventId
    requestId: event.WebEventId.toString(),
    name: event.FullName,
    FullName: event.FullName,
    location: event.Address,
    CustomerAddress: event.Address,
    date: dateStr,
    appointmentTime: appointmentTime,
    duration: duration,
    status: statusMap[event.EventStatus] || 'open',
    phone: event.HomePhone,
    HomePhone: event.HomePhone,
    EventStatus: event.EventStatus,
  };
}

/**
 * Convert DriverEvent to Job format for UI compatibility
 */
export function driverEventToJob(event: DriverEvent): Job {
  // Format appointment time from Pickup (starttime)
  const appointmentTime = formatTime(event.Pickup);
  
  // Calculate duration from Pickup to dropoff
  const duration = calculateDuration(event.Pickup, event.dropoff);
  
  // Format date from Pickup if available, otherwise use today
  let dateStr = new Date().toISOString().split('T')[0]; // Default to today
  if (event.Pickup) {
    try {
      const date = new Date(event.Pickup);
      if (!isNaN(date.getTime())) {
        // Format as MM-DD-YYYY to match reference app
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const year = date.getFullYear();
        dateStr = `${month}-${day}-${year}`;
      }
    } catch (error) {
      console.warn('⚠️ Error formatting date from Pickup:', error);
    }
  }
  
  return {
    EventId: event.EventId,
    webeventid: event.EventId, // For compatibility
    requestId: event.EventId.toString(),
    name: event.FullName,
    FullName: event.FullName,
    location: event.CustomerAddress,
    CustomerAddress: event.CustomerAddress,
    City: event.City,
    date: dateStr,
    appointmentTime: appointmentTime,
    duration: duration,
    status: event.EventStatus === 'READY' ? 'open' :
            event.EventStatus === 'CHECKEDIN' ? 'in-progress' :
            event.EventStatus === 'CHECKEDOUT' ? 'completed' :
            event.EventStatus === 'NOSHOW' ? 'no-show' : 'open',
    phone: event.HomePhone,
    HomePhone: event.HomePhone,
    EventStatus: event.EventStatus,
    Event: event.Event,
    Route: event.Route,
  };
}
