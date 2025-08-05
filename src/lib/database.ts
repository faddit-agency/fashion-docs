import { supabase, Product, Purchase, Worksheet, CartItem } from './supabase';

// 상품 관련 함수들
export const productAPI = {
  // 모든 상품 조회
  async getAllProducts() {
    if (!supabase) {
      console.warn('Supabase 설정이 없어 빈 배열을 반환합니다.');
      return [];
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.warn('상품 조회 실패:', error);
      return [];
    }
    return data;
  },

  // 특정 상품 조회
  async getProductById(id: number) {
    if (!supabase) {
      console.warn('Supabase 설정이 없어 null을 반환합니다.');
      return null;
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.warn('상품 조회 실패:', error);
      return null;
    }
    return data;
  },

  // 상품 검색
  async searchProducts(query: string) {
    if (!supabase) {
      console.warn('Supabase 설정이 없어 빈 배열을 반환합니다.');
      return [];
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.warn('상품 검색 실패:', error);
      return [];
    }
    return data;
  },

  // 카테고리별 상품 조회
  async getProductsByCategory(category: string) {
    if (!supabase) {
      console.warn('Supabase 설정이 없어 빈 배열을 반환합니다.');
      return [];
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.warn('카테고리별 상품 조회 실패:', error);
      return [];
    }
    return data;
  }
};

// 구매 관련 함수들
export const purchaseAPI = {
  // 사용자 구매 내역 조회
  async getUserPurchases(userId: string) {
    if (!supabase) {
      console.warn('Supabase 설정이 없어 빈 배열을 반환합니다.');
      return [];
    }

    const { data, error } = await supabase
      .from('purchases')
      .select(`
        *,
        products (
          id,
          name,
          price,
          image_urls
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.warn('구매 내역 조회 실패:', error);
      return [];
    }
    return data;
  },

  // 구매 기록 생성
  async createPurchase(purchase: Omit<Purchase, 'id' | 'created_at'>) {
    if (!supabase) {
      console.warn('Supabase 설정이 없어 null을 반환합니다.');
      return null;
    }

    const { data, error } = await supabase
      .from('purchases')
      .insert(purchase)
      .select()
      .single();
    
    if (error) {
      console.warn('구매 기록 생성 실패:', error);
      return null;
    }
    return data;
  },

  // 구매 상태 업데이트
  async updatePurchaseStatus(id: number, status: Purchase['status'], paymentKey?: string) {
    if (!supabase) {
      console.warn('Supabase 설정이 없어 null을 반환합니다.');
      return null;
    }

    const { data, error } = await supabase
      .from('purchases')
      .update({ 
        status, 
        payment_key: paymentKey,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.warn('구매 상태 업데이트 실패:', error);
      return null;
    }
    return data;
  }
};

// 작업지시서 관련 함수들
export const worksheetAPI = {
  // 사용자 작업지시서 조회
  async getUserWorksheets(userId: string) {
    if (!supabase) {
      console.warn('Supabase 설정이 없어 빈 배열을 반환합니다.');
      return [];
    }

    const { data, error } = await supabase
      .from('worksheets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.warn('작업지시서 조회 실패:', error);
      return [];
    }
    return data;
  },

  // 작업지시서 생성
  async createWorksheet(worksheet: Omit<Worksheet, 'id' | 'created_at' | 'updated_at'>) {
    if (!supabase) {
      console.warn('Supabase 설정이 없어 null을 반환합니다.');
      return null;
    }

    const { data, error } = await supabase
      .from('worksheets')
      .insert(worksheet)
      .select()
      .single();
    
    if (error) {
      console.warn('작업지시서 생성 실패:', error);
      return null;
    }
    return data;
  },

  // 작업지시서 업데이트
  async updateWorksheet(id: number, updates: Partial<Worksheet>) {
    if (!supabase) {
      console.warn('Supabase 설정이 없어 null을 반환합니다.');
      return null;
    }

    const { data, error } = await supabase
      .from('worksheets')
      .update({ 
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.warn('작업지시서 업데이트 실패:', error);
      return null;
    }
    return data;
  },

  // 작업지시서 삭제
  async deleteWorksheet(id: number) {
    if (!supabase) {
      console.warn('Supabase 설정이 없어 false를 반환합니다.');
      return false;
    }

    const { error } = await supabase
      .from('worksheets')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.warn('작업지시서 삭제 실패:', error);
      return false;
    }
    return true;
  }
};

// 장바구니 관련 함수들
export const cartAPI = {
  // 사용자 장바구니 조회
  async getUserCart(userId: string) {
    if (!supabase) {
      console.warn('Supabase 설정이 없어 빈 배열을 반환합니다.');
      return [];
    }

    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        products (
          id,
          name,
          price,
          image_urls
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.warn('장바구니 조회 실패:', error);
      return [];
    }
    return data;
  },

  // 장바구니에 상품 추가
  async addToCart(userId: string, productId: number, quantity: number = 1) {
    if (!supabase) {
      console.warn('Supabase 설정이 없어 null을 반환합니다.');
      return null;
    }

    // 기존 장바구니 아이템 확인
    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    if (existingItem) {
      // 수량 업데이트
      const { data, error } = await supabase
        .from('cart_items')
        .update({ quantity: existingItem.quantity + quantity })
        .eq('id', existingItem.id)
        .select()
        .single();
      
      if (error) {
        console.warn('장바구니 수량 업데이트 실패:', error);
        return null;
      }
      return data;
    } else {
      // 새 아이템 추가
      const { data, error } = await supabase
        .from('cart_items')
        .insert({
          user_id: userId,
          product_id: productId,
          quantity
        })
        .select()
        .single();
      
      if (error) {
        console.warn('장바구니 추가 실패:', error);
        return null;
      }
      return data;
    }
  },

  // 장바구니 아이템 수량 업데이트
  async updateCartItemQuantity(cartItemId: number, quantity: number) {
    if (!supabase) {
      console.warn('Supabase 설정이 없어 null을 반환합니다.');
      return null;
    }

    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', cartItemId)
      .select()
      .single();
    
    if (error) {
      console.warn('장바구니 수량 업데이트 실패:', error);
      return null;
    }
    return data;
  },

  // 장바구니에서 상품 제거
  async removeFromCart(cartItemId: number) {
    if (!supabase) {
      console.warn('Supabase 설정이 없어 false를 반환합니다.');
      return false;
    }

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', cartItemId);
    
    if (error) {
      console.warn('장바구니 제거 실패:', error);
      return false;
    }
    return true;
  },

  // 장바구니 비우기
  async clearCart(userId: string) {
    if (!supabase) {
      console.warn('Supabase 설정이 없어 false를 반환합니다.');
      return false;
    }

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId);
    
    if (error) {
      console.warn('장바구니 비우기 실패:', error);
      return false;
    }
    return true;
  },

  // 장바구니 아이템 개수 조회
  async getCartItemCount(userId: string) {
    if (!supabase) {
      console.warn('Supabase 설정이 없어 0을 반환합니다.');
      return 0;
    }

    const { count, error } = await supabase
      .from('cart_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    if (error) {
      console.warn('장바구니 개수 조회 실패:', error);
      return 0;
    }
    return count || 0;
  }
};

// 판매자 관련 함수들
export const sellerAPI = {
  // 판매자 상품 조회
  async getSellerProducts(sellerId: string) {
    if (!supabase) {
      console.warn('Supabase 설정이 없어 빈 배열을 반환합니다.');
      return [];
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.warn('판매자 상품 조회 실패:', error);
      return [];
    }
    return data;
  },

  // 판매자 통계 조회
  async getSellerStats(sellerId: string, period: '7d' | '30d' | '90d' = '7d') {
    if (!supabase) {
      console.warn('Supabase 설정이 없어 기본 통계를 반환합니다.');
      return {
        totalSales: 0,
        totalOrders: 0,
        averageOrderValue: 0
      };
    }

    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('purchases')
      .select(`
        *,
        products!inner(seller_id)
      `)
      .eq('products.seller_id', sellerId)
      .gte('created_at', startDate.toISOString())
      .eq('status', 'completed');

    if (error) {
      console.warn('판매자 통계 조회 실패:', error);
      return {
        totalSales: 0,
        totalOrders: 0,
        averageOrderValue: 0
      };
    }

    const totalSales = data.reduce((sum, purchase) => sum + purchase.amount, 0);
    const totalOrders = data.length;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    return {
      totalSales,
      totalOrders,
      averageOrderValue
    };
  },

  // 판매자 일별 매출 조회
  async getSellerDailySales(sellerId: string, days: number = 7) {
    if (!supabase) {
      console.warn('Supabase 설정이 없어 빈 배열을 반환합니다.');
      return [];
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('purchases')
      .select(`
        *,
        products!inner(seller_id)
      `)
      .eq('products.seller_id', sellerId)
      .gte('created_at', startDate.toISOString())
      .eq('status', 'completed')
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('판매자 일별 매출 조회 실패:', error);
      return [];
    }

    // 일별 매출 집계
    const dailySales = data.reduce((acc, purchase) => {
      const date = new Date(purchase.created_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + purchase.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(dailySales).map(([date, amount]) => ({
      date,
      amount
    }));
  }
};

// 상품 관리 관련 함수들
export const productManagementAPI = {
  // 상품 생성
  async createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) {
    if (!supabase) {
      console.warn('Supabase 설정이 없어 null을 반환합니다.');
      return null;
    }

    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single();
    
    if (error) {
      console.warn('상품 생성 실패:', error);
      return null;
    }
    return data;
  },

  // 상품 업데이트
  async updateProduct(id: number, updates: Partial<Product>) {
    if (!supabase) {
      console.warn('Supabase 설정이 없어 null을 반환합니다.');
      return null;
    }

    const { data, error } = await supabase
      .from('products')
      .update({ 
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.warn('상품 업데이트 실패:', error);
      return null;
    }
    return data;
  },

  // 상품 삭제
  async deleteProduct(id: number) {
    if (!supabase) {
      console.warn('Supabase 설정이 없어 false를 반환합니다.');
      return false;
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.warn('상품 삭제 실패:', error);
      return false;
    }
    return true;
  },

  // 상품 상태 업데이트
  async updateProductStatus(id: number, status: 'active' | 'inactive') {
    if (!supabase) {
      console.warn('Supabase 설정이 없어 null을 반환합니다.');
      return null;
    }

    const { data, error } = await supabase
      .from('products')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.warn('상품 상태 업데이트 실패:', error);
      return null;
    }
    return data;
  }
}; 