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
          url: `https://via.placeholder.com/400x600/cccccc/666666?text=File+Upload`,
          path: `temp/${Date.now()}-${file.name}`
        };
      }

      const fileName = `${Date.now()}-${file.name}`;
      const filePath = path ? `${path}/${fileName}` : fileName;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.warn('Storage 업로드 실패, 임시 URL 반환:', error);
        return {
          url: `https://via.placeholder.com/400x600/cccccc/666666?text=File+Upload`,
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
        url: `https://via.placeholder.com/400x600/cccccc/666666?text=File+Upload`,
        path: `temp/${Date.now()}-${file.name}`
      };
    }
  }

  // 파일 다운로드 URL 생성
  static async getDownloadUrl(
    path: string,
    bucket: string = 'faddit-files'
  ): Promise<string> {
    try {
      // Supabase 설정이 없는 경우 임시 처리
      if (!supabase) {
        return `https://via.placeholder.com/400x600/cccccc/666666?text=Download+File`;
      }

      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 3600); // 1시간 유효

      if (error) {
        console.warn('다운로드 URL 생성 실패:', error);
        return `https://via.placeholder.com/400x600/cccccc/666666?text=Download+File`;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('다운로드 URL 생성 오류:', error);
      return `https://via.placeholder.com/400x600/cccccc/666666?text=Download+File`;
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
          url: `https://via.placeholder.com/400x600/cccccc/666666?text=Image+Upload`,
          path: `temp/${Date.now()}-${file.name}`
        };
      }

      const fileName = `${Date.now()}-${file.name}`;
      const filePath = path ? `${path}/${fileName}` : fileName;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.warn('이미지 업로드 실패, 임시 URL 반환:', error);
        return {
          url: `https://via.placeholder.com/400x600/cccccc/666666?text=Image+Upload`,
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
        url: `https://via.placeholder.com/400x600/cccccc/666666?text=Image+Upload`,
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