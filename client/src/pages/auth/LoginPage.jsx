import { AuthForm } from '../../components/auth/AuthForm';
import { AuthFrame } from '../../components/auth/AuthFrame';

export const LoginPage = () => (
  <AuthFrame mode="login">
    <AuthForm mode="login" />
  </AuthFrame>
);
