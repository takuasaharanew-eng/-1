import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Message, Attachment } from '../types';
import {
  Hash,
  Send,
  PlusCircle,
  Smile,
  Users,
  Trash2,
  Reply,
  Volume2,
  Image as ImageIcon,
  Sparkles,
  X,
} from 'lucide-react';

const COMMON_EMOJIS = ['👍', '❤️', '😂', '🎉', '🔥', '👏', '👀', '✨', '☕', '🚀'];

export const ChatArea: React.FC = () => {
  const {
    currentChannel,
    currentServer,
    messages,
    sendMessage,
    deleteMessage,
    addReaction,
    currentUser,
    sendTyping,
    typingUsers,
    isMembersSidebarOpen,
    setIsMembersSidebarOpen,
    activeVoiceChannelId,
    setIsVoiceStageOpen,
  } = useApp();

  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const typingTimerRef = useRef<any>(null);

  const channelMessages = currentChannel ? messages[currentChannel.id] || [] : [];

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [channelMessages.length]);

  if (!currentChannel) {
    return (
      <div className="flex-1 bg-[#313338] flex items-center justify-center text-[#949ba4]">
        チャンネルを選択してください
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);

    // Typing notification throttled
    sendTyping(true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      sendTyping(false);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!inputText.trim() && attachments.length === 0) return;

    sendMessage(
      inputText.trim(),
      attachments.length > 0 ? attachments : undefined,
      replyingTo
        ? {
            id: replyingTo.id,
            senderName: replyingTo.senderName,
            content: replyingTo.content,
          }
        : undefined
    );

    setInputText('');
    setAttachments([]);
    setReplyingTo(null);
    setShowEmojiPicker(false);
    sendTyping(false);
  };

  // Handle local file upload (e.g. screenshot or photo)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const newAttachment: Attachment = {
        id: `att-${Date.now()}`,
        name: file.name,
        url: dataUrl,
        type: file.type.startsWith('image/') ? 'image' : 'file',
        size: file.size,
      };
      setAttachments(prev => [...prev, newAttachment]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const formatTimestamp = (time: number) => {
    const date = new Date(time);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    if (isToday) {
      return `今日 ${hours}:${minutes}`;
    }
    return `${date.getMonth() + 1}/${date.getDate()} ${hours}:${minutes}`;
  };

  // Typing users excluding current user
  const otherTypingUsers = Object.entries(typingUsers)
    .filter(([uid]) => uid !== currentUser?.id)
    .map(([, name]) => name);

  return (
    <div className="flex-1 flex flex-col bg-[#313338] min-w-0">
      {/* Channel Header Bar */}
      <div className="h-12 px-4 border-b border-[#1f2023] flex items-center justify-between shadow-sm z-10 shrink-0">
        <div className="flex items-center gap-2 truncate">
          <Hash className="w-5 h-5 text-[#80848e] shrink-0" />
          <span className="font-bold text-white text-sm truncate">{currentChannel.name}</span>
          {currentChannel.topic && (
            <>
              <span className="text-[#4e5058] mx-1">|</span>
              <span className="text-xs text-[#949ba4] truncate max-w-[320px]">
                {currentChannel.topic}
              </span>
            </>
          )}
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {activeVoiceChannelId && (
            <button
              id="btn-open-active-voice-stage"
              onClick={() => setIsVoiceStageOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#23a55a]/10 hover:bg-[#23a55a]/20 text-[#23a55a] text-xs font-semibold border border-[#23a55a]/30 transition"
              title="通話画面を開く"
            >
              <Volume2 className="w-3.5 h-3.5 animate-pulse" />
              <span>通話中</span>
            </button>
          )}

          <button
            id="btn-toggle-members-sidebar"
            onClick={() => setIsMembersSidebarOpen(!isMembersSidebarOpen)}
            className={`p-1.5 rounded transition ${
              isMembersSidebarOpen
                ? 'text-white bg-[#35373c]'
                : 'text-[#b5bac1] hover:text-white hover:bg-[#35373c]'
            }`}
            title="メンバーリスト表示"
          >
            <Users className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">
        {/* Welcome Banner */}
        <div className="pt-8 pb-4">
          <div className="w-16 h-16 rounded-full bg-[#35373c] flex items-center justify-center text-white mb-2">
            <Hash className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">#{currentChannel.name} へようこそ！</h1>
          <p className="text-xs text-[#949ba4] mt-1">
            これは #{currentChannel.name} チャンネルの始まりです。メッセージを送信してみましょう！
          </p>
        </div>

        <div className="h-[1px] bg-[#3f4147]" />

        {/* Messages List */}
        {channelMessages.map(msg => {
          const isMe = msg.senderId === currentUser?.id;

          return (
            <div
              key={msg.id}
              className="group relative flex gap-3.5 hover:bg-[#2e3035] -mx-4 px-4 py-1.5 rounded transition-colors"
            >
              {/* Floating Quick Action Bar on Hover */}
              <div className="absolute right-4 -top-3 hidden group-hover:flex items-center gap-1 bg-[#313338] border border-[#2b2d31] rounded-lg p-1 shadow-lg z-10">
                {COMMON_EMOJIS.slice(0, 4).map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => addReaction(msg.id, emoji)}
                    className="w-6 h-6 flex items-center justify-center hover:bg-[#35373c] rounded text-sm transition"
                    title={`リアクション: ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}

                <button
                  onClick={() => setReplyingTo(msg)}
                  className="p-1 hover:bg-[#35373c] rounded text-[#b5bac1] hover:text-white transition"
                  title="返信"
                >
                  <Reply className="w-3.5 h-3.5" />
                </button>

                {isMe && (
                  <button
                    onClick={() => deleteMessage(msg.id)}
                    className="p-1 hover:bg-[#f23f43]/20 rounded text-[#f23f43] transition"
                    title="削除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Avatar */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 text-base shadow-sm mt-0.5"
                style={{ backgroundColor: msg.senderAvatarColor || '#5865F2' }}
              >
                {msg.senderAvatarIcon || msg.senderName.slice(0, 1)}
              </div>

              {/* Message Details */}
              <div className="flex-1 min-w-0">
                {/* Reply context if exists */}
                {msg.replyTo && (
                  <div className="flex items-center gap-1.5 text-xs text-[#b5bac1] mb-1 pl-2 border-l-2 border-[#4e5058]">
                    <span className="font-semibold text-white">@{msg.replyTo.senderName}</span>
                    <span className="truncate max-w-sm text-[11px] text-[#949ba4]">
                      {msg.replyTo.content}
                    </span>
                  </div>
                )}

                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-white text-sm hover:underline cursor-pointer">
                    {msg.senderName}
                  </span>
                  <span className="text-[10px] text-[#949ba4] font-medium">
                    {formatTimestamp(msg.createdAt)}
                  </span>
                </div>

                {/* Message Content */}
                {msg.content && (
                  <div className="text-sm text-[#dbdee1] mt-1 break-words whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </div>
                )}

                {/* Attachments */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {msg.attachments.map(att => (
                      <div key={att.id} className="relative rounded-lg overflow-hidden max-w-sm">
                        {att.type === 'image' ? (
                          <img
                            src={att.url}
                            alt={att.name}
                            onClick={() => setPreviewImage(att.url)}
                            className="max-h-60 rounded-lg object-contain cursor-zoom-in border border-[#1f2023] hover:opacity-95 transition"
                          />
                        ) : (
                          <div className="p-3 bg-[#2b2d31] rounded-lg border border-[#1f2023] flex items-center gap-2 text-xs text-[#dbdee1]">
                            <ImageIcon className="w-4 h-4 text-[#5865F2]" />
                            <span className="truncate">{att.name}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Reactions Bar */}
                {msg.reactions && msg.reactions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {msg.reactions.map(r => {
                      const hasReacted = currentUser && r.users.includes(currentUser.id);
                      return (
                        <button
                          key={r.emoji}
                          onClick={() => addReaction(msg.id, r.emoji)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs transition border ${
                            hasReacted
                              ? 'bg-[#5865F2]/20 border-[#5865F2] text-white'
                              : 'bg-[#2b2d31] border-transparent hover:bg-[#35373c] text-[#b5bac1]'
                          }`}
                        >
                          <span>{r.emoji}</span>
                          <span className="font-semibold text-[11px]">{r.count}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Typing Status Indicator */}
      <div className="h-5 px-4 text-[11px] text-[#949ba4] flex items-center">
        {otherTypingUsers.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#5865F2] animate-bounce" />
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#5865F2] animate-bounce [animation-delay:0.15s]" />
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#5865F2] animate-bounce [animation-delay:0.3s]" />
            <span className="font-bold text-white">
              {otherTypingUsers.join(', ')}
            </span>
            <span>が入力中...</span>
          </div>
        )}
      </div>

      {/* Message Input Box Area */}
      <div className="p-4 pt-1">
        <div className="bg-[#383a40] rounded-lg p-2.5 relative border border-[#313338] focus-within:border-[#5865F2] transition">
          {/* Reply bar banner */}
          {replyingTo && (
            <div className="flex items-center justify-between bg-[#2b2d31] p-2 rounded mb-2 text-xs text-[#b5bac1]">
              <div className="flex items-center gap-2 truncate">
                <Reply className="w-3.5 h-3.5 text-[#5865F2]" />
                <span>
                  <strong className="text-white">@{replyingTo.senderName}</strong> に返信中
                </span>
                <span className="truncate text-[11px] text-[#949ba4]">"{replyingTo.content}"</span>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="text-[#949ba4] hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Pending Attachments preview */}
          {attachments.length > 0 && (
            <div className="flex gap-2 mb-2 flex-wrap">
              {attachments.map((att, idx) => (
                <div key={idx} className="relative group bg-[#2b2d31] rounded p-1 border border-[#1f2023]">
                  {att.type === 'image' && (
                    <img src={att.url} alt="upload" className="w-16 h-16 object-cover rounded" />
                  )}
                  <button
                    onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#f23f43] text-white flex items-center justify-center text-[10px]"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Textarea + Action Icons */}
          <div className="flex items-end gap-2">
            {/* File Upload Trigger */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              id="btn-upload-file"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-full hover:bg-[#4e5058] text-[#b5bac1] hover:text-white transition"
              title="画像を添付"
            >
              <PlusCircle className="w-5 h-5" />
            </button>

            {/* Input */}
            <textarea
              id="chat-message-input"
              rows={1}
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={`#${currentChannel.name} にメッセージを送信 (Shift + Enter で改行)`}
              className="flex-1 bg-transparent text-white text-sm placeholder-[#80848e] resize-none outline-none max-h-32 py-1 leading-relaxed"
            />

            {/* Emoji picker toggle */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-1.5 rounded-full hover:bg-[#4e5058] text-[#b5bac1] hover:text-white transition"
                title="絵文字"
              >
                <Smile className="w-5 h-5" />
              </button>

              {showEmojiPicker && (
                <div className="absolute bottom-10 right-0 bg-[#2b2d31] rounded-xl p-2.5 shadow-2xl border border-[#1f2023] z-30 grid grid-cols-5 gap-1 w-48">
                  {COMMON_EMOJIS.map(em => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => {
                        setInputText(prev => prev + em);
                        setShowEmojiPicker(false);
                      }}
                      className="p-2 hover:bg-[#35373c] rounded text-lg flex items-center justify-center transition"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Send Button */}
            <button
              id="btn-send-message"
              type="button"
              onClick={handleSend}
              disabled={!inputText.trim() && attachments.length === 0}
              className="p-2 rounded-lg bg-[#5865F2] hover:bg-[#4752c4] text-white transition disabled:opacity-40 disabled:hover:bg-[#5865F2] cursor-pointer"
              title="送信"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Image Zoom Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-sm cursor-zoom-out"
        >
          <img
            src={previewImage}
            alt="Preview"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
