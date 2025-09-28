import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import ItemCard from '@/components/ui/ItemCard';
import ProductCardSkeleton from '@/components/ProductCardSkeleton';
import { toast } from 'sonner';
import {
  MessageCircle,
  Heart,
  Share,
  Clock,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Edit,
  MapPin
} from 'lucide-react';

interface Seller {
  _id: string;
  name: string;
  avatar?: string;
  phone?: string;
  email?: string;
  createdAt: string;
  address?: {
    city?: string;
    state?: string;
    country?: string;
  };
}

interface Listing {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  images: { url: string; alt?: string }[];
  image?: string;
  seller: Seller;
  tags?: string[];
  createdAt: string;
  views?: number;
  originalPrice?: number;
  status: string;
}






const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [product, setProduct] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ _id: string; name: string; email: string } | null>(null);
  const [savingWishlist, setSavingWishlist] = useState(false);
  const [suggestedItems, setSuggestedItems] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        setError('Product ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(`/api/listings/${id}`);
        setProduct(response.data);
        setError(null);
      } catch (err: unknown) {
        console.error('Error fetching product:', err);
        const errorMessage = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to load product';
        setError(errorMessage);
        toast.error('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await axios.get('/api/users/profile');
          setCurrentUser(response.data.user);
        } catch (error) {
          console.error('Error fetching user:', error);
        }
      }
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!id) return;
      
      try {
        setLoadingSuggestions(true);
        const response = await axios.get(`/api/listings/suggestions/${id}?limit=4`);
        setSuggestedItems(response.data);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        // Fallback to mock data if API fails
        setSuggestedItems([
          {
            _id: '2',
            title: 'Statistics Workbook',
            price: 25,
            condition: 'Good',
            images: [{ url: 'https://images.pexels.com/photos/4386321/pexels-photo-4386321.jpeg?auto=compress&cs=tinysrgb&w=400' }],
            category: 'Books',
            seller: { name: 'Mike Chen', address: 'East Dorms' },
            createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          },
          {
            _id: '3',
            title: 'TI-84 Calculator',
            price: 80,
            condition: 'Excellent',
            images: [{ url: 'https://images.pexels.com/photos/5952651/pexels-photo-5952651.jpeg?auto=compress&cs=tinysrgb&w=400' }],
            category: 'Electronics',
            seller: { name: 'Emma Davis', address: 'Science Building' },
            createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          },
        ]);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    if (product) {
      fetchSuggestions();
    }
  }, [id, product]);

  const handleWishlistToggle = async () => {
    if (!currentUser) {
      toast.error('Please login to save items');
      navigate('/login');
      return;
    }

    try {
      setSavingWishlist(true);
      await axios.post(`/api/listings/${id}/favorite`);
      setIsWishlisted(!isWishlisted);
      toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
    } catch (error) {
      console.error('Error updating wishlist:', error);
      toast.error('Failed to update wishlist');
    } finally {
      setSavingWishlist(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    } catch (error) {
      console.error('Error copying link:', error);
      toast.error('Failed to copy link');
    }
  };

  const handleChatWithSeller = async () => {
    if (!currentUser) {
      toast.error('Please login to chat with seller');
      navigate('/login');
      return;
    }

    if (!product?.seller) {
      toast.error('Seller information not available');
      return;
    }

    if (currentUser._id === product.seller._id) {
      toast.error('You cannot chat with yourself');
      return;
    }

    try {
      // Create or get existing chat for this listing
      const response = await axios.post(`/api/chat/listing/${product._id}`);
      const chat = response.data;

      // Navigate to the specific chat
      navigate(`/chat/${chat._id}`);
    } catch (error: any) {
      console.error('Error creating chat:', error);
      toast.error(error.response?.data?.error || 'Failed to start chat');
    }
  };

  const handleBuyNow = () => {
    if (!currentUser) {
      toast.error('Please login to purchase');
      navigate('/login');
      return;
    }

    if (!product?.seller) {
      toast.error('Product information not available');
      return;
    }

    if (currentUser._id === product.seller._id) {
      toast.error('You cannot buy your own item');
      return;
    }

    // Navigate to buy now page
    navigate(`/buy-now/${product._id}`);
  };


  // Get images array (handle both single image and images array)
  const images = product?.images && product.images.length > 0 ? product.images.map((img: {url: string}) => img.url) : [product?.image || '/placeholder-image.jpg'];

  const nextImage = () => {
    if (images && images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = () => {
    if (images && images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The product you are looking for does not exist.'}</p>
          <Link to="/marketplace">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Back to Marketplace
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/marketplace" className="flex items-center hover:text-blue-600">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Marketplace
          </Link>
          <span>/</span>
          <span>{product?.category}</span>
          <span>/</span>
          <span className="text-gray-900">{product?.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Main Image */}
              <div className="relative bg-white rounded-lg overflow-hidden shadow-md mb-4">
                <div className="aspect-square relative">
                  <img
                    src={images[currentImageIndex]}
                    alt={product?.title || 'Product image'}
                    className="w-full h-full object-cover"
                  />

                  {images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-md transition-all"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-md transition-all"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>

                {/* Image indicators */}
                {images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {images.map((_: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Thumbnail Strip */}
              {product?.images && product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.images.map((image: {url: string}, index: number) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`aspect-square rounded-md overflow-hidden border-2 transition-all ${
                        index === currentImageIndex
                          ? 'border-blue-500 ring-2 ring-blue-100'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={image.url}
                        alt={`${product?.title || 'Product'} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Column - Product Info */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="shadow-md border-0">
                <CardContent className="p-6">
                  {/* Category and Condition */}
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary">{product?.category}</Badge>
                    <Badge variant={product?.condition === 'New' ? 'default' : 'outline'}>
                      {product?.condition}
                    </Badge>
                  </div>

                  {/* Title */}
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">
                    {product?.title}
                  </h1>

                  {/* Price */}
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-3xl font-bold text-blue-600">
                      ₹{((product?.price || 0) * 83).toLocaleString('en-IN')}
                    </span>
                    {product?.originalPrice && (
                      <>
                        <span className="text-lg text-gray-500 line-through">
                          ₹{((product.originalPrice) * 83).toLocaleString('en-IN')}
                        </span>
                        <Badge variant="destructive">
                          {Math.round((1 - (product.price || 0) / product.originalPrice) * 100)}% OFF
                        </Badge>
                      </>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleChatWithSeller}>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Chat with Seller
                    </Button>
                    <Button variant="outline" onClick={handleBuyNow}>
                      Buy Now
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleWishlistToggle}
                      disabled={savingWishlist}
                      className={isWishlisted ? 'text-red-500 border-red-200' : ''}
                    >
                      <Heart className={`h-4 w-4 mr-1 ${isWishlisted ? 'fill-current' : ''}`} />
                      {savingWishlist ? 'Saving...' : isWishlisted ? 'Saved' : 'Save'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleShare}>
                      <Share className="h-4 w-4 mr-1" />
                      Share
                    </Button>
                    {currentUser && product && currentUser._id === product.seller._id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/add-listing?edit=${product._id}`)}
                        className="text-blue-600 border-blue-200"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Seller Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card className="shadow-md border-0">
                <CardHeader>
                  <CardTitle className="text-lg">Seller Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={product?.seller?.avatar} />
                      <AvatarFallback>
                        {product?.seller?.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{product?.seller?.name || 'Unknown Seller'}</h3>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <span>Member since {product?.seller?.createdAt ? new Date(product.seller.createdAt).getFullYear() : 'Unknown'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{product?.seller?.address?.city || 'Location not specified'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Joined {product?.seller?.createdAt ? new Date(product.seller.createdAt).toLocaleDateString() : 'Unknown'}</span>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full">
                    View Seller Profile
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Item Details */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card className="shadow-md border-0">
                <CardHeader>
                  <CardTitle className="text-lg">Item Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-gray-600">
                    <div className="flex justify-between py-2">
                      <span>Condition</span>
                      <span className="font-medium">{product?.condition}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between py-2">
                      <span>Posted</span>
                      <span className="font-medium">{product?.createdAt ? new Date(product.createdAt).toLocaleDateString() : 'Unknown'}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between py-2">
                      <span>Views</span>
                      <span className="font-medium">{product?.views || 0}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  {product?.tags && product.tags.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-1">
                        {product.tags.map((tag: string) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-12"
        >
          <Card className="shadow-md border-0">
            <CardHeader>
              <CardTitle className="text-xl">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                {product?.description || 'No description available'}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Suggested Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">You might also like</h2>
          {loadingSuggestions ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </div>
          ) : suggestedItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {suggestedItems.map((item, index) => (
                <ItemCard key={item._id || item.id} item={item} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No suggestions available at the moment.</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ProductDetail;