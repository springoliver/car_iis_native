/**
 * API Service for CSM Mobile App
 * Connects to IIS Web Service at: advantecis-csmwebservicebus.com
 */

const API_BASE_URL = 'https://advantecis-csmwebservicebus.com';

export interface LoginRequest {
  username: string; // Format: DRITLC (e.g., DR1TLC)
  password: string;
}

export interface LoginResponse {
  success: boolean;
  authToken?: string;
  message?: string;
  driverData?: any;
  tennantid?: number;
  userLogon?: string; // Full DRITLC format
  role?: 'Driver' | 'User';
}

export interface JobUpdateRequest {
  eventid: number; // webeventid from database
  action: 'Checkedin' | 'Checkedout' | 'NoShow' | 'CancelALL' | 'CancelDropOff' | 'started' | 'completed';
  latitude: string;
  longitude: string;
  userLogon: string; // Format: DRITLC (e.g., DR1TLC)
  tennantid: number; // Extracted from userLogon (TLC part)
  role: 'Driver' | 'User';
  authToken: string;
  note?: string;
}

export interface Job {
  webeventid: number; // This is the eventid used in stored procedure
  requestId?: string; // Legacy field, maps to webeventid
  name: string;
  location: string;
  date: string;
  appointmentTime: string;
  duration: string;
  status?: 'open' | 'in-progress' | 'completed' | 'no-show';
  phone?: string;
  eventstatus?: number; // From database: 1, 14, 16, 19, 21, 30
  action?: string; // Current action from database
}

/**
 * Login to the system
 * Format: DRITLC where TLC is tenant identifier
 * Old app only requires username - password is handled server-side or remembered
 * @param username - Format: DRITLC (e.g., DR1TLC) or email format
 * @param password - Optional, not used in old app
 */
export async function login(username: string, password: string = ''): Promise<LoginResponse> {
  // MOCK MODE: Return success for UI testing
  // TODO: Remove this mock and use real API when backend is ready
  const USE_MOCK = true; // Set to false when ready to use real API
  
  if (USE_MOCK) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock successful login response
    console.log('🔵 MOCK MODE: Login successful for', username);
    
    return {
      success: true,
      authToken: 'mock_auth_token_' + Date.now(),
      driverData: {
        username: username,
        name: 'John Driver',
      },
      tennantid: 1,
      userLogon: username.startsWith('DR') ? username : `DR1TLC`,
      role: 'Driver',
    };
  }
  
  // REAL API CODE (will be used when USE_MOCK = false)
  try {
    // Based on chat history, the API expects URL strings with delimited parameters
    // The login format sends DR(x)TLC as first param
    // Old app only sends username, password is optional/remembered
    
    const params = new URLSearchParams({
      username: username, // Format: DRITLC or email
    });
    
    // Only add password if provided (for backward compatibility)
    if (password) {
      params.append('password', password);
    }
    
    const response = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    
    console.log('Login response:', data);
    
    // Store auth token for subsequent requests
    if (data.authToken) {
      // TODO: Store in secure storage (e.g., expo-secure-store)
      // For now, we'll handle this in the component
    }

    return {
      success: true,
      authToken: data.authToken || data.token,
      driverData: data.driverData || data.data,
      tennantid: data.tennantid,
      userLogon: data.userLogon || username,
      role: data.role || 'Driver',
    };
  } catch (error) {
    console.error('Login error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to connect to server';
    console.error('Error details:', errorMessage);
    return {
      success: false,
      message: errorMessage,
    };
  }
}

/**
 * Get today's appointments/jobs for the driver
 * @param authToken - Authentication token from login
 */
export async function getTodayJobs(authToken: string): Promise<Job[]> {
  try {
    // TODO: Replace with actual API endpoint
    // Based on chat history, this downloads ~20 records daily
    
    const response = await fetch(`${API_BASE_URL}/api/jobs/today`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.jobs || [];
  } catch (error) {
    console.error('Get jobs error:', error);
    return [];
  }
}

/**
 * Update job status using UpdateMobileLog stored procedure
 * Matches the stored procedure signature in update.sql
 * 
 * Stored Procedure Parameters:
 * @tennantid int
 * @dt datetime
 * @longitude varchar(50)
 * @userLogon nvarchar(20) - Format: DRITLC
 * @action varchar(20) - 'Checkedin', 'Checkedout', 'NoShow', 'CancelALL', 'CancelDropOff', 'started', 'completed'
 * @Latitude varchar(20)
 * @role nchar(10) - 'Driver' or 'User'
 * @eventid int - webeventid
 * @Logid int OUTPUT
 * 
 * @param update - Job update request matching stored procedure parameters
 */
export async function updateJobStatus(update: JobUpdateRequest): Promise<{ success: boolean; logid?: number; message?: string }> {
  try {
    // Format datetime as SQL Server expects: YYYY-MM-DD HH:MM:SS
    const dt = new Date().toISOString().replace('T', ' ').substring(0, 19);
    
    // Build URL-encoded parameters matching stored procedure
    const params = new URLSearchParams({
      tennantid: update.tennantid.toString(),
      dt: dt,
      longitude: update.longitude,
      userLogon: update.userLogon, // Full DRITLC format
      action: update.action,
      Latitude: update.latitude,
      role: update.role,
      eventid: update.eventid.toString(),
    });

    // Add note if provided
    if (update.note) {
      params.append('note', update.note);
    }

    const response = await fetch(`${API_BASE_URL}/api/UpdateMobileLog`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${update.authToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    // Stored procedure returns @Logid as OUTPUT parameter
    const data = await response.json();
    
    return {
      success: true,
      logid: data.logid,
    };
  } catch (error) {
    console.error('Update job error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update job status',
    };
  }
}

/**
 * Add note to a job
 * @param requestId - Job request ID
 * @param note - Note text
 * @param authToken - Authentication token
 */
export async function addJobNote(
  requestId: string,
  note: string,
  authToken: string
): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/jobs/note`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        requestId: requestId,
        note: note,
      }).toString(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Add note error:', error);
    return false;
  }
}
