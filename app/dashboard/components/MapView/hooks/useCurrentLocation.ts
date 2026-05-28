import { useState, useEffect } from 'react';

export interface CurrentLocation {
  lat: number;
  lng: number;
}

export interface UseCurrentLocationResult {
  location: CurrentLocation | null;
  error: string | null;
  loading: boolean;
}

export function useCurrentLocation(): UseCurrentLocationResult {
  const [location, setLocation] = useState<CurrentLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Geolocation APIが利用可能かチェック
    if (!('geolocation' in navigator)) {
      setError('このブラウザでは位置情報がサポートされていません');
      setLoading(false);
      return;
    }

    // 位置情報を取得
    const fetchLocation = async () => {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });
        });

        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setError(null);
      } catch (err) {
        // エラーの種類を判定
        if (err instanceof GeolocationPositionError) {
          switch (err.code) {
            case err.PERMISSION_DENIED:
              setError('位置情報の使用が拒否されました');
              break;
            case err.POSITION_UNAVAILABLE:
              setError('位置情報を取得できませんでした');
              break;
            case err.TIMEOUT:
              setError('位置情報の取得がタイムアウトしました');
              break;
            default:
              setError('位置情報の取得に失敗しました');
          }
        } else {
          setError('位置情報の取得に失敗しました');
        }
        console.warn('位置情報取得エラー:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLocation();
  }, []);

  return { location, error, loading };
}
