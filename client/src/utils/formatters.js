/**
 * Formats seconds into MM:SS format (e.g., 65 -> "01:05")
 * @param {number} seconds 
 * @returns {string}
 */
export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Formats file size in bytes to a human-readable string (e.g., 1048576 -> "1.0 MB")
 * @param {number} bytes 
 * @returns {string}
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

/**
 * Formats a Date object or timestamp into HH:MM:SS format
 * @param {Date|number} date 
 * @returns {string}
 */
export const formatTimestamp = (date) => {
  const d = typeof date === 'number' ? new Date(date) : date;
  return d.toTimeString().split(' ')[0];
};
