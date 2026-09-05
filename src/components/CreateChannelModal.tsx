import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ChannelType } from '../types';
import { Hash, Volume2, X } from 'lucide-react';

export const CreateChannelModal: React.FC = () => {
  const { isCreateChannelModalOpen, setIsCreateChannelModalOpen, createChannel, currentServer } = useApp();

  const [channelType, setChannelType] = useState<ChannelType>('text');
  const [channelName, setChannelName] = useState('');
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isCreateChannelModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelName.trim()) return;

    setIsLoading(true);
    await createChannel(channelName.trim(), channelType, topic.trim());
    setIsLoading(false);
    setChannelName('');
    setTopic('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-[#313338] text-[#dbdee1] rounded-2xl shadow-2xl border border-[#3f4147] overflow-hidden">
        <div className="p-5 flex items-center justify-between border-b border-[#2b2d31]">
          <div>
            <h3 className="text-lg font-bold text-white">チャンネルを作成</h3>
            <div className="text-xs text-[#949ba4]">{currentServer?.name}</div>
          </div>
          <button
            onClick={() => setIsCreateChannelModalOpen(false)}
            className="text-[#949ba4] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Channel Type */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#b5bac1] mb-2">
              チャンネルの種類
            </label>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setChannelType('text')}
                className={`w-full p-3 rounded-xl border flex items-center gap-3 text-left transition ${
                  channelType === 'text'
                    ? 'bg-[#5865F2]/15 border-[#5865F2] text-white'
                    : 'bg-[#2b2d31] border-transparent hover:bg-[#35373c] text-[#949ba4]'
                }`}
              >
                <Hash className="w-6 h-6 text-[#5865F2] shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-white">テキスト</div>
                  <div className="text-[11px] text-[#949ba4]">
                    メッセージ、画像、絵文字、ステッカーなどを投稿
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setChannelType('voice')}
                className={`w-full p-3 rounded-xl border flex items-center gap-3 text-left transition ${
                  channelType === 'voice'
                    ? 'bg-[#5865F2]/15 border-[#5865F2] text-white'
                    : 'bg-[#2b2d31] border-transparent hover:bg-[#35373c] text-[#949ba4]'
                }`}
              >
                <Volume2 className="w-6 h-6 text-[#23a55a] shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-white">ボイス (通話)</div>
                  <div className="text-[11px] text-[#949ba4]">
                    音声通話、画面共有、サウンドボードで通話
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Channel Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#b5bac1] mb-1.5">
              チャンネル名 <span className="text-[#ED4245]">*</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-[#949ba4] text-sm">
                {channelType === 'text' ? '#' : '🔊'}
              </span>
              <input
                type="text"
                required
                placeholder="new-channel"
                value={channelName}
                onChange={e => setChannelName(e.target.value)}
                className="w-full bg-[#1e1f22] text-white rounded-lg pl-8 pr-3 py-2 text-sm border border-[#2b2d31] focus:outline-none focus:border-[#5865F2]"
                autoFocus
              />
            </div>
          </div>

          {/* Topic */}
          {channelType === 'text' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#b5bac1] mb-1.5">
                トピック (任意)
              </label>
              <input
                type="text"
                placeholder="このチャンネルの目的やルール"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                className="w-full bg-[#1e1f22] text-white rounded-lg px-3 py-2 text-sm border border-[#2b2d31] focus:outline-none focus:border-[#5865F2]"
              />
            </div>
          )}

          {/* Footer buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#2b2d31]">
            <button
              type="button"
              onClick={() => setIsCreateChannelModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-[#dbdee1] hover:underline"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isLoading || !channelName.trim()}
              className="px-5 py-2 bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-semibold rounded-lg shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? '作成中...' : 'チャンネルを作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
