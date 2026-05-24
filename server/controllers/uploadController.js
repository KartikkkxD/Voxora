/**
 * Controller to process multer file uploads.
 * Logs transfer stats and returns file parameters.
 */
export const handleUpload = async (req, res, next) => {
  try {
    console.info(`[UploadController] [${new Date().toISOString()}] Received POST /api/upload request.`);
    
    if (!req.file) {
      console.warn('[UploadController] File was missing or blocked by filter rules.');
      return res.status(400).json({
        success: false,
        error: {
          status: 400,
          message: 'No valid audio file received. Verify file type (MP3/WAV/M4A/WEBM) and size (<15MB).'
        }
      });
    }

    console.info(`[UploadController] File successfully saved: ${req.file.filename} (${req.file.size} bytes) at ${req.file.path}`);

    res.status(200).json({
      success: true,
      message: 'Audio uploaded successfully.',
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        path: req.file.path
      }
    });

  } catch (err) {
    console.error('[UploadController] Error handling file upload:', err);
    next(err);
  }
};
