import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import axios, { AxiosError } from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ArrowLeft, 
  CreditCard, 
  Smartphone, 
  MapPin, 
  Package,
  Shield,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface Listing {
  _id: string;
  title: string;
  description: string;
  price: number;
  images: Array<{ url: string }>;
  seller: {
    _id: string;
    name: string;
    avatar?: string;
    phone?: string;
    address?: {
      city?: string;
      state?: string;
    };
  };
  category: string;
  condition: string;
}


const BuyNow = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  // Form data
  const [formData, setFormData] = useState({
    quantity: 1,
    deliveryMethod: 'pickup',
    paymentMethod: 'cash',
    shippingAddress: {
      name: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      landmark: ''
    },
    pickupAddress: {
      name: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      landmark: '',
      instructions: ''
    },
    agreeToTerms: false
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch listing details
      const listingResponse = await axios.get(`/api/listings/${id}`);
      setListing(listingResponse.data);

      // Fetch current user
      const userResponse = await axios.get('/api/auth/me');

      // Pre-fill user data
      if (userResponse.data.user) {
        setFormData(prev => ({
          ...prev,
          shippingAddress: {
            name: userResponse.data.user.name,
            phone: userResponse.data.user.phone || '',
            address: userResponse.data.user.address?.street || '',
            city: userResponse.data.user.address?.city || '',
            state: userResponse.data.user.address?.state || '',
            zipCode: userResponse.data.user.address?.zipCode || '',
            landmark: ''
          },
          pickupAddress: {
            name: userResponse.data.user.name,
            phone: userResponse.data.user.phone || '',
            address: userResponse.data.user.address?.street || '',
            city: userResponse.data.user.address?.city || '',
            state: userResponse.data.user.address?.state || '',
            zipCode: userResponse.data.user.address?.zipCode || '',
            landmark: '',
            instructions: ''
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load listing details');
      navigate('/marketplace');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedInputChange = (parent: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent as keyof typeof prev] as Record<string, unknown>),
        [field]: value
      }
    }));
  };

  const validateForm = () => {
    if (!formData.agreeToTerms) {
      toast.error('Please agree to the terms and conditions');
      return false;
    }

    if (formData.deliveryMethod === 'delivery') {
      const { shippingAddress } = formData;
      if (!shippingAddress.name || !shippingAddress.phone || !shippingAddress.address ||
          !shippingAddress.city || !shippingAddress.state || !shippingAddress.zipCode) {
        toast.error('Please fill in all shipping address fields');
        return false;
      }
    } else if (formData.deliveryMethod === 'pickup') {
      const { pickupAddress } = formData;
      if (!pickupAddress.name || !pickupAddress.phone || !pickupAddress.address ||
          !pickupAddress.city || !pickupAddress.state || !pickupAddress.zipCode) {
        toast.error('Please fill in all pickup address fields');
        return false;
      }
    }

    if (!['cash', 'upi', 'card'].includes(formData.paymentMethod)) {
      toast.error('Please select a valid payment method');
      return false;
    }

    if (!['pickup', 'delivery'].includes(formData.deliveryMethod)) {
      toast.error('Please select a valid delivery method');
      return false;
    }

    if (formData.quantity < 1) {
      toast.error('Quantity must be at least 1');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      const orderData = {
        listingId: id,
        quantity: formData.quantity,
        paymentMethod: formData.paymentMethod,
        deliveryMethod: formData.deliveryMethod,
        shippingAddress: formData.deliveryMethod === 'delivery' ? formData.shippingAddress : undefined,
        pickupAddress: formData.deliveryMethod === 'pickup' ? formData.pickupAddress : undefined
      };

      const response = await axios.post('/api/orders', orderData);

      toast.success('Order placed successfully!');
      navigate(`/orders/${response.data._id}`);
    } catch (error) {
      console.error('Error placing order:', error);
      const errorMessage = error instanceof AxiosError ? error.response?.data?.error : 'Failed to place order. Please try again.';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const totalAmount = listing ? listing.price * formData.quantity : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Listing Not Found</h2>
          <p className="text-gray-600 mb-6">The listing you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/marketplace')}>
            Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Complete Your Purchase</h1>
            <p className="text-gray-600">Secure checkout for {listing.title}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Delivery Method */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Delivery Method
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup
                      value={formData.deliveryMethod}
                      onValueChange={(value) => handleInputChange('deliveryMethod', value)}
                    >
                      <div className="flex items-center space-x-2 p-4 border rounded-lg">
                        <RadioGroupItem value="pickup" id="pickup" />
                        <Label htmlFor="pickup" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <MapPin className="h-5 w-5 text-blue-600" />
                            <div>
                              <p className="font-medium">Pickup</p>
                              <p className="text-sm text-gray-600">Meet with seller to collect item</p>
                            </div>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-4 border rounded-lg">
                        <RadioGroupItem value="delivery" id="delivery" />
                        <Label htmlFor="delivery" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <Package className="h-5 w-5 text-green-600" />
                            <div>
                              <p className="font-medium">Delivery</p>
                              <p className="text-sm text-gray-600">Get item delivered to your address</p>
                            </div>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 2: Address Details */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      {formData.deliveryMethod === 'pickup' ? 'Pickup Details' : 'Shipping Address'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={formData.deliveryMethod === 'pickup' ? formData.pickupAddress.name : formData.shippingAddress.name}
                          onChange={(e) => handleNestedInputChange(
                            formData.deliveryMethod === 'pickup' ? 'pickupAddress' : 'shippingAddress',
                            'name',
                            e.target.value
                          )}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.deliveryMethod === 'pickup' ? formData.pickupAddress.phone : formData.shippingAddress.phone}
                          onChange={(e) => handleNestedInputChange(
                            formData.deliveryMethod === 'pickup' ? 'pickupAddress' : 'shippingAddress',
                            'phone',
                            e.target.value
                          )}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={formData.deliveryMethod === 'pickup' ? formData.pickupAddress.address : formData.shippingAddress.address}
                        onChange={(e) => handleNestedInputChange(
                          formData.deliveryMethod === 'pickup' ? 'pickupAddress' : 'shippingAddress',
                          'address',
                          e.target.value
                        )}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={formData.deliveryMethod === 'pickup' ? formData.pickupAddress.city : formData.shippingAddress.city}
                          onChange={(e) => handleNestedInputChange(
                            formData.deliveryMethod === 'pickup' ? 'pickupAddress' : 'shippingAddress',
                            'city',
                            e.target.value
                          )}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          value={formData.deliveryMethod === 'pickup' ? formData.pickupAddress.state : formData.shippingAddress.state}
                          onChange={(e) => handleNestedInputChange(
                            formData.deliveryMethod === 'pickup' ? 'pickupAddress' : 'shippingAddress',
                            'state',
                            e.target.value
                          )}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="zipCode">ZIP Code</Label>
                        <Input
                          id="zipCode"
                          value={formData.deliveryMethod === 'pickup' ? formData.pickupAddress.zipCode : formData.shippingAddress.zipCode}
                          onChange={(e) => handleNestedInputChange(
                            formData.deliveryMethod === 'pickup' ? 'pickupAddress' : 'shippingAddress',
                            'zipCode',
                            e.target.value
                          )}
                          required
                        />
                      </div>
                    </div>
                    {formData.deliveryMethod === 'pickup' && (
                      <div>
                        <Label htmlFor="instructions">Special Instructions</Label>
                        <Input
                          id="instructions"
                          value={formData.pickupAddress.instructions}
                          onChange={(e) => handleNestedInputChange('pickupAddress', 'instructions', e.target.value)}
                          placeholder="Any special instructions for pickup..."
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 3: Payment Method */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Payment Method
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup
                      value={formData.paymentMethod}
                      onValueChange={(value) => handleInputChange('paymentMethod', value)}
                    >
                      <div className="flex items-center space-x-2 p-4 border rounded-lg">
                        <RadioGroupItem value="cash" id="cash" />
                        <Label htmlFor="cash" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              💵
                            </div>
                            <div>
                              <p className="font-medium">Cash on Delivery/Pickup</p>
                              <p className="text-sm text-gray-600">Pay when you receive the item</p>
                            </div>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-4 border rounded-lg">
                        <RadioGroupItem value="upi" id="upi" />
                        <Label htmlFor="upi" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <Smartphone className="h-5 w-5 text-blue-600" />
                            <div>
                              <p className="font-medium">UPI Payment</p>
                              <p className="text-sm text-gray-600">Pay via UPI apps like PhonePe, Google Pay</p>
                            </div>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-4 border rounded-lg">
                        <RadioGroupItem value="card" id="card" />
                        <Label htmlFor="card" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <CreditCard className="h-5 w-5 text-purple-600" />
                            <div>
                              <p className="font-medium">Credit/Debit Card</p>
                              <p className="text-sm text-gray-600">Pay with your card securely</p>
                            </div>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Terms and Conditions */}
            {step === 3 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="terms"
                      checked={formData.agreeToTerms}
                      onCheckedChange={(checked) => handleInputChange('agreeToTerms', checked)}
                    />
                    <Label htmlFor="terms" className="text-sm">
                      I agree to the{' '}
                      <a href="#" className="text-blue-600 hover:underline">
                        Terms and Conditions
                      </a>{' '}
                      and{' '}
                      <a href="#" className="text-blue-600 hover:underline">
                        Privacy Policy
                      </a>
                    </Label>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Item Details */}
                <div className="flex items-center space-x-3">
                  <img
                    src={listing.images[0]?.url || '/placeholder-image.jpg'}
                    alt={listing.title}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 line-clamp-2">
                      {listing.title}
                    </h3>
                    <p className="text-sm text-gray-600">{listing.category}</p>
                    <Badge variant="outline" className="text-xs">
                      {listing.condition}
                    </Badge>
                  </div>
                </div>

                <Separator />

                {/* Quantity */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Quantity</span>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleInputChange('quantity', Math.max(1, formData.quantity - 1))}
                    >
                      -
                    </Button>
                    <span className="w-8 text-center">{formData.quantity}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleInputChange('quantity', formData.quantity + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Price Breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Item Price</span>
                    <span>₹{(listing.price * 83).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Quantity</span>
                    <span>×{formData.quantity}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Delivery</span>
                    <span className="text-green-600">Free</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>Total</span>
                    <span>₹{(totalAmount * 83).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Security Badges */}
                <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Shield className="h-3 w-3" />
                    <span>Secure</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="h-3 w-3" />
                    <span>Protected</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  {step < 3 ? (
                    <Button
                      onClick={() => setStep(step + 1)}
                      className="w-full"
                    >
                      Continue
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={submitting || !formData.agreeToTerms}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {submitting ? 'Placing Order...' : 'Place Order'}
                    </Button>
                  )}
                  
                  {step > 1 && (
                    <Button
                      variant="outline"
                      onClick={() => setStep(step - 1)}
                      className="w-full"
                    >
                      Back
                    </Button>
                  )}
                </div>

                {/* Progress Indicator */}
                <div className="flex items-center justify-center space-x-2">
                  {[1, 2, 3].map((stepNumber) => (
                    <div
                      key={stepNumber}
                      className={`w-2 h-2 rounded-full ${
                        stepNumber <= step ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyNow;
