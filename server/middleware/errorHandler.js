/**
 * Centralized error handling middleware.
 * Formats errors and logs them to console with details.
 */
export const errorHandler = (err, req, res, next) => {
  console.error(`[ErrorHandler] [${new Date().toISOString()}] Caught exception:`, err.stack || err.message || err);

  const status = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Handle Multer specific errors (e.g. file size limit exceeded)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: {
        status: 400,
        message: 'File is too large. Maximum size allowed is 15MB.'
      }
    });
  }

  res.status(status).json({
    success: false,
    error: {
      status,
      message
    }
  });
};
