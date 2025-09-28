import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ItemCard from '@/components/ui/ItemCard';
import { toast } from 'sonner';
import {
  Package,
  ShoppingBag,
  Heart,
  Settings,
  Plus,
  Eye,
  Edit,
  Trash2,
  DollarSign,
  TrendingUp,
  Clock
} from 'lucide-react';

interface Listing {
  _id: string;
  title: string;
  price: number;
  images: { url: string }[];
  status: string;
  views?: number;
  createdAt: string;
  seller?: {
    name: string;
    avatar?: string;
  };
}

interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
  createdAt: string;
  preferences?: {
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    weeklySummary?: boolean;
  };
}

interface Stats {
  activeListings?: number;
  soldListings?: number;
  recentListings?: number;
  totalViews?: number;
}

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('listings');
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [wishlist, setWishlist] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    fetchDashboardData();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfileEmail(user.email || '');
      setEmailNotifications(user.preferences?.emailNotifications ?? true);
      setPushNotifications(user.preferences?.pushNotifications ?? true);
      setWeeklySummary(user.preferences?.weeklySummary ?? false);
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch user profile and dashboard stats
      const [profileResponse, dashboardResponse] = await Promise.all([
        axios.get('/api/users/profile'),
        axios.get('/api/users/dashboard')
      ]);

      setUser(profileResponse.data.user);
      setStats(dashboardResponse.data.stats);

      // Fetch user's listings
      await fetchUserListings();

      // Fetch user's favorites
      await fetchUserFavorites();

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserListings = async () => {
    try {
      setListingsLoading(true);
      const response = await axios.get('/api/users/listings');
      setMyListings(response.data.listings);
    } catch (error: any) {
      console.error('Error fetching listings:', error);
      toast.error('Failed to load listings');
    } finally {
      setListingsLoading(false);
    }
  };

  const fetchUserFavorites = async () => {
    try {
      const response = await axios.get('/api/users/favorites');
      setWishlist(response.data.listings);
    } catch (error: any) {
      console.error('Error fetching favorites:', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);
      await axios.put('/api/users/profile', {
        name: profileName,
      });
      toast.success('Profile updated successfully');
      // Refresh user data
      const response = await axios.get('/api/users/profile');
      setUser(response.data.user);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      setSavingPreferences(true);
      await axios.put('/api/users/profile', {
        preferences: {
          emailNotifications,
          pushNotifications,
          weeklySummary,
        },
      });
      toast.success('Preferences updated successfully');
      // Refresh user data
      const response = await axios.get('/api/users/profile');
      setUser(response.data.user);
    } catch (error: any) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences');
    } finally {
      setSavingPreferences(false);
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;

    try {
      await axios.delete(`/api/listings/${listingId}`);
      toast.success('Listing deleted successfully');
      await fetchUserListings(); // Refresh listings
    } catch (error: any) {
      console.error('Error deleting listing:', error);
      toast.error('Failed to delete listing');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString();
  };

  // Mock purchases data (since no backend route exists yet)
  const myPurchases: any[] = [];

  // Calculate stats for display
  const displayStats = stats ? [
    {
      title: 'Active Listings',
      value: stats.activeListings?.toString() || '0',
      icon: Package,
      change: `+${stats.recentListings || 0} this week`,
      color: 'text-blue-600'
    },
    {
      title: 'Total Sales',
      value: stats.soldListings?.toString() || '0',
      icon: ShoppingBag,
      change: '+0 this month', // TODO: Calculate from monthlyStats
      color: 'text-green-600'
    },
    {
      title: 'Total Earnings',
      value: '$0', // TODO: Calculate from sold listings
      icon: DollarSign,
      change: '+$0 this month',
      color: 'text-purple-600'
    },
    {
      title: 'Profile Views',
      value: stats.totalViews?.toString() || '0',
      icon: Eye,
      change: '+0 this week', // TODO: Calculate weekly views
      color: 'text-orange-600'
    },
  ] : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Manage your listings, purchases, and account</p>
          </div>
          <Link to="/add-listing">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add New Listing
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {loading ? (
            // Loading skeleton
            Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="shadow-md border-0">
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            displayStats.map((stat: any) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.title} className="shadow-md border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                        <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
                      </div>
                      <div className={`p-3 rounded-full bg-gray-100 ${stat.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="listings" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  <span className="hidden sm:inline">My Listings</span>
                </TabsTrigger>
                <TabsTrigger value="purchases" className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  <span className="hidden sm:inline">Purchases</span>
                </TabsTrigger>
                <TabsTrigger value="wishlist" className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  <span className="hidden sm:inline">Wishlist</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Settings</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="listings" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">My Listings</h2>
                  <Badge variant="secondary">{myListings.length} total</Badge>
                </div>

                {listingsLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <Card key={index} className="shadow-md border-0">
                        <CardContent className="p-6">
                          <div className="animate-pulse flex items-start space-x-4">
                            <div className="w-20 h-20 bg-gray-200 rounded-lg"></div>
                            <div className="flex-1">
                              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                              <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
                              <div className="flex gap-4">
                                <div className="h-4 bg-gray-200 rounded w-16"></div>
                                <div className="h-4 bg-gray-200 rounded w-20"></div>
                                <div className="h-4 bg-gray-200 rounded w-12"></div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : myListings.length === 0 ? (
                  <Card className="shadow-md border-0">
                    <CardContent className="p-12 text-center">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No listings yet</h3>
                      <p className="text-gray-500 mb-4">Create your first listing to start selling</p>
                      <Link to="/add-listing">
                        <Button className="bg-blue-600 hover:bg-blue-700">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Your First Listing
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {myListings.map((listing: any) => (
                      <Card key={listing._id} className="shadow-md border-0">
                        <CardContent className="p-6">
                          <div className="flex items-start space-x-4">
                            <img
                              src={listing.images?.[0]?.url || '/placeholder-image.jpg'}
                              alt={listing.title}
                              className="w-20 h-20 rounded-lg object-cover"
                            />
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="font-semibold text-gray-900">{listing.title}</h3>
                                  <p className="text-2xl font-bold text-blue-600 mt-1">${listing.price}</p>
                                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                    <div className="flex items-center gap-1">
                                      <Eye className="h-4 w-4" />
                                      <span>{listing.views || 0} views</span>
                                    </div>
                                    <Badge variant={listing.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                                      {listing.status}
                                    </Badge>
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-4 w-4" />
                                      <span>{formatDate(listing.createdAt)}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(`/add-listing?edit=${listing._id}`)}
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700"
                                    onClick={() => handleDeleteListing(listing._id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="purchases" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">My Purchases</h2>
                  <Badge variant="secondary">{myPurchases.length} items</Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myPurchases.map((item) => (
                    <div key={item.id}>
                      <ItemCard item={item} />
                      <div className="mt-2 text-center">
                        <Badge className="bg-green-100 text-green-800">
                          Purchased {item.purchaseDate}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="wishlist" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Wishlist</h2>
                  <Badge variant="secondary">{wishlist.length} items</Badge>
                </div>

                {wishlist.length === 0 ? (
                  <Card className="shadow-md border-0">
                    <CardContent className="p-12 text-center">
                      <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No favorites yet</h3>
                      <p className="text-gray-500 mb-4">Items you favorite will appear here</p>
                      <Link to="/marketplace">
                        <Button variant="outline">
                          Browse Marketplace
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wishlist.map((item: any) => (
                      <ItemCard key={item._id} item={item} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <h2 className="text-xl font-semibold">Account Settings</h2>
                
                <div className="space-y-6">
                  <Card className="shadow-md border-0">
                    <CardHeader>
                      <CardTitle>Profile Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Full Name</label>
                          <input
                            type="text"
                            value={profileName}
                            onChange={(e) => setProfileName(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Email</label>
                          <input
                            type="email"
                            value={profileEmail}
                            onChange={(e) => setProfileEmail(e.target.value)}
                            disabled
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-100"
                          />
                        </div>
                      </div>
                      <Button
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={handleSaveProfile}
                        disabled={savingProfile}
                      >
                        {savingProfile ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="shadow-md border-0">
                    <CardHeader>
                      <CardTitle>Notification Preferences</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={emailNotifications}
                            onChange={(e) => setEmailNotifications(e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm">Email notifications for new messages</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={pushNotifications}
                            onChange={(e) => setPushNotifications(e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm">Push notifications for item interactions</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={weeklySummary}
                            onChange={(e) => setWeeklySummary(e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm">Weekly summary emails</span>
                        </label>
                      </div>
                      <Button
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={handleSavePreferences}
                        disabled={savingPreferences}
                      >
                        {savingPreferences ? 'Saving...' : 'Save Preferences'}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Profile Sidebar */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="shadow-md border-0">
                <CardContent className="p-6 text-center">
                  {loading ? (
                    <div className="animate-pulse">
                      <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4"></div>
                      <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-4"></div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <div className="h-4 bg-gray-200 rounded w-12"></div>
                          <div className="h-4 bg-gray-200 rounded w-16"></div>
                        </div>
                        <div className="flex justify-between">
                          <div className="h-4 bg-gray-200 rounded w-12"></div>
                          <div className="h-4 bg-gray-200 rounded w-8"></div>
                        </div>
                        <div className="flex justify-between">
                          <div className="h-4 bg-gray-200 rounded w-20"></div>
                          <div className="h-4 bg-gray-200 rounded w-16"></div>
                        </div>
                      </div>
                    </div>
                  ) : user ? (
                    <>
                      <Avatar className="w-20 h-20 mx-auto mb-4">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="text-xl">
                          {user.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{user.name}</h3>
                      <p className="text-gray-600 text-sm mb-4">{user.email}</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Joined</span>
                          <span className="font-medium">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Role</span>
                          <span className="font-medium capitalize">{user.role || 'Student'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Status</span>
                          <span className="font-medium text-green-600">Active</span>
                        </div>
                      </div>
                    </>
                  ) : null}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card className="shadow-md border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">This Month</span>
                      <span className="font-medium">+{stats?.soldListings || 0} sales</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">This Week</span>
                      <span className="font-medium">+{stats?.recentListings || 0} listings</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Response Rate</span>
                      <span className="font-medium">98%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;