/**
 * Accurately determines if a file is expired and provides a human-readable remaining time string.
 * Uses exact millisecond epoch comparisons so that expiration within hours/minutes/seconds
 * is NEVER falsely marked as expired.
 *
 * @param {string|Date} expiresAt - ISO string or Date object
 * @returns {{ isExpired: boolean, text: string }}
 */
export const getExpiryInfo = (expiresAt) => {
  if (!expiresAt) {
    return { isExpired: false, text: "Never expires" };
  }

  const target = new Date(expiresAt).getTime();
  if (isNaN(target)) {
    return { isExpired: false, text: "N/A" };
  }

  const now = Date.now();
  const diffMs = target - now;

  if (diffMs <= 0) {
    return { isExpired: true, text: "Expired" };
  }

  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return {
      isExpired: false,
      text: `Expires in ${diffDays} day${diffDays > 1 ? "s" : ""}`,
    };
  }
  if (diffHours > 0) {
    const remMins = diffMins % 60;
    return {
      isExpired: false,
      text: remMins > 0 ? `Expires in ${diffHours} hr ${remMins} min` : `Expires in ${diffHours} hr${diffHours > 1 ? "s" : ""}`,
    };
  }
  if (diffMins > 0) {
    return {
      isExpired: false,
      text: `Expires in ${diffMins} min${diffMins > 1 ? "s" : ""}`,
    };
  }
  return {
    isExpired: false,
    text: `Expires in ${diffSecs}s`,
  };
};

/**
 * Checks if a date has passed down to the millisecond.
 */
export const isDateExpired = (expiresAt) => {
  if (!expiresAt) return false;
  const target = new Date(expiresAt).getTime();
  if (isNaN(target)) return false;
  return target <= Date.now();
};

