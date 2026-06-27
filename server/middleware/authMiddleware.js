import { supabase } from '../services/supabaseClient.js';

/**
 * Middleware to enforce authentication using Supabase JWT.
 
 */
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          status: 401,
          message: 'Authentication required. Please log in first.'
        }
      });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: {
          status: 401,
          message: 'Invalid or expired session. Please log in again.'
        }
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('[AuthMiddleware] Exception during requireAuth:', err);
    res.status(500).json({
      success: false,
      error: {
        status: 500,
        message: 'Internal server error during authentication verification.'
      }
    });
  }
};

/**
 * Middleware to optionally parse a Supabase JWT token.
 * Passes the request through if the token is absent.
 * Fails with 401 if a token is provided but is invalid/expired.
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, proceed as anonymous/guest
      return next();
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: {
          status: 401,
          message: 'Your session is invalid or expired. Please sign in again.'
        }
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('[AuthMiddleware] Exception during optionalAuth:', err);
    // Proceed as guest as fallback if there is an error reading the token structure
    next();
  }
};
