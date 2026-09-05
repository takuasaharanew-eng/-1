import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Hash,
  Volume2,
  Plus,
  Mic,
  MicOff,
  Headphones,
  Settings,
  PhoneOff,
  Radio,
  ChevronDown,
  Monitor,
  Share2,
  Sliders,
  VolumeX,
} from 'lucide-react';

export const SidebarChannels: React.FC = () => {
  const {
    currentServer,
    currentChannelId,
    selectChannel,
    setIsCreateChannelModalOpen,
    activeVoiceChannelId,
    voiceParticipants,
    joinVoiceChannel,
    leaveVoiceChannel,
    currentUser,
    isMuted,
    isDeafened,
    toggleMute,
    toggleDeafen,
    setIsSettingsModalOpen,
    speakingUsers,
    isScreenSharing,
    toggleScreenShare,
    setIsVoiceStageOpen,
  } = useApp();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!currentServer) {
    return <div className="w-60 bg-[#2b2d31] shrink-0 border-r border-[#1f2023]" />;
  }

  const textChannels = currentServer.channels.filter(c => c.type === 'text');
  const voiceChannels = currentServer.channels.filter(c => c.type === 'voice');

  const activeVoiceChannel = currentServer.channels.find(c => c.id === activeVoiceChannelId);

  return (
    <div className="w-60 bg-[#2b2d31] flex flex-col shrink-0 select-none border-r border-[#1f2023]">
      {/* Server Header */}
      <div className="relative">
        <button
          id="btn-server-menu-toggle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="w-full h-12 px-4 border-b border-[#1f2023] flex items-center justify-between font-bold text-white shadow-sm hover:bg-[#35373c] transition-colors"
        >
          <span className="truncate text-sm">{currentServer.name}</span>
          <ChevronDown
            className={`w-4 h-4 text-[#949ba4] transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Server Dropdown Menu */}
        {isMenuOpen && (
          <div className="absolute top-13 left-2 right-2 z-30 bg-[#111214] rounded-lg p-1.5 shadow-xl border border-[#232428] text-xs">
            <button
              id="btn-menu-add-channel"
              onClick={() => {
                setIsMenuOpen(false);
                setIsCreateChannelModalOpen(true);
              }}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded text-[#949ba4] hover:bg-[#5865F2] hover:text-white transition"
            >
              <span>チャンネルを作成</span>
              <Plus className="w-3.5 h-3.5" />
            </button>
            <div className="h-[1px] bg-[#232428] my-1" />
            <div className="px-2.5 py-1.5 text-[11px] text-[#949ba4]">
              {currentServer.description || 'コミュニティスペース'}
            </div>
          </div>
        )}
      </div>

      {/* Channels List */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 scrollbar-thin">
        {/* TEXT CHANNELS CATEGORY */}
        <div>
          <div className="flex items-center justify-between px-2 text-[11px] font-bold uppercase tracking-wider text-[#949ba4] mb-1 group">
            <span className="group-hover:text-white transition">テキストチャンネル</span>
            <button
              id="btn-add-text-channel"
              onClick={() => setIsCreateChannelModalOpen(true)}
              className="hover:text-white transition"
              title="チャンネル作成"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-0.5">
            {textChannels.map(ch => {
              const isActive = ch.id === currentChannelId;
              return (
                <button
                  key={ch.id}
                  id={`btn-channel-${ch.id}`}
                  onClick={() => selectChannel(ch.id)}
                  className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all group ${
                    isActive
                      ? 'bg-[#404249] text-white'
                      : 'text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]'
                  }`}
                >
                  <Hash className="w-4 h-4 shrink-0 text-[#80848e] group-hover:text-[#dbdee1]" />
                  <span className="truncate">{ch.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* VOICE CHANNELS CATEGORY */}
        <div>
          <div className="flex items-center justify-between px-2 text-[11px] font-bold uppercase tracking-wider text-[#949ba4] mb-1 group">
            <span className="group-hover:text-white transition">ボイスチャンネル (通話)</span>
            <button
              id="btn-add-voice-channel"
              onClick={() => setIsCreateChannelModalOpen(true)}
              className="hover:text-white transition"
              title="ボイスチャンネル作成"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            {voiceChannels.map(ch => {
              const isConnectedHere = ch.id === activeVoiceChannelId;
              const participants = voiceParticipants.filter(p => p.channelId === ch.id);

              return (
                <div key={ch.id} className="space-y-0.5">
                  <button
                    id={`btn-voice-channel-${ch.id}`}
                    onClick={() => {
                      if (isConnectedHere) {
                        setIsVoiceStageOpen(true);
                      } else {
                        joinVoiceChannel(ch.id);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs font-medium transition-all group ${
                      isConnectedHere
                        ? 'bg-[#5865F2]/20 text-[#57F287] border border-[#57F287]/30'
                        : 'text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <Volume2
                        className={`w-4 h-4 shrink-0 ${
                          isConnectedHere ? 'text-[#57F287]' : 'text-[#80848e] group-hover:text-[#dbdee1]'
                        }`}
                      />
                      <span className="truncate">{ch.name}</span>
                    </div>

                    {participants.length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1e1f22] text-[#949ba4]">
                        {participants.length}
                      </span>
                    )}
                  </button>

                  {/* Connected Participants list under this voice channel */}
                  {participants.length > 0 && (
                    <div className="pl-6 pr-1 space-y-1 py-1">
                      {participants.map(p => {
                        const isSpeaking = speakingUsers.has(p.userId);
                        return (
                          <div
                            key={p.userId}
                            className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-[#35373c]/50 text-xs text-[#dbdee1]"
                          >
                            <div className="flex items-center gap-2 truncate">
                              {/* Avatar with speaking ring */}
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white shrink-0 relative transition-all ${
                                  isSpeaking
                                    ? 'ring-2 ring-[#23a55a] shadow-[0_0_8px_#23a55a]'
                                    : ''
                                }`}
                                style={{ backgroundColor: p.user?.avatarColor || '#5865F2' }}
                              >
                                {p.user?.avatarIcon || p.user?.displayName?.slice(0, 1) || '👤'}
                              </div>
                              <span className="truncate text-[11px] font-medium">
                                {p.user?.displayName || 'ユーザー'}
                              </span>
                            </div>

                            {/* Icons (muted/screen) */}
                            <div className="flex items-center gap-1 text-[#80848e]">
                              {p.isScreenSharing && (
                                <Monitor className="w-3 h-3 text-[#23a55a]" title="画面共有中" />
                              )}
                              {p.isDeafened ? (
                                <VolumeX className="w-3 h-3 text-[#f23f43]" title="スピーカーミュート" />
                              ) : p.isMuted ? (
                                <MicOff className="w-3 h-3 text-[#f23f43]" title="マイクミュート" />
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ACTIVE VOICE CONNECTION STATUS TRAY */}
      {activeVoiceChannel && (
        <div className="bg-[#232428] border-t border-[#1f2023] p-2.5">
          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
              onClick={() => setIsVoiceStageOpen(true)}
            >
              <div className="w-2 h-2 rounded-full bg-[#23a55a] animate-pulse" />
              <div>
                <div className="text-[11px] font-bold text-[#23a55a] flex items-center gap-1">
                  <span>音声 接続中</span>
                  <span className="text-[9px] text-[#949ba4] font-normal">/ RTC 24ms</span>
                </div>
                <div className="text-[10px] text-[#949ba4] truncate max-w-[130px]">
                  {activeVoiceChannel.name} / {currentServer.name}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                id="btn-voice-toggle-screenshare"
                onClick={toggleScreenShare}
                className={`p-1.5 rounded hover:bg-[#35373c] transition ${
                  isScreenSharing ? 'text-[#23a55a] bg-[#23a55a]/10' : 'text-[#b5bac1]'
                }`}
                title="画面を共有"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                id="btn-voice-disconnect"
                onClick={leaveVoiceChannel}
                className="p-1.5 rounded hover:bg-[#f23f43]/20 text-[#f23f43] transition"
                title="通話を切断"
              >
                <PhoneOff className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM USER PROFILE BAR */}
      <div className="h-[52px] bg-[#232428] px-2 flex items-center justify-between border-t border-[#1f2023]">
        {currentUser ? (
          <>
            {/* User Details */}
            <div
              className="flex items-center gap-2 p-1 rounded-md hover:bg-[#35373c] transition cursor-pointer max-w-[120px]"
              onClick={() => setIsSettingsModalOpen(true)}
            >
              <div className="relative shrink-0">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm text-white font-bold"
                  style={{ backgroundColor: currentUser.avatarColor || '#5865F2' }}
                >
                  {currentUser.avatarIcon || currentUser.displayName?.slice(0, 1) || '👤'}
                </div>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#232428] ${
                    currentUser.status === 'online'
                      ? 'bg-[#23a55a]'
                      : currentUser.status === 'idle'
                      ? 'bg-[#f0b232]'
                      : currentUser.status === 'dnd'
                      ? 'bg-[#f23f43]'
                      : 'bg-[#80848e]'
                  }`}
                />
              </div>

              <div className="truncate leading-tight">
                <div className="text-xs font-bold text-white truncate">{currentUser.displayName}</div>
                <div className="text-[10px] text-[#949ba4] truncate">@{currentUser.username}</div>
              </div>
            </div>

            {/* Controls (Mic, Deafen, Settings) */}
            <div className="flex items-center gap-0.5">
              <button
                id="btn-user-toggle-mic"
                onClick={toggleMute}
                className={`p-1.5 rounded hover:bg-[#35373c] transition ${
                  isMuted ? 'text-[#f23f43]' : 'text-[#b5bac1] hover:text-white'
                }`}
                title={isMuted ? 'ミュート解除' : 'ミュート'}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <button
                id="btn-user-toggle-deafen"
                onClick={toggleDeafen}
                className={`p-1.5 rounded hover:bg-[#35373c] transition ${
                  isDeafened ? 'text-[#f23f43]' : 'text-[#b5bac1] hover:text-white'
                }`}
                title={isDeafened ? 'スピーカーミュート解除' : 'スピーカーミュート'}
              >
                {isDeafened ? <VolumeX className="w-4 h-4" /> : <Headphones className="w-4 h-4" />}
              </button>

              <button
                id="btn-user-open-settings"
                onClick={() => setIsSettingsModalOpen(true)}
                className="p-1.5 rounded text-[#b5bac1] hover:text-white hover:bg-[#35373c] transition"
                title="ユーザー設定"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="text-xs text-[#949ba4]">ゲスト接続待機中</div>
        )}
      </div>
    </div>
  );
};
