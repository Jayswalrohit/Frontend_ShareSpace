import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

const ProductCardSkeleton = () => {
  return (
    <Card className="h-full overflow-hidden border-0 shadow-md">
      {/* Image Skeleton */}
      <div className="relative aspect-square overflow-hidden">
        <Skeleton className="w-full h-full" />
      </div>

      <CardContent className="p-4 flex flex-col h-full">
        <div className="flex-1">
          {/* Title Skeleton */}
          <Skeleton className="h-5 mb-2" />
          <Skeleton className="h-4 w-3/4 mb-3" />

          {/* Price and Condition Skeleton */}
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>

        {/* Seller Info Skeleton */}
        <div className="border-t border-gray-100 pt-3 mt-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Skeleton className="w-6 h-6 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>

          <div className="flex items-center justify-between mt-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCardSkeleton;
