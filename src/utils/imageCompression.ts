const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_RAW_FILE_SIZE = 15 * 1024 * 1024; // 15MB before compression
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB Supabase Storage limit
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.84;

export interface PreparedImage {
  id: string;
  name: string;
  previewUrl: string;
  blob: Blob;
  mimeType: string;
  width: number;
  height: number;
  sizeBytes: number;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Không thể đọc tệp ảnh này.'));
    reader.readAsDataURL(file);
  });
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Tệp ảnh bị lỗi hoặc không hợp lệ.'));
    img.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Không thể nén tệp ảnh này.'));
        }
      },
      mimeType,
      quality,
    );
  });
}

export async function validateAndCompressImage(file: File): Promise<PreparedImage> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error(
      `Ảnh "${file.name}" chưa đúng định dạng. Chỉ hỗ trợ JPG, PNG, WebP hoặc GIF nha!`,
    );
  }
  if (file.size > MAX_RAW_FILE_SIZE) {
    throw new Error(`Ảnh "${file.name}" hơi nặng quá (trên 15MB). Bạn chọn ảnh nhẹ hơn xíu nha!`);
  }

  const originalDataUrl = await readFileAsDataUrl(file);
  const img = await loadImageElement(originalDataUrl);
  const id = `img-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  // Keep animated GIFs untouched if within Supabase 5MB cap
  if (file.type === 'image/gif' && file.size <= MAX_UPLOAD_BYTES) {
    return {
      id,
      name: file.name,
      previewUrl: originalDataUrl,
      blob: file,
      mimeType: 'image/gif',
      width: img.naturalWidth,
      height: img.naturalHeight,
      sizeBytes: file.size,
    };
  }

  // Preserve exact original aspect ratio while downscaling very large images
  let targetWidth = img.naturalWidth;
  let targetHeight = img.naturalHeight;

  if (targetWidth > MAX_DIMENSION || targetHeight > MAX_DIMENSION) {
    if (targetWidth >= targetHeight) {
      targetHeight = Math.round((targetHeight * MAX_DIMENSION) / targetWidth);
      targetWidth = MAX_DIMENSION;
    } else {
      targetWidth = Math.round((targetWidth * MAX_DIMENSION) / targetHeight);
      targetHeight = MAX_DIMENSION;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new Error(`Ảnh "${file.name}" vượt quá 5MB và không thể nén trên trình duyệt này.`);
    }
    return {
      id,
      name: file.name,
      previewUrl: originalDataUrl,
      blob: file,
      mimeType: file.type,
      width: img.naturalWidth,
      height: img.naturalHeight,
      sizeBytes: file.size,
    };
  }

  const outputMime =
    file.type === 'image/png' && file.size < 1.2 * 1024 * 1024 ? 'image/png' : 'image/jpeg';

  if (outputMime === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  let blob = await canvasToBlob(
    canvas,
    outputMime,
    outputMime === 'image/jpeg' ? JPEG_QUALITY : undefined,
  );
  let finalMime = outputMime;

  if (blob.size > MAX_UPLOAD_BYTES - 150 * 1024) {
    blob = await canvasToBlob(canvas, 'image/jpeg', 0.72);
    finalMime = 'image/jpeg';
  }

  if (blob.size > MAX_UPLOAD_BYTES) {
    throw new Error(`Ảnh "${file.name}" vẫn vượt quá 5MB sau khi nén. Bạn chọn ảnh nhẹ hơn nha!`);
  }

  const previewUrl = URL.createObjectURL(blob);

  return {
    id,
    name: file.name,
    previewUrl,
    blob,
    mimeType: finalMime,
    width: targetWidth,
    height: targetHeight,
    sizeBytes: blob.size,
  };
}
