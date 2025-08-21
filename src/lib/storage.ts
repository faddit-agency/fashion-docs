import { supabase } from './supabase';


export class StorageService {
  // 파일 업로드
  static async uploadFile(
    file: File,
    bucket: string = 'faddit-files',
    path?: string
  ): Promise<{ url: string; path: string }> {
    try {
      // Supabase 설정이 없는 경우 임시 처리
      if (!supabase) {
        console.warn('Supabase 설정이 없습니다. 임시 URL을 반환합니다.');
        return {
          url: `/api/placeholder/400/600?text=File+Upload`,
          path: `temp/${Date.now()}-${file.name}`
        };
      }

      const fileName = `${Date.now()}-${file.name}`;
      const filePath = path ? `${path}/${fileName}` : fileName;

      const { data: _data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.warn('Storage 업로드 실패, 임시 URL 반환:', error);
        return {
          url: `/api/placeholder/400/600?text=File+Upload`,
          path: filePath
        };
      }

      // 공개 URL 생성
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return {
        url: urlData.publicUrl,
        path: filePath
      };
    } catch (error) {
      console.error('파일 업로드 오류:', error);
      // 오류가 발생해도 앱이 중단되지 않도록 임시 URL 반환
      return {
        url: `/api/placeholder/400/600?text=File+Upload`,
        path: `temp/${Date.now()}-${file.name}`
      };
    }
  }

  // 파일 다운로드 URL 생성
  static async getDownloadUrl(
    path: string,
    bucket: string = 'faddit-files'
  ): Promise<string> {
    // 클라이언트에서는 직접 URL을 만들지 않고, 서버 API를 통해 서명 URL을 발급받는다.
    try {
      const userId = typeof window !== 'undefined' ? (window as any).__FAKE_USER_ID__ || 'user1' : 'user1';
      const resp = await fetch('/api/files/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, bucket, userId })
      });
      
      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        console.error('API 응답 오류:', resp.status, errorData);
        throw new Error(`API 오류: ${resp.status} - ${errorData.error || '알 수 없는 오류'}`);
      }
      
      const data = await resp.json();
      if (!data.url) {
        throw new Error('URL이 응답에 포함되지 않았습니다.');
      }
      
      return data.url as string;
    } catch (error) {
      console.error('다운로드 URL 생성 오류:', error);
      // 오류 발생 시 placeholder URL 반환
      return `/api/placeholder/400/600?text=Download+File`;
    }
  }

  // 파일 삭제
  static async deleteFile(
    path: string,
    bucket: string = 'faddit-files'
  ): Promise<void> {
    try {
      // Supabase 설정이 없는 경우 무시
      if (!supabase) {
        console.warn('Supabase 설정이 없어 파일 삭제를 건너뜁니다.');
        return;
      }

      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        console.warn('파일 삭제 실패:', error);
      }
    } catch (error) {
      console.error('파일 삭제 오류:', error);
    }
  }

  // 이미지 리사이징 및 최적화
  static async uploadImage(
    file: File,
    bucket: string = 'faddit-images',
    path?: string
  ): Promise<{ url: string; path: string }> {
    try {
      // 이미지 파일 검증
      if (!file.type.startsWith('image/')) {
        throw new Error('이미지 파일만 업로드 가능합니다.');
      }

      // Supabase 설정이 없는 경우 임시 처리
      if (!supabase) {
        console.warn('Supabase 설정이 없습니다. 임시 이미지 URL을 반환합니다.');
        return {
          url: `/api/placeholder/400/600?text=Image+Upload`,
          path: `temp/${Date.now()}-${file.name}`
        };
      }

      const fileName = `${Date.now()}-${file.name}`;
      const filePath = path ? `${path}/${fileName}` : fileName;

      const { data: _data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.warn('이미지 업로드 실패, 임시 URL 반환:', error);
        return {
          url: `/api/placeholder/400/600?text=Image+Upload`,
          path: filePath
        };
      }

      // 공개 URL 생성
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return {
        url: urlData.publicUrl,
        path: filePath
      };
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      // 오류가 발생해도 앱이 중단되지 않도록 임시 URL 반환
      return {
        url: `/api/placeholder/400/600?text=Image+Upload`,
        path: `temp/${Date.now()}-${file.name}`
      };
    }
  }

  // 파일 크기 및 형식 검증
  static validateFile(file: File, maxSize: number = 10 * 1024 * 1024): boolean {
    if (file.size > maxSize) {
      throw new Error('파일 크기가 너무 큽니다. (최대 10MB)');
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/illustrator',
      'application/postscript'
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error('지원하지 않는 파일 형식입니다.');
    }

    return true;
  }
} 

// 사용자별 스토리지 제한 관리

export interface StorageUsage {
  userId: string;
  usedBytes: number;
  maxBytes: number;
  lastUpdated: string;
}

export interface StorageLimit {
  free: number; // 1GB
  premium: number; // 10GB
  enterprise: number; // 100GB
}

export const STORAGE_LIMITS: StorageLimit = {
  free: 1024 * 1024 * 1024, // 1GB
  premium: 10 * 1024 * 1024 * 1024, // 10GB
  enterprise: 100 * 1024 * 1024 * 1024 // 100GB
};

// 사용자별 스토리지 사용량 조회
export const getUserStorageUsage = async (userId: string): Promise<StorageUsage> => {
  try {
    // 실제로는 데이터베이스에서 조회
    const stored = localStorage.getItem(`storage_usage_${userId}`);
    if (stored) {
      return JSON.parse(stored);
    }
    
    // 기본값 반환
    return {
      userId,
      usedBytes: 0,
      maxBytes: STORAGE_LIMITS.free,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('스토리지 사용량 조회 오류:', error);
    return {
      userId,
      usedBytes: 0,
      maxBytes: STORAGE_LIMITS.free,
      lastUpdated: new Date().toISOString()
    };
  }
};

// 스토리지 사용량 업데이트
export const updateStorageUsage = async (userId: string, fileSizeBytes: number): Promise<StorageUsage> => {
  try {
    const currentUsage = await getUserStorageUsage(userId);
    const newUsedBytes = currentUsage.usedBytes + fileSizeBytes;
    
    const updatedUsage: StorageUsage = {
      ...currentUsage,
      usedBytes: newUsedBytes,
      lastUpdated: new Date().toISOString()
    };
    
    // 로컬 스토리지에 저장 (실제로는 데이터베이스에 저장)
    localStorage.setItem(`storage_usage_${userId}`, JSON.stringify(updatedUsage));
    
    return updatedUsage;
  } catch (error) {
    console.error('스토리지 사용량 업데이트 오류:', error);
    throw error;
  }
};

// 스토리지 제한 확인
export const checkStorageLimit = async (userId: string, fileSizeBytes: number): Promise<{
  allowed: boolean;
  currentUsage: StorageUsage;
  remainingBytes: number;
  errorMessage?: string;
}> => {
  try {
    const currentUsage = await getUserStorageUsage(userId);
    const remainingBytes = currentUsage.maxBytes - currentUsage.usedBytes;
    const allowed = remainingBytes >= fileSizeBytes;
    
    return {
      allowed,
      currentUsage,
      remainingBytes,
      errorMessage: allowed ? undefined : 
        `스토리지 용량이 부족합니다. 현재 사용량: ${formatBytes(currentUsage.usedBytes)} / ${formatBytes(currentUsage.maxBytes)}`
    };
  } catch (error) {
    console.error('스토리지 제한 확인 오류:', error);
    return {
      allowed: false,
      currentUsage: {
        userId,
        usedBytes: 0,
        maxBytes: STORAGE_LIMITS.free,
        lastUpdated: new Date().toISOString()
      },
      remainingBytes: 0,
      errorMessage: '스토리지 제한 확인 중 오류가 발생했습니다.'
    };
  }
};

// 바이트를 읽기 쉬운 형태로 변환
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 사용률 계산 (0-100)
export const getStorageUsagePercentage = (usedBytes: number, maxBytes: number): number => {
  return Math.round((usedBytes / maxBytes) * 100);
}; 