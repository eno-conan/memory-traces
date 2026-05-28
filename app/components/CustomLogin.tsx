'use client';

import { useState, FormEvent } from 'react';
import {
  signIn,
  signUp,
  confirmSignUp,
  resetPassword,
  confirmResetPassword,
  confirmSignIn,
  signInWithRedirect
} from 'aws-amplify/auth';

type AuthView = 'signIn' | 'signUp' | 'confirmSignUp' | 'forgotPassword' | 'confirmReset' | 'confirmMFA';

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  code?: string;
  mfaCode?: string;
  general?: string;
}

interface CustomLoginProps {
  onSuccess: () => void;
}

export default function CustomLogin({ onSuccess }: CustomLoginProps) {
  const [currentView, setCurrentView] = useState<AuthView>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // バリデーション関数
  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) {
      return 'メールアドレスを入力してください';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return '有効なメールアドレスを入力してください';
    }
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) {
      return 'パスワードを入力してください';
    }
    if (password.length < 8) {
      return 'パスワードは8文字以上である必要があります';
    }
    if (!/[a-z]/.test(password)) {
      return 'パスワードには小文字を含める必要があります';
    }
    if (!/[A-Z]/.test(password)) {
      return 'パスワードには大文字を含める必要があります';
    }
    if (!/[0-9]/.test(password)) {
      return 'パスワードには数字を含める必要があります';
    }
    if (!/[^a-zA-Z0-9]/.test(password)) {
      return 'パスワードには特殊文字を含める必要があります';
    }
    return undefined;
  };

  const validateCode = (code: string): string | undefined => {
    if (!code.trim()) {
      return '確認コードを入力してください';
    }
    return undefined;
  };

  // サインイン処理
  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const emailError = validateEmail(email);
    const passwordError = !password ? 'パスワードを入力してください' : undefined;

    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError });
      setLoading(false);
      return;
    }

    try {
      const { isSignedIn, nextStep } = await signIn({
        username: email,
        password,
      });

      if (isSignedIn) {
        onSuccess();
      } else if (nextStep.signInStep === 'CONFIRM_SIGN_UP') {
        setCurrentView('confirmSignUp');
        setErrors({ general: 'アカウントの確認が必要です。確認コードを入力してください。' });
      } else if (nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_TOTP_CODE') {
        setCurrentView('confirmMFA');
        setErrors({ general: '認証アプリのコードを入力してください。' });
      }
    } catch (error) {
      console.error('Sign in error:', error);
      let errorMessage = 'ログインに失敗しました';

      if (error instanceof Error) {
        if (error.name === 'UserNotFoundException' || error.name === 'NotAuthorizedException') {
          errorMessage = 'メールアドレスまたはパスワードが正しくありません';
        } else if (error.name === 'UserNotConfirmedException') {
          setCurrentView('confirmSignUp');
          errorMessage = 'アカウントの確認が必要です';
        } else if (error.message) {
          errorMessage = error.message;
        }
      }

      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  // サインアップ処理
  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const confirmPasswordError = password !== confirmPassword ? 'パスワードが一致しません' : undefined;

    if (emailError || passwordError || confirmPasswordError) {
      setErrors({ email: emailError, password: passwordError, confirmPassword: confirmPasswordError });
      setLoading(false);
      return;
    }

    try {
      await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
          },
        },
      });

      setCurrentView('confirmSignUp');
      setErrors({ general: '確認コードをメールアドレスに送信しました。' });
    } catch (error) {
      console.error('Sign up error:', error);
      let errorMessage = 'アカウント作成に失敗しました';

      if (error instanceof Error) {
        if (error.name === 'UsernameExistsException') {
          errorMessage = 'このメールアドレスは既に登録されています';
        } else if (error.message) {
          errorMessage = error.message;
        }
      }

      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  // 確認コード送信処理
  const handleConfirmSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const codeError = validateCode(code);
    if (codeError) {
      setErrors({ code: codeError });
      setLoading(false);
      return;
    }

    try {
      await confirmSignUp({
        username: email,
        confirmationCode: code,
      });

      setCurrentView('signIn');
      setErrors({ general: 'アカウントが確認されました。ログインしてください。' });
      setCode('');
    } catch (error) {
      console.error('Confirm sign up error:', error);
      let errorMessage = '確認に失敗しました';

      if (error instanceof Error) {
        if (error.name === 'CodeMismatchException') {
          errorMessage = '確認コードが正しくありません';
        } else if (error.name === 'ExpiredCodeException') {
          errorMessage = '確認コードの有効期限が切れています';
        } else if (error.message) {
          errorMessage = error.message;
        }
      }

      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  // パスワードリセット開始
  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const emailError = validateEmail(email);
    if (emailError) {
      setErrors({ email: emailError });
      setLoading(false);
      return;
    }

    try {
      await resetPassword({ username: email });
      setCurrentView('confirmReset');
      setErrors({ general: 'パスワードリセット用のコードをメールアドレスに送信しました。' });
    } catch (error) {
      console.error('Reset password error:', error);
      const message = error instanceof Error ? error.message : 'パスワードリセットに失敗しました';
      setErrors({ general: message });
    } finally {
      setLoading(false);
    }
  };

  // パスワードリセット確認
  const handleConfirmReset = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const codeError = validateCode(code);
    const passwordError = validatePassword(password);

    if (codeError || passwordError) {
      setErrors({ code: codeError, password: passwordError });
      setLoading(false);
      return;
    }

    try {
      await confirmResetPassword({
        username: email,
        confirmationCode: code,
        newPassword: password,
      });

      setCurrentView('signIn');
      setPassword('');
      setCode('');
      setErrors({ general: 'パスワードが変更されました。新しいパスワードでログインしてください。' });
    } catch (error) {
      console.error('Confirm reset password error:', error);
      let errorMessage = 'パスワード変更に失敗しました';

      if (error instanceof Error) {
        if (error.name === 'CodeMismatchException') {
          errorMessage = '確認コードが正しくありません';
        } else if (error.message) {
          errorMessage = error.message;
        }
      }

      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  // MFA確認
  const handleConfirmMFA = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    if (!mfaCode.trim()) {
      setErrors({ mfaCode: '認証コードを入力してください' });
      setLoading(false);
      return;
    }

    if (!/^\d{6}$/.test(mfaCode)) {
      setErrors({ mfaCode: '6桁の数字を入力してください' });
      setLoading(false);
      return;
    }

    try {
      const { isSignedIn } = await confirmSignIn({
        challengeResponse: mfaCode,
      });

      if (isSignedIn) {
        onSuccess();
      }
    } catch (error) {
      console.error('Confirm MFA error:', error);
      let errorMessage = 'MFA認証に失敗しました';

      if (error instanceof Error) {
        if (error.name === 'CodeMismatchException' || error.name === 'NotAuthorizedException') {
          errorMessage = '認証コードが正しくありません';
        } else if (error.message) {
          errorMessage = error.message;
        }
      }

      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth ログイン
  const handleGoogleSignIn = async () => {
    try {
      await signInWithRedirect({
        provider: 'Google',
      });
      // リダイレクトが自動的に行われる
    } catch (error) {
      console.error('Google sign in error:', error);
      setErrors({
        general: 'Googleログインに失敗しました。もう一度お試しください。'
      });
    }
  };

  // 共通の入力フィールドコンポーネント
  const InputField = ({
    id,
    type,
    label,
    value,
    onChange,
    error,
    autoComplete,
    placeholder,
  }: {
    id: string;
    type: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    autoComplete?: string;
    placeholder?: string;
  }) => (
    <div className="mb-4">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full px-4 py-3 rounded-lg border-2 transition-colors
          ${error
            ? 'border-red-500 dark:border-red-400 focus:border-red-600 dark:focus:border-red-300'
            : 'border-zinc-300 dark:border-zinc-600 focus:border-blue-500 dark:focus:border-blue-400'
          }
          bg-white dark:bg-zinc-800
          text-zinc-900 dark:text-white
          placeholder-zinc-400 dark:placeholder-zinc-500
          focus:outline-none focus:ring-2
          ${error
            ? 'focus:ring-red-500/20 dark:focus:ring-red-400/20'
            : 'focus:ring-blue-500/20 dark:focus:ring-blue-400/20'
          }`}
      />
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium"
        >
          {error}
        </p>
      )}
    </div>
  );

  // 共通のボタンコンポーネント
  const SubmitButton = ({ children, loading }: { children: React.ReactNode; loading: boolean }) => (
    <button
      type="submit"
      disabled={loading}
      className="w-full px-4 py-3 rounded-lg font-medium transition-colors
        bg-blue-600 hover:bg-blue-700
        dark:bg-blue-500 dark:hover:bg-blue-600
        text-white
        focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50
        disabled:bg-zinc-400 disabled:dark:bg-zinc-600
        disabled:cursor-not-allowed
        disabled:opacity-60"
      aria-busy={loading}
    >
      {loading ? '処理中...' : children}
    </button>
  );

  // エラーメッセージ表示
  const ErrorMessage = ({ message }: { message: string }) => (
    <div
      role="alert"
      className="mb-4 p-4 rounded-lg border-2
        bg-red-50 dark:bg-red-900/20
        border-red-300 dark:border-red-700
        text-red-800 dark:text-red-200"
    >
      <p className="font-medium">{message}</p>
    </div>
  );

  // 成功メッセージ表示（情報メッセージとして使用）
  const InfoMessage = ({ message }: { message: string }) => (
    <div
      role="status"
      className="mb-4 p-4 rounded-lg border-2
        bg-blue-50 dark:bg-blue-900/20
        border-blue-300 dark:border-blue-700
        text-blue-800 dark:text-blue-200"
    >
      <p className="font-medium">{message}</p>
    </div>
  );

  return (
    <div className="w-full max-w-md">
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl p-8 border border-zinc-200 dark:border-zinc-700">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6 text-center">
          {currentView === 'signIn' && 'ログイン'}
          {currentView === 'signUp' && '新規登録'}
          {currentView === 'confirmSignUp' && 'アカウント確認'}
          {currentView === 'forgotPassword' && 'パスワードリセット'}
          {currentView === 'confirmReset' && 'パスワード変更'}
          {currentView === 'confirmMFA' && '二段階認証'}
        </h1>

        {errors.general && (
          errors.general.includes('確認') || errors.general.includes('送信')
            ? <InfoMessage message={errors.general} />
            : <ErrorMessage message={errors.general} />
        )}

        {/* サインインフォーム */}
        {currentView === 'signIn' && (
          <form onSubmit={handleSignIn} noValidate>
            <InputField
              id="email"
              type="email"
              label="メールアドレス"
              value={email}
              onChange={setEmail}
              error={errors.email}
              autoComplete="email"
              placeholder="example@example.com"
            />
            <InputField
              id="password"
              type="password"
              label="パスワード"
              value={password}
              onChange={setPassword}
              error={errors.password}
              autoComplete="current-password"
              placeholder="パスワードを入力"
            />
            <div className="mb-6">
              <SubmitButton loading={loading}>ログイン</SubmitButton>
            </div>

            {/* Google OAuth ボタン */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-300 dark:border-zinc-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                  または
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full px-4 py-3 rounded-lg font-medium transition-colors
                bg-white hover:bg-zinc-50
                dark:bg-zinc-700 dark:hover:bg-zinc-600
                text-zinc-900 dark:text-white
                border-2 border-zinc-300 dark:border-zinc-600
                focus:outline-none focus:ring-2 focus:ring-blue-500/50
                disabled:opacity-60 disabled:cursor-not-allowed
                flex items-center justify-center gap-3 mb-6"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Googleでログイン
            </button>

            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={() => {
                  setCurrentView('signUp');
                  setErrors({});
                }}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded px-1"
              >
                アカウントをお持ちでない方はこちら
              </button>
              <br />
              <button
                type="button"
                onClick={() => {
                  setCurrentView('forgotPassword');
                  setErrors({});
                }}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded px-1"
              >
                パスワードをお忘れの方はこちら
              </button>
            </div>
          </form>
        )}

        {/* サインアップフォーム */}
        {currentView === 'signUp' && (
          <form onSubmit={handleSignUp} noValidate>
            <InputField
              id="email"
              type="email"
              label="メールアドレス"
              value={email}
              onChange={setEmail}
              error={errors.email}
              autoComplete="email"
              placeholder="example@example.com"
            />
            <InputField
              id="password"
              type="password"
              label="パスワード"
              value={password}
              onChange={setPassword}
              error={errors.password}
              autoComplete="new-password"
              placeholder="8文字以上、大小英字・数字・記号を含む"
            />
            <InputField
              id="confirmPassword"
              type="password"
              label="パスワード（確認）"
              value={confirmPassword}
              onChange={setConfirmPassword}
              error={errors.confirmPassword}
              autoComplete="new-password"
              placeholder="パスワードを再入力"
            />
            <div className="mb-6">
              <SubmitButton loading={loading}>新規登録</SubmitButton>
            </div>
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setCurrentView('signIn');
                  setErrors({});
                }}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded px-1"
              >
                既にアカウントをお持ちの方はこちら
              </button>
            </div>
          </form>
        )}

        {/* 確認コード入力フォーム */}
        {currentView === 'confirmSignUp' && (
          <form onSubmit={handleConfirmSignUp} noValidate>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              {email} に送信された確認コードを入力してください。
            </p>
            <InputField
              id="code"
              type="text"
              label="確認コード"
              value={code}
              onChange={setCode}
              error={errors.code}
              autoComplete="one-time-code"
              placeholder="6桁の確認コード"
            />
            <div className="mb-6">
              <SubmitButton loading={loading}>確認</SubmitButton>
            </div>
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setCurrentView('signIn');
                  setErrors({});
                }}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded px-1"
              >
                ログインに戻る
              </button>
            </div>
          </form>
        )}

        {/* パスワードリセットフォーム */}
        {currentView === 'forgotPassword' && (
          <form onSubmit={handleForgotPassword} noValidate>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              登録されているメールアドレスを入力してください。パスワードリセット用のコードを送信します。
            </p>
            <InputField
              id="email"
              type="email"
              label="メールアドレス"
              value={email}
              onChange={setEmail}
              error={errors.email}
              autoComplete="email"
              placeholder="example@example.com"
            />
            <div className="mb-6">
              <SubmitButton loading={loading}>コードを送信</SubmitButton>
            </div>
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setCurrentView('signIn');
                  setErrors({});
                }}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded px-1"
              >
                ログインに戻る
              </button>
            </div>
          </form>
        )}

        {/* パスワードリセット確認フォーム */}
        {currentView === 'confirmReset' && (
          <form onSubmit={handleConfirmReset} noValidate>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              メールで受け取った確認コードと新しいパスワードを入力してください。
            </p>
            <InputField
              id="code"
              type="text"
              label="確認コード"
              value={code}
              onChange={setCode}
              error={errors.code}
              autoComplete="one-time-code"
              placeholder="6桁の確認コード"
            />
            <InputField
              id="newPassword"
              type="password"
              label="新しいパスワード"
              value={password}
              onChange={setPassword}
              error={errors.password}
              autoComplete="new-password"
              placeholder="8文字以上、大小英字・数字・記号を含む"
            />
            <div className="mb-6">
              <SubmitButton loading={loading}>パスワードを変更</SubmitButton>
            </div>
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setCurrentView('signIn');
                  setErrors({});
                }}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded px-1"
              >
                ログインに戻る
              </button>
            </div>
          </form>
        )}

        {/* MFA確認フォーム */}
        {currentView === 'confirmMFA' && (
          <form onSubmit={handleConfirmMFA} noValidate>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              認証アプリに表示されている6桁のコードを入力してください。
            </p>
            <InputField
              id="mfaCode"
              type="text"
              label="認証コード"
              value={mfaCode}
              onChange={setMfaCode}
              error={errors.mfaCode}
              autoComplete="one-time-code"
              placeholder="000000"
            />
            <div className="mb-6">
              <SubmitButton loading={loading}>認証</SubmitButton>
            </div>
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setCurrentView('signIn');
                  setErrors({});
                  setMfaCode('');
                }}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded px-1"
              >
                ログインに戻る
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
