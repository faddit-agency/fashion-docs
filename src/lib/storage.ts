import { supabase } from './supabase';


export class StorageService {
  // 파일 업로드
  static async uploadFile(
    file: File,
    bucket: string = 'faddit-files', // drawings에서 faddit-files로 변경
    path?: string
  ): Promise<{ url: string; path: string }> {
    try {
      // AI 파일인 경우 PNG로 변환하여 업로드
      const fileExtension = file.name.toLowerCase().split('.').pop();
      if (fileExtension === 'ai') {
        return await this.convertAiToSvgAndUpload(file, bucket, path);
      }

      // 모든 파일을 서버 API를 통해 업로드 (RLS 문제 우회)
      return await this.uploadFileViaServer(file, bucket, path);
    } catch (error) {
      console.error('파일 업로드 오류:', error);
      throw error; // 에러를 상위로 전파
    }
  }

  // 파일을 직접 업로드
  private static async uploadFileDirectly(
    file: File,
    bucket: string = 'drawings',
    path?: string
  ): Promise<{ url: string; path: string }> {
    // Supabase 설정이 없는 경우 에러 발생
    if (!supabase) {
      console.error('Supabase가 설정되지 않았습니다. .env.local 파일을 확인하세요.');
      throw new Error('Supabase 설정이 필요합니다. 환경변수를 확인하세요.');
    }

    // 파일명에서 특수문자 제거 및 안전한 파일명 생성
    const safeFileName = file.name
      .replace(/[^a-zA-Z0-9.-]/g, '_') // 특수문자를 언더스코어로 변경
      .replace(/_{2,}/g, '_') // 연속된 언더스코어를 하나로
      .replace(/^_|_$/g, ''); // 앞뒤 언더스코어 제거
    
    const fileName = `${Date.now()}-${safeFileName}`;
    const filePath = path ? `${path}/${fileName}` : fileName;
    
    console.log('업로드 파일 정보:', {
      originalName: file.name,
      safeName: safeFileName,
      filePath: filePath,
      fileSize: file.size,
      mimeType: file.type
    });

    const { data: _data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Supabase Storage 업로드 실패:', error);
      throw new Error(`파일 업로드 실패: ${error.message}`);
    }

    // 공개 URL 생성
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return {
      url: urlData.publicUrl,
      path: filePath
    };
  }

  // 서버를 통한 파일 업로드 (AI/EPS 파일용)
  private static async uploadFileViaServer(
    file: File,
    bucket: string = 'drawings',
    path?: string
  ): Promise<{ url: string; path: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', bucket);
      if (path) {
        formData.append('path', path);
      }

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData
      });

      // 응답 상태 확인
      if (!response.ok) {
        let errorMessage = '서버 업로드 실패';
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          // JSON 파싱 실패 시 텍스트로 읽기 시도
          try {
            const textResponse = await response.text();
            console.error('서버 응답 (텍스트):', textResponse);
            errorMessage = `서버 오류 (${response.status}): ${textResponse.substring(0, 100)}`;
          } catch (textError) {
            errorMessage = `서버 오류 (${response.status}): 응답을 읽을 수 없습니다.`;
          }
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || '서버 업로드 실패');
      }

      return {
        url: data.url,
        path: data.path
      };
    } catch (error) {
      console.error('서버 업로드 오류:', error);
      
      // PDF 파일인 경우 이미지로 변환하여 업로드 시도
      const fileExtension = file.name.toLowerCase().split('.').pop();
      if (fileExtension === 'pdf') {
        console.log('PDF 파일을 이미지로 변환하여 업로드를 시도합니다.');
        return await this.convertPdfToImageAndUpload(file, bucket, path);
      }
      
      throw error;
    }
  }

  // PDF를 이미지로 변환하여 업로드
  private static async convertPdfToImageAndUpload(
    file: File,
    bucket: string = 'drawings',
    path?: string
  ): Promise<{ url: string; path: string }> {
    try {
      // PDF를 이미지로 변환하는 API 호출
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', bucket);
      if (path) {
        formData.append('path', path);
      }

      const response = await fetch('/api/files/convert', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'PDF 변환 실패');
      }

      const data = await response.json();
      return {
        url: data.url,
        path: data.path
      };
    } catch (error) {
      console.error('PDF 변환 오류:', error);
      throw new Error('PDF 파일 처리에 실패했습니다. 다른 형식의 파일을 시도해주세요.');
    }
  }

  // AI 파일을 PNG로 변환하여 업로드
  static async convertAiToSvgAndUpload(
    file: File,
    bucket: string = 'faddit-files', // drawings에서 faddit-files로 변경
    path?: string
  ): Promise<{ url: string; path: string }> {
    try {
      console.log('AI 파일 PNG 변환 시작:', file.name, file.size, 'bytes');
      
      // AI 파일을 PNG로 변환하는 API 호출
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', bucket);
      if (path) {
        formData.append('path', path);
      }

      console.log('AI 파일 변환 API 호출...');
      const response = await fetch('/api/files/convert-ai-to-svg', {
        method: 'POST',
        body: formData
      });

      console.log('API 응답 상태:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('AI 파일 변환 API 오류:', errorData);
        throw new Error(errorData.error || 'AI 파일 PNG 변환 실패');
      }

      const data = await response.json();
      console.log('AI 파일 변환 성공:', data);
      
      return {
        url: data.url,
        path: data.path
      };
    } catch (error) {
      console.error('AI 파일 PNG 변환 오류:', error);
      throw new Error('AI 파일 PNG 변환에 실패했습니다. 다른 형식의 파일을 시도해주세요.');
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

      // 파일명에서 특수문자 제거 및 안전한 파일명 생성
      const safeFileName = file.name
        .replace(/[^a-zA-Z0-9.-]/g, '_') // 특수문자를 언더스코어로 변경
        .replace(/_{2,}/g, '_') // 연속된 언더스코어를 하나로
        .replace(/^_|_$/g, ''); // 앞뒤 언더스코어 제거
      
      const fileName = `${Date.now()}-${safeFileName}`;
      const filePath = path ? `${path}/${fileName}` : fileName;
      
      console.log('이미지 업로드 파일 정보:', {
        originalName: file.name,
        safeName: safeFileName,
        filePath: filePath,
        fileSize: file.size
      });

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

    // AI/EPS 파일의 경우 MIME 타입이 정확하지 않을 수 있으므로 확장자로도 확인
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/illustrator',
      'application/postscript',
      'application/octet-stream', // AI 파일이 이 타입으로 인식될 수 있음
      'application/x-illustrator', // AI 파일의 다른 MIME 타입
      'application/x-postscript', // EPS 파일의 다른 MIME 타입
      'application/vnd.adobe.illustrator' // AI 파일의 공식 MIME 타입
    ];

    const fileExtension = file.name.toLowerCase().split('.').pop();
    const allowedExtensions = ['ai', 'eps', 'pdf', 'jpg', 'jpeg', 'png', 'gif'];

    // AI/EPS 파일의 경우 MIME 타입을 무시하고 확장자로만 확인
    if (fileExtension === 'ai' || fileExtension === 'eps') {
      return true;
    }

    // MIME 타입 또는 확장자로 확인
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension || '')) {
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