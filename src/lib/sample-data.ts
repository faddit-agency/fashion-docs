import { Product } from './supabase';

export const sampleProducts: Product[] = [
  {
    id: 1,
    name: "남성 기본 반팔 티셔츠 도식화",
    category: "상의",
    gender: "남성",
    season: "봄/여름",
    price: 50000,
    description: "기본적인 남성 반팔 티셔츠의 도식화입니다. 다양한 사이즈에 적용 가능하며, 깔끔하고 실용적인 디자인을 제공합니다. 면 100% 원단을 사용하여 편안한 착용감을 제공하며, 다양한 색상으로 제작 가능합니다.",
    seller_id: "seller1",
    file_url: "/files/product1.pdf",
    image_urls: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=1000&fit=crop",
      "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800&h=1000&fit=crop",
      "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=1000&fit=crop"
    ],
    status: "active",
    created_at: "2024-01-15T00:00:00Z",
    updated_at: "2024-01-15T00:00:00Z"
  },
  {
    id: 2,
    name: "여성 기본 원피스 도식화",
    category: "원피스",
    gender: "여성",
    season: "봄/여름",
    price: 70000,
    description: "우아한 여성 원피스 도식화입니다. 여성스러운 실루엣과 편안한 착용감을 제공합니다. 다양한 사이즈에 적용 가능하며, 고급스러운 디자인으로 제작되었습니다.",
    seller_id: "seller1",
    file_url: "/files/product2.pdf",
    image_urls: [
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&h=1000&fit=crop",
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&h=1000&fit=crop",
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&h=1000&fit=crop"
    ],
    status: "active",
    created_at: "2024-01-10T00:00:00Z",
    updated_at: "2024-01-10T00:00:00Z"
  },
  {
    id: 3,
    name: "남성 데님 팬츠 패턴",
    category: "하의",
    gender: "남성",
    season: "사계절",
    price: 60000,
    description: "클래식한 남성 데님 팬츠 패턴입니다. 편안한 착용감과 내구성을 제공하며, 다양한 사이즈에 적용 가능합니다. 데님 원단의 특성을 살린 패턴으로 제작되었습니다.",
    seller_id: "seller2",
    file_url: "/files/product3.pdf",
    image_urls: [
      "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&h=1000&fit=crop",
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&h=1000&fit=crop",
      "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&h=1000&fit=crop"
    ],
    status: "active",
    created_at: "2024-01-08T00:00:00Z",
    updated_at: "2024-01-08T00:00:00Z"
  },
  {
    id: 4,
    name: "여성 블라우스 도식화",
    category: "상의",
    gender: "여성",
    season: "봄/여름",
    price: 45000,
    description: "여성스러운 블라우스 도식화입니다. 우아한 디자인과 편안한 착용감을 제공합니다. 다양한 사이즈에 적용 가능하며, 실용적인 패턴으로 제작되었습니다.",
    seller_id: "seller2",
    file_url: "/files/product4.pdf",
    image_urls: [
      "https://images.unsplash.com/photo-1564257631407-3deb5d3c3b1c?w=800&h=1000&fit=crop",
      "https://images.unsplash.com/photo-1564257631407-3deb5d3c3b1c?w=800&h=1000&fit=crop",
      "https://images.unsplash.com/photo-1564257631407-3deb5d3c3b1c?w=800&h=1000&fit=crop"
    ],
    status: "active",
    created_at: "2024-01-05T00:00:00Z",
    updated_at: "2024-01-05T00:00:00Z"
  },
  {
    id: 5,
    name: "남성 후드 집업 패턴",
    category: "아우터",
    gender: "남성",
    season: "가을/겨울",
    price: 80000,
    description: "편안한 남성 후드 집업 패턴입니다. 보온성과 실용성을 겸비한 디자인으로 제작되었습니다. 다양한 사이즈에 적용 가능하며, 일상복으로 활용하기 좋습니다.",
    seller_id: "seller3",
    file_url: "/files/product5.pdf",
    image_urls: [
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=1000&fit=crop",
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=1000&fit=crop",
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=1000&fit=crop"
    ],
    status: "active",
    created_at: "2024-01-03T00:00:00Z",
    updated_at: "2024-01-03T00:00:00Z"
  },
  {
    id: 6,
    name: "여성 미니 스커트 도식화",
    category: "하의",
    gender: "여성",
    season: "봄/여름",
    price: 55000,
    description: "여성스러운 미니 스커트 도식화입니다. 우아한 실루엣과 편안한 착용감을 제공합니다. 다양한 사이즈에 적용 가능하며, 다양한 스타일링이 가능합니다.",
    seller_id: "seller3",
    file_url: "/files/product6.pdf",
    image_urls: [
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&h=1000&fit=crop",
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&h=1000&fit=crop",
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&h=1000&fit=crop"
    ],
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  }
];

export const getSampleProduct = (id: number): Product | null => {
  return sampleProducts.find(product => product.id === id) || null;
};

export const getSampleProducts = (): Product[] => {
  return sampleProducts;
}; 