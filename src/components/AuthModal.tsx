import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserCheck, Sparkles, LogIn, UserPlus, ShieldAlert, Check, Smile } from 'lucide-react';

const AVATAR_COLORS = [
  '#5865F2', // Discord Blurple
  '#EB459E', // Pink
  '#57F287', // Green
  '#FEE75C', // Yellow
  '#ED4245', // Red
  '#9B59B6', // Purple
  '#1ABC9C', // Teal
  '#E67E22', // Orange
];

const AVATAR_ICONS = ['🎮', '🦊', '🐱', '☕', '⚡', '🎧', '👾', '🌟', '🚀', '🔥', '🌸', '🤖'];

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, currentUser, register, guestLogin, login } = useApp();
  const [tab, setTab] = useState<'guest' | 'register' | 'login'>('guest');

  // Form states
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(AVATAR_ICONS[0]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isAuthModalOpen && currentUser) return null;

  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    const res = await guestLogin(displayName, selectedColor, selectedIcon);
    setIsLoading(false);
    if (!res.success) {
      setError(res.error || '参加に失敗しました');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('ユーザー名（ID）を入力してください');
      return;
    }
    setError(null);
    setIsLoading(true);
    const res = await register(username, password, displayName, selectedColor, selectedIcon, bio);
    setIsLoading(false);
    if (!res.success) {
      setError(res.error || '登録に失敗しました');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('ユーザー名を入力してください');
      return;
    }
    setError(null);
    setIsLoading(true);
    const res = await login(username, password);
    setIsLoading(false);
    if (!res.success) {
      setError(res.error || 'ログインに失敗しました');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#313338] text-[#dbdee1] rounded-2xl shadow-2xl border border-[#3f4147] overflow-hidden">
        {/* Header */}
        <div className="p-6 text-center bg-[#2b2d31] border-b border-[#1f2023] relative">
          <div className="w-12 h-12 rounded-2xl bg-[#5865F2] flex items-center justify-center mx-auto mb-3 text-2xl shadow-lg shadow-[#5865F2]/20">
            {selectedIcon}
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">コミュニティに参加</h2>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#57F287]/10 text-[#57F287] text-xs font-semibold border border-[#57F287]/20">
            <Check className="w-3.5 h-3.5" />
            メールアドレス不要・即座に開始可能
          </div>

          {currentUser && (
            <button
              id="btn-close-auth-modal"
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-4 right-4 text-[#949ba4] hover:text-white text-lg px-2 py-1 rounded"
            >
              ✕
            </button>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#232428] bg-[#2b2d31]/60 p-1">
          <button
            id="tab-btn-guest"
            onClick={() => {
              setTab('guest');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              tab === 'guest' ? 'bg-[#5865F2] text-white shadow-sm' : 'text-[#949ba4] hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            1秒クイック参加
          </button>
          <button
            id="tab-btn-register"
            onClick={() => {
              setTab('register');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              tab === 'register' ? 'bg-[#5865F2] text-white shadow-sm' : 'text-[#949ba4] hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            アカウント作成
          </button>
          <button
            id="tab-btn-login"
            onClick={() => {
              setTab('login');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              tab === 'login' ? 'bg-[#5865F2] text-white shadow-sm' : 'text-[#949ba4] hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            ログイン
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-[#ED4245]/15 border border-[#ED4245]/30 text-[#f23f43] text-sm flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: 1-Click Guest */}
          {tab === 'guest' && (
            <form onSubmit={handleGuestSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#b5bac1] uppercase tracking-wider mb-2">
                  表示名 (ニックネーム)
                </label>
                <input
                  id="input-guest-name"
                  type="text"
                  placeholder="例: たかし, Gamer99, さくら"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full bg-[#1e1f22] text-white rounded-lg px-3.5 py-2.5 text-sm border border-[#2b2d31] focus:outline-none focus:border-[#5865F2] transition"
                  autoFocus
                />
              </div>

              {/* Avatar Icon Selector */}
              <div>
                <label className="block text-xs font-bold text-[#b5bac1] uppercase tracking-wider mb-2">
                  アイコン絵文字
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {AVATAR_ICONS.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setSelectedIcon(icon)}
                      className={`h-10 rounded-lg text-lg flex items-center justify-center transition border ${
                        selectedIcon === icon
                          ? 'bg-[#5865F2]/20 border-[#5865F2] scale-105'
                          : 'bg-[#2b2d31] border-transparent hover:bg-[#35373c]'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Avatar Color Selector */}
              <div>
                <label className="block text-xs font-bold text-[#b5bac1] uppercase tracking-wider mb-2">
                  アイコン背景色
                </label>
                <div className="flex gap-2">
                  {AVATAR_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        selectedColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#313338] scale-110' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <button
                id="btn-submit-guest"
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 bg-[#5865F2] hover:bg-[#4752c4] text-white font-medium rounded-lg shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {isLoading ? '接続中...' : 'メールなしで今すぐ参加'}
              </button>

              <p className="text-center text-xs text-[#949ba4] mt-3">
                ※ メールアドレスは一切不要です。後からいつでも名前やパスワードを設定可能です。
              </p>
            </form>
          )}

          {/* TAB 2: Register Account */}
          {tab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#b5bac1] uppercase tracking-wider mb-1.5">
                  ユーザーID (英数字) <span className="text-[#ED4245]">*</span>
                </label>
                <input
                  id="input-register-username"
                  type="text"
                  placeholder="例: takashi_dev, neko99"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  className="w-full bg-[#1e1f22] text-white rounded-lg px-3.5 py-2.5 text-sm border border-[#2b2d31] focus:outline-none focus:border-[#5865F2]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#b5bac1] uppercase tracking-wider mb-1.5">
                  表示名 (ニックネーム)
                </label>
                <input
                  id="input-register-displayname"
                  type="text"
                  placeholder="例: たかし 🎮"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full bg-[#1e1f22] text-white rounded-lg px-3.5 py-2.5 text-sm border border-[#2b2d31] focus:outline-none focus:border-[#5865F2]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#b5bac1] uppercase tracking-wider mb-1.5">
                  パスワード (任意・後からログイン用)
                </label>
                <input
                  id="input-register-password"
                  type="password"
                  placeholder="パスワード (省略可能)"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-[#1e1f22] text-white rounded-lg px-3.5 py-2.5 text-sm border border-[#2b2d31] focus:outline-none focus:border-[#5865F2]"
                />
              </div>

              {/* Avatar Icon Selector */}
              <div>
                <label className="block text-xs font-bold text-[#b5bac1] uppercase tracking-wider mb-1.5">
                  アバターアイコン
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {AVATAR_ICONS.slice(0, 6).map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setSelectedIcon(icon)}
                      className={`h-9 rounded-lg text-lg flex items-center justify-center transition border ${
                        selectedIcon === icon
                          ? 'bg-[#5865F2]/20 border-[#5865F2] scale-105'
                          : 'bg-[#2b2d31] border-transparent hover:bg-[#35373c]'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <button
                id="btn-submit-register"
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 bg-[#5865F2] hover:bg-[#4752c4] text-white font-medium rounded-lg shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                {isLoading ? '登録中...' : 'アカウントを作成して参加'}
              </button>
            </form>
          )}

          {/* TAB 3: Login */}
          {tab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#b5bac1] uppercase tracking-wider mb-2">
                  ユーザーID (または登録時のユーザー名)
                </label>
                <input
                  id="input-login-username"
                  type="text"
                  placeholder="ユーザーIDを入力"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  className="w-full bg-[#1e1f22] text-white rounded-lg px-3.5 py-2.5 text-sm border border-[#2b2d31] focus:outline-none focus:border-[#5865F2]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#b5bac1] uppercase tracking-wider mb-2">
                  パスワード
                </label>
                <input
                  id="input-login-password"
                  type="password"
                  placeholder="パスワードを入力"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-[#1e1f22] text-white rounded-lg px-3.5 py-2.5 text-sm border border-[#2b2d31] focus:outline-none focus:border-[#5865F2]"
                />
              </div>

              <button
                id="btn-submit-login"
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 bg-[#5865F2] hover:bg-[#4752c4] text-white font-medium rounded-lg shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                {isLoading ? 'ログイン中...' : 'ログイン'}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setTab('guest')}
                  className="text-xs text-[#00a8fc] hover:underline"
                >
                  アカウントをお持ちでない場合はこちら（メール不要）
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
