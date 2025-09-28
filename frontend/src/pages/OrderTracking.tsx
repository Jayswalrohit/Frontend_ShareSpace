import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  MessageCircle,
  Star,
  AlertCircle,
  XCircle,
  RefreshCw,
  Edit
} from 'lucide-react';
import { toast } from 'sonner';

interface Order {
  _id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  quantity: number;
  deliveryMethod: string;
  createdAt: string;
  buyer: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
  };
  seller: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
  };
  listing: {
    _id: string;
    title: string;
    price: number;
    images: Array<{ url: string }>;
    category: string;
  };
  timeline: Array<{
    status: string;
    timestamp: string;
    note: string;
    updatedBy: {
      _id: string;
      name: string;
    };
  }>;
  messages: Array<{
    sender: {
      _id: string;
      name: string;
      avatar?: string;
    };
    message: string;
    timestamp: string;
    isSystemMessage: boolean;
  }>;
  shippingAddress?: {
    name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  pickupAddress?: {
    name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    instructions: string;
  };
  deliveryDetails?: {
    estimatedDelivery: string;
    actualDelivery?: string;
    trackingNumber?: string;
    courierService?: string;
    deliveryInstructions?: string;
  };
}

const OrderTracking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [updatingDelivery, setUpdatingDelivery] = useState(false);

  // Form states
  const [locationForm, setLocationForm] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    instructions: ''
  });

  const [deliveryForm, setDeliveryForm] = useState({
    estimatedDelivery: '',
    trackingNumber: '',
    courierService: '',
    deliveryInstructions: ''
  });

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/orders/${id}`);
      setOrder(response.data);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Failed to load order details');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      setSendingMessage(true);
      await axios.post(`/api/orders/${id}/message`, { message: newMessage });
      setNewMessage('');
      await fetchOrder(); // Refresh order data
      toast.success('Message sent');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleUpdateLocation = async () => {
    try {
      setUpdatingLocation(true);
      const data = order?.deliveryMethod === 'delivery'
        ? { shippingAddress: locationForm }
        : { pickupAddress: locationForm };

      await axios.put(`/api/orders/${id}/delivery-location`, data);
      setShowLocationModal(false);
      await fetchOrder();
      toast.success('Delivery location updated');
    } catch (error) {
      console.error('Error updating location:', error);
      toast.error('Failed to update location');
    } finally {
      setUpdatingLocation(false);
    }
  };

  const handleUpdateDelivery = async () => {
    try {
      setUpdatingDelivery(true);
      await axios.put(`/api/orders/${id}/delivery-details`, deliveryForm);
      setShowDeliveryModal(false);
      await fetchOrder();
      toast.success('Delivery details updated');
    } catch (error) {
      console.error('Error updating delivery:', error);
      toast.error('Failed to update delivery details');
    } finally {
      setUpdatingDelivery(false);
    }
  };

  const openLocationModal = () => {
    if (order?.deliveryMethod === 'delivery' && order.shippingAddress) {
      setLocationForm({
        ...order.shippingAddress,
        instructions: ''
      });
    } else if (order?.deliveryMethod === 'pickup' && order.pickupAddress) {
      setLocationForm(order.pickupAddress);
    }
    setShowLocationModal(true);
  };

  const openDeliveryModal = () => {
    if (order?.deliveryDetails) {
      setDeliveryForm({
        estimatedDelivery: order.deliveryDetails.estimatedDelivery || '',
        trackingNumber: order.deliveryDetails.trackingNumber || '',
        courierService: order.deliveryDetails.courierService || '',
        deliveryInstructions: order.deliveryDetails.deliveryInstructions || ''
      });
    }
    setShowDeliveryModal(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'paid':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'preparing':
        return <Package className="h-5 w-5 text-orange-500" />;
      case 'ready_for_pickup':
        return <MapPin className="h-5 w-5 text-purple-500" />;
      case 'shipped':
        return <Truck className="h-5 w-5 text-blue-500" />;
      case 'out_for_delivery':
        return <Truck className="h-5 w-5 text-indigo-500" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'refunded':
        return <RefreshCw className="h-5 w-5 text-gray-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'paid':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'preparing':
        return 'bg-orange-100 text-orange-800';
      case 'ready_for_pickup':
        return 'bg-purple-100 text-purple-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'out_for_delivery':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };


  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-6">The order you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/orders')}>
            View All Orders
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Order Tracking</h1>
              <p className="text-gray-600">Order #{order.orderNumber}</p>
            </div>
            <Badge className={`${getStatusColor(order.status)} px-3 py-1`}>
              {order.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.timeline.map((event, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="flex items-start space-x-4"
                    >
                      <div className="flex-shrink-0">
                        {getStatusIcon(event.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {event.status.replace('_', ' ').toUpperCase()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatTime(event.timestamp)}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{event.note}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Updated by {event.updatedBy.name}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Order Messages */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Order Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {order.messages.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className={`flex ${message.isSystemMessage ? 'justify-center' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md ${message.isSystemMessage ? 'text-center' : ''}`}>
                        {!message.isSystemMessage && (
                          <div className="flex items-center space-x-2 mb-1">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={message.sender.avatar} />
                              <AvatarFallback className="text-xs">
                                {message.sender.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{message.sender.name}</span>
                            <span className="text-xs text-gray-500">
                              {formatTime(message.timestamp)}
                            </span>
                          </div>
                        )}
                        <div
                          className={`rounded-lg px-3 py-2 ${
                            message.isSystemMessage
                              ? 'bg-gray-100 text-gray-700 text-sm'
                              : 'bg-blue-100 text-blue-900'
                          }`}
                        >
                          <p className="text-sm">{message.message}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="mt-4 flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={sendingMessage || !newMessage.trim()}
                    size="sm"
                  >
                    Send
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Details */}
            <Card>
              <CardHeader>
                <CardTitle>Order Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <img
                    src={order.listing.images[0]?.url || '/placeholder-image.jpg'}
                    alt={order.listing.title}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 line-clamp-2">
                      {order.listing.title}
                    </h3>
                    <p className="text-sm text-gray-600">{order.listing.category}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quantity</span>
                    <span>{order.quantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Unit Price</span>
                    <span>₹{(order.listing.price * 83).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount</span>
                    <span className="font-medium">₹{(order.totalAmount * 83).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Seller</h4>
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={order.seller.avatar} />
                      <AvatarFallback>
                        {order.seller.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{order.seller.name}</p>
                      {order.seller.phone && (
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <Phone className="h-3 w-3" />
                          <span>{order.seller.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Delivery Method</h4>
                  <p className="text-sm text-gray-600 capitalize">
                    {order.deliveryMethod.replace('_', ' ')}
                  </p>
                </div>

                {order.deliveryMethod === 'delivery' && order.shippingAddress && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">Shipping Address</h4>
                      <Button
                        onClick={openLocationModal}
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>{order.shippingAddress.name}</p>
                      <p>{order.shippingAddress.address}</p>
                      <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                      <p>{order.shippingAddress.phone}</p>
                    </div>
                  </div>
                )}

                {order.deliveryMethod === 'pickup' && order.pickupAddress && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">Pickup Address</h4>
                      <Button
                        onClick={openLocationModal}
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>{order.pickupAddress.name}</p>
                      <p>{order.pickupAddress.address}</p>
                      <p>{order.pickupAddress.city}, {order.pickupAddress.state} {order.pickupAddress.zipCode}</p>
                      <p>{order.pickupAddress.phone}</p>
                      {order.pickupAddress.instructions && (
                        <p className="mt-2 p-2 bg-gray-50 rounded">
                          <strong>Instructions:</strong> {order.pickupAddress.instructions}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {order.deliveryDetails && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">Delivery Details</h4>
                      <Button
                        onClick={openDeliveryModal}
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      {order.deliveryDetails.estimatedDelivery && (
                        <p><strong>Estimated Delivery:</strong> {new Date(order.deliveryDetails.estimatedDelivery).toLocaleDateString()}</p>
                      )}
                      {order.deliveryDetails.trackingNumber && (
                        <p><strong>Tracking Number:</strong> {order.deliveryDetails.trackingNumber}</p>
                      )}
                      {order.deliveryDetails.courierService && (
                        <p><strong>Courier Service:</strong> {order.deliveryDetails.courierService}</p>
                      )}
                      {order.deliveryDetails.deliveryInstructions && (
                        <p className="mt-2 p-2 bg-gray-50 rounded">
                          <strong>Instructions:</strong> {order.deliveryDetails.deliveryInstructions}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <Button
                    onClick={() => navigate(`/chat?seller=${order.seller._id}`)}
                    className="w-full"
                    variant="outline"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Contact Seller
                  </Button>
                  
                  {order.status === 'delivered' && (
                    <Button
                      onClick={() => navigate(`/orders/${order._id}/rate`)}
                      className="w-full"
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Rate Order
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Location Modal */}
      <Dialog open={showLocationModal} onOpenChange={setShowLocationModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit {order?.deliveryMethod === 'delivery' ? 'Shipping' : 'Pickup'} Address</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={locationForm.name}
                onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                placeholder="Enter name"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={locationForm.phone}
                onChange={(e) => setLocationForm({ ...locationForm, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={locationForm.address}
                onChange={(e) => setLocationForm({ ...locationForm, address: e.target.value })}
                placeholder="Enter address"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={locationForm.city}
                  onChange={(e) => setLocationForm({ ...locationForm, city: e.target.value })}
                  placeholder="Enter city"
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={locationForm.state}
                  onChange={(e) => setLocationForm({ ...locationForm, state: e.target.value })}
                  placeholder="Enter state"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="zipCode">Zip Code</Label>
              <Input
                id="zipCode"
                value={locationForm.zipCode}
                onChange={(e) => setLocationForm({ ...locationForm, zipCode: e.target.value })}
                placeholder="Enter zip code"
              />
            </div>
            {order?.deliveryMethod === 'pickup' && (
              <div>
                <Label htmlFor="instructions">Instructions</Label>
                <Textarea
                  id="instructions"
                  value={locationForm.instructions}
                  onChange={(e) => setLocationForm({ ...locationForm, instructions: e.target.value })}
                  placeholder="Enter pickup instructions"
                  rows={2}
                />
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowLocationModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateLocation}
                disabled={updatingLocation}
              >
                {updatingLocation ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delivery Modal */}
      <Dialog open={showDeliveryModal} onOpenChange={setShowDeliveryModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Delivery Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="estimatedDelivery">Estimated Delivery Date</Label>
              <Input
                id="estimatedDelivery"
                type="date"
                value={deliveryForm.estimatedDelivery}
                onChange={(e) => setDeliveryForm({ ...deliveryForm, estimatedDelivery: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="trackingNumber">Tracking Number</Label>
              <Input
                id="trackingNumber"
                value={deliveryForm.trackingNumber}
                onChange={(e) => setDeliveryForm({ ...deliveryForm, trackingNumber: e.target.value })}
                placeholder="Enter tracking number"
              />
            </div>
            <div>
              <Label htmlFor="courierService">Courier Service</Label>
              <Input
                id="courierService"
                value={deliveryForm.courierService}
                onChange={(e) => setDeliveryForm({ ...deliveryForm, courierService: e.target.value })}
                placeholder="Enter courier service"
              />
            </div>
            <div>
              <Label htmlFor="deliveryInstructions">Delivery Instructions</Label>
              <Textarea
                id="deliveryInstructions"
                value={deliveryForm.deliveryInstructions}
                onChange={(e) => setDeliveryForm({ ...deliveryForm, deliveryInstructions: e.target.value })}
                placeholder="Enter delivery instructions"
                rows={2}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowDeliveryModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateDelivery}
                disabled={updatingDelivery}
              >
                {updatingDelivery ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderTracking;
