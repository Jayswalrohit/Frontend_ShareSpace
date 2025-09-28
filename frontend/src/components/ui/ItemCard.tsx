import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Clock, Heart } from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

interface ItemCardProps {
  item: {
    id?: string;
    _id?: string;
    title: string;
    price: number;
    condition: string;
    image?: string;
    images?: { url: string }[];
    category: string;
    seller?: {
      name: string;
      location?: string;
      address?: string;
    };
    user?: {
      name: string;
      email: string;
    };
    timePosted?: string;
    createdAt?: string;
    views?: number;
    status?: string;
  };
  index?: number;
}

const ItemCard = ({ item, index = 0 }: ItemCardProps) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Get the correct ID (support both id and _id)
  const itemId = (item.id || item._id)?.toString();

  // Get the correct image URL
  const imageUrl = item.image || (item.images && item.images.length > 0 ? item.images[0].url : '/placeholder-image.jpg');

  // Get seller info (support both seller and user structures)
  const sellerName = item.seller?.name || item.user?.name || 'Unknown Seller';
  const sellerLocation = item.seller?.address || item.seller?.location || 'Unknown Location';

  // Get time posted
  const timePosted = item.timePosted || (item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recently');

  // USD to INR conversion rate
  const USD_TO_INR = 83;
  const formatINR = (usd: number) => `₹${(usd * USD_TO_INR).toLocaleString('en-IN')}`;

  const getConditionColor = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'new':
        return 'bg-green-100 text-green-800';
      case 'like new':
      case 'excellent':
        return 'bg-blue-100 text-blue-800';
      case 'good':
        return 'bg-yellow-100 text-yellow-800';
      case 'fair':
        return 'bg-orange-100 text-orange-800';
      case 'poor':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to save items');
      return;
    }

    if (!itemId) {
      toast.error('Item ID not available');
      return;
    }

    try {
      setIsLoading(true);
      await axios.post(`/api/listings/${itemId}/favorite`);
      setIsWishlisted(!isWishlisted);
      toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
    } catch (error) {
      console.error('Error updating wishlist:', error);
      toast.error('Failed to update wishlist');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      className="h-full"
    >
      <Link to={`/product/${itemId}`}>
        <Card className="h-full overflow-hidden hover:shadow-lg transition-all duration-300 border-0 shadow-md group">
          {/* Image */}
          <div className="relative aspect-square overflow-hidden">
            <img
              src={imageUrl}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />

            {/* Wishlist Button */}
            <button
              onClick={handleWishlistToggle}
              disabled={isLoading}
              className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white rounded-full shadow-md transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
            >
              <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
            </button>

            {/* Category Badge */}
            <div className="absolute top-3 left-3">
              <Badge variant="secondary" className="bg-white/90 text-gray-900">
                {item.category}
              </Badge>
            </div>
          </div>

          <CardContent className="p-4 flex flex-col h-full">
            <div className="flex-1">
              {/* Title */}
              <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                {item.title}
              </h3>

              {/* Price and Condition */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl font-bold text-blue-600">
                  {formatINR(item.price)}
                </span>
                <Badge className={`text-xs ${getConditionColor(item.condition)}`}>
                  {item.condition}
                </Badge>
              </div>
            </div>

            {/* Seller Info */}
            <div className="border-t border-gray-100 pt-3 mt-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-xs">
                      {sellerName.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-gray-700 truncate">
                    {sellerName}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <MapPin className="h-3 w-3" />
                  <span>{sellerLocation}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{timePosted}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
};

export default ItemCard;