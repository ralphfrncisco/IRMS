/**
 * Format datetime to readable format
 * @param {string|Date} dateTimeString - ISO datetime string or Date object
 * @param {object} options - Formatting options
 * @returns {string} Formatted datetime string
 */

export const formatDateTime = (dateTimeString, options = {}) => {
  if (!dateTimeString) return '';
  
  const {
    includeTime = true,
    includeDate = true,
    dateStyle = 'long', // 'short', 'medium', 'long', 'full'
    timeStyle = 'short', // 'short', 'medium', 'long'
    separator = ' - ',
    timezone = 'Asia/Manila' // Default to Philippine Time
  } = options;

  const date = new Date(dateTimeString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) return 'Invalid date';

  let formattedString = '';

  // Format date part
  if (includeDate) {
    const dateOptions = {
      timeZone: timezone,
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    
    formattedString += date.toLocaleDateString('en-US', dateOptions);
  }

  // Add separator if both date and time are included
  if (includeDate && includeTime) {
    formattedString += separator;
  }

  // Format time part
  if (includeTime) {
    const timeOptions = {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    
    formattedString += date.toLocaleTimeString('en-US', timeOptions);
  }

  return formattedString;
};

/**
 * Format date only (no time)
 * @param {string|Date} dateString
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString) => {
  return formatDateTime(dateString, { includeTime: false });
};

/**
 * Format time only (no date)
 * @param {string|Date} dateTimeString
 * @returns {string} Formatted time string
 */
export const formatTime = (dateTimeString) => {
  return formatDateTime(dateTimeString, { includeDate: false });
};

/**
 * Format datetime with short date style
 * @param {string|Date} dateTimeString
 * @returns {string} Example: "Feb 24, 2026 - 1:26 PM"
 */
export const formatDateTimeShort = (dateTimeString) => {
  if (!dateTimeString) return '';
  
  const date = new Date(dateTimeString);
  if (isNaN(date.getTime())) return 'Invalid date';

  const dateOptions = {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };

  const timeOptions = {
    timeZone: 'Asia/Manila',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };

  const datePart = date.toLocaleDateString('en-US', dateOptions);
  const timePart = date.toLocaleTimeString('en-US', timeOptions);

  return `${datePart} - ${timePart}`;
};

/**
 * Format relative time (e.g., "2 minutes ago", "Just now")
 * @param {string|Date} dateTimeString
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (dateTimeString) => {
  if (!dateTimeString) return '';
  
  const date = new Date(dateTimeString);
  if (isNaN(date.getTime())) return 'Invalid date';

  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins === 1) return '1 minute ago';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  
  // If older than 7 days, show actual date and time
  return formatDateTime(dateTimeString);
};

/**
 * Format datetime for display in tables
 * @param {string|Date} dateTimeString
 * @returns {string} Example: "Feb 24, 2026
1:26 PM"
 */
export const formatDateTimeCompact = (dateTimeString) => {
  if (!dateTimeString) return '';
  
  const date = new Date(dateTimeString);
  if (isNaN(date.getTime())) return 'Invalid date';

  const dateOptions = {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };

  const timeOptions = {
    timeZone: 'Asia/Manila',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };

  const datePart = date.toLocaleDateString('en-US', dateOptions);
  const timePart = date.toLocaleTimeString('en-US', timeOptions);

  return `${datePart}\n${timePart}`;
};