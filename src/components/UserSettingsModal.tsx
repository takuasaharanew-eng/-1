import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserStatus } from '../types';
import { playSound } from '../lib/soundboard';
import {
  X,
  LogOut,
  Mic,
  Volume2,
  Check,
  Smile,
  Shield,
  Radio,
  Sliders,
} from 'lucide-react';

const STATUS_OPTIONS: { id: UserStatus; label: string; color: string; desc: string }[] = [
  { id: 'online', label: 'オンライン', color: 'bg-[#23a55a]', desc: '通常のアクティブ状態' },
  { id: 'idle', label: '退席中', color: 'bg-[#f0b232]', desc: '一時的に離席中' },
  { id: 'dnd', label: '取り込み中', color: 'bg-[#f23f43]', desc: '通知をミュート' },
  { id: 'offline', label: 'オフライン表示', color: 'bg-[#80848e]', desc: 'オフラインとして表示' },
];

const COLORS = [
  '#5865F2',
  '#EB459E',
  '#57F287',
  '#FEE75C',
  '#ED4245',
  '#9B59B6',
  '#1ABC9C',
  '#E67E22',
];

const ICONS = ['🎮', '🦊', '🐱', '☕', '⚡', '🎧', '👾', '🌟', '🚀', '🔥', '🌸', '🤖'];

export const UserSettingsModal: React.FC = () => {
  const {
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    currentUser,
    logout,
    updateUserStatus,
    micAudioLevel,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'profile' | 'voice'>('profile');

  // Edit fields
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [customStatus, setCustomStatus] = useState(currentUser?.customStatus || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [selectedStatus, setSelectedStatus] = useState<UserStatus>(currentUser?.status || 'online');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isSettingsModalOpen || !currentUser) return null;

  const handleSave = () => {
    updateUserStatus(selectedStatus, customStatus, bio);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setIsSettingsModalOpen(false);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-2xl bg-[#313338] rounded-2xl shadow-2xl border border-[#3f4147] flex overflow-hidden min-h-[500px]">
        {/* Left Settings Sidebar */}
        <div className="w-52 bg-[#2b2d31] p-4 flex flex-col justify-between border-r border-[#1f2023]">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#949ba4] px-2 mb-2">
              ユーザー設定
            </div>

            <div className="space-y-1">
              <button
                id="btn-tab-settings-profile"
                onClick={() => setActiveTab('profile')}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'profile'
                    ? 'bg-[#35373c] text-white'
                    : 'text-[#949ba4] hover:bg-[#35373c]/50 hover:text-[#dbdee1]'
                }`}
              >
                マイアカウント・プロフィール
              </button>

              <button
                id="btn-tab-settings-voice"
                onClick={() => setActiveTab('voice')}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'voice'
                    ? 'bg-[#35373c] text-white'
                    : 'text-[#949ba4] hover:bg-[#35373c]/50 hover:text-[#dbdee1]'
                }`}
              >
                音声・マイクテスト
              </button>
            </div>
          </div>

          <div>
            <div className="h-[1px] bg-[#3f4147] mb-3" />
            <button
              id="btn-settings-logout"
              onClick={logout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-[#f23f43] hover:bg-[#f23f43]/15 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>ログアウト</span>
            </button>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 p-6 overflow-y-auto text-[#dbdee1] flex flex-col justify-between">
          <div>
            {/* Top Close Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-[#3f4147] mb-6">
              <h3 className="text-lg font-bold text-white">
                {activeTab === 'profile' ? 'プロフィール設定' : '音声・ビデオ設定'}
              </h3>
              <button
                id="btn-close-settings-modal"
                onClick={() => setIsSettingsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#2b2d31] hover:bg-[#35373c] text-[#949ba4] hover:text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* TAB 1: PROFILE */}
            {activeTab === 'profile' && (
              <div className="space-y-4">
                {/* User card preview */}
                <div className="bg-[#2b2d31] rounded-xl p-4 border border-[#1f2023] flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-2xl text-white shadow-md"
                    style={{ backgroundColor: currentUser.avatarColor || '#5865F2' }}
                  >
                    {currentUser.avatarIcon || currentUser.displayName.slice(0, 1)}
                  </div>
                  <div>
                    <div className="font-bold text-white text-base">{currentUser.displayName}</div>
                    <div className="text-xs text-[#949ba4]">@{currentUser.username}</div>
                    <div className="text-[10px] text-[#23a55a] font-semibold mt-1">
                      ✓ メールアドレス不要アカウント
                    </div>
                  </div>
                </div>

                {/* Status selector */}
                <div>
                  <label className="block text-xs font-bold text-[#b5bac1] uppercase tracking-wider mb-2">
                    オンラインステータス
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {STATUS_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedStatus(opt.id)}
                        className={`p-2.5 rounded-lg border text-left transition flex items-center gap-2.5 ${
                          selectedStatus === opt.id
                            ? 'bg-[#5865F2]/15 border-[#5865F2] text-white'
                            : 'bg-[#2b2d31] border-transparent hover:bg-[#35373c] text-[#949ba4]'
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-full shrink-0 ${opt.color}`} />
                        <div>
                          <div className="font-semibold text-xs text-white">{opt.label}</div>
                          <div className="text-[10px] text-[#949ba4]">{opt.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Status */}
                <div>
                  <label className="block text-xs font-bold text-[#b5bac1] uppercase tracking-wider mb-1.5">
                    カスタムステータス
                  </label>
                  <input
                    type="text"
                    placeholder="例: 🎮 ゲーム中, ☕ 雑談募集中, 💻 開発中"
                    value={customStatus}
                    onChange={e => setCustomStatus(e.target.value)}
                    className="w-full bg-[#1e1f22] text-white rounded-lg px-3 py-2 text-xs border border-[#2b2d31] focus:outline-none focus:border-[#5865F2]"
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-xs font-bold text-[#b5bac1] uppercase tracking-wider mb-1.5">
                    自己紹介 (Bio)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="自己紹介を書いてみましょう"
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    className="w-full bg-[#1e1f22] text-white rounded-lg px-3 py-2 text-xs border border-[#2b2d31] focus:outline-none focus:border-[#5865F2] resize-none"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: VOICE */}
            {activeTab === 'voice' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-white mb-1">マイク入力テスト</h4>
                  <p className="text-xs text-[#949ba4] mb-4">
                    声を出すと下のメーターが緑色に反応します。ボイスチャンネル参加時は自動で音声が送信されます。
                  </p>

                  <div className="p-4 bg-[#2b2d31] rounded-xl border border-[#1f2023] space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white flex items-center gap-1.5">
                        <Mic className="w-4 h-4 text-[#23a55a]" />
                        入力レベル (Web Audio API)
                      </span>
                      <span className="font-mono text-[#949ba4]">{micAudioLevel}%</span>
                    </div>

                    <div className="w-full h-3 bg-[#1e1f22] rounded-full overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-75 ${
                          micAudioLevel > 15 ? 'bg-[#23a55a]' : 'bg-[#5865F2]'
                        }`}
                        style={{ width: `${micAudioLevel}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#949ba4]">
                      <span>0 (無音)</span>
                      <span>15 (発言検知しきい値)</span>
                      <span>100 (最大)</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white mb-2">スピーカー＆サウンドテスト</h4>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => playSound('join')}
                      className="px-3 py-2 rounded-lg bg-[#2b2d31] hover:bg-[#35373c] text-white text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <Volume2 className="w-4 h-4 text-[#5865F2]" />
                      接続音テスト
                    </button>
                    <button
                      type="button"
                      onClick={() => playSound('airhorn')}
                      className="px-3 py-2 rounded-lg bg-[#2b2d31] hover:bg-[#35373c] text-white text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <Volume2 className="w-4 h-4 text-[#E67E22]" />
                      エアホーンテスト
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Save Bar */}
          <div className="pt-4 border-t border-[#3f4147] flex items-center justify-end gap-3 mt-4">
            <button
              id="btn-cancel-settings"
              type="button"
              onClick={() => setIsSettingsModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-[#dbdee1] hover:underline"
            >
              キャンセル
            </button>
            <button
              id="btn-save-settings"
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-semibold rounded-lg shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  保存完了！
                </>
              ) : (
                '変更を保存'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
