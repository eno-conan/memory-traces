'use client';

import { useState } from 'react';
import Image from 'next/image';
import { setUpTOTP, verifyTOTPSetup, updateMFAPreference } from 'aws-amplify/auth';

interface MFASetupProps {
  onComplete: () => void;
  isRequired?: boolean; // Whether MFA is required for this user
}

export default function MFASetup({ onComplete, isRequired = false }: MFASetupProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [secretCode, setSecretCode] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [setupStep, setSetupStep] = useState<'init' | 'qr' | 'verify'>('init');

  const startMFASetup = async () => {
    setLoading(true);
    setError('');

    try {
      // TOTPセットアップを開始
      const totpSetupDetails = await setUpTOTP();
      const appName = 'LearnAuthApp';
      const setupUri = totpSetupDetails.getSetupUri(appName);

      // QRコードを生成（動的インポート）
      const QRCode = (await import('qrcode')).default;
      const qrCodeDataUrl = await QRCode.toDataURL(setupUri.href);

      setQrCodeUrl(qrCodeDataUrl);
      setSecretCode(totpSetupDetails.sharedSecret);
      setSetupStep('qr');
    } catch (err) {
      console.error('MFA setup error:', err);
      setError('MFAセットアップの開始に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('6桁のコードを入力してください');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // TOTPコードを検証
      await verifyTOTPSetup({ code: verificationCode });

      // MFAを優先認証方法として設定
      await updateMFAPreference({ totp: 'PREFERRED' });

      onComplete();
    } catch (err) {
      console.error('Verification error:', err);
      setError('コードの検証に失敗しました。もう一度お試しください');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Simply call onComplete without setting up MFA
    onComplete();
  };

  if (setupStep === 'init') {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
            2段階認証のセットアップ
          </h1>

          {isRequired && (
            <div className="mb-4 p-3 bg-amber-100 dark:bg-amber-900/30 border border-amber-400 dark:border-amber-600 rounded-lg">
              <p className="text-amber-800 dark:text-amber-300 text-sm font-medium">
                あなたのアカウントでは2段階認証が必須です
              </p>
            </div>
          )}

          <p className="text-zinc-700 dark:text-zinc-300 mb-6">
            アカウントのセキュリティを強化するため、2段階認証（MFA）のセットアップ{isRequired ? 'が必要です' : 'をお勧めします'}。
          </p>
          <p className="text-zinc-700 dark:text-zinc-300 mb-6">
            以下の認証アプリのいずれかをインストールしてください：
          </p>
          <ul className="list-disc list-inside text-zinc-700 dark:text-zinc-300 mb-6 space-y-2">
            <li>Google Authenticator</li>
            <li>Microsoft Authenticator</li>
            <li>Authy</li>
          </ul>
          <button
            onClick={startMFASetup}
            disabled={loading}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {loading ? 'セットアップ中...' : 'セットアップを開始'}
          </button>

          {/* Skip button - only show for optional users */}
          {!isRequired && (
            <button
              onClick={handleSkip}
              disabled={loading}
              className="w-full mt-3 px-6 py-2 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors disabled:opacity-50"
            >
              後でセットアップ
            </button>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 rounded-lg">
              <p className="text-red-800 dark:text-red-300 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (setupStep === 'qr') {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
            QRコードをスキャン
          </h1>
          <p className="text-zinc-700 dark:text-zinc-300 mb-6">
            認証アプリでこのQRコードをスキャンしてください。
          </p>

          {qrCodeUrl && (
            <div className="flex justify-center mb-6">
              <Image src={qrCodeUrl} alt="QR Code" width={256} height={256} />
            </div>
          )}

          <div className="mb-6 p-4 bg-zinc-100 dark:bg-zinc-700 rounded-lg">
            <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-2">
              QRコードをスキャンできない場合は、以下のコードを手動で入力してください：
            </p>
            <code className="block text-sm font-mono text-zinc-900 dark:text-white bg-white dark:bg-zinc-800 p-2 rounded break-all">
              {secretCode}
            </code>
          </div>

          <button
            onClick={() => setSetupStep('verify')}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            次へ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
          認証コードを入力
        </h1>
        <p className="text-zinc-700 dark:text-zinc-300 mb-6">
          認証アプリに表示されている6桁のコードを入力してください。
        </p>

        <div className="mb-6">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            className="w-full px-4 py-3 text-2xl text-center font-mono border-2 border-zinc-300 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
          />
        </div>

        <button
          onClick={verifyCode}
          disabled={loading || verificationCode.length !== 6}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {loading ? '検証中...' : '検証'}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 rounded-lg">
            <p className="text-red-800 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={() => setSetupStep('qr')}
          disabled={loading}
          className="w-full mt-4 px-6 py-2 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          QRコードに戻る
        </button>
      </div>
    </div>
  );
}
