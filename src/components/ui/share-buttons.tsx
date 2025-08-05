import { Share2, Heart, Copy } from "lucide-react";
import { useState } from "react";

interface ShareButtonsProps {
  productName: string;
  productUrl: string;
  onWishlist?: () => void;
  isWishlisted?: boolean;
}

export function ShareButtons({ 
  productName, 
  productUrl, 
  onWishlist, 
  isWishlisted = false 
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('링크 복사 실패:', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: productName,
          url: productUrl,
        });
      } catch (err) {
        console.error('공유 실패:', err);
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="flex items-center space-x-4">
      <button
        onClick={handleShare}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
      >
        <Share2 className="w-4 h-4" />
        <span className="text-sm">공유</span>
      </button>
      
      <button
        onClick={handleCopyLink}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
      >
        <Copy className="w-4 h-4" />
        <span className="text-sm">
          {copied ? '복사됨!' : '링크 복사'}
        </span>
      </button>
      
      <button
        onClick={onWishlist}
        className={`flex items-center space-x-2 transition-colors ${
          isWishlisted 
            ? 'text-gray-900 hover:text-gray-700' 
            : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        <span className="text-sm">
          {isWishlisted ? '위시리스트에서 제거' : '위시리스트 추가'}
        </span>
      </button>
    </div>
  );
} 