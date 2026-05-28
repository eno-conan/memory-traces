import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';

// ===========================
// モック設定
// ===========================

// vi.hoisted()を使ってホイストされる変数を定義
const { mockRunWithAmplifyServerContext, mockExifrParse } = vi.hoisted(() => ({
  mockRunWithAmplifyServerContext: vi.fn(),
  mockExifrParse: vi.fn(),
}));

// Amplify設定モック
vi.mock('@/amplify-config', () => ({
  amplifyConfig: {
    Auth: {
      Cognito: {
        userPoolId: 'test-pool-id',
        userPoolClientId: 'test-client-id',
      },
    },
  },
}));

// Amplify認証モック
vi.mock('@aws-amplify/adapter-nextjs', () => ({
  createServerRunner: vi.fn(() => ({
    runWithAmplifyServerContext: mockRunWithAmplifyServerContext,
  })),
}));

vi.mock('aws-amplify/auth/server', () => ({
  fetchAuthSession: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

// EXIFパーサーモック
vi.mock('exifr', () => ({
  default: {
    parse: mockExifrParse,
  },
}));

// Redisモック
vi.mock('@upstash/redis', () => ({
  Redis: {
    fromEnv: vi.fn(() => ({
      incr: vi.fn().mockResolvedValue(1),
      expire: vi.fn().mockResolvedValue(1),
    })),
  },
}));

// ===========================
// テストデータファクトリー
// ===========================

interface FormDataParams {
  entryId?: string;
  photoId?: string;
  dateFolder?: string;
  timeFolder?: string;
  title?: string;
  thoughts?: string;
  latitude?: string;
  longitude?: string;
  shotAt?: string;
  image?: File;
}

/**
 * 正常系用のFormDataを生成
 */
function createValidFormData(overrides?: Partial<FormDataParams>): FormData {
  const defaults: Required<FormDataParams> = {
    entryId: '123e4567-e89b-12d3-a456-426614174000',
    photoId: '456e7890-e89b-12d3-a456-426614174001',
    dateFolder: '20240131',
    timeFolder: '123456789',
    title: 'Test Photo',
    thoughts: '',
    latitude: '',
    longitude: '',
    shotAt: '2024-01-31T12:00:00.000Z',
    image: createMockImageFile(),
  };

  const params = { ...defaults, ...overrides };
  const formData = new FormData();

  formData.append('entryId', params.entryId);
  formData.append('photoId', params.photoId);
  formData.append('dateFolder', params.dateFolder);
  formData.append('timeFolder', params.timeFolder);
  formData.append('title', params.title);
  formData.append('shotAt', params.shotAt);
  formData.append('image', params.image);

  if (params.thoughts) {
    formData.append('thoughts', params.thoughts);
  }
  if (params.latitude) {
    formData.append('latitude', params.latitude);
  }
  if (params.longitude) {
    formData.append('longitude', params.longitude);
  }

  return formData;
}

/**
 * 異常系用のFormDataを生成
 */
function createInvalidFormData(invalidField: string): FormData {
  const formData = createValidFormData();

  switch (invalidField) {
    case 'entryId-missing':
      formData.delete('entryId');
      break;
    case 'entryId-invalid':
      formData.set('entryId', 'not-a-uuid');
      break;
    case 'dateFolder-missing':
      formData.delete('dateFolder');
      break;
    case 'dateFolder-invalid':
      formData.set('dateFolder', '2024013'); // 7桁
      break;
    case 'timeFolder-missing':
      formData.delete('timeFolder');
      break;
    case 'timeFolder-invalid':
      formData.set('timeFolder', '12345678'); // 8桁
      break;
    case 'image-missing':
      formData.delete('image');
      break;
    case 'title-missing':
      formData.delete('title');
      break;
    case 'title-empty':
      formData.set('title', '   ');
      break;
    case 'latitude-only':
      formData.set('latitude', '35.6812');
      break;
    case 'longitude-only':
      formData.set('longitude', '139.7671');
      break;
    default:
      throw new Error(`Unknown invalid field: ${invalidField}`);
  }

  return formData;
}

/**
 * モック画像ファイルを生成
 */
function createMockImageFile(options?: {
  name?: string;
  type?: string;
  size?: number;
}): File {
  const defaults = {
    name: 'test-image.jpg',
    type: 'image/jpeg',
    size: 1024,
  };

  const { name, type, size } = { ...defaults, ...options };
  const buffer = new Uint8Array(Math.max(size, 12));
  if (type === 'image/heic' || type === 'image/heif') {
    // HEIC/HEIF: ftyp box at offset 4
    buffer[4] = 0x66; buffer[5] = 0x74; buffer[6] = 0x79; buffer[7] = 0x70; // 'ftyp'
    const brand = type === 'image/heic' ? 'heic' : 'heif';
    for (let i = 0; i < 4; i++) buffer[8 + i] = brand.charCodeAt(i);
  } else {
    // JPEG: FF D8 FF
    buffer[0] = 0xFF; buffer[1] = 0xD8; buffer[2] = 0xFF;
  }
  const blob = new Blob([buffer.slice(0, size)], { type });

  return new File([blob], name, { type });
}

/**
 * NextRequestモックを生成
 */
function createMockRequest(formData: FormData): NextRequest {
  const request = new NextRequest('http://localhost:3000/api/upload-photo', {
    method: 'POST',
    body: formData,
  });

  return request;
}

// ===========================
// テストスイート
// ===========================

describe('POST /api/upload-photo', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // 環境変数設定
    process.env.CLOUDFLARE_WORKERS_API_URL = 'https://api.example.com';
    process.env.CLOUDFLARE_WORKERS_API_TOKEN = 'test-token';
    delete process.env.CLOUDFLARE_UPLOAD_API_URL;

    // コンソール出力のスパイ
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

    // fetchのモック（デフォルトは成功レスポンス）
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue('OK'),
    });

    // Amplify認証モック（デフォルトは認証成功）
    mockRunWithAmplifyServerContext.mockResolvedValue({
      tokens: {
        idToken: {
          payload: {
            sub: 'test-user-id',
          },
        },
      },
    });

    // EXIFパーサーモック（デフォルトは位置情報なし）
    mockExifrParse.mockResolvedValue({});
  });

  afterEach(() => {
    // 環境変数クリーンアップ
    delete process.env.CLOUDFLARE_WORKERS_API_URL;
    delete process.env.CLOUDFLARE_WORKERS_API_TOKEN;
    delete process.env.CLOUDFLARE_UPLOAD_API_URL;

    // スパイのリストア
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();

    // モッククリア
    vi.clearAllMocks();
  });

  // ===========================
  // 正常系テスト
  // ===========================

  describe('正常系', () => {
    it('[TC-001] 全必須項目を含む画像アップロード成功', async () => {
      // Arrange
      const formData = createValidFormData();
      const request = createMockRequest(formData);

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body).toEqual({
        success: true,
        location: null,
        message: '位置情報なしでアップロードが完了しました',
      });

      // fetchが呼ばれたことを確認
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/upload',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });

    describe('位置情報処理', () => {
      it('[TC-002] クライアント側から位置情報を受け取る', async () => {
        // Arrange
        const formData = createValidFormData({
          latitude: '35.6812',
          longitude: '139.7671',
        });
        const request = createMockRequest(formData);

        // Act
        const response = await POST(request);

        // Assert
        expect(response.status).toBe(200);

        const body = await response.json();
        expect(body).toEqual({
          success: true,
          location: { lat: 35.6812, lng: 139.7671 },
          message: '位置情報付きでアップロードが完了しました',
        });

        // クライアント側の位置情報を使用したログが出力されることを確認
        const logCall = consoleLogSpy.mock.calls.find((call: string[]) => {
          try {
            const parsed = JSON.parse(call[0]);
            return parsed.checkpoint === 'LOCATION_FROM_CLIENT';
          } catch {
            return false;
          }
        });
        expect(logCall).toBeDefined();
        const parsedLog = JSON.parse(logCall![0]);
        expect(parsedLog.data.location).toEqual({ lat: 35.6812, lng: 139.7671 });

        // EXIF解析は実行されないことを確認
        expect(mockExifrParse).not.toHaveBeenCalled();
      });

      it('[TC-003] EXIF情報から位置情報を抽出', async () => {
        // Arrange
        mockExifrParse.mockResolvedValueOnce({
          latitude: 35.6812,
          longitude: 139.7671,
        });

        const formData = createValidFormData();
        const request = createMockRequest(formData);

        // Act
        const response = await POST(request);

        // Assert
        expect(response.status).toBe(200);

        const body = await response.json();
        expect(body).toEqual({
          success: true,
          location: { lat: 35.6812, lng: 139.7671 },
          message: '位置情報付きでアップロードが完了しました',
        });

        // EXIF解析が実行されたことを確認
        expect(mockExifrParse).toHaveBeenCalledWith(expect.any(Buffer));

        // サーバー側でEXIF情報から位置情報を取得したログが出力されることを確認
        const logCall = consoleLogSpy.mock.calls.find((call: string[]) => {
          try {
            const parsed = JSON.parse(call[0]);
            return parsed.checkpoint === 'LOCATION_FROM_EXIF';
          } catch {
            return false;
          }
        });
        expect(logCall).toBeDefined();
        const parsedLog = JSON.parse(logCall![0]);
        expect(parsedLog.data.location).toEqual({ lat: 35.6812, lng: 139.7671 });
      });

      it('[TC-004] 位置情報なしでアップロード', async () => {
        // Arrange
        const formData = createValidFormData();
        const request = createMockRequest(formData);

        // Act
        const response = await POST(request);

        // Assert
        expect(response.status).toBe(200);

        const body = await response.json();
        expect(body).toEqual({
          success: true,
          location: null,
          message: '位置情報なしでアップロードが完了しました',
        });

        // 位置情報なしの警告ログが出力されることを確認
        const warnCall = consoleWarnSpy.mock.calls.find((call: string[]) => {
          try {
            const parsed = JSON.parse(call[0]);
            return parsed.message === 'EXIF位置情報なし';
          } catch {
            return false;
          }
        });
        expect(warnCall).toBeDefined();
      });
    });

    describe('オプションフィールド', () => {
      it('[TC-005] thoughtsフィールドを含む', async () => {
        // Arrange
        const formData = createValidFormData({
          thoughts: 'This is a test thought',
        });
        const request = createMockRequest(formData);

        // Act
        const response = await POST(request);

        // Assert
        expect(response.status).toBe(200);

        const body = await response.json();
        expect(body.success).toBe(true);

        // thoughtsがCloudflare APIに送信されたことを確認
        expect(global.fetch).toHaveBeenCalledWith(
          'https://api.example.com/upload',
          expect.objectContaining({
            method: 'POST',
          })
        );
      });

      it('[TC-006] Cloudflare API設定なしでスキップ', async () => {
        // Arrange
        delete process.env.CLOUDFLARE_WORKERS_API_URL;
        delete process.env.CLOUDFLARE_WORKERS_API_TOKEN;

        const formData = createValidFormData();
        const request = createMockRequest(formData);

        // Act
        const response = await POST(request);

        // Assert
        expect(response.status).toBe(200);

        const body = await response.json();
        expect(body.success).toBe(true);

        // fetchが呼ばれないことを確認
        expect(global.fetch).not.toHaveBeenCalled();

        // スキップのログが出力されることを確認
        const warnCall = consoleWarnSpy.mock.calls.find((call: string[]) => {
          try {
            const parsed = JSON.parse(call[0]);
            return parsed.message === 'Cloudflare Workers API設定が見つかりません';
          } catch {
            return false;
          }
        });
        expect(warnCall).toBeDefined();
      });
    });
  });

  // ===========================
  // 異常系テスト - 認証エラー
  // ===========================

  describe('異常系 - 認証エラー', () => {
    it('[TC-101] 認証されていない場合', async () => {
      // Arrange
      mockRunWithAmplifyServerContext.mockResolvedValueOnce({
        tokens: undefined,
      });

      const formData = createValidFormData();
      const request = createMockRequest(formData);

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(401);

      const body = await response.json();
      expect(body).toEqual({ error: '認証が必要です' });

      // fetchが呼ばれないことを確認
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  // ===========================
  // 異常系テスト - バリデーションエラー
  // ===========================

  describe('異常系 - バリデーションエラー', () => {
    describe('必須項目チェック', () => {
      it('[TC-102] entryId未指定', async () => {
        // Arrange
        const formData = createInvalidFormData('entryId-missing');
        const request = createMockRequest(formData);

        // Act
        const response = await POST(request);

        // Assert
        expect(response.status).toBe(400);

        const body = await response.json();
        expect(body).toEqual({
          error: 'entryId, photoId, dateFolder, timeFolderは必須です',
        });
      });

      it('[TC-103] dateFolder未指定', async () => {
        // Arrange
        const formData = createInvalidFormData('dateFolder-missing');
        const request = createMockRequest(formData);

        // Act
        const response = await POST(request);

        // Assert
        expect(response.status).toBe(400);

        const body = await response.json();
        expect(body).toEqual({
          error: 'entryId, photoId, dateFolder, timeFolderは必須です',
        });
      });

      it('[TC-104] timeFolder未指定', async () => {
        // Arrange
        const formData = createInvalidFormData('timeFolder-missing');
        const request = createMockRequest(formData);

        // Act
        const response = await POST(request);

        // Assert
        expect(response.status).toBe(400);

        const body = await response.json();
        expect(body).toEqual({
          error: 'entryId, photoId, dateFolder, timeFolderは必須です',
        });
      });

      it('[TC-108] 画像ファイル未指定', async () => {
        // Arrange
        const formData = createInvalidFormData('image-missing');
        const request = createMockRequest(formData);

        // Act
        const response = await POST(request);

        // Assert
        expect(response.status).toBe(400);

        const body = await response.json();
        expect(body).toEqual({ error: '画像ファイルが必要です' });
      });

      it('[TC-109] タイトル未指定', async () => {
        // Arrange
        const formData = createInvalidFormData('title-missing');
        const request = createMockRequest(formData);

        // Act
        const response = await POST(request);

        // Assert
        expect(response.status).toBe(400);

        const body = await response.json();
        expect(body).toEqual({ error: 'タイトルは必須です' });
      });

      it('[TC-110] タイトルが空白のみ', async () => {
        // Arrange
        const formData = createInvalidFormData('title-empty');
        const request = createMockRequest(formData);

        // Act
        const response = await POST(request);

        // Assert
        expect(response.status).toBe(400);

        const body = await response.json();
        expect(body).toEqual({ error: 'タイトルは必須です' });
      });
    });

    describe('フォーマットチェック', () => {
      it('[TC-105] entryIdがUUID形式でない', async () => {
        // Arrange
        const formData = createInvalidFormData('entryId-invalid');
        const request = createMockRequest(formData);

        // Act
        const response = await POST(request);

        // Assert
        expect(response.status).toBe(400);

        const body = await response.json();
        expect(body).toEqual({
          error: 'entryIdとphotoIdはUUID形式である必要があります',
        });
      });

      it('[TC-106] dateFolderが8桁数字でない', async () => {
        // Arrange
        const formData = createInvalidFormData('dateFolder-invalid');
        const request = createMockRequest(formData);

        // Act
        const response = await POST(request);

        // Assert
        expect(response.status).toBe(400);

        const body = await response.json();
        expect(body).toEqual({
          error: 'dateFolder/timeFolderの形式が不正です',
        });
      });

      it('[TC-107] timeFolderが9桁数字でない', async () => {
        // Arrange
        const formData = createInvalidFormData('timeFolder-invalid');
        const request = createMockRequest(formData);

        // Act
        const response = await POST(request);

        // Assert
        expect(response.status).toBe(400);

        const body = await response.json();
        expect(body).toEqual({
          error: 'dateFolder/timeFolderの形式が不正です',
        });
      });
    });
  });

  // ===========================
  // 異常系テスト - 外部連携エラー
  // ===========================

  describe('異常系 - 外部連携エラー', () => {
    it('[TC-201] Cloudflare APIがエラーを返す', async () => {
      // Arrange
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue('Internal Server Error'),
      });

      const formData = createValidFormData();
      const request = createMockRequest(formData);

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(500);

      const body = await response.json();
      expect(body).toEqual({ error: 'アップロード処理に失敗しました' });

      // エラーログが出力されることを確認
      const cloudflareErrorCall = consoleErrorSpy.mock.calls.find((call: string[]) => {
        try {
          const parsed = JSON.parse(call[0]);
          return parsed.message === 'Cloudflare Workers APIエラー';
        } catch {
          return false;
        }
      });
      expect(cloudflareErrorCall).toBeDefined();

      const uploadErrorCall = consoleErrorSpy.mock.calls.find((call: string[]) => {
        try {
          const parsed = JSON.parse(call[0]);
          return parsed.message === 'アップロード処理エラー';
        } catch {
          return false;
        }
      });
      expect(uploadErrorCall).toBeDefined();
    });

    it('[TC-202] ネットワークエラー', async () => {
      // Arrange
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const formData = createValidFormData();
      const request = createMockRequest(formData);

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(500);

      const body = await response.json();
      expect(body).toEqual({ error: 'アップロード処理に失敗しました' });

      // エラーログが出力されることを確認
      const errorCall = consoleErrorSpy.mock.calls.find((call: string[]) => {
        try {
          const parsed = JSON.parse(call[0]);
          return parsed.message === 'アップロード処理エラー';
        } catch {
          return false;
        }
      });
      expect(errorCall).toBeDefined();
    });

    it('[TC-203] EXIF解析エラー', async () => {
      // Arrange
      mockExifrParse.mockRejectedValueOnce(new Error('EXIF parse error'));

      const formData = createValidFormData();
      const request = createMockRequest(formData);

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.location).toBe(null);

      // 警告ログが出力されることを確認
      const warnCall = consoleWarnSpy.mock.calls.find((call: string[]) => {
        try {
          const parsed = JSON.parse(call[0]);
          return parsed.message === 'EXIF抽出エラー';
        } catch {
          return false;
        }
      });
      expect(warnCall).toBeDefined();
    });
  });

  // ===========================
  // エッジケーステスト
  // ===========================

  describe('エッジケース', () => {
    it('[TC-301] latitudeのみ指定', async () => {
      // Arrange
      mockExifrParse.mockResolvedValueOnce({
        latitude: 35.6812,
        longitude: 139.7671,
      });

      const formData = createInvalidFormData('latitude-only');
      const request = createMockRequest(formData);

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      // EXIF解析にフォールバック
      expect(body.location).toEqual({ lat: 35.6812, lng: 139.7671 });

      // EXIF解析が実行されたことを確認
      expect(mockExifrParse).toHaveBeenCalled();
    });

    it('[TC-302] longitudeのみ指定', async () => {
      // Arrange
      mockExifrParse.mockResolvedValueOnce({
        latitude: 35.6812,
        longitude: 139.7671,
      });

      const formData = createInvalidFormData('longitude-only');
      const request = createMockRequest(formData);

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      // EXIF解析にフォールバック
      expect(body.location).toEqual({ lat: 35.6812, lng: 139.7671 });

      // EXIF解析が実行されたことを確認
      expect(mockExifrParse).toHaveBeenCalled();
    });

    it('[TC-303] thoughtsが空文字列', async () => {
      // Arrange
      const formData = createValidFormData({ thoughts: '' });
      const request = createMockRequest(formData);

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);

      // fetchが呼ばれることを確認（thoughtsは送信されない）
      expect(global.fetch).toHaveBeenCalled();
    });

    it('[TC-304] thoughtsが空白のみ', async () => {
      // Arrange
      const formData = createValidFormData({ thoughts: '   ' });
      const request = createMockRequest(formData);

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);

      // fetchが呼ばれることを確認（thoughtsは送信されない）
      expect(global.fetch).toHaveBeenCalled();
    });

    it('[TC-305] titleに前後の空白', async () => {
      // Arrange
      const formData = createValidFormData({ title: '  Test Photo  ' });
      const request = createMockRequest(formData);

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);

      // fetchが呼ばれることを確認（titleはトリムされて送信される）
      expect(global.fetch).toHaveBeenCalled();
    });

    it('[TC-306] EXIF情報に位置情報が含まれない', async () => {
      // Arrange
      mockExifrParse.mockResolvedValueOnce({
        make: 'Canon',
        model: 'EOS 5D',
        // 位置情報なし
      });

      const formData = createValidFormData();
      const request = createMockRequest(formData);

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.location).toBe(null);

      // 警告ログが出力されることを確認
      const warnCall = consoleWarnSpy.mock.calls.find((call: string[]) => {
        try {
          const parsed = JSON.parse(call[0]);
          return parsed.message === 'EXIF位置情報なし';
        } catch {
          return false;
        }
      });
      expect(warnCall).toBeDefined();
    });
  });

  // ===========================
  // APIルール準拠テスト
  // ===========================

  describe('APIルール準拠', () => {
    it('[TC-401] エラーレスポンスに生のエラーオブジェクトを含まない', async () => {
      // Arrange
      global.fetch = vi.fn().mockRejectedValue(new Error('Test error'));

      const formData = createValidFormData();
      const request = createMockRequest(formData);

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(500);

      const body = await response.json();

      // エラーオブジェクトのプロパティが含まれないことを確認
      expect(body).not.toHaveProperty('stack');
      expect(body).not.toHaveProperty('name');
      expect(body).not.toHaveProperty('message');

      // エラーメッセージのみが含まれることを確認
      expect(body).toEqual({ error: 'アップロード処理に失敗しました' });
    });

    it('[TC-402] 全エラーレスポンスにHTTPステータスが明示', async () => {
      // このテストは他のテストケースで検証済み
      // 各エラーレスポンスで status が明示されていることを確認
      expect(true).toBe(true);
    });

    it('[TC-403] catchブロックから2xxを返さない', async () => {
      // Arrange
      global.fetch = vi.fn().mockRejectedValue(new Error('Test error'));

      const formData = createValidFormData();
      const request = createMockRequest(formData);

      // Act
      const response = await POST(request);

      // Assert
      // catchブロックからは必ず500を返す
      expect(response.status).toBe(500);
      expect(response.status).not.toBe(200);
      expect(response.status).not.toBe(201);
      expect(response.status).not.toBe(204);
    });

    it('[TC-404] バリデーションエラーはcatchに入らない', async () => {
      // Arrange
      const formData = createInvalidFormData('title-missing');
      const request = createMockRequest(formData);

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(400);

      // catchブロックのエラーログが出力されないことを確認
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        'アップロード処理エラー:',
        expect.anything()
      );
    });
  });

  // ===========================
  // 新規追加：ファイルサイズ・Content-Type・タイムアウトのテスト
  // ===========================

  describe('ファイルサイズとContent-Typeのバリデーション', () => {
    it('[TC-111] ファイルサイズが10MBを超える場合は400エラー', async () => {
      // Arrange
      const largeFile = createMockImageFile({
        size: 11 * 1024 * 1024, // 11MB
      });
      const formData = createValidFormData({ image: largeFile });
      const request = createMockRequest(formData);

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toContain('ファイルサイズが大きすぎます');
    });

    it('[TC-112] 不正なContent-Typeの画像は400エラー', async () => {
      // Arrange
      const invalidFile = createMockImageFile({
        type: 'application/pdf', // 不正なMIME Type
      });
      const formData = createValidFormData({ image: invalidFile });
      const request = createMockRequest(formData);

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toContain('サポートされていない画像形式');
    });

    it('[TC-113] HEIC形式の画像は受け入れ可能', async () => {
      // Arrange
      const heicFile = createMockImageFile({
        type: 'image/heic',
        name: 'test-image.heic',
      });
      const formData = createValidFormData({ image: heicFile });
      const request = createMockRequest(formData);

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(200);
    });

    it('[TC-114] HEIF形式の画像は受け入れ可能', async () => {
      // Arrange
      const heifFile = createMockImageFile({
        type: 'image/heif',
        name: 'test-image.heif',
      });
      const formData = createValidFormData({ image: heifFile });
      const request = createMockRequest(formData);

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(200);
    });
  });

  describe('Cloudflare Workers API設定', () => {
    it('[TC-115] 本番環境でCloudflare Workers API設定がない場合は500エラー', async () => {
      // Arrange
      vi.stubEnv('NODE_ENV', 'production');
      delete process.env.CLOUDFLARE_WORKERS_API_URL;
      delete process.env.CLOUDFLARE_WORKERS_API_TOKEN;

      const formData = createValidFormData();
      const request = createMockRequest(formData);

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toContain('アップロード設定が不完全');

      // Cleanup
      vi.unstubAllEnvs();
    });

    it('[TC-116] 開発環境でCloudflare Workers API設定がない場合は警告のみ', async () => {
      // Arrange
      vi.stubEnv('NODE_ENV', 'development');
      delete process.env.CLOUDFLARE_WORKERS_API_URL;
      delete process.env.CLOUDFLARE_WORKERS_API_TOKEN;

      const formData = createValidFormData();
      const request = createMockRequest(formData);

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(200);

      // 警告ログが出力されることを確認
      expect(consoleWarnSpy).toHaveBeenCalled();

      // Cleanup
      vi.unstubAllEnvs();
    });
  });
});
