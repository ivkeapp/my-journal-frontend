/**
 * Login Page
 * Clean, minimalist login form with email and password
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { BookOpen, Mail, Lock } from 'lucide-react';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .regex(
      /^[^\s@]+@[^\s@]+$/,
      'Please enter a valid email address'
    ),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, clearError } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Get redirect destination from location state, default to /journal
  const from = (location.state as { from?: string })?.from || '/journal';
  
  // Check if user just registered
  const justRegistered = (location.state as { registered?: boolean })?.registered;
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });
  
  const onSubmit = async (data: LoginFormData) => {
    setSubmitError(null);
    clearError();
    
    try {
      await login(data);
      navigate(from, { replace: true });
    } catch (err) {
      // Error is handled by the store, but we can also show it here
      if (err instanceof Error) {
        setSubmitError(err.message);
      }
    }
  };
  
  const displayError = submitError || error;
  const isDisabled = isLoading || isSubmitting;
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-900 rounded-xl mb-4">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">My Journal</h1>
          <p className="text-gray-500 mt-1">Your private space for thoughts</p>
        </div>
        
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>
              Enter your credentials to access your journal
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {/* Success message after registration */}
              {justRegistered && !displayError && (
                <Alert variant="success">
                  <AlertDescription>
                    Account created successfully! Please sign in.
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Error message */}
              {displayError && (
                <Alert variant="destructive">
                  <AlertDescription>{displayError}</AlertDescription>
                </Alert>
              )}
              
              {/* Email field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-10"
                    autoComplete="email"
                    disabled={isDisabled}
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>
              
              {/* Password field */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    autoComplete="current-password"
                    disabled={isDisabled}
                    {...register('password')}
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full"
                disabled={isDisabled}
              >
                {isDisabled ? (
                  <>
                    <Spinner size="sm" className="text-white" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
              
              <p className="text-sm text-center text-gray-500">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="font-medium text-gray-900 hover:underline"
                >
                  Create one
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default LoginPage;
