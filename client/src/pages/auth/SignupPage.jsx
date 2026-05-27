import { AuthForm } from '../../components/auth/AuthForm';
import { AuthFrame } from '../../components/auth/AuthFrame';

export const SignupPage = () => (
  <AuthFrame mode="signup">
    <AuthForm mode="signup" />
  </AuthFrame>
);
