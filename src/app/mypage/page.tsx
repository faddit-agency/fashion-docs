"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { PaymentModal } from "@/components/payment/payment-modal";
import { formatPrice, formatDate } from "@/lib/utils";
import { purchaseAPI, worksheetAPI, cartAPI } from "@/lib/database";
import { Purchase, Worksheet, CartItem } from "@/lib/supabase";
import { useCart } from "@/hooks/use-cart";
import Link from "next/link";
import { Download, Edit, FileText, Trash2, Plus, Minus, ShoppingCart, X, Save, User } from "lucide-react";
import { FileUpload } from "@/components/ui/file-upload";
import { FileDownload } from "@/components/ui/file-download";
import { getWorksheetThumbnail, deleteWorksheetThumbnail } from "@/components/ui/worksheet-thumbnail";
import PhoneRequiredModal from "@/components/ui/phone-required-modal";


// 타입 정의
interface UserProfile {
  company?: string;
  position?: string;
  bio?: string;
  updatedAt: string;
}

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  bio: string;
}

interface DriveAsset {
  id: string;
  name: string;
  path: string;
  url?: string;
  category?: string;
  fileType?: string;
  file_type?: string;
  uploadedAt?: string;
  uploaded_at?: string;
  created_at?: string;
}

// 프로필 수정 모달 컴포넌트
function ProfileEditModal({ isOpen, onClose, user, onProfileUpdate }: { 
  isOpen: boolean; 
  onClose: () => void; 
  user: any;
  onProfileUpdate: () => void;
}) {
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.emailAddresses[0]?.emailAddress || '',
    phone: user?.phoneNumbers[0]?.phoneNumber || '',
    company: '',
    position: '',
    bio: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      // 저장된 프로필 정보 불러오기
      let savedProfile: UserProfile | null = null;
      try {
        const saved = localStorage.getItem('userProfile');
        if (saved) {
          savedProfile = JSON.parse(saved);
        }
              } catch {
          // 프로덕션에서는 에러 로깅을 서비스로 대체
          if (process.env.NODE_ENV === 'development') {
            console.error('저장된 프로필 로딩 오류');
          }
        }

      setFormData({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.emailAddresses[0]?.emailAddress || '',
        phone: user?.phoneNumbers[0]?.phoneNumber || '',
        company: savedProfile?.company || '',
        position: savedProfile?.position || '',
        bio: savedProfile?.bio || ''
      });
    }
  }, [isOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Clerk 사용자 정보 업데이트
      await user?.update({
        firstName: formData.firstName,
        lastName: formData.lastName,
      });

      // 추가 정보는 로컬 스토리지나 데이터베이스에 저장
      const userProfile: UserProfile = {
        company: formData.company,
        position: formData.position,
        bio: formData.bio,
        updatedAt: new Date().toISOString()
      };
      
      localStorage.setItem('userProfile', JSON.stringify(userProfile));
      
      setSuccess(true);
      onProfileUpdate(); // 프로필 정보 새로고침
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);
    } catch {
      if (process.env.NODE_ENV === 'development') {
        console.error('프로필 업데이트 오류');
      }
      setError('프로필 업데이트에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">프로필 수정</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md">
              <p className="text-sm text-green-600 dark:text-green-400">프로필이 성공적으로 업데이트되었습니다!</p>
            </div>
          )}

          {/* 기본 정보 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground">기본 정보</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  이름 *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  성 *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                이메일
              </label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full px-3 py-2 border border-border rounded-md bg-muted text-muted-foreground cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-1">이메일은 변경할 수 없습니다</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                전화번호
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                placeholder="010-1234-5678"
              />
            </div>
          </div>

          {/* 직장 정보 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">직장 정보</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                회사명
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="회사명을 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                직책
              </label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => handleInputChange('position', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="직책을 입력하세요"
              />
            </div>
          </div>

          {/* 자기소개 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">자기소개</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                소개
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                placeholder="자기소개를 입력하세요"
              />
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              취소
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  저장 중...
                </div>
              ) : (
                <div className="flex items-center">
                  <Save className="w-4 h-4 mr-2" />
                  저장
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();
  const [activeTab, setActiveTab] = useState<'overview' | 'purchases' | 'worksheets' | 'cart' | 'drive'>('overview');
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchaseFilter, setPurchaseFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');
  const [worksheetFilter, setWorksheetFilter] = useState<string>('all');
  const [selectedCartItems, setSelectedCartItems] = useState<number[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPhoneRequiredModal, setShowPhoneRequiredModal] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { updateCartCount } = useCart(user?.id);

  // URL 파라미터에서 탭 설정
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'cart') {
      setActiveTab('cart');
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      loadUserData();
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = () => {
    try {
      const savedProfile = localStorage.getItem('userProfile');
      if (savedProfile) {
        setUserProfile(JSON.parse(savedProfile));
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('프로필 로딩 오류:', err);
      }
    }
  };

  const loadUserData = async () => {
    try {
      setLoading(true);
      const userId = user?.id;
      
      if (!userId) {
        setError("사용자 정보를 불러올 수 없습니다.");
        return;
      }
      
      // 디버깅: localStorage 썸네일 데이터 확인
      const thumbnails = JSON.parse(localStorage.getItem('worksheet_thumbnails') || '{}');
      console.log('전체 localStorage 썸네일 데이터:', thumbnails);
      console.log('저장된 썸네일 개수:', Object.keys(thumbnails).length);
      console.log('저장된 썸네일 키들:', Object.keys(thumbnails));
      
      // 구매 내역, 작업지시서, 장바구니를 병렬로 로드
      const [purchasesData, worksheetsData, cartData] = await Promise.all([
        purchaseAPI.getUserPurchases(userId),
        worksheetAPI.getUserWorksheets(userId),
        cartAPI.getUserCart(userId)
      ]);
      
      setPurchases(purchasesData || []);
      // content에만 값이 있고 보조 컬럼이 비어 있을 수 있으므로 정규화
      const fromServer = (worksheetsData || []).map((w) => ({
        ...w,
        title: w.title || (w as any).content?.title || '작업지시서',
        category: w.category || (w as any).content?.category || '기타',
        size_range:
          w.size_range ||
          ((w as any).content?.sizeSpec?.sizes
            ? `${(w as any).content.sizeSpec.sizes[0]}~${(w as any).content.sizeSpec.sizes[(w as any).content.sizeSpec.sizes.length - 1]}`
            : 'S~XL'),
      }));
      // 데모 모드 로컬 저장분 병합
      let fromLocal: Worksheet[] = [];
      try {
        const raw = typeof window !== 'undefined' ? window.localStorage.getItem('demo_worksheets') : null;
        fromLocal = raw ? JSON.parse(raw) : [];
      } catch {}
      // 중복 제거: 같은 id가 있으면 updated_at 최신으로 유지
      const merged = [...fromLocal, ...fromServer];
      const uniqueById = new Map<string, Worksheet>();
      for (const w of merged) {
        const key = String(w.id);
        if (!uniqueById.has(key)) {
          uniqueById.set(key, w);
        } else {
          const prev = uniqueById.get(key);
          const prevUpdated = new Date(prev?.updated_at || prev?.created_at || 0).getTime();
          const currUpdated = new Date(w.updated_at || w.created_at || 0).getTime();
          if (currUpdated >= prevUpdated && prev) uniqueById.set(key, w);
        }
      }
      const normalized = Array.from(uniqueById.values());
      setWorksheets(normalized);
      setCartItems(cartData || []);
    } catch {
      if (process.env.NODE_ENV === 'development') {
        console.error("데이터 로딩 오류");
      }
      setError("데이터를 불러오는데 실패했습니다.");
      // 빈 배열로 설정
      setPurchases([]);
      setWorksheets([
        {
          id: 1,
          user_id: "user1",
          title: "남성 반팔 티셔츠 작업지시서",
          category: "상의",
          size_range: "S~XL",
          content: { /* 작업지시서 내용 */ },
          created_at: "2024-01-15T00:00:00Z",
          updated_at: "2024-01-15T00:00:00Z"
        },
        {
          id: 2,
          user_id: "user1",
          title: "여성 블라우스 작업지시서",
          category: "상의",
          size_range: "S~L",
          content: { /* 작업지시서 내용 */ },
          created_at: "2024-01-12T00:00:00Z",
          updated_at: "2024-01-12T00:00:00Z"
        }
      ]);
      setCartItems([
        {
          id: 1,
          user_id: "user1",
          product_id: 1,
          quantity: 2,
          created_at: "2024-01-15T00:00:00Z",
          product: {
            id: 1,
            name: "남성 기본 반팔 티셔츠 도식화",
            category: "상의",
            gender: "남성",
            season: "봄/여름",
            price: 50000,
            description: "기본적인 남성 반팔 티셔츠의 도식화입니다.",
            seller_id: "seller1",
            file_url: "/files/product1.pdf",
            image_urls: ["/images/product1.jpg"],
            created_at: "2024-01-15T00:00:00Z",
            updated_at: "2024-01-15T00:00:00Z"
          }
        },
        {
          id: 2,
          user_id: "user1",
          product_id: 2,
          quantity: 1,
          created_at: "2024-01-15T00:00:00Z",
          product: {
            id: 2,
            name: "여성 기본 원피스 도식화",
            category: "원피스",
            gender: "여성",
            season: "봄/여름",
            price: 70000,
            description: "우아한 여성 원피스 도식화입니다.",
            seller_id: "seller1",
            file_url: "/files/product2.pdf",
            image_urls: ["/images/product2.jpg"],
            created_at: "2024-01-15T00:00:00Z",
            updated_at: "2024-01-15T00:00:00Z"
          }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadFile = (fileUrl: string, fileName: string) => {
    // 실제 파일 다운로드 로직
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteWorksheet = async (worksheetId: number) => {
    if (!confirm("작업지시서를 삭제하시겠습니까?")) return;
    
    try {
      await worksheetAPI.deleteWorksheet(worksheetId);
      setWorksheets(prev => prev.filter(w => w.id !== worksheetId));
      
      // 썸네일도 함께 삭제
      deleteWorksheetThumbnail(worksheetId.toString());
      
      // localStorage의 demo_worksheets에서도 삭제
      try {
        const localKey = 'demo_worksheets';
        const raw = typeof window !== 'undefined' ? window.localStorage.getItem(localKey) : null;
        if (raw) {
          const localWorksheets = JSON.parse(raw);
          const filteredWorksheets = localWorksheets.filter((w: any) => w.id !== worksheetId);
          window.localStorage.setItem(localKey, JSON.stringify(filteredWorksheets));
        }
      } catch (localError) {
        console.error("로컬 스토리지 삭제 오류:", localError);
      }
      
      alert("작업지시서가 삭제되었습니다.");
    } catch {
      if (process.env.NODE_ENV === 'development') {
        console.error("작업지시서 삭제 오류");
      }
      alert("작업지시서 삭제에 실패했습니다.");
    }
  };

  // 장바구니 관련 함수들
  const handleQuantityChange = async (cartItemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    try {
      await cartAPI.updateCartItemQuantity(cartItemId, newQuantity);
      setCartItems(prev => 
        prev.map(item => 
          item.id === cartItemId 
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    } catch {
      if (process.env.NODE_ENV === 'development') {
        console.error("수량 변경 오류");
      }
      alert("수량 변경에 실패했습니다.");
    }
  };

  const handleRemoveCartItem = async (cartItemId: number) => {
    try {
      await cartAPI.removeFromCart(cartItemId);
      setCartItems(prev => prev.filter(item => item.id !== cartItemId));
      setSelectedCartItems(prev => prev.filter(id => id !== cartItemId));
      updateCartCount(-1);
    } catch {
      if (process.env.NODE_ENV === 'development') {
        console.error("상품 제거 오류");
      }
      alert("상품 제거에 실패했습니다.");
    }
  };

  const handleSelectCartItem = (cartItemId: number) => {
    setSelectedCartItems(prev => 
      prev.includes(cartItemId)
        ? prev.filter(id => id !== cartItemId)
        : [...prev, cartItemId]
    );
  };

  const handleSelectAllCartItems = () => {
    if (selectedCartItems.length === cartItems.length) {
      setSelectedCartItems([]);
    } else {
      setSelectedCartItems(cartItems.map(item => item.id));
    }
  };

  const handleRemoveSelectedCartItems = async () => {
    if (selectedCartItems.length === 0) return;
    
    try {
      await Promise.all(selectedCartItems.map(id => cartAPI.removeFromCart(id)));
      setCartItems(prev => prev.filter(item => !selectedCartItems.includes(item.id)));
      setSelectedCartItems([]);
      updateCartCount(-selectedCartItems.length);
    } catch {
      if (process.env.NODE_ENV === 'development') {
        console.error("선택 상품 제거 오류");
      }
      alert("선택한 상품 제거에 실패했습니다.");
    }
  };

  const handleCheckout = () => {
    if (selectedCartItems.length === 0) {
      alert("구매할 상품을 선택해주세요.");
      return;
    }
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (paymentResult: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      console.log("결제 성공:", paymentResult);
    }
    setShowPaymentModal(false);
    alert("결제가 완료되었습니다! 파일 다운로드가 가능합니다.");
    setActiveTab('purchases');
  };

  const handleProductionRequest = (worksheetId: number) => {
    // 휴대폰 번호 확인
    const hasPhoneNumber = user?.phoneNumbers && user.phoneNumbers.length > 0;
    
    if (!hasPhoneNumber) {
      setShowPhoneRequiredModal(true);
      return;
    }
    
    // 휴대폰 번호가 있으면 생산 의뢰 진행
    alert(`작업지시서 #${worksheetId}의 생산 의뢰가 접수되었습니다.\n봉제공장에서 연락드리겠습니다.`);
  };

  // 드라이브 데이터 뷰 (간단히 내장 컴포넌트)
  function DriveContent({ userId }: { userId: string }) {
    const [assets, setAssets] = useState<DriveAsset[]>([]);
    const [loadingAssets, setLoadingAssets] = useState(false);
    const [category, setCategory] = useState<string>('전체');
    const [showUploader, setShowUploader] = useState(false);
    const [previewIndex, setPreviewIndex] = useState<number | null>(null);
    const [zoom, setZoom] = useState<number>(1);
    const [pendingUpload, setPendingUpload] = useState<null | { url: string; path: string; name: string }>(null);

    useEffect(() => {
      const fetchAssets = async () => {
        try {
          setLoadingAssets(true);
          const res = await fetch(`/api/drive/assets?userId=${userId}&category=${category}`);
          const data = await res.json();
          setAssets(data.assets || []);
        } catch {
          setAssets([]);
        } finally {
          setLoadingAssets(false);
        }
      };
      fetchAssets();
    }, [userId, category]);

    const categories = ['전체', '패턴', '인쇄', '원단', '라벨', '기타'];

    const detectType = (nameOrPath: string, fallbackUrl?: string, mimeType?: string): 'image' | 'pdf' | 'other' => {
      const lower = (nameOrPath || '').toLowerCase();
      if (mimeType && mimeType.startsWith('image/')) return 'image';
      if (lower.match(/\.(png|jpg|jpeg|gif|webp|svg)$/)) return 'image';
      if (lower.endsWith('.pdf')) return 'pdf';
      // placeholder는 이미지로 취급
      if ((fallbackUrl || '').includes('/api/placeholder/')) return 'image';
      return 'other';
    };

    const buildThumbUrl = (asset: DriveAsset): string => {
      const url = asset.url || '';
      const type = detectType(asset.path || asset.name || '', url, asset.fileType || asset.file_type);
      if (type === 'image') {
        // 비공개 버킷 포함: 썸네일 프록시 사용
        return `/api/files/thumbnail?path=${encodeURIComponent(asset.path)}&bucket=faddit-files&w=360&h=240&q=70`;
      }
      if (type === 'pdf') return '/api/placeholder/360/240?text=PDF';
      return '/api/placeholder/360/240?text=FILE';
    };

    const currentAsset = previewIndex !== null ? assets[previewIndex] : null;
    const currentUrl = currentAsset ? (currentAsset.url || `/api/placeholder/800/600`) : '';
    const currentName = currentAsset ? (currentAsset.name || '파일 미리보기') : '';
    const currentType: 'image' | 'pdf' | 'other' = currentAsset ? detectType(currentAsset.path || currentAsset.name || '', currentUrl) : 'other';

    const closePreview = () => {
      setPreviewIndex(null);
      setZoom(1);
    };

    const goPrev = () => {
      if (previewIndex === null || assets.length === 0) return;
      setPreviewIndex((previewIndex - 1 + assets.length) % assets.length);
      setZoom(1);
    };

    const goNext = () => {
      if (previewIndex === null || assets.length === 0) return;
      setPreviewIndex((previewIndex + 1) % assets.length);
      setZoom(1);
    };

    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1 text-sm rounded-md ${category === c ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {c}
            </button>
          ))}
          <Button size="sm" className="ml-auto" onClick={() => setShowUploader(true)}>업로드</Button>
        </div>
        {showUploader && (
          <div className="mb-6">
            <FileUpload
              onUploadComplete={async (url, path) => {
                const name = path.split('/').pop() || '업로드 파일';
                setPendingUpload({ url, path, name });
              }}
              onUploadError={(msg) => alert('업로드 실패: ' + msg)}
              accept=".pdf,.jpg,.jpeg,.png,.gif,.ai,.eps,.dxf"
              maxSize={10 * 1024 * 1024}
            />
          </div>
        )}
        {loadingAssets ? (
          <div className="text-center py-8">불러오는 중...</div>
        ) : assets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">파일이 없습니다</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {assets.map((a) => {
              const thumb = buildThumbUrl(a);
              const type = detectType(a.path || a.name || '', a.url, a.fileType || a.file_type);
              return (
                <div key={a.id} className="border rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow">
                  <div className="w-full h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
                    {type === 'image' ? (
                      <img src={thumb} alt={a.name} className="w-full h-full object-cover" />
                    ) : (
                      <img src={thumb} alt={a.name} className="w-full h-full object-contain" />
                    )}
                  </div>
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate" title={a.name}>{a.name}</div>
                        <div className="text-xs text-gray-500 truncate" title={a.path}>{a.path}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileDownload filePath={a.path} size="sm" />
                        <button
                          onClick={() => {
                            if (confirm('정말로 이 파일을 삭제하시겠습니까?')) {
                              // 삭제 로직 구현
                              setAssets(prev => prev.filter(asset => asset.id !== a.id));
                            }
                          }}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          title="삭제"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 mt-2">{a.category || '기타'} • {new Date(a.uploadedAt || a.uploaded_at || a.created_at || Date.now()).toLocaleDateString()}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 미리보기 모달 (확대/축소 + 좌우 탐색, 상품 상세 미리보기와 유사 크기) */}
        {previewIndex !== null && currentAsset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="relative w-[900px] h-[700px] bg-white rounded-xl shadow-2xl overflow-hidden animate-fade-in flex flex-col">
              {/* 상단 바: 파일명 + 줌 컨트롤 + 닫기 */}
              <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
                <div className="font-medium text-gray-900 truncate pr-8">{currentName}</div>
                <div className="flex items-center gap-2">
                  <a
                    href={currentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2 py-1 text-sm border rounded hover:bg-gray-100"
                  >
                    새 창
                  </a>
                  <span className="text-xs text-gray-500 w-14 text-right">{Math.round(zoom * 100)}%</span>
                  <button onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))} className="px-2 py-1 text-sm border rounded hover:bg-gray-100" aria-label="축소">-</button>
                  <button onClick={() => setZoom(1)} className="px-2 py-1 text-sm border rounded hover:bg-gray-100" aria-label="원본">100%</button>
                  <button onClick={() => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))} className="px-2 py-1 text-sm border rounded hover:bg-gray-100" aria-label="확대">+</button>
                  <button onClick={closePreview} className="ml-2 text-gray-500 hover:text-gray-700" aria-label="닫기">×</button>
                </div>
              </div>
              
              {/* 콘텐츠 영역 */}
              <div className="relative bg-black flex-1 flex items-center justify-center">
                <div className="overflow-auto flex items-center justify-center w-full h-full">
                  {currentType === 'image' && (
                    <img src={currentUrl} alt={currentName} className="max-w-full max-h-full object-contain select-none" draggable={false} style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }} />
                  )}
                  {currentType === 'pdf' && (
                    <iframe src={currentUrl} title={currentName} className="w-full h-full bg-white" style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }} />
                  )}
                  {currentType === 'other' && (
                    <div className="w-full h-[60vh] bg-white flex items-center justify-center p-8">
                      <div className="text-center">
                        <div className="text-gray-500 mb-4">이 파일 유형은 미리보기를 지원하지 않습니다.</div>
                        <Button asChild>
                          <a href={currentUrl} target="_blank" rel="noreferrer">새 창에서 열기</a>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 좌우 탐색 버튼 */}
                <button onClick={goPrev} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full w-9 h-9 flex items-center justify-center shadow" aria-label="이전">‹</button>
                <button onClick={goNext} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full w-9 h-9 flex items-center justify-center shadow" aria-label="다음">›</button>
              </div>
            </div>
          </div>
        )}

        {/* 업로드 후 카테고리 선택 모달 */}
        {pendingUpload && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="w-[420px] bg-white rounded-xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">카테고리 선택</h3>
              <p className="text-sm text-gray-600 mb-4">
                업로드된 파일을 어떤 카테고리에 저장할지 선택하세요.
              </p>
              <select id="upload-category" className="w-full border rounded-md px-3 py-2 mb-4">
                {['패턴','도식화','인쇄','원단','라벨','기타'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setPendingUpload(null)}>취소</Button>
                <Button
                  onClick={async () => {
                    const selectEl = document.getElementById('upload-category') as HTMLSelectElement | null;
                    const selected = selectEl?.value || '기타';
                    try {
                      const resp = await fetch('/api/drive/assets', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          userId,
                          name: pendingUpload.name,
                          path: pendingUpload.path,
                          url: pendingUpload.url,
                          category: selected,
                        })
                      });
                      if (!resp.ok) throw new Error('자산 저장 실패');
                      setPendingUpload(null);
                      setShowUploader(false);
                      // 목록 리프레시
                      const res = await fetch(`/api/drive/assets?userId=${userId}&category=${category}`);
                      const data = await res.json();
                      setAssets(data.assets || []);
                      
                      // 로컬 스토리지에도 추가
                      const localKey = 'demo_drive_assets';
                      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(localKey) : null;
                      const localAssets = raw ? JSON.parse(raw) : [];
                      const newAsset = {
                        id: `temp-${Date.now()}`,
                        name: pendingUpload.name,
                        path: pendingUpload.path,
                        url: pendingUpload.url,
                        category: selected,
                        uploadedAt: new Date().toISOString(),
                        fileType: pendingUpload.name.split('.').pop()?.toLowerCase() || ''
                      };
                      localAssets.push(newAsset);
                      localStorage.setItem(localKey, JSON.stringify(localAssets));
                      
                      alert('업로드 및 저장 완료');
                    } catch {
                      alert('자산 저장 중 오류가 발생했습니다');
                    }
                  }}
                >
                  저장
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const selectedCartItemsData = cartItems.filter(item => selectedCartItems.includes(item.id));
  const totalCartPrice = selectedCartItemsData.reduce((sum, item) => 
    sum + (item.product?.price || 0) * item.quantity, 0
  );

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">로그인이 필요합니다</h1>
            <Button asChild className="bg-primary hover:bg-primary/90">
              <Link href="/sign-in">로그인하기</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 사용자 정보 및 통계 */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* 사용자 정보 */}
          <div className="md:col-span-2 bg-card border border-card-border rounded-lg p-6 h-full">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold text-primary">
                  {user.firstName?.charAt(0) || user.emailAddresses[0]?.emailAddress.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-foreground">
                  {user.firstName ? `${user.firstName} ${user.lastName || ''}` : '사용자'}
                </h1>
                <p className="text-muted-foreground mb-2">{user.emailAddresses[0]?.emailAddress}</p>
                
                {/* 휴대폰 번호 표시 */}
                {user.phoneNumbers && user.phoneNumbers.length > 0 && (
                  <p className="text-muted-foreground mb-2">
                    📱 {user.phoneNumbers[0].phoneNumber}
                  </p>
                )}
                
                {/* 추가 프로필 정보 */}
                {userProfile && (
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {userProfile.company && (
                      <div className="flex items-center">
                        <span className="font-medium">회사:</span>
                        <span className="ml-2">{userProfile.company}</span>
                        {userProfile.position && (
                          <span className="ml-2">• {userProfile.position}</span>
                        )}
                      </div>
                    )}
                    {userProfile.bio && (
                      <div className="mt-2 p-2 bg-muted rounded-md">
                        <p className="text-foreground">{userProfile.bio}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* 계정 설정 */}
            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4">계정 설정</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <Button variant="outline" onClick={() => setShowProfileModal(true)}>
                  <User className="w-4 h-4 mr-2" />
                  프로필 수정
                </Button>
                <Button variant="outline">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  비밀번호 변경
                </Button>
                <Button variant="outline">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  알림 설정
                </Button>
              </div>
            </div>
          </div>

          {/* 통계 카드들 - 세로 배치 */}
          <div className="flex flex-col gap-4">
            <div className="bg-card border border-card-border rounded-lg p-6 flex-1">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">{purchases.length}</div>
                <div className="text-sm text-muted-foreground">총 구매</div>
              </div>
            </div>

            <div className="bg-card border border-card-border rounded-lg p-6 flex-1">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">{worksheets.length}</div>
                <div className="text-sm text-muted-foreground">작업지시서</div>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">데이터를 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-bold text-foreground mb-4">오류가 발생했습니다</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={loadUserData} className="bg-primary hover:bg-primary/90">다시 시도</Button>
          </div>
        ) : (
          <>
            {/* 탭 네비게이션 */}
            <div className="mb-8">
              <div className="border-b border-border">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'overview'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                    }`}
                  >
                    개요
                  </button>
                  <button
                    onClick={() => setActiveTab('purchases')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'purchases'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                    }`}
                  >
                    구매 내역
                  </button>
                  <button
                    onClick={() => setActiveTab('worksheets')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'worksheets'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                    }`}
                  >
                    작업지시서
                  </button>
                  <button
                    onClick={() => setActiveTab('cart')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                      activeTab === 'cart'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4 mr-1" />
                    장바구니 ({cartItems.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('drive')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'drive'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                    }`}
                  >
                    드라이브
                  </button>
                </nav>
              </div>
            </div>

            {/* 탭 콘텐츠 */}
            {activeTab === 'overview' && (
              <div className="grid md:grid-cols-2 gap-8">
                {/* 구매 내역 요약 */}
                <div className="card">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">최근 구매</h2>
                    <Button variant="outline" size="sm" onClick={() => setActiveTab('purchases')}>
                      전체 보기
                    </Button>
                  </div>
                  {purchases.length > 0 ? (
                    <div className="space-y-4">
                      {purchases.slice(0, 3).map((purchase) => (
                        <div key={purchase.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                              <div className="text-gray-500 text-xs">이미지</div>
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900 text-sm">상품 #{purchase.product_id}</h3>
                              <div className="flex justify-between items-center text-xs text-gray-600 mt-1">
                                <span>{formatDate(new Date(purchase.created_at))}</span>
                                <span className="font-medium">{formatPrice(purchase.amount)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-muted-foreground mb-4">
                        <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </div>
                      <h3 className="text-sm font-medium text-foreground mb-2">구매 내역이 없습니다</h3>
                      <Button asChild size="sm" className="bg-primary hover:bg-primary/90">
                        <Link href="/products">상품 둘러보기</Link>
                      </Button>
                    </div>
                  )}
                </div>

                {/* 작업지시서 요약 */}
                <div className="bg-card border border-card-border rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-foreground">최근 작업지시서</h2>
                    <Button variant="outline" size="sm" onClick={() => setActiveTab('worksheets')}>
                      전체 보기
                    </Button>
                  </div>
                  {worksheets.length > 0 ? (
                    <div className="space-y-3">
                      {worksheets.slice(0, 5).map((worksheet, idx) => {
                        // 작업지시서 미리보기 썸네일 생성
                        const generateThumbnail = (worksheet: any) => {
                          console.log('썸네일 생성 시작:', worksheet.id, worksheet.title);
                          
                          // 1. 캡처된 썸네일이 있으면 우선 사용
                          const savedThumbnail = getWorksheetThumbnail(worksheet.id.toString());
                          console.log('저장된 썸네일 확인:', worksheet.id, savedThumbnail ? '있음' : '없음');
                          
                          if (savedThumbnail) {
                            console.log('캡처된 썸네일 사용:', worksheet.id, '썸네일 길이:', savedThumbnail.length);
                            console.log('썸네일 미리보기:', savedThumbnail.substring(0, 100) + '...');
                            return savedThumbnail;
                          }
                          
                          // 2. 작업지시서 내용에서 도식화 이미지 확인
                          const content = worksheet.content;
                          const frontImage = content?.technicalDrawing?.frontImage || '';
                          
                          // 도식화 이미지가 있고 placeholder가 아니면 사용
                          if (frontImage && !frontImage.includes('placeholder')) {
                            console.log('도식화 이미지 사용:', worksheet.id);
                            return frontImage;
                          }
                          
                          console.log('기본 썸네일 생성:', worksheet.id);
                          
                          // 3. 기본 썸네일 생성 (SVG) - 더 연하게 표시
                          const categoryColors: Record<string, string> = {
                            '상의': '#e3f2fd',
                            '하의': '#e8f5e8',
                            '원피스': '#f3e5f5',
                            '아우터': '#fff3e0',
                            '속옷': '#fce4ec',
                            '액세서리': '#fff8e1'
                          };

                          return `data:image/svg+xml,${encodeURIComponent(`
                            <svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">
                              <rect width="100%" height="100%" fill="${categoryColors[worksheet.category] || '#f5f5f5'}"/>
                              <text x="50%" y="35%" font-family="Arial, sans-serif" font-size="12" fill="#666666" text-anchor="middle" font-weight="normal">${worksheet.title}</text>
                              <text x="50%" y="55%" font-family="Arial, sans-serif" font-size="10" fill="#999999" text-anchor="middle">${worksheet.category}</text>
                              <text x="50%" y="75%" font-family="Arial, sans-serif" font-size="8" fill="#cccccc" text-anchor="middle">작업지시서</text>
                              <text x="50%" y="90%" font-family="Arial, sans-serif" font-size="6" fill="#dddddd" text-anchor="middle">${worksheet.size_range}</text>
                            </svg>
                          `)}`;
                        };

                        return (
                          <div key={`recent-ws-${worksheet.id}-${worksheet.updated_at || worksheet.created_at || idx}`} 
                               className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200">
                            {/* 썸네일 이미지 */}
                            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center p-0">
                              <img
                                src={generateThumbnail(worksheet)}
                                alt={worksheet.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const nextElement = target.nextElementSibling as HTMLElement;
                                  if (nextElement) {
                                    nextElement.style.display = 'flex';
                                  }
                                }}
                                onLoad={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'block';
                                  const nextElement = target.nextElementSibling as HTMLElement;
                                  if (nextElement) {
                                    nextElement.style.display = 'none';
                                  }
                                }}
                              />
                              <div className="w-full h-full bg-gray-100 flex items-center justify-center" style={{display: 'none'}}>
                                <FileText className="w-6 h-6 text-gray-400" />
                              </div>
                            </div>
                            
                            {/* 작업지시서 정보 */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium text-gray-900 truncate">{worksheet.title}</h3>
                                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                                  {worksheet.category}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span>사이즈: {worksheet.size_range}</span>
                                <span>•</span>
                                <span>수정: {formatDate(new Date(worksheet.updated_at))}</span>
                              </div>
                            </div>
                            

                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-400 mb-4">
                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">작업지시서가 없습니다</h3>
                      <p className="text-gray-600 mb-4">첫 번째 작업지시서를 만들어보세요!</p>
                      <Button asChild className="bg-primary hover:bg-primary/90">
                        <Link href="/worksheet">작업지시서 만들기</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'purchases' && (
              <div className="bg-card border border-card-border rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-foreground">구매 내역</h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPurchaseFilter('all')}
                      className={`px-3 py-1 text-sm rounded-md ${
                        purchaseFilter === 'all' 
                          ? 'bg-primary/10 text-primary' 
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      전체
                    </button>
                    <button
                      onClick={() => setPurchaseFilter('completed')}
                      className={`px-3 py-1 text-sm rounded-md ${
                        purchaseFilter === 'completed' 
                          ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      완료
                    </button>
                    <button
                      onClick={() => setPurchaseFilter('pending')}
                      className={`px-3 py-1 text-sm rounded-md ${
                        purchaseFilter === 'pending' 
                          ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' 
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      진행중
                    </button>
                    <button
                      onClick={() => setPurchaseFilter('failed')}
                      className={`px-3 py-1 text-sm rounded-md ${
                        purchaseFilter === 'failed' 
                          ? 'bg-red-500/10 text-red-600 dark:text-red-400' 
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      실패
                    </button>
                  </div>
                </div>
                {purchases.length > 0 ? (
                  <div className="space-y-4">
                    {purchases
                      .filter(purchase => purchaseFilter === 'all' || purchase.status === purchaseFilter)
                      .map((purchase) => (
                      <div key={purchase.id} className="border border-border rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          {/* 상품 이미지 */}
                          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                            <div className="text-muted-foreground text-xs">이미지</div>
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-medium text-foreground">상품 #{purchase.product_id}</h3>
                              <span className={`text-sm font-medium px-2 py-1 rounded ${
                                purchase.status === 'completed' 
                                  ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                                  : purchase.status === 'pending'
                                  ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                                  : 'bg-red-500/10 text-red-600 dark:text-red-400'
                              }`}>
                                {purchase.status === 'completed' ? '완료' : 
                                 purchase.status === 'pending' ? '진행중' : '실패'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-sm text-muted-foreground mb-3">
                              <span>{formatDate(new Date(purchase.created_at))}</span>
                              <span className="font-medium">{formatPrice(purchase.amount)}</span>
                            </div>
                            {purchase.status === 'completed' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDownloadFile(
                                  `/files/product${purchase.product_id}.pdf`, 
                                  `상품${purchase.product_id}.pdf`
                                )}
                              >
                                <Download className="w-4 h-4 mr-1" />
                                파일 다운로드
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground mb-4">
                      <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">구매 내역이 없습니다</h3>
                    <p className="text-muted-foreground mb-4">상품을 구매해보세요!</p>
                    <Button asChild className="bg-primary hover:bg-primary/90">
                      <Link href="/products">상품 둘러보기</Link>
                    </Button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'worksheets' && (
              <div className="bg-card border border-card-border rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-foreground">작업지시서</h2>
                  <div className="flex items-center space-x-4">
                    <select
                      value={worksheetFilter}
                      onChange={(e) => setWorksheetFilter(e.target.value)}
                      className="px-3 py-1 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                    >
                      <option value="all">전체 카테고리</option>
                      <option value="상의">상의</option>
                      <option value="하의">하의</option>
                      <option value="원피스">원피스</option>
                      <option value="아우터">아우터</option>
                      <option value="속옷">속옷</option>
                      <option value="액세서리">액세서리</option>
                    </select>

                    <Button size="sm" asChild className="bg-primary hover:bg-primary/90">
                      <Link href="/worksheet" className="inline-flex items-center gap-2 min-w-[110px] justify-center">
                        <Plus className="w-4 h-4" />
                        새로 만들기
                      </Link>
                    </Button>
                  </div>
                </div>
                {worksheets.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {worksheets
                      .filter(worksheet => worksheetFilter === 'all' || worksheet.category === worksheetFilter)
                      .map((worksheet, idx) => {
                                                // 작업지시서 미리보기 썸네일 생성
                        const generateThumbnail = (worksheet: any) => {
                          console.log('썸네일 생성 시작:', worksheet.id, worksheet.title);
                          
                          // 1. 캡처된 썸네일이 있으면 우선 사용
                          const savedThumbnail = getWorksheetThumbnail(worksheet.id.toString());
                          console.log('저장된 썸네일 확인:', worksheet.id, savedThumbnail ? '있음' : '없음');
                          
                          if (savedThumbnail) {
                            console.log('캡처된 썸네일 사용:', worksheet.id, '썸네일 길이:', savedThumbnail.length);
                            console.log('썸네일 미리보기:', savedThumbnail.substring(0, 100) + '...');
                            return savedThumbnail;
                          }
                          
                          // 2. 작업지시서 내용에서 도식화 이미지 확인
                          const content = worksheet.content;
                          const frontImage = content?.technicalDrawing?.frontImage || '';
                          
                          // 도식화 이미지가 있고 placeholder가 아니면 사용
                          if (frontImage && !frontImage.includes('placeholder')) {
                            console.log('도식화 이미지 사용:', worksheet.id);
                            return frontImage;
                          }
                          
                          console.log('기본 썸네일 생성:', worksheet.id);
                          
                          // 3. 기본 썸네일 생성 (SVG) - 더 연하게 표시
                          const categoryColors: Record<string, string> = {
                            '상의': '#e3f2fd',
                            '하의': '#e8f5e8',
                            '원피스': '#f3e5f5',
                            '아우터': '#fff3e0',
                            '속옷': '#fce4ec',
                            '액세서리': '#fff8e1'
                          };

                          return `data:image/svg+xml,${encodeURIComponent(`
                            <svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">
                              <rect width="100%" height="100%" fill="${categoryColors[worksheet.category] || '#f5f5f5'}"/>
                              <text x="50%" y="35%" font-family="Arial, sans-serif" font-size="12" fill="#666666" text-anchor="middle" font-weight="normal">${worksheet.title}</text>
                              <text x="50%" y="55%" font-family="Arial, sans-serif" font-size="10" fill="#999999" text-anchor="middle">${worksheet.category}</text>
                              <text x="50%" y="75%" font-family="Arial, sans-serif" font-size="8" fill="#cccccc" text-anchor="middle">작업지시서</text>
                              <text x="50%" y="90%" font-family="Arial, sans-serif" font-size="6" fill="#dddddd" text-anchor="middle">${worksheet.size_range}</text>
                            </svg>
                          `)}`;
                        };

                        return (
                          <div key={`ws-${worksheet.id}-${worksheet.updated_at || worksheet.created_at || idx}`} 
                               className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200">
                            {/* 썸네일 이미지 */}
                            <div className="aspect-[4/3] bg-gray-100 relative flex items-center justify-center p-0">
                              <img
                                src={generateThumbnail(worksheet)}
                                alt={worksheet.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  console.log('이미지 로드 실패:', worksheet.id, 'src:', target.src.substring(0, 100) + '...');
                                  target.style.display = 'none';
                                  const nextElement = target.nextElementSibling as HTMLElement;
                                  if (nextElement) {
                                    nextElement.style.display = 'flex';
                                  }
                                }}
                                onLoad={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  console.log('이미지 로드 성공:', worksheet.id, '이미지 크기:', target.naturalWidth, 'x', target.naturalHeight, 'src 타입:', target.src.substring(0, 30));
                                  target.style.display = 'block';
                                  const nextElement = target.nextElementSibling as HTMLElement;
                                  if (nextElement) {
                                    nextElement.style.display = 'none';
                                  }
                                }}
                              />
                              <div className="absolute inset-0 bg-gray-100 flex items-center justify-center" style={{display: 'none'}}>
                                <div className="text-center">
                                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                  <p className="text-sm text-gray-500">{worksheet.title}</p>
                                </div>
                              </div>
                              

                            </div>
                            
                            {/* 카드 내용 */}
                            <div className="p-3">
                              <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{worksheet.title}</h3>
                              
                              <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                <span>생성: {formatDate(new Date(worksheet.created_at))}</span>
                                <span>•</span>
                                <span>사이즈: {worksheet.size_range}</span>
                              </div>
                              
                              {/* 액션 버튼들 */}
                              <div className="flex flex-wrap gap-2">
                                <Button variant="outline" size="sm" asChild className="flex-1">
                                  <Link href={`/worksheet/${worksheet.id}`} className="inline-flex items-center gap-1 justify-center">
                                    <Edit className="w-3 h-3" />
                                    편집
                                  </Link>
                                </Button>
                                <Button variant="outline" size="sm" className="flex-1">
                                  <FileText className="w-3 h-3 mr-1" />
                                  PDF
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="bg-green-600 text-white hover:bg-green-700 flex-1"
                                  onClick={() => handleProductionRequest(worksheet.id)}
                                >
                                  생산 의뢰
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleDeleteWorksheet(worksheet.id)}
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-4">
                      <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">작업지시서가 없습니다</h3>
                    <p className="text-gray-600 mb-4">첫 번째 작업지시서를 만들어보세요!</p>
                    <Button asChild className="bg-primary hover:bg-primary/90">
                      <Link href="/worksheet">작업지시서 만들기</Link>
                    </Button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'cart' && (
              <div className="card">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">장바구니</h2>
                  <p className="text-gray-600">{cartItems.length}개의 상품이 담겨있습니다</p>
                </div>

                {cartItems.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-4">
                      <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m6 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">장바구니가 비어있습니다</h3>
                    <p className="text-gray-600 mb-6">상품을 추가해보세요!</p>
                    <Button asChild>
                      <Link href="/products">상품 둘러보기</Link>
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* 선택된 상품 관리 */}
                    <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={selectedCartItems.length === cartItems.length}
                              onChange={handleSelectAllCartItems}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">전체 선택</span>
                          </label>
                          <span className="text-sm text-gray-500">
                            {selectedCartItems.length}개 선택됨
                          </span>
                        </div>
                        {selectedCartItems.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRemoveSelectedCartItems}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            선택 삭제
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* 장바구니 상품 목록 */}
                    <div className="space-y-4">
                      {cartItems.map((item) => (
                        <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center space-x-4">
                            <input
                              type="checkbox"
                              checked={selectedCartItems.includes(item.id)}
                              onChange={() => handleSelectCartItem(item.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            
                            <div className="flex-1 flex items-center space-x-4">
                              {/* 상품 이미지 */}
                              <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                                {item.product?.image_urls && item.product.image_urls.length > 0 ? (
                                  <img 
                                    src={item.product.image_urls[0]} 
                                    alt={item.product.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="text-gray-500 text-xs">이미지</div>
                                )}
                              </div>

                              {/* 상품 정보 */}
                              <div className="flex-1">
                                <h3 className="font-medium text-gray-900 mb-1">
                                  {item.product?.name}
                                </h3>
                                <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                                  <span>{item.product?.category}</span>
                                  <span>•</span>
                                  <span>{item.product?.gender}</span>
                                  <span>•</span>
                                  <span>{item.product?.season}</span>
                                </div>
                                <div className="text-lg font-bold text-gray-900">
                                  {formatPrice(item.product?.price || 0)}
                                </div>
                              </div>

                              {/* 수량 조절 */}
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="w-12 text-center font-medium">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>

                              {/* 총 가격 */}
                              <div className="text-right">
                                <div className="text-lg font-bold text-gray-900">
                                  {formatPrice((item.product?.price || 0) * item.quantity)}
                                </div>
                              </div>

                              {/* 삭제 버튼 */}
                              <button
                                onClick={() => handleRemoveCartItem(item.id)}
                                className="text-gray-400 hover:text-red-500"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 결제 섹션 */}
                    <div className="mt-6 p-4 border-t border-gray-200 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-lg font-medium text-gray-900">
                          선택된 상품 ({selectedCartItems.length}개)
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                          {formatPrice(totalCartPrice)}
                        </div>
                      </div>
                      
                      <div className="flex space-x-4">
                        <Button
                          onClick={handleCheckout}
                          disabled={selectedCartItems.length === 0}
                          className="flex-1 h-12 text-lg"
                        >
                          선택 상품 구매하기
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => router.push("/products")}
                          className="h-12"
                        >
                          쇼핑 계속하기
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'drive' && (
              <div className="card">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">드라이브</h2>
                </div>

                {/* 카테고리 필터 + 리스트 */}
                <DriveContent userId={user.id} />
              </div>
            )}
          </>
        )}


      </div>

      {/* 결제 모달 */}
      {selectedCartItemsData.length > 0 && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          products={selectedCartItemsData.map(item => ({
            ...item.product!,
            quantity: item.quantity
          }))}
          onSuccess={handlePaymentSuccess}
        />
      )}

             {/* 프로필 수정 모달 */}
       {showProfileModal && user && (
         <ProfileEditModal
           isOpen={showProfileModal}
           onClose={() => setShowProfileModal(false)}
           user={user}
           onProfileUpdate={loadUserProfile}
         />
       )}

       {/* 휴대폰 번호 필요 모달 */}
       <PhoneRequiredModal
         isOpen={showPhoneRequiredModal}
         onClose={() => setShowPhoneRequiredModal(false)}
         onComplete={() => {
           setShowPhoneRequiredModal(false);
           // 생산 의뢰 재시도 로직을 여기에 추가할 수 있습니다
         }}
       />

      {/* 드라이브 선택 모달은 제거됨 */}
    </div>
  );
}

export default function MyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">로딩 중...</p>
          </div>
        </div>
      </div>
    }>
      <MyPageContent />
    </Suspense>
  );
} 