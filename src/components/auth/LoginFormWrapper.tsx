'use client';

import dynamic from 'next/dynamic';

const LoginForm = dynamic(() => import('./LoginForm'), {
  ssr: false,
});

interface LoginFormWrapperProps {
  userType: 'admin' | 'student' | 'teacher';
}

export default function LoginFormWrapper({ userType }: LoginFormWrapperProps) {
  return <LoginForm userType={userType} />;
} 