// lib/upload-image.ts
import { createClient } from '@/lib/supabase-browser';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

export function validateImageFile(file: File, maxSizeMB: number): { valid: boolean; error?: string } {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Please upload a JPEG, PNG, or WebP image'
    };
  }

  const fileExt = file.name.split('.').pop()?.toLowerCase();
  if (!fileExt || !ALLOWED_IMAGE_EXTENSIONS.includes(fileExt)) {
    return {
      valid: false,
      error: 'Please upload a JPEG, PNG, or WebP image'
    };
  }

  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > maxSizeMB) {
    return {
      valid: false,
      error: `Image must be less than ${maxSizeMB}MB (current: ${fileSizeMB.toFixed(1)}MB)`
    };
  }

  return { valid: true };
}

export async function uploadImage(
  file: File,
  bucket: string = 'store-assets',
  folder: string = '',
  isPublicBucket: boolean = false
): Promise<{ url: string; path: string } | null> {
  try {
    // Create browser client that can read cookies
    const supabase = createClient();
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('You must be logged in to upload images');
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    let imageUrl: string;

    if (isPublicBucket) {
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);
      imageUrl = publicUrl;
    } else {
      const { data: signedData, error: signedError } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, 31536000);

      if (signedError) {
        throw signedError;
      }
      imageUrl = signedData.signedUrl;
    }

    return {
      url: imageUrl,
      path: filePath
    };
  } catch (error: any) {
    console.error('Upload error:', error);
    throw new Error(error.message || 'Failed to upload image');
  }
}

export async function deleteImage(
  path: string,
  bucket: string = 'store-assets'
): Promise<boolean> {
  try {
    const supabase = createClient();
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('You must be logged in to delete images');
    }

    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
}

export async function getSignedUrl(
  path: string,
  bucket: string = 'store-assets',
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error('Signed URL error:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Signed URL error:', error);
    return null;
  }
}