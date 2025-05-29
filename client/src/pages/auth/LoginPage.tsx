import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, Mail, KeyRound } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Step 1: Email form schema
const emailFormSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
});

// Step 2: OTP verification schema
const otpFormSchema = z.object({
  otp: z.string().length(6, { message: 'OTP must be 6 digits' }),
});

type EmailFormValues = z.infer<typeof emailFormSchema>;
type OtpFormValues = z.infer<typeof otpFormSchema>;

const LoginPage = () => {
  const [currentStep, setCurrentStep] = useState<'email' | 'otp'>('email');
  const [currentEmail, setCurrentEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const auth = useAuth();
  const { user, isAuthenticated } = auth;
  // If your AuthContext does not provide these mutations, you need to implement them or adjust usage below.
  const requestOtpMutation = auth.requestOtpMutation;
  const verifyOtpMutation = auth.verifyOtpMutation;
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const redirectTo = new URLSearchParams(location.split('?')[1] || '').get('redirect');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (redirectTo) {
        setLocation(redirectTo);
      } else if (user?.role === 'super_admin') {
        setLocation('/admin');
      } else {
        setLocation('/dashboard');
      }
    }
  }, [isAuthenticated, user, setLocation, redirectTo]);

  // Email form
  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      email: '',
    },
  });

  // OTP form
  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpFormSchema),
    defaultValues: {
      otp: '',
    },
  });

  // Handle email submission to request OTP
  const onSubmitEmail = async (data: EmailFormValues) => {
    setError(null);
    
    try {
      const result = await requestOtpMutation.mutateAsync({ email: data.email });
      
      // Save email for OTP verification step
      setCurrentEmail(data.email);
      
      // Move to OTP verification step
      setCurrentStep('otp');
      
      // Show preview URL in development
      if (result.previewUrl) {
        console.log('OTP Email Preview URL:', result.previewUrl);
      }
    } catch (err) {
      console.error('Error requesting OTP:', err);
      setError(err instanceof Error ? err.message : 'Failed to send verification code');
    }
  };

  // Handle OTP verification submission
  const onSubmitOtp = async (data: OtpFormValues) => {
    setError(null);
    
    try {
      await verifyOtpMutation.mutateAsync({
        email: currentEmail,
        otp: data.otp,
      });
      
      // No need to redirect here as it's handled by the useEffect above
    } catch (err) {
      console.error('Error verifying OTP:', err);
      setError(err instanceof Error ? err.message : 'Invalid verification code');
    }
  };

  // Handle email edit
  const handleBackToEmail = () => {
    setCurrentStep('email');
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left panel with login form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12 bg-white dark:bg-gray-950">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">MultiVend</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Multi-tenant eCommerce platform</p>
          </div>
          
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-center text-2xl">Welcome Back</CardTitle>
              <CardDescription className="text-center">
                Log in to your account with one-time code
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {currentStep === 'email' ? (
                <Form {...emailForm}>
                  <form onSubmit={emailForm.handleSubmit(onSubmitEmail)} className="space-y-4">
                    <FormField
                      control={emailForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <div className="flex items-center border rounded-md focus-within:ring-1 focus-within:ring-indigo-500 bg-white dark:bg-gray-900">
                              <Mail className="ml-3 h-5 w-5 text-gray-400" />
                              <Input 
                                placeholder="your.email@example.com" 
                                type="email"
                                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            We'll send a one-time verification code to this email.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={requestOtpMutation.isPending}
                    >
                      {requestOtpMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending Code...
                        </>
                      ) : (
                        'Continue with Email'
                      )}
                    </Button>
                  </form>
                </Form>
              ) : (
                <Form {...otpForm}>
                  <form onSubmit={otpForm.handleSubmit(onSubmitOtp)} className="space-y-6">
                    <div className="space-y-2">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        We've sent a verification code to <span className="font-medium text-gray-700 dark:text-gray-300">{currentEmail}</span>
                      </div>
                      
                      <FormField
                        control={otpForm.control}
                        name="otp"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel>Verification Code</FormLabel>
                            <FormControl>
                              <InputOTP 
                                maxLength={6} 
                                {...field}
                              >
                                <InputOTPGroup>
                                  <InputOTPSlot index={0} />
                                  <InputOTPSlot index={1} />
                                  <InputOTPSlot index={2} />
                                  <InputOTPSlot index={3} />
                                  <InputOTPSlot index={4} />
                                  <InputOTPSlot index={5} />
                                </InputOTPGroup>
                              </InputOTP>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={verifyOtpMutation.isPending}
                      >
                        {verifyOtpMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          'Verify'
                        )}
                      </Button>
                      
                      <Button 
                        type="button" 
                        variant="ghost" 
                        className="w-full text-gray-500" 
                        onClick={handleBackToEmail}
                        disabled={verifyOtpMutation.isPending}
                      >
                        Use a different email
                      </Button>
                      
                      <Button 
                        type="button" 
                        variant="link" 
                        className="w-full text-indigo-600" 
                        onClick={() => onSubmitEmail({ email: currentEmail })}
                        disabled={requestOtpMutation.isPending || verifyOtpMutation.isPending}
                      >
                        {requestOtpMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          'Resend code'
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
          
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              &copy; {new Date().getFullYear()} MultiVend. All rights reserved.
            </p>
          </div>
        </div>
      </div>
      
      {/* Right panel with hero content (only visible on large screens) */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-indigo-600 to-purple-700 items-center justify-center p-12">
        <div className="max-w-md text-white">
          <h2 className="text-3xl font-bold mb-6">Build and Manage Your eCommerce Empire</h2>
          <p className="text-lg mb-8 text-indigo-100">
            Launch, scale, and optimize your online store with our powerful multi-tenant platform.
            Access comprehensive tools for inventory management, order fulfillment, and seamless customer experiences.
          </p>
          <div className="space-y-4">
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p>Manage multiple stores from a single dashboard</p>
            </div>
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p>Seamless domain integration and customization</p>
            </div>
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p>Comprehensive analytics and performance tracking</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
