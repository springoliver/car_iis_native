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
