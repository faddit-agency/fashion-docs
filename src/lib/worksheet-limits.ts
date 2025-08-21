// 작업지시서 제한 관리

export interface WorksheetLimit {
  userId: string;
  currentCount: number;
  maxCount: number;
  lastUpdated: string;
}

// 기본 제한: 사용자당 1개 작업지시서
export const DEFAULT_WORKSHEET_LIMIT = 1;

// 사용자별 작업지시서 개수 조회
export const getUserWorksheetCount = async (userId: string): Promise<number> => {
  try {
    // 실제로는 데이터베이스에서 조회
    const stored = localStorage.getItem(`worksheet_count_${userId}`);
    if (stored) {
      const data = JSON.parse(stored);
      return data.count || 0;
    }
    return 0;
  } catch (error) {
    console.error('작업지시서 개수 조회 오류:', error);
    return 0;
  }
};

// 작업지시서 제한 확인
export const checkWorksheetLimit = async (userId: string): Promise<{
  allowed: boolean;
  currentCount: number;
  maxCount: number;
  errorMessage?: string;
}> => {
  try {
    const currentCount = await getUserWorksheetCount(userId);
    const maxCount = DEFAULT_WORKSHEET_LIMIT;
    const allowed = currentCount < maxCount;
    
    return {
      allowed,
      currentCount,
      maxCount,
      errorMessage: allowed ? undefined : 
        `작업지시서는 최대 ${maxCount}개까지만 생성할 수 있습니다. 기존 작업지시서를 삭제하고 새로 생성하거나, 기존 작업지시서를 수정해주세요.`
    };
  } catch (error) {
    console.error('작업지시서 제한 확인 오류:', error);
    return {
      allowed: false,
      currentCount: 0,
      maxCount: DEFAULT_WORKSHEET_LIMIT,
      errorMessage: '작업지시서 제한 확인 중 오류가 발생했습니다.'
    };
  }
};

// 작업지시서 개수 증가
export const incrementWorksheetCount = async (userId: string): Promise<void> => {
  try {
    const currentCount = await getUserWorksheetCount(userId);
    const newCount = currentCount + 1;
    
    const data = {
      userId,
      count: newCount,
      lastUpdated: new Date().toISOString()
    };
    
    // 로컬 스토리지에 저장 (실제로는 데이터베이스에 저장)
    localStorage.setItem(`worksheet_count_${userId}`, JSON.stringify(data));
  } catch (error) {
    console.error('작업지시서 개수 증가 오류:', error);
    throw error;
  }
};

// 작업지시서 개수 감소
export const decrementWorksheetCount = async (userId: string): Promise<void> => {
  try {
    const currentCount = await getUserWorksheetCount(userId);
    const newCount = Math.max(0, currentCount - 1);
    
    const data = {
      userId,
      count: newCount,
      lastUpdated: new Date().toISOString()
    };
    
    // 로컬 스토리지에 저장 (실제로는 데이터베이스에 저장)
    localStorage.setItem(`worksheet_count_${userId}`, JSON.stringify(data));
  } catch (error) {
    console.error('작업지시서 개수 감소 오류:', error);
    throw error;
  }
};

// 작업지시서 개수 초기화
export const resetWorksheetCount = async (userId: string): Promise<void> => {
  try {
    const data = {
      userId,
      count: 0,
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem(`worksheet_count_${userId}`, JSON.stringify(data));
  } catch (error) {
    console.error('작업지시서 개수 초기화 오류:', error);
    throw error;
  }
};
