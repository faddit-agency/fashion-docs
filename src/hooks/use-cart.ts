import { useState, useEffect } from "react";
import { cartAPI } from "@/lib/database";

export function useCart(userId?: string) {
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadCartCount = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const count = await cartAPI.getCartItemCount(userId);
      setCartCount(count);
    } catch (err) {
      console.error("장바구니 개수 로딩 오류:", err);
      setCartCount(0);
    } finally {
      setLoading(false);
    }
  };

  const updateCartCount = (increment: number = 1) => {
    setCartCount(prev => Math.max(0, prev + increment));
  };

  useEffect(() => {
    loadCartCount();
  }, [userId]);

  return {
    cartCount,
    loading,
    loadCartCount,
    updateCartCount
  };
} 