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
  // For web platform, we need to handle CORS
  // Option 1: Use relative path if server supports it (unlikely)
  // Option 2: Use full URL and handle CORS error with helpful message
  // Option 3: Test on mobile where CORS doesn't apply
  
  if (Platform.OS === 'web') {
    // On web, try to use the server URL directly
    // If CORS error occurs, user should test on mobile or configure server CORS
    return process.env.EXPO_PUBLIC_API_URL || 'http://localhost';
  }
  
  // For mobile (iOS/Android), use full URL - CORS doesn't apply
  return process.env.EXPO_PUBLIC_API_URL || (__DEV__ ? 'http://localhost' : 'https://advantecis-csmwebservicebus.com');
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
}

export interface GetDriverEventsResponse {
  DriverEvents: DriverEvent[];
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
    
    // Check if we're on web platform - warn about CORS
    if (Platform.OS === 'web') {
      console.warn('⚠️ Running on web platform. CORS errors are expected. Please test on mobile device/emulator for full functionality.');
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
        UserName: data.UserName,
        // Legacy fields for compatibility
        tennantid: data.TennantId,
        userLogon: username, // Keep original username
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
    
    if (isCorsError) {
      errorMessage = 'CORS_ERROR: Please test on mobile device/emulator (iOS/Android) instead of web browser. CORS only affects web browsers. Mobile apps don\'t have CORS restrictions.';
    }
    
    return {
      success: false,
      message: errorMessage,
      LoginStatus: 'INVALID',
    };
  }
}

/**
 * Get driver events for today
 * Endpoint: GET /business/getdriverevents?userName=...&userID=...&tennantId=...
 * Uses stored procedure: sp_getMobileData @userName,'SelectClientsONRoute'
 * 
 * @param userName - Username from login
 * @param userID - UserId (GUID) from login response
 * @param tennantId - TennantId from login response
 */
export async function getDriverEvents(
  userName: string,
  userID: string,
  tennantId: number
): Promise<DriverEvent[]> {
  try {
    console.log('🔵 Get driver events:', { userName, userID, tennantId });
    
    const params = new URLSearchParams({
      userName: userName,
      userID: userID,
      tennantId: tennantId.toString(),
    });
    
    const response = await fetch(`${API_BASE_URL}/business/getdriverevents?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Get driver events error:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data: GetDriverEventsResponse = await response.json();
    console.log('✅ Get driver events response:', data);
    
    return data.DriverEvents || [];
  } catch (error) {
    console.error('❌ Get driver events error:', error);
    return [];
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
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
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
 * Convert DriverEvent to Job format for UI compatibility
 */
export function driverEventToJob(event: DriverEvent): Job {
  return {
    EventId: event.EventId,
    webeventid: event.EventId, // For compatibility
    requestId: event.EventId.toString(),
    name: event.FullName,
    FullName: event.FullName,
    location: event.CustomerAddress,
    CustomerAddress: event.CustomerAddress,
    City: event.City,
    date: new Date().toISOString().split('T')[0], // Today's date
    appointmentTime: '', // Not provided in driver events
    duration: '',
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
