import { Star } from "lucide-react";

interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  helpful: number;
}

interface ReviewCardProps {
  review: Review;
  onHelpful: (reviewId: string) => void;
}

export function ReviewCard({ review, onHelpful }: ReviewCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'fill-gray-900 text-gray-900' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="border-b border-gray-100 py-8 last:border-b-0">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-gray-700">
              {review.userName.charAt(0)}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900">{review.userName}</p>
            <div className="flex items-center space-x-1">
              {renderStars(review.rating)}
              <span className="text-sm text-gray-500 ml-2">
                {review.rating}.0
              </span>
            </div>
          </div>
        </div>
        <span className="text-sm text-gray-500">
          {formatDate(review.createdAt)}
        </span>
      </div>
      
      <p className="text-gray-700 leading-relaxed mb-4">
        {review.comment}
      </p>
      
      <div className="flex items-center space-x-4">
        <button
          onClick={() => onHelpful(review.id)}
          className="flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <span>👍</span>
          <span>도움됨 ({review.helpful})</span>
        </button>
      </div>
    </div>
  );
} 