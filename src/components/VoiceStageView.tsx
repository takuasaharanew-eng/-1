import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Mic,
  MicOff,
  Headphones,
  PhoneOff,
  Monitor,
  Volume2,
  VolumeX,
  Sparkles,
  ChevronDown,
  X,
  Volume1,
  Radio,
  Sliders,
  Bell,
} from 'lucide-react';
import { SoundEffectType } from '../lib/soundboard';

const SOUNDBOARD_ITEMS: { name: string; sound: SoundEffectType; icon: string }[] = [
  { name: 'エアホーン', sound: 'airhorn', icon: '📢' },
  { name: 'ファンファーレ', sound: 'tada', icon: '🎉' },
  { name: 'アヒル', sound: 'quack', icon: '🦆' },
  { name: '拍手喝采', sound: 'applause', icon: '👏' },
  { name: 'GG (ナイスゲーム)', sound: 'gg', icon: '🎮' },
  { name: '勝利ファンファーレ', sound: 'victory', icon: '🏆' },
];

export const VoiceStageView: React.FC = () => {
  const {
    activeVoiceChannelId,
    servers,
    voiceParticipants,
    currentUser,
    isMuted,
    isDeafened,
    toggleMute,
    toggleDeafen,
    leaveVoiceChannel,
    isScreenSharing,
    toggleScreenShare,
    localScreenStream,
    remoteStreams,
    speakingUsers,
    micAudioLevel,
    setPeerVolume,
    triggerSoundboard,
    setIsVoiceStageOpen,
    soundboardNotice,
  } = useApp();

  const [isSoundboardOpen, setIsSoundboardOpen] = useState(false);
  const [peerVolumes, setPeerVolumes] = useState<{ [userId: string]: number }>({});
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  // Find voice channel & server
  const currentChannel = servers
    .flatMap(s => s.channels)
    .find(c => c.id === activeVoiceChannelId);
  const currentServer = servers.find(s => s.channels.some(c => c.id === activeVoiceChannelId));

  // Attach local screen video stream
  useEffect(() => {
    if (localVideoRef.current && localScreenStream) {
      localVideoRef.current.srcObject = localScreenStream;
    }
  }, [localScreenStream]);

  if (!activeVoiceChannelId || !currentChannel) return null;

  const handleVolumeChange = (userId: string, val: number) => {
    setPeerVolumes(prev => ({ ...prev, [userId]: val }));
    setPeerVolume(userId, val / 100);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#111214] text-white relative overflow-hidden select-none">
      {/* Top Bar */}
      <div className="h-12 px-4 border-b border-[#1f2023] flex items-center justify-between bg-[#1e1f22]/80 backdrop-blur z-10">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#23a55a] animate-pulse" />
          <span className="font-bold text-sm">{currentChannel.name}</span>
          <span className="text-xs text-[#949ba4]">/ {currentServer?.name}</span>
          <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-[#23a55a]/10 text-[#23a55a] font-medium border border-[#23a55a]/20">
            WebRTC P2P 高音質
          </span>
        </div>

        {/* Minimize / Close Stage button */}
        <button
          id="btn-close-voice-stage"
          onClick={() => setIsVoiceStageOpen(false)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#2b2d31] hover:bg-[#35373c] text-xs text-[#dbdee1] transition"
        >
          <X className="w-3.5 h-3.5" />
          <span>チャットに戻る (通話継続)</span>
        </button>
      </div>

      {/* Soundboard Live Notification Banner */}
      {soundboardNotice && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 px-4 py-2 bg-[#5865F2] text-white text-xs font-bold rounded-full shadow-xl flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4" />
          <span>
            {soundboardNotice.userName} がサウンド「{soundboardNotice.sound}」を再生しました！
          </span>
        </div>
      )}

      {/* Participants Grid */}
      <div className="flex-1 p-6 overflow-y-auto flex items-center justify-center">
        <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-center justify-center">
          {voiceParticipants.map(participant => {
            const isLocal = participant.userId === currentUser?.id;
            const isSpeaking = speakingUsers.has(participant.userId);
            const remoteStream = remoteStreams.get(participant.userId);
            const userVol = peerVolumes[participant.userId] ?? 100;

            return (
              <div
                key={participant.userId}
                className={`relative aspect-video bg-[#2b2d31] rounded-2xl overflow-hidden border-2 transition-all flex flex-col items-center justify-center p-4 shadow-xl ${
                  isSpeaking
                    ? 'border-[#23a55a] shadow-[0_0_20px_rgba(35,165,90,0.35)]'
                    : 'border-[#1f2023]'
                }`}
              >
                {/* If screen sharing video */}
                {isLocal && isScreenSharing && localScreenStream ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-contain bg-black"
                  />
                ) : !isLocal && participant.isScreenSharing && remoteStream ? (
                  <video
                    autoPlay
                    playsInline
                    ref={el => {
                      if (el && el.srcObject !== remoteStream) {
                        el.srcObject = remoteStream;
                      }
                    }}
                    className="absolute inset-0 w-full h-full object-contain bg-black"
                  />
                ) : (
                  /* Avatar View */
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div
                      className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-lg transition-all ${
                        isSpeaking
                          ? 'ring-4 ring-[#23a55a] scale-105 shadow-[0_0_25px_#23a55a]'
                          : ''
                      }`}
                      style={{ backgroundColor: participant.user?.avatarColor || '#5865F2' }}
                    >
                      {participant.user?.avatarIcon || participant.user?.displayName?.slice(0, 1) || '👤'}
                    </div>

                    <div className="text-center">
                      <div className="font-bold text-sm text-white flex items-center justify-center gap-1.5">
                        <span>{participant.user?.displayName || 'ユーザー'}</span>
                        {isLocal && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#5865F2] text-white">
                            あなた
                          </span>
                        )}
                      </div>
                      {participant.user?.customStatus && (
                        <div className="text-[11px] text-[#949ba4] mt-0.5 truncate max-w-[160px]">
                          {participant.user.customStatus}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Bottom badges & volume control */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10">
                  <div className="flex items-center gap-1.5 bg-[#111214]/80 backdrop-blur px-2.5 py-1 rounded-full text-xs">
                    <span className="font-medium text-white truncate max-w-[120px]">
                      {participant.user?.displayName}
                    </span>
                    {participant.isDeafened ? (
                      <VolumeX className="w-3.5 h-3.5 text-[#f23f43]" />
                    ) : participant.isMuted ? (
                      <MicOff className="w-3.5 h-3.5 text-[#f23f43]" />
                    ) : (
                      <Mic className="w-3.5 h-3.5 text-[#23a55a]" />
                    )}
                  </div>

                  {/* Volume Slider for Remote Peers */}
                  {!isLocal && (
                    <div className="flex items-center gap-1 bg-[#111214]/80 backdrop-blur px-2 py-1 rounded-full group/vol">
                      <Volume1 className="w-3 h-3 text-[#949ba4]" />
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={userVol}
                        onChange={e => handleVolumeChange(participant.userId, Number(e.target.value))}
                        className="w-12 h-1 accent-[#5865F2] cursor-pointer"
                        title={`音量: ${userVol}%`}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Bottom Discord-style Call Control Bar */}
      <div className="p-4 flex flex-col items-center justify-center z-20">
        {/* Live Mic Input Level Meter */}
        <div className="mb-2 flex items-center gap-2 bg-[#1e1f22]/90 backdrop-blur px-3 py-1 rounded-full border border-[#2b2d31]">
          <span className="text-[10px] text-[#949ba4] font-medium">マイク入力音量:</span>
          <div className="w-24 h-1.5 bg-[#313338] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-75 ${
                isMuted ? 'bg-transparent' : micAudioLevel > 15 ? 'bg-[#23a55a]' : 'bg-[#5865F2]'
              }`}
              style={{ width: `${isMuted ? 0 : micAudioLevel}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-[#949ba4]">
            {isMuted ? 'Muted' : `${micAudioLevel}%`}
          </span>
        </div>

        {/* Primary Controls */}
        <div className="flex items-center gap-3 bg-[#1e1f22] p-2 rounded-2xl border border-[#2b2d31] shadow-2xl">
          {/* Mute Toggle */}
          <button
            id="btn-stage-mute"
            onClick={toggleMute}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
              isMuted
                ? 'bg-[#f23f43] text-white hover:bg-[#d83a3e]'
                : 'bg-[#313338] text-white hover:bg-[#3f4147]'
            }`}
            title={isMuted ? 'ミュート解除' : 'ミュート'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Deafen Toggle */}
          <button
            id="btn-stage-deafen"
            onClick={toggleDeafen}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
              isDeafened
                ? 'bg-[#f23f43] text-white hover:bg-[#d83a3e]'
                : 'bg-[#313338] text-white hover:bg-[#3f4147]'
            }`}
            title={isDeafened ? 'スピーカーミュート解除' : 'スピーカーミュート'}
          >
            {isDeafened ? <VolumeX className="w-5 h-5" /> : <Headphones className="w-5 h-5" />}
          </button>

          {/* Screen Share Toggle */}
          <button
            id="btn-stage-screenshare"
            onClick={toggleScreenShare}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
              isScreenSharing
                ? 'bg-[#23a55a] text-white hover:bg-[#1f9250]'
                : 'bg-[#313338] text-white hover:bg-[#3f4147]'
            }`}
            title={isScreenSharing ? '画面共有を停止' : '画面を共有'}
          >
            <Monitor className="w-5 h-5" />
          </button>

          {/* Soundboard Button */}
          <div className="relative">
            <button
              id="btn-stage-soundboard"
              onClick={() => setIsSoundboardOpen(!isSoundboardOpen)}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                isSoundboardOpen
                  ? 'bg-[#5865F2] text-white'
                  : 'bg-[#313338] text-white hover:bg-[#3f4147]'
              }`}
              title="サウンドボード (効果音)"
            >
              <Sparkles className="w-5 h-5" />
            </button>

            {/* Soundboard Popover */}
            {isSoundboardOpen && (
              <div className="absolute bottom-15 left-1/2 -translate-x-1/2 w-64 bg-[#232428] rounded-xl p-3 border border-[#35363c] shadow-2xl z-30">
                <div className="text-xs font-bold text-[#dbdee1] mb-2 flex items-center justify-between">
                  <span>サウンドボード (全員に再生)</span>
                  <span className="text-[10px] text-[#949ba4]">Web Audio</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {SOUNDBOARD_ITEMS.map(item => (
                    <button
                      key={item.sound}
                      onClick={() => {
                        triggerSoundboard(item.sound);
                      }}
                      className="p-2 rounded-lg bg-[#2b2d31] hover:bg-[#5865F2] text-white text-xs flex items-center gap-1.5 transition font-medium text-left"
                    >
                      <span className="text-sm">{item.icon}</span>
                      <span className="truncate">{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Disconnect Button */}
          <button
            id="btn-stage-disconnect"
            onClick={leaveVoiceChannel}
            className="w-12 h-12 rounded-xl bg-[#f23f43] hover:bg-[#d83a3e] text-white flex items-center justify-center transition-all shadow-lg"
            title="通話から切断"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
