import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { User, Lock, Eye, EyeOff, ExternalLink } from 'lucide-react';

const Profile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState({ name: '', email: '', phone: '', avatar: '', address: { street: '', city: '', state: '', zipCode: '' } });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    // Fetch user data
    const fetchUser = async () => {
      try {
        const response = await axios.get('/api/users/profile');
        const userData = response.data.user;
        setUser(userData);
        setFormData(prev => ({
          ...prev,
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          address: userData.address || { street: '', city: '', state: '', zipCode: '' }
        }));
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        toast.error('Failed to load profile data.');
      }
    };
    fetchUser();
  }, [navigate]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.put('/api/users/profile', {
        name: formData.name,
        phone: formData.phone,
        address: formData.address
      });
      setUser(response.data.user);
      toast.success('Profile updated successfully!');
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string } } };
        toast.error(axiosError.response?.data?.error || 'Failed to update profile.');
      } else {
        toast.error('Failed to update profile.');
      }
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match!');
      return;
    }
    try {
      await axios.put('/api/auth/password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      toast.success('Password changed successfully!');
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string } } };
        toast.error(axiosError.response?.data?.error || 'Failed to change password.');
      } else {
        toast.error('Failed to change password.');
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await axios.post('/api/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setUser(prev => ({ ...prev, avatar: response.data.avatar }));
      toast.success('Avatar updated successfully!');
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string } } };
        toast.error(axiosError.response?.data?.error || 'Failed to update avatar.');
      } else {
        toast.error('Failed to update avatar.');
      }
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
            <p className="text-gray-600">Manage your account information and preferences</p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile Information
              </TabsTrigger>
              <TabsTrigger value="password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Change Password
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <Card className="shadow-md border-0">
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-6">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="text-xl">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold">{user.name}</h3>
                      <p className="text-gray-600">{user.email}</p>
                      <Button variant="outline" size="sm" className="mt-2" onClick={handleAvatarClick}>
                        Change Avatar
                      </Button>
                    </div>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />

                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          value={formData.name}
                          onChange={handleChange}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleChange}
                          className="mt-1"
                          placeholder="Enter phone number"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Address Information</h3>
                      <p className="text-sm text-gray-600">Required for buying and selling items</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                          <Label htmlFor="address.street">Street Address</Label>
                          <Input
                            id="address.street"
                            name="address.street"
                            type="text"
                            value={formData.address.street}
                            onChange={handleChange}
                            className="mt-1"
                            placeholder="Enter street address"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="address.city">City</Label>
                          <Input
                            id="address.city"
                            name="address.city"
                            type="text"
                            value={formData.address.city}
                            onChange={handleChange}
                            className="mt-1"
                            placeholder="Enter city"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="address.state">State</Label>
                          <Input
                            id="address.state"
                            name="address.state"
                            type="text"
                            value={formData.address.state}
                            onChange={handleChange}
                            className="mt-1"
                            placeholder="Enter state"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="address.zipCode">ZIP Code</Label>
                          <Input
                            id="address.zipCode"
                            name="address.zipCode"
                            type="text"
                            value={formData.address.zipCode}
                            onChange={handleChange}
                            className="mt-1"
                            placeholder="Enter ZIP code"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                      Save Changes
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="password" className="space-y-6">
              <Card className="shadow-md border-0">
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <p className="text-sm text-gray-600 mt-2">
                    For a better experience, you can also use our dedicated{' '}
                    <Link to="/change-password" className="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1">
                      Change Password page <ExternalLink className="h-3 w-3" />
                    </Link>
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <div className="relative mt-1">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="currentPassword"
                          name="currentPassword"
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={formData.currentPassword}
                          onChange={handleChange}
                          className="pl-10 pr-10"
                          placeholder="Enter current password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative mt-1">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="newPassword"
                          name="newPassword"
                          type={showNewPassword ? 'text' : 'password'}
                          value={formData.newPassword}
                          onChange={handleChange}
                          className="pl-10 pr-10"
                          placeholder="Enter new password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <div className="relative mt-1">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className="pl-10 pr-10"
                          placeholder="Confirm new password"
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

                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                      Change Password
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
