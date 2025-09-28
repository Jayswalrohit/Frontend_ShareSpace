
import { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, Lock, User, Chrome, GraduationCap, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const Signup = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isNameAvailable, setIsNameAvailable] = useState<boolean | null>(null);
  const [nameError, setNameError] = useState('');
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const checkNameAvailability = async (name: string) => {
    if (name.trim().length < 2) {
      setIsNameAvailable(null);
      setNameError('');
      return;
    }

    setIsCheckingName(true);
    setNameError('');
    try {
      const response = await axios.post('/api/auth/check-name', { name: name.trim() });
      setIsNameAvailable(response.data.available);
      setNameError(response.data.available ? '' : response.data.message);
    } catch (error: unknown) {
      console.error('Error checking name availability:', error);
      setNameError('Error checking name availability');
      setIsNameAvailable(false);
    } finally {
      setIsCheckingName(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }
    if (isNameAvailable === false) {
      toast.error('Name is not available. Please choose another.');
      return;
    }
    if (isNameAvailable === null && formData.name.trim()) {
      await checkNameAvailability(formData.name);
      if (isNameAvailable === false) {
        toast.error('Name is not available. Please choose another.');
        return;
      }
    }
    try {
      const response = await axios.post('/api/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        toast.success('Account created successfully!');
        navigate('/dashboard'); // Redirect to dashboard after signup
      } else {
        toast.error(response.data.error || 'Signup failed.');
      }
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'response' in error) {
        // @ts-expect-error: error.response is not typed, but axios error may have it
        toast.error(error.response?.data?.error || 'Signup failed.');
      } else {
        toast.error('Signup failed.');
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    if (name === 'name') {
      setIsNameAvailable(null);
      setNameError('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl border-0">
          <CardHeader className="space-y-1 pb-8">
            <CardTitle className="text-2xl font-bold text-center">Join ShareSpace</CardTitle>
            <CardDescription className="text-center text-gray-600">
              Create your account to start trading
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={() => checkNameAvailability(formData.name)}
                    className="pl-10"
                    placeholder="John Doe"
                    required
                  />
                </div>
                {isCheckingName && (
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Checking name availability...
                  </p>
                )}
                {nameError && (
                  <p className="text-sm text-red-600">{nameError}</p>
                )}
                {isNameAvailable === true && (
                  <p className="text-sm text-green-600">Name is available!</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">College Email</Label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10"
                    placeholder="your.email@university.edu"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Must be a valid college email address
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 pr-10"
                    placeholder="Create a secure password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-10 pr-10"
                    placeholder="Confirm your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <input
                  id="terms"
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 mt-1"
                  required
                />
                <Label htmlFor="terms" className="text-sm leading-relaxed">
                  I agree to the{' '}
                  <a href="#" className="text-blue-600 hover:underline">Terms of Service</a> and{' '}
                  <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
                </Label>
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                Create Account
              </Button>
            </form>

            <div className="relative">
              <Separator className="my-4" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-sm text-gray-500">
                or continue with
              </span>
            </div>

            <Button
              variant="outline"
              className="w-full"
              type="button"
              onClick={() => {
                window.location.href = "/api/auth/google";
              }}
            >
              <Chrome className="mr-2 h-4 w-4" />
              Sign up with Google
            </Button>

            <div className="text-center">
              <span className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-600 hover:underline font-medium">
                  Sign in
                </Link>
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Signup;