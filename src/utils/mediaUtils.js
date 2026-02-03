/**
 * Chuẩn hóa URL ảnh/video: chuyển http sang https khi trang chạy trên HTTPS
 * (Mixed Content: trình duyệt chặn tải http trên trang https)
 */
export function normalizeMediaUrl(url) {
  if (typeof url !== 'string' || !url.trim()) return url;
  if (typeof window !== 'undefined' && window.location?.protocol === 'https:' && url.startsWith('http:')) {
    return url.replace(/^http:/, 'https:');
  }
  return url;
}
