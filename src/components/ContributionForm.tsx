import { ImagePlus, Loader2, Trash2, UploadCloud, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPostWithProgress } from '../services/api';
import {
  ANONYMOUS_LABEL,
  MAX_IMAGES_PER_POST,
  MAX_MESSAGE_LENGTH,
  MAX_SENDER_NAME_LENGTH,
  type ScrapbookPost,
} from '../types/scrapbook';
import { validateAndCompressImage, type PreparedImage } from '../utils/imageCompression';

interface ContributionFormProps {
  open: boolean;
  wallId: string;
  onClose: () => void;
  onSubmitted: (post: ScrapbookPost) => void;
}

export function ContributionForm({
  open,
  wallId,
  onClose,
  onSubmitted,
}: ContributionFormProps) {
  const [images, setImages] = useState<PreparedImage[]>([]);
  const [message, setMessage] = useState('');
  const [senderName, setSenderName] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [processingImages, setProcessingImages] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, submitting, onClose]);

  if (!open) return null;

  function resetForm() {
    setImages([]);
    setMessage('');
    setSenderName('');
    setIsAnonymous(false);
    setUploadProgress(0);
    setErrorMessage(null);
  }

  async function handleFilesSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setErrorMessage(null);

    const remainingSlots = MAX_IMAGES_PER_POST - images.length;
    if (remainingSlots <= 0) {
      setErrorMessage(`Bạn đã chọn tối đa ${MAX_IMAGES_PER_POST} chiếc ảnh rồi nha!`);
      return;
    }

    const filesToProcess = Array.from(fileList).slice(0, remainingSlots);
    if (fileList.length > remainingSlots) {
      setErrorMessage(`Chỉ thêm được tối đa ${MAX_IMAGES_PER_POST} chiếc ảnh cho mỗi lần gửi nha!`);
    }

    setProcessingImages(true);
    try {
      const prepared: PreparedImage[] = [];
      for (const file of filesToProcess) {
        const compressed = await validateAndCompressImage(file);
        prepared.push(compressed);
      }
      setImages((prev) => [...prev, ...prepared]);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Không thể xử lý chiếc ảnh này, bạn thử lại nha!',
      );
    } finally {
      setProcessingImages(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  function handleRemoveImage(id: string) {
    setImages((prev) => prev.filter((img) => img.id !== id));
    setErrorMessage(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || processingImages) return;

    const trimmedMsg = message.trim();
    if (!trimmedMsg && images.length === 0) {
      setErrorMessage('Bạn gửi ít nhất một chiếc ảnh hoặc vài dòng nhắn gửi nha!');
      return;
    }

    setErrorMessage(null);
    setSubmitting(true);
    setUploadProgress(10);

    try {
      const result = await createPostWithProgress(
        wallId,
        {
          senderName: isAnonymous ? '' : senderName.trim(),
          isAnonymous,
          message: trimmedMsg,
          images: images.map((img) => img.dataUrl),
        },
        (pct) => setUploadProgress(pct),
      );

      resetForm();
      onSubmitted(result.post);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Có lỗi khi gửi chiếc thương, bạn thử lại nha!',
      );
      setUploadProgress(0);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="contribution-form-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#49363A]/45 p-3 sm:p-5 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div className="relative my-auto w-full max-w-2xl rounded-3xl border-2 border-[#49363A]/20 bg-[#FFF7F0] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Form Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#B87983]/25 bg-[#F8E4E8]/75 px-5 py-4 sm:px-7 sm:py-5 shrink-0">
          <div>
            <h2
              id="contribution-form-title"
              className="font-display text-2xl sm:text-3xl font-extrabold text-[#49363A]"
            >
              Có gì muốn thủ thỉ hông?
            </h2>
            <p className="mt-1 text-sm text-[#6E565B]">
              Chọn một chiếc ảnh, viết vài dòng hoặc gửi cả hai nha!
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Đóng biểu mẫu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#B87983]/30 bg-[#FFF7F0] text-[#49363A] hover:bg-[#F3D5DD] transition-colors shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto px-5 py-5 sm:px-7 sm:py-6 space-y-6">
          {/* SECTION A — PHOTO UPLOAD */}
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <label className="font-display text-lg font-bold text-[#49363A]">
                Chọn chiếc ảnh bạn muốn gửi
              </label>
              <span className="text-xs font-semibold text-[#8B636B] tabular-nums">
                {images.length}/{MAX_IMAGES_PER_POST} ảnh
              </span>
            </div>
            <p className="mt-0.5 text-xs sm:text-sm text-[#6E565B]">
              Những khoảnh khắc xinh xắn của bạn sẽ được lưu lại ở đây.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              onChange={(e) => handleFilesSelected(e.target.files)}
              className="sr-only"
              id="scrapbook-photo-input"
            />

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleFilesSelected(e.dataTransfer.files);
              }}
              className={`mt-3 rounded-2xl border-2 border-dashed p-5 text-center transition-colors ${
                isDragging
                  ? 'border-[#B87983] bg-[#F3D5DD]/50'
                  : 'border-[#B87983]/45 bg-[#F8E4E8]/40'
              }`}
            >
              {images.length === 0 ? (
                <div className="flex flex-col items-center gap-2.5 py-2">
                  <UploadCloud className="h-8 w-8 text-[#B87983]" />
                  <p className="text-sm font-semibold text-[#49363A]/85">
                    Thả những chiếc ảnh xinh xắn vào đây nha!
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={processingImages || submitting}
                    className="mt-1 inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#B87983]/50 bg-[#FFF7F0] px-4 py-2 text-sm font-bold text-[#49363A] shadow-xs hover:bg-[#F3D5DD]/60 transition-colors"
                  >
                    <ImagePlus className="h-4 w-4 text-[#9E5D68]" />
                    {processingImages ? 'Đang chuẩn bị ảnh...' : 'Chọn ảnh từ thiết bị'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {images.map((img) => (
                      <div
                        key={img.id}
                        className="group relative overflow-hidden rounded-xl border border-[#B87983]/35 bg-[#FFFFFF] p-1.5 shadow-xs"
                      >
                        <img
                          src={img.previewUrl}
                          alt={img.name}
                          className="h-28 w-full object-contain rounded-lg bg-[#FFF7F0]"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(img.id)}
                          disabled={submitting}
                          aria-label={`Xóa ảnh ${img.name}`}
                          className="absolute top-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#49363A]/85 text-[#FFF7F0] hover:bg-[#49363A] transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {images.length < MAX_IMAGES_PER_POST && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={processingImages || submitting}
                      className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#B87983]/50 bg-[#FFF7F0] px-4 py-2 text-xs sm:text-sm font-bold text-[#49363A] hover:bg-[#F3D5DD]/60 transition-colors"
                    >
                      <ImagePlus className="h-4 w-4 text-[#9E5D68]" />
                      {processingImages ? 'Đang chuẩn bị ảnh...' : 'Chọn ảnh từ thiết bị'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* SECTION B — WISH MESSAGE */}
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <label
                htmlFor="scrapbook-message"
                className="font-display text-lg font-bold text-[#49363A]"
              >
                Muốn nhắn gửi điều gì hông?
              </label>
              <span
                className={`text-xs font-semibold tabular-nums ${
                  message.length > MAX_MESSAGE_LENGTH * 0.9 ? 'text-[#9E4556]' : 'text-[#8B636B]'
                }`}
              >
                {message.length}/{MAX_MESSAGE_LENGTH}
              </span>
            </div>
            <textarea
              id="scrapbook-message"
              rows={4}
              maxLength={MAX_MESSAGE_LENGTH}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="Viết vài dòng cho nhà mình đi..."
              disabled={submitting}
              className="mt-2 w-full rounded-2xl border border-[#B87983]/45 bg-[#FFFFFF] px-4 py-3 text-base text-[#49363A] placeholder:text-[#9A7F84] focus:border-[#49363A] focus:outline-none focus:ring-2 focus:ring-[#E8B6C2] resize-y"
            />
          </div>

          {/* SECTION C — SENDER IDENTITY */}
          <div className="rounded-2xl border border-[#B87983]/25 bg-[#F8E4E8]/45 p-4 sm:p-5">
            <label
              htmlFor="scrapbook-sender"
              className="block font-display text-lg font-bold text-[#49363A]"
            >
              Ai gửi chiếc thương này vậy ta?
            </label>

            <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3">
              <input
                id="scrapbook-sender"
                type="text"
                maxLength={MAX_SENDER_NAME_LENGTH}
                value={isAnonymous ? '' : senderName}
                onChange={(e) => setSenderName(e.target.value)}
                disabled={isAnonymous || submitting}
                placeholder={isAnonymous ? ANONYMOUS_LABEL : 'Để lại tên của bạn nha'}
                className="flex-1 min-h-11 rounded-xl border border-[#B87983]/45 bg-[#FFFFFF] px-4 py-2.5 text-sm sm:text-base text-[#49363A] placeholder:text-[#9A7F84] disabled:bg-[#F3D5DD]/50 disabled:text-[#6E565B] focus:border-[#49363A] focus:outline-none focus:ring-2 focus:ring-[#E8B6C2]"
              />

              <label className="inline-flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl border border-[#B87983]/40 bg-[#FFF7F0] px-4 py-2 text-sm font-bold text-[#49363A] select-none shrink-0">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  disabled={submitting}
                  className="h-4.5 w-4.5 rounded border-[#B87983] accent-[#B87983]"
                />
                <span>Gửi ẩn danh</span>
              </label>
            </div>

            {isAnonymous && (
              <p className="mt-2.5 text-xs sm:text-sm font-semibold text-[#8A4A56]">
                Tên hiển thị trên bức tường sẽ là:{' '}
                <span className="underline decoration-[#E8B6C2] decoration-2">
                  {ANONYMOUS_LABEL}
                </span>
              </p>
            )}
          </div>

          {/* Validation / Upload Error */}
          {errorMessage && (
            <div
              role="alert"
              className="rounded-xl border border-[#C77082] bg-[#FDECEF] px-4 py-3 text-sm font-semibold text-[#8A2E42]"
            >
              {errorMessage}
            </div>
          )}

          {/* Upload Progress Bar */}
          {submitting && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-[#49363A]">
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#B87983]" />
                  Đang gửi chiếc thương...
                </span>
                <span className="tabular-nums">{uploadProgress}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#F3D5DD]">
                <div
                  className="h-full rounded-full bg-[#B87983] transition-all duration-150"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* SECTION D — SUBMISSION BUTTONS */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-2 border-t border-[#B87983]/20">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="w-full sm:w-auto min-h-11 rounded-xl border border-[#B87983]/45 bg-[#FFF7F0] px-5 py-2.5 text-sm font-bold text-[#49363A] hover:bg-[#F8E4E8] transition-colors disabled:opacity-50"
            >
              Thôi, để mình nghĩ thêm
            </button>

            <button
              type="submit"
              disabled={submitting || processingImages}
              className="w-full sm:w-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border-2 border-[#49363A] bg-[#E8B6C2] px-6 py-2.5 text-sm sm:text-base font-extrabold text-[#49363A] shadow-[0_3px_0_#49363A] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#E1A6B5] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang gửi chiếc thương...
                </>
              ) : (
                'Gửi chiếc thương này ♡'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
