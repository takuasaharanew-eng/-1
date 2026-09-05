import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User } from '../types';
import { MessageSquare, Copy, Check, Shield, Circle } from 'lucide-react';

export const MembersSidebar: React.FC = () => {
  const { users, currentUser, isMembersSidebarOpen, currentServer } = useApp();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isMembersSidebarOpen) return null;

  // Filter members of current server
  const serverUsers = users.filter(u => currentServer?.memberIds.includes(u.id));
  const onlineUsers = serverUsers.filter(u => u.status !== 'offline');
  const offlineUsers = serverUsers.filter(u => u.status === 'offline');

  const copyUserId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-60 bg-[#2b2d31] border-l border-[#1f2023] flex flex-col shrink-0 select-none overflow-y-auto p-3 space-y-4 text-xs scrollbar-thin">
      {/* ONLINE MEMBERS */}
      <div>
        <div className="text-[11px] font-bold text-[#949ba4] uppercase tracking-wider px-2 mb-1">
          オンライン — {onlineUsers.length}
        </div>

        <div className="space-y-0.5">
          {onlineUsers.map(user => {
            const isMe = user.id === currentUser?.id;
            return (
              <div
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-[#35373c] text-[#dbdee1] hover:text-white transition cursor-pointer group"
              >
                {/* Avatar with status dot */}
                <div className="relative shrink-0">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white font-bold"
                    style={{ backgroundColor: user.avatarColor || '#5865F2' }}
                  >
                    {user.avatarIcon || user.displayName?.slice(0, 1) || '👤'}
                  </div>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#2b2d31] ${
                      user.status === 'online'
                        ? 'bg-[#23a55a]'
                        : user.status === 'idle'
                        ? 'bg-[#f0b232]'
                        : user.status === 'dnd'
                        ? 'bg-[#f23f43]'
                        : 'bg-[#80848e]'
                    }`}
                  />
                </div>

                <div className="truncate flex-1">
                  <div className="font-medium text-xs truncate flex items-center gap-1">
                    <span className="truncate">{user.displayName}</span>
                    {isMe && (
                      <span className="text-[9px] px-1 rounded bg-[#5865F2]/20 text-[#5865F2] font-normal">
                        自分
                      </span>
                    )}
                  </div>
                  {user.customStatus ? (
                    <div className="text-[10px] text-[#949ba4] truncate">{user.customStatus}</div>
                  ) : (
                    <div className="text-[10px] text-[#949ba4] truncate">@{user.username}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* OFFLINE MEMBERS */}
      {offlineUsers.length > 0 && (
        <div>
          <div className="text-[11px] font-bold text-[#949ba4] uppercase tracking-wider px-2 mb-1">
            オフライン — {offlineUsers.length}
          </div>

          <div className="space-y-0.5 opacity-60">
            {offlineUsers.map(user => (
              <div
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-[#35373c] text-[#949ba4] hover:text-white transition cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white font-bold bg-[#4e5058] shrink-0">
                  {user.avatarIcon || user.displayName?.slice(0, 1)}
                </div>
                <div className="truncate flex-1">
                  <div className="font-medium text-xs truncate">{user.displayName}</div>
                  <div className="text-[10px] text-[#949ba4] truncate">@{user.username}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Profile Popover Modal */}
      {selectedUser && (
        <div
          onClick={() => setSelectedUser(null)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-xs bg-[#232428] rounded-2xl overflow-hidden border border-[#35363c] shadow-2xl text-[#dbdee1]"
          >
            {/* Banner */}
            <div
              className="h-20 w-full relative"
              style={{ backgroundColor: selectedUser.avatarColor || '#5865F2' }}
            />

            <div className="px-4 pb-4 relative pt-10">
              {/* Floating Avatar */}
              <div
                className="absolute -top-9 left-4 w-18 h-18 rounded-full border-4 border-[#232428] flex items-center justify-center text-3xl shadow-xl"
                style={{ backgroundColor: selectedUser.avatarColor || '#5865F2' }}
              >
                {selectedUser.avatarIcon || selectedUser.displayName.slice(0, 1)}
              </div>

              <div className="font-bold text-lg text-white">{selectedUser.displayName}</div>
              <div className="text-xs text-[#949ba4]">@{selectedUser.username}</div>

              {selectedUser.customStatus && (
                <div className="mt-2.5 p-2 rounded-lg bg-[#111214] text-xs text-white font-medium border border-[#2b2d31]">
                  💬 {selectedUser.customStatus}
                </div>
              )}

              <div className="h-[1px] bg-[#35363c] my-3" />

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[#949ba4] block text-[10px] uppercase font-bold">自己紹介</span>
                  <p className="mt-0.5 text-[#dbdee1] whitespace-pre-wrap">
                    {selectedUser.bio || '自己紹介はありません'}
                  </p>
                </div>

                <div>
                  <span className="text-[#949ba4] block text-[10px] uppercase font-bold">ステータス</span>
                  <div className="flex items-center gap-1.5 mt-1 capitalize text-white">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        selectedUser.status === 'online'
                          ? 'bg-[#23a55a]'
                          : selectedUser.status === 'idle'
                          ? 'bg-[#f0b232]'
                          : selectedUser.status === 'dnd'
                          ? 'bg-[#f23f43]'
                          : 'bg-[#80848e]'
                      }`}
                    />
                    <span>{selectedUser.status}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-[#35363c] flex items-center justify-between">
                <button
                  onClick={() => copyUserId(selectedUser.id)}
                  className="flex items-center gap-1 text-[11px] text-[#949ba4] hover:text-white transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#23a55a]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'IDコピー完了' : 'ユーザーIDをコピー'}</span>
                </button>

                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-3 py-1 bg-[#35373c] hover:bg-[#404249] text-white rounded text-xs transition"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
