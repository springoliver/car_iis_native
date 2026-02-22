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
}

export interface JobUpdateRequest {
  requestId: string;
  status: 'picked-up' | 'dropped-off' | 'no-show';
  gpsLat?: number;
  gpsLon?: number;
  note?: string;
  authToken: string;
}

export interface Job {
  requestId: string;
  name: string;
  location: string;
  date: string;
  appointmentTime: string;
  duration: string;
  status?: 'open' | 'in-progress' | 'completed' | 'no-show';
  phone?: string;
}

/**
 * Login to the system
 * Format: DRITLC where TLC is tenant identifier
 * @param username - Format: DRITLC (e.g., DR1TLC)
 * @param password - User password
 */
export async function login(username: string, password: string): Promise<LoginResponse> {
  try {
    // TODO: Replace with actual API endpoint
    // Based on chat history, the API expects URL strings with delimited parameters
    // The login format sends DR(x)TLC as first param
    
    const response = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        username: username, // Format: DRITLC
        password: password,
      }).toString(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Store auth token for subsequent requests
    if (data.authToken) {
      // TODO: Store in secure storage (e.g., expo-secure-store)
      // For now, we'll handle this in the component
    }

    return {
      success: true,
      authToken: data.authToken,
      driverData: data.driverData,
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to connect to server',
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
 * Update job status (pick-up, drop-off, no-show)
 * Sends GPS coordinates and timestamp
 * @param update - Job update request
 */
export async function updateJobStatus(update: JobUpdateRequest): Promise<boolean> {
  try {
    // TODO: Replace with actual API endpoint
    // Based on chat history, updates are sent as URL strings with delimited parameters
    // API fires stored procedure to update SQL database in real-time
    
    const response = await fetch(`${API_BASE_URL}/api/jobs/update`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${update.authToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        requestId: update.requestId,
        status: update.status,
        gpsLat: update.gpsLat?.toString() || '',
        gpsLon: update.gpsLon?.toString() || '',
        note: update.note || '',
        timestamp: new Date().toISOString(),
      }).toString(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Update job error:', error);
    return false;
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
