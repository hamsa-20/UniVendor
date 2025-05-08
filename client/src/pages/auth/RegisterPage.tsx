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
import { Loader2, AlertCircle, Mail, Store, Building, Globe } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Step 1: Email form schema
const emailFormSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
});

// Step 2: OTP verification schema
const otpFormSchema = z.object({
  otp: z.string().length(6, { message: 'OTP must be 6 digits' }),
});

// Step 3: Profile completion schema
const profileFormSchema = z.object({
  firstName: z.string().min(2, { message: 'First name must be at least 2 characters' }),
  lastName: z.string().min(2, { message: 'Last name must be at least 2 characters' }),
  companyName: z.string().min(2, { message: 'Company name must be at least 2 characters' }),
  subdomainName: z.string().min(3, { message: 'Subdomain must be at least 3 characters' })
    .regex(/^[a-zA-Z0-9-]+$/, { message: 'Subdomain can only contain letters, numbers, and hyphens' }),
});

type EmailFormValues = z.infer<typeof emailFormSchema>;
type OtpFormValues = z.infer<typeof otpFormSchema>;
type ProfileFormValues = z.infer<typeof profileFormSchema>;

const RegisterPage = () => {
  // Step tracking and email storage
  const [currentStep, setCurrentStep] = useState<'email' | 'otp' | 'profile'>('email');
  const [currentEmail, setCurrentEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Auth context for authentication mutations
  const { 
    requestOtpMutation, 
    verifyOtpMutation, 
    completeProfileMutation,
    user, 
    isAuthenticated 
  } = useAuth();
  
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Redirect if already authenticated with complete profile
  useEffect(() => {
    if (isAuthenticated) {
      if (user?.isProfileComplete) {
        // If profile is complete, redirect based on role
        if (user.role === 'super_admin') {
          setLocation('/admin');
        } else {
          setLocation('/dashboard');
        }
      } else if (user && !user.isProfileComplete && currentStep !== 'profile') {
        // If authenticated but profile not complete, move to profile step
        setCurrentStep('profile');
      }
    }
  }, [isAuthenticated, user, currentStep, setLocation]);

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

  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      companyName: '',
      subdomainName: '',
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
      const user = await verifyOtpMutation.mutateAsync({
        email: currentEmail,
        otp: data.otp,
      });
      
      // If user already has a profile, they will be redirected by the useEffect
      // If not, we'll show the profile completion form
      if (!user.isProfileComplete) {
        setCurrentStep('profile');
      }
    } catch (err) {
      console.error('Error verifying OTP:', err);
      setError(err instanceof Error ? err.message : 'Invalid verification code');
    }
  };

  // Handle profile completion
  const onSubmitProfile = async (data: ProfileFormValues) => {
    setError(null);
    
    try {
      await completeProfileMutation.mutateAsync({
        firstName: data.firstName,
        lastName: data.lastName,
        isProfileComplete: true,
        // These will be used to create a vendor record in a separate API call
        vendor: {
          companyName: data.companyName,
          subdomainName: data.subdomainName,
        }
      });
      
      toast({
        title: 'Account Created',
        description: 'Your vendor account has been successfully created!',
      });
      
      // Redirect will happen due to the useEffect watching isAuthenticated and isProfileComplete
    } catch (err) {
      console.error('Error completing profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to complete profile');
    }
  };

  // Handle back to email button
  const handleBackToEmail = () => {
    setCurrentStep('email');
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left panel with registration form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12 bg-white dark:bg-gray-950">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">MultiVend</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Create your eCommerce store in minutes</p>
          </div>
          
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-center text-2xl">Create an Account</CardTitle>
              <CardDescription className="text-center">
                {currentStep === 'email' && 'Get started with a free vendor account'}
                {currentStep === 'otp' && 'Verify your email address'}
                {currentStep === 'profile' && 'Complete your profile and store details'}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {/* Step 1: Email Form */}
              {currentStep === 'email' && (
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
              )}
              
              {/* Step 2: OTP Verification Form */}
              {currentStep === 'otp' && (
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
              
              {/* Step 3: Profile Completion Form */}
              {currentStep === 'profile' && (
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 pb-2 border-b dark:border-gray-800">
                        Personal Information
                      </h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={profileForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input placeholder="John" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Doe" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 pb-2 border-b dark:border-gray-800">
                        Store Information
                      </h3>
                      
                      <FormField
                        control={profileForm.control}
                        name="companyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Store Name</FormLabel>
                            <FormControl>
                              <div className="flex items-center border rounded-md focus-within:ring-1 focus-within:ring-indigo-500 bg-white dark:bg-gray-900">
                                <Store className="ml-3 h-5 w-5 text-gray-400" />
                                <Input 
                                  placeholder="My Awesome Store" 
                                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="subdomainName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Store Subdomain</FormLabel>
                            <FormControl>
                              <div className="flex items-center">
                                <div className="flex flex-1 items-center border rounded-l-md focus-within:ring-1 focus-within:ring-indigo-500 bg-white dark:bg-gray-900">
                                  <Globe className="ml-3 h-5 w-5 text-gray-400" />
                                  <Input 
                                    placeholder="mystore" 
                                    className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                                    {...field} 
                                  />
                                </div>
                                <div className="inline-flex items-center px-3 h-10 rounded-r-md border border-l-0 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm">
                                  .multivend.com
                                </div>
                              </div>
                            </FormControl>
                            <FormDescription>
                              This will be your store's web address
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={completeProfileMutation.isPending}
                    >
                      {completeProfileMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Store...
                        </>
                      ) : (
                        'Complete Registration'
                      )}
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
            
            {(currentStep === 'email' || currentStep === 'otp') && (
              <CardFooter className="flex flex-col space-y-2">
                <div className="text-sm text-center text-gray-500 dark:text-gray-400">
                  Already have an account?{" "}
                  <Link href="/login" className="text-primary hover:text-primary/80 font-medium">
                    Sign in
                  </Link>
                </div>
              </CardFooter>
            )}
          </Card>
          
          <div className="text-center text-xs text-gray-500 dark:text-gray-400">
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </div>
        </div>
      </div>
      
      {/* Right panel with hero content (only visible on large screens) */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-indigo-600 to-purple-700 items-center justify-center p-12">
        <div className="max-w-md text-white">
          <h2 className="text-3xl font-bold mb-6">Launch Your Online Store Today</h2>
          <p className="text-lg mb-8 text-indigo-100">
            MultiVend provides everything you need to create, manage, and grow your eCommerce business.
            Get started in minutes with our powerful platform designed for entrepreneurs.
          </p>
          <div className="space-y-4">
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p>Easy setup with no technical skills required</p>
            </div>
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p>Professional store with your custom domain</p>
            </div>
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p>Powerful tools to grow your business</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
