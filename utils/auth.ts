/**
 * Authentication utilities
 * Handles parsing of DRITLC format and tenant ID extraction
 */

/**
 * Parse DRITLC format to extract tenant ID
 * Format: DRITLC where TLC is the tenant identifier (3 characters)
 * Example: DR1TLC -> tenant ID is extracted from TLC part
 * 
 * @param userLogon - Full DRITLC format (e.g., "DR1TLC")
 * @returns Object with user part and tenant ID
 */
export function parseUserLogon(userLogon: string): { user: string; tennantid: number } | null {
  if (!userLogon || userLogon.length < 5) {
    return null;
  }

  // Extract user part (everything except last 3 characters - TLC)
  // As per stored procedure: set @usr = (select left(@userlogon,len(@userlogon)-3))
  const user = userLogon.substring(0, userLogon.length - 3);
  
  // Extract TLC part (last 3 characters)
  const tlc = userLogon.substring(userLogon.length - 3);
  
  // Convert TLC to tenant ID
  // This may need adjustment based on your actual tenant ID mapping
  // For now, we'll try to parse it as a number or use a lookup
  let tennantid: number;
  
  // If TLC is numeric, use it directly
  if (!isNaN(Number(tlc))) {
    tennantid = Number(tlc);
  } else {
    // If TLC is alphanumeric, you may need a mapping table
    // For now, we'll use a simple hash or default
    // TODO: Implement proper tenant ID lookup from database
    tennantid = 1; // Default, should be looked up from adv_tennant table
  }

  return {
    user,
    tennantid,
  };
}

/**
 * Validate DRITLC format
 * @param userLogon - User login string to validate
 */
export function isValidUserLogon(userLogon: string): boolean {
  if (!userLogon) return false;
  
  // Minimum length: DR + 1 digit + TLC (3 chars) = 6 characters
  // Example: DR1TLC
  return userLogon.length >= 6 && /^DR\d+[A-Z]{3}$/i.test(userLogon);
}
