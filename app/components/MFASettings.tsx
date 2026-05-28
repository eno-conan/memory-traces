'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  fetchMFAPreference,
  setUpTOTP,
  verifyTOTPSetup,
  updateMFAPreference
} from 'aws-amplify/auth';
import { FocusTrap } from '@/components/FocusTrap';

interface MFASettingsProps {
  isRequired: boolean; // Whether MFA is required for this user
}

export default function MFASettings({ isRequired }: MFASettingsProps) {
  const [mfaEnabled, setMfaEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [showSetupModal, setShowSetupModal] = useState<boolean>(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Setup modal states
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [secretCode, setSecretCode] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [setupStep, setSetupStep] = useState<'qr' | 'verify'>('qr');

  // Load current MFA status
  useEffect(() => {
    loadMFAStatus();
  }, []);

  const loadMFAStatus = async () => {
    try {
      setLoading(true);
      const preference = await fetchMFAPreference();
      const enabled = preference.preferred === 'TOTP' ||
        preference.enabled?.includes('TOTP') === true;
      setMfaEnabled(enabled);
    } catch (err) {
      console.error('Failed to load MFA status:', err);
      setError('MFA設定の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleEnableMFA = async () => {
    try {
      setError('');
      setLoading(true);

      // Start TOTP setup
      const totpSetupDetails = await setUpTOTP();
      const appName = 'LearnAuthApp';
      const setupUri = totpSetupDetails.getSetupUri(appName);

      // Generate QR code（動的インポート）
      const QRCode = (await import('qrcode')).default;
      const qrCodeDataUrl = await QRCode.toDataURL(setupUri.href);

      setQrCodeUrl(qrCodeDataUrl);
      setSecretCode(totpSetupDetails.sharedSecret);
      setSetupStep('qr');
      setShowSetupModal(true);
    } catch (err) {
      console.error('MFA setup error:', err);
      setError('MFAの有効化に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndEnable = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('6桁のコードを入力してください');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Verify TOTP code
      await verifyTOTPSetup({ code: verificationCode });

      // Set MFA as preferred
      await updateMFAPreference({ totp: 'PREFERRED' });

      setMfaEnabled(true);
      setShowSetupModal(false);
      setVerificationCode('');
    } catch (err) {
      console.error('Verification error:', err);
      setError('コードの検証に失敗しました。もう一度お試しください');
    } finally {
      setLoading(false);
    }
  };

  const handleDisableMFA = async () => {
    try {
      setLoading(true);
      setError('');

      // Disable TOTP
      await updateMFAPreference({ totp: 'DISABLED' });

      setMfaEnabled(false);
      setShowDisableConfirm(false);
    } catch (err) {
      console.error('Disable MFA error:', err);
      setError('MFAの無効化に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // メモ化されたコールバック
  const handleModalClose = useCallback(() => {
    setShowSetupModal(false);
    setVerificationCode('');
    setSetupStep('qr');
    setError('');
  }, []);

  const handleNext = useCallback(() => setSetupStep('verify'), []);

  const handleDisableConfirmClose = useCallback(() => setShowDisableConfirm(false), []);

  if (loading && !showSetupModal) {
    return (
      <div className="p-4 bg-zinc-100 dark:bg-zinc-700 rounded-lg">
        <p className="text-zinc-600 dark:text-zinc-300">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
        2段階認証（MFA）
      </h3>

      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-2">
            {mfaEnabled ? 'MFAが有効です' : 'MFAが無効です'}
          </p>
          {isRequired && (
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              あなたのアカウントではMFAが必須です
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${mfaEnabled
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-400'
            }`}>
            {mfaEnabled ? '有効' : '無効'}
          </span>

          {!mfaEnabled ? (
            <button
              onClick={handleEnableMFA}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
            >
              有効化
            </button>
          ) : (
            <button
              onClick={() => setShowDisableConfirm(true)}
              disabled={loading || isRequired}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
              title={isRequired ? 'あなたのアカウントではMFAは必須です' : ''}
            >
              無効化
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 rounded-lg mb-4">
          <p className="text-red-800 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Setup Modal */}
      {showSetupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="setup-modal-title"
            className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl p-6 max-w-md w-full"
          >
            <FocusTrap onClose={handleModalClose}>
              <h2 id="setup-modal-title" className="text-xl font-bold text-zinc-900 dark:text-white mb-4">
                {setupStep === 'qr' ? 'QRコードをスキャン' : '認証コードを入力'}
              </h2>

              {setupStep === 'qr' && (
                <>
                  <p className="text-zinc-700 dark:text-zinc-300 mb-4 text-sm">
                    認証アプリでこのQRコードをスキャンしてください。
                  </p>
                  {qrCodeUrl && (
                    <div className="flex justify-center mb-4">
                      <Image src={qrCodeUrl} alt="QR Code" width={192} height={192} />
                    </div>
                  )}
                  <div className="mb-4 p-3 bg-zinc-100 dark:bg-zinc-700 rounded-lg">
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 mb-1">
                      手動入力用コード:
                    </p>
                    <code className="block text-xs font-mono text-zinc-900 dark:text-white break-all">
                      {secretCode}
                    </code>
                  </div>
                  <button
                    onClick={handleNext}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    次へ
                  </button>
                </>
              )}

              {setupStep === 'verify' && (
                <>
                  <p className="text-zinc-700 dark:text-zinc-300 mb-4 text-sm">
                    認証アプリに表示されている6桁のコードを入力してください。
                  </p>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full px-4 py-3 text-xl text-center font-mono border-2 border-zinc-300 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white mb-4"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSetupStep('qr')}
                      disabled={loading}
                      className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                    >
                      戻る
                    </button>
                    <button
                      onClick={handleVerifyAndEnable}
                      disabled={loading || verificationCode.length !== 6}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {loading ? '検証中...' : '検証'}
                    </button>
                  </div>
                </>
              )}

              <button
                onClick={handleModalClose}
                className="w-full mt-3 px-4 py-2 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors text-sm"
              >
                キャンセル
              </button>
            </FocusTrap>
          </div>
        </div>
      )}

      {/* Disable Confirmation Modal */}
      {showDisableConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="disable-modal-title"
            className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl p-6 max-w-md w-full"
          >
            <FocusTrap onClose={handleDisableConfirmClose}>
              <h2 id="disable-modal-title" className="text-xl font-bold text-zinc-900 dark:text-white mb-4">
                MFAを無効化しますか？
              </h2>
              <div className="mb-4 p-4 bg-amber-100 dark:bg-amber-900/30 border border-amber-400 dark:border-amber-600 rounded-lg">
                <p className="text-amber-800 dark:text-amber-300 text-sm">
                  警告: MFAを無効化すると、アカウントのセキュリティが低下します。
                </p>
              </div>
              <p className="text-zinc-700 dark:text-zinc-300 mb-6 text-sm">
                本当にMFAを無効化してもよろしいですか？
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDisableConfirm(false)}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleDisableMFA}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? '無効化中...' : '無効化する'}
                </button>
              </div>
            </FocusTrap>
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/30 border border-blue-400 dark:border-blue-600 rounded-lg">
        <p className="text-blue-800 dark:text-blue-300 text-xs">
          2段階認証を有効にすると、ログイン時に認証アプリからのコードが必要になります。
        </p>
      </div>
    </div>
  );
}
