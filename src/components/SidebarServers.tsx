import React from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Compass, MessageSquare, Radio, Volume2 } from 'lucide-react';

export const SidebarServers: React.FC = () => {
  const {
    servers,
    currentServerId,
    selectServer,
    setIsCreateServerModalOpen,
    activeVoiceChannelId,
    isConnected,
  } = useApp();

  return (
    <div className="w-[72px] bg-[#1e1f22] flex flex-col items-center py-3 select-none z-20 shrink-0 gap-2 border-r border-[#1a1b1e]">
      {/* Home / Direct Messages button */}
      <div className="relative group flex items-center justify-center w-full">
        {/* Active Pill Indicator */}
        <div className="absolute left-0 w-1 bg-white rounded-r transition-all duration-200 h-2 group-hover:h-5 opacity-0 group-hover:opacity-100" />
        <button
          id="btn-nav-home"
          onClick={() => {
            if (servers.length > 0) selectServer(servers[0].id);
          }}
          className="w-12 h-12 rounded-[24px] hover:rounded-[16px] bg-[#313338] hover:bg-[#5865F2] text-[#dbdee1] hover:text-white flex items-center justify-center transition-all duration-200 group-hover:scale-105 shadow-md"
          title="ホーム・コミュニティ"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      </div>

      <div className="w-8 h-[2px] bg-[#35363c] rounded-full my-0.5" />

      {/* Server List */}
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col items-center gap-2 scrollbar-none py-1">
        {servers.map(server => {
          const isActive = server.id === currentServerId;
          const hasActiveVoice = server.channels.some(c => c.id === activeVoiceChannelId);

          return (
            <div key={server.id} className="relative group flex items-center justify-center w-full">
              {/* Pill Indicator on left */}
              <div
                className={`absolute left-0 w-1 bg-white rounded-r transition-all duration-200 ${
                  isActive ? 'h-10 opacity-100' : 'h-2 group-hover:h-5 opacity-0 group-hover:opacity-100'
                }`}
              />

              <button
                id={`btn-server-${server.id}`}
                onClick={() => selectServer(server.id)}
                style={{ backgroundColor: server.iconBg || '#5865F2' }}
                className={`w-12 h-12 flex items-center justify-center text-white font-bold text-lg transition-all duration-200 shadow-md relative ${
                  isActive
                    ? 'rounded-[16px] ring-2 ring-white/40 shadow-[#5865F2]/30'
                    : 'rounded-[24px] hover:rounded-[16px] hover:scale-105'
                }`}
                title={server.name}
              >
                {server.icon || server.name.slice(0, 2)}

                {/* Voice active badge indicator on server icon */}
                {hasActiveVoice && (
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#57F287] border-2 border-[#1e1f22] flex items-center justify-center text-[#1e1f22] animate-pulse shadow-sm">
                    <Volume2 className="w-3 h-3" />
                  </span>
                )}
              </button>
            </div>
          );
        })}

        {/* Add Server Button */}
        <div className="relative group flex items-center justify-center w-full mt-1">
          <div className="absolute left-0 w-1 bg-white rounded-r transition-all duration-200 h-2 group-hover:h-5 opacity-0 group-hover:opacity-100" />
          <button
            id="btn-add-server"
            onClick={() => setIsCreateServerModalOpen(true)}
            className="w-12 h-12 rounded-[24px] hover:rounded-[16px] bg-[#313338] hover:bg-[#23a55a] text-[#23a55a] hover:text-white flex items-center justify-center transition-all duration-200 group-hover:scale-105 shadow-sm"
            title="サーバーを作成"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Network connection indicator */}
      <div className="pt-2 flex flex-col items-center">
        <div
          className={`w-3 h-3 rounded-full transition-colors ${
            isConnected ? 'bg-[#23a55a] shadow-sm shadow-[#23a55a]' : 'bg-[#f23f43] animate-ping'
          }`}
          title={isConnected ? 'サーバー接続中 (リアルタイム同期)' : '再接続待機中...'}
        />
      </div>
    </div>
  );
};
