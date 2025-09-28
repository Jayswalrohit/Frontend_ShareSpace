import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Package, 
  Flag, 
  TrendingUp, 
  Search, 
  Check,
  X,
  Eye,
  MoreVertical,
  AlertTriangle,
  ShieldCheck,
  Calendar
} from 'lucide-react';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock admin statistics
  const adminStats = [
    { 
      title: 'Total Users', 
      value: '2,847', 
      change: '+124 this month',
      icon: Users,
      color: 'text-blue-600'
    },
    { 
      title: 'Active Listings', 
      value: '1,283', 
      change: '+89 this week',
      icon: Package,
      color: 'text-green-600'
    },
    { 
      title: 'Pending Reviews', 
      value: '47', 
      change: '-12 today',
      icon: Eye,
      color: 'text-orange-600'
    },
    { 
      title: 'Reported Items', 
      value: '8', 
      change: '+3 new',
      icon: Flag,
      color: 'text-red-600'
    },
  ];

  // Mock pending listings
  const pendingListings = [
    {
      id: '1',
      title: 'iPhone 14 Pro - Excellent Condition',
      seller: { name: 'John Smith', email: 'john.smith@university.edu' },
      price: 800,
      category: 'Electronics',
      image: 'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=400',
      submittedAt: '2h ago',
      status: 'pending',
    },
    {
      id: '2',
      title: 'Calculus Textbook Set',
      seller: { name: 'Sarah Johnson', email: 'sarah.j@university.edu' },
      price: 120,
      category: 'Books',
      image: 'https://images.pexels.com/photos/1370296/pexels-photo-1370296.jpeg?auto=compress&cs=tinysrgb&w=400',
      submittedAt: '4h ago',
      status: 'pending',
    },
    {
      id: '3',
      title: 'Gaming Laptop - ASUS ROG',
      seller: { name: 'Mike Chen', email: 'mike.chen@university.edu' },
      price: 1200,
      category: 'Electronics',
      image: 'https://images.pexels.com/photos/812264/pexels-photo-812264.jpeg?auto=compress&cs=tinysrgb&w=400',
      submittedAt: '6h ago',
      status: 'pending',
    },
  ];

  // Mock reported items
  const reportedItems = [
    {
      id: '4',
      title: 'Suspicious Electronics Deal',
      reporter: { name: 'Emma Davis', email: 'emma.d@university.edu' },
      reported: { name: 'Unknown User', email: 'fake@email.com' },
      reason: 'Scam/Fraud',
      description: 'Price too good to be true, seller not responding',
      reportedAt: '1d ago',
      severity: 'high',
    },
    {
      id: '5',
      title: 'Inappropriate Item Description',
      reporter: { name: 'Alex Wilson', email: 'alex.w@university.edu' },
      reported: { name: 'Tom Brown', email: 'tom.b@university.edu' },
      reason: 'Inappropriate Content',
      description: 'Contains inappropriate language',
      reportedAt: '2d ago',
      severity: 'medium',
    },
  ];

  // Mock users
  const users = [
    {
      id: '1',
      name: 'John Smith',
      email: 'john.smith@university.edu',
      avatar: '',
      joinedAt: '2023-09-15',
      totalListings: 12,
      totalPurchases: 8,
      status: 'active',
      verified: true,
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah.j@university.edu',
      avatar: '',
      joinedAt: '2023-08-22',
      totalListings: 18,
      totalPurchases: 15,
      status: 'active',
      verified: true,
    },
    {
      id: '3',
      name: 'Mike Chen',
      email: 'mike.chen@university.edu',
      avatar: '',
      joinedAt: '2023-10-01',
      totalListings: 6,
      totalPurchases: 4,
      status: 'suspended',
      verified: false,
    },
  ];

  const handleApprove = (id: string) => {
    console.log('Approving listing:', id);
  };

  const handleReject = (id: string) => {
    console.log('Rejecting listing:', id);
  };

  const handleResolveReport = (id: string) => {
    console.log('Resolving report:', id);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Manage users, listings, and platform operations</p>
        </div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {adminStats.map((stat,) => {
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
          })}
        </motion.div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="listings" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Listings
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <Flag className="h-4 w-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-md border-0">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <Check className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium">Listing Approved</p>
                        <p className="text-xs text-gray-500">iPhone 13 Pro by Sarah Johnson</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                      <Users className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium">New User Registered</p>
                        <p className="text-xs text-gray-500">alex.wilson@university.edu</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                      <Flag className="h-5 w-5 text-red-600" />
                      <div>
                        <p className="text-sm font-medium">Item Reported</p>
                        <p className="text-xs text-gray-500">Suspicious pricing detected</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-md border-0">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    <Eye className="h-4 w-4 mr-2" />
                    Review Pending Listings ({pendingListings.length})
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Flag className="h-4 w-4 mr-2" />
                    Check Reported Items ({reportedItems.length})
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Users className="h-4 w-4 mr-2" />
                    Manage Users
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="listings" className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <h2 className="text-xl font-semibold">Pending Listings</h2>
              <div className="flex gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search listings..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              {pendingListings.map((listing) => (
                <Card key={listing.id} className="shadow-md border-0">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <img
                        src={listing.image}
                        alt={listing.title}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">{listing.title}</h3>
                            <p className="text-2xl font-bold text-blue-600 mt-1">${listing.price}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <Badge variant="outline">{listing.category}</Badge>
                              <span>by {listing.seller.name}</span>
                              <span>{listing.submittedAt}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => handleApprove(listing.id)}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              onClick={() => handleReject(listing.id)}
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 border-red-200"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Reported Items</h2>
              <Badge variant="destructive">{reportedItems.length} pending</Badge>
            </div>

            <div className="space-y-4">
              {reportedItems.map((report) => (
                <Card key={report.id} className="shadow-md border-0">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4">
                        <AlertTriangle className="h-6 w-6 text-red-500 mt-1" />
                        <div>
                          <h3 className="font-semibold text-gray-900">{report.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getSeverityColor(report.severity)}>
                              {report.severity} priority
                            </Badge>
                            <Badge variant="outline">{report.reason}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleResolveReport(report.id)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Resolve
                        </Button>
                        <Button variant="outline" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-700">Reporter:</p>
                        <p className="text-gray-600">{report.reporter.name}</p>
                        <p className="text-gray-500">{report.reporter.email}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">Reported User:</p>
                        <p className="text-gray-600">{report.reported.name}</p>
                        <p className="text-gray-500">{report.reported.email}</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="font-medium text-gray-700 mb-2">Description:</p>
                      <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                        {report.description}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                      <span>Reported {report.reportedAt}</span>
                      <span>ID: {report.id}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">User Management</h2>
              <div className="flex gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input placeholder="Search users..." className="pl-10 w-80" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {users.map((user) => (
                <Card key={user.id} className="shadow-md border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{user.name}</h3>
                            {user.verified && (
                              <ShieldCheck className="h-4 w-4 text-green-500" />
                            )}
                            <Badge className={user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {user.status}
                            </Badge>
                          </div>
                          <p className="text-gray-600">{user.email}</p>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>Joined {user.joinedAt}</span>
                            </div>
                            <span>{user.totalListings} listings</span>
                            <span>{user.totalPurchases} purchases</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          View Profile
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className={user.status === 'active' ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                        >
                          {user.status === 'active' ? 'Suspend' : 'Activate'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;