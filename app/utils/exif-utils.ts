import exifr from 'exifr';

/**
 * 画像ファイルからEXIF位置情報を抽出する
 * @param file 画像ファイル
 * @returns 緯度経度オブジェクト、または null（位置情報がない場合）
 */
export async function extractExifLocation(
  file: File
): Promise<{ lat: number; lng: number } | null> {
  try {
    const exifData = await exifr.parse(file, {
      gps: true,
      pick: ['latitude', 'longitude'],
    }) as { latitude?: number; longitude?: number } | undefined;

    if (exifData?.latitude && exifData?.longitude) {
      return {
        lat: exifData.latitude,
        lng: exifData.longitude,
      };
    }

    return null;
  } catch (error) {
    console.warn('EXIF extraction failed:', error);
    return null;
  }
}
