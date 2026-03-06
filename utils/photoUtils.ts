/**
 * Web で blob URL を data URL に変換する（保存後にリロードしても画像を表示するため）
 */
export async function blobUrlToDataUrl(blobUrl: string): Promise<string> {
  const res = await fetch(blobUrl);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export function isBlobUrl(uri: string | undefined): boolean {
  return typeof uri === 'string' && uri.startsWith('blob:');
}

/**
 * 保存済みの photoUri を表示してよいか。
 * Web では blob URL はリロード後に無効なので表示しない。
 */
export function isDisplayablePhotoUri(uri: string | undefined): boolean {
  if (!uri || typeof uri !== 'string') return false;
  if (uri.startsWith('blob:')) return false;
  return true;
}
