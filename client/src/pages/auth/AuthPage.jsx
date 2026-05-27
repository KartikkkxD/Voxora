import { useLocation } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import { SignupPage } from './SignupPage';

export const AuthPage = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const requestedMode = params.get('mode');
  const isSignup = location.pathname === '/signup' || requestedMode === 'signup';

  return isSignup ? <SignupPage /> : <LoginPage />;
};
