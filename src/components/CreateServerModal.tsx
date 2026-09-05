import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Sparkles } from 'lucide-react';

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

export const CreateServerModal: React.FC = () => {
  const { isCreateServerModalOpen, setIsCreateServerModalOpen, createServer } = useApp();

  const [serverName, setServerName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [isLoading, setIsLoading] = useState(false);

  if (!isCreateServerModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverName.trim()) return;

    setIsLoading(true);
    await createServer(serverName.trim(), selectedColor, description.trim());
    setIsLoading(false);
    setServerName('');
    setDescription('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-[#313338] text-[#dbdee1] rounded-2xl shadow-2xl border border-[#3f4147] overflow-hidden">
        <div className="p-6 text-center border-b border-[#2b2d31] relative">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold mx-auto mb-2 shadow-lg"
            style={{ backgroundColor: selectedColor }}
          >
            {serverName.trim() ? serverName.trim().slice(0, 2) : '🌟'}
          </div>
          <h3 className="text-xl font-bold text-white">サーバーをカスタマイズ</h3>
          <p className="text-xs text-[#949ba4] mt-1">
            新しいサーバーを作って、友達とチャットやボイス通話を楽しもう！
          </p>

          <button
            onClick={() => setIsCreateServerModalOpen(false)}
            className="absolute top-4 right-4 text-[#949ba4] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Server Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#b5bac1] mb-1.5">
              サーバー名 <span className="text-[#ED4245]">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="例: たかしのゲーム部屋, 読書クラブ"
              value={serverName}
              onChange={e => setServerName(e.target.value)}
              className="w-full bg-[#1e1f22] text-white rounded-lg px-3.5 py-2.5 text-sm border border-[#2b2d31] focus:outline-none focus:border-[#5865F2]"
              autoFocus
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#b5bac1] mb-1.5">
              サーバーアイコンカラー
            </label>
            <div className="flex gap-2.5">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    selectedColor === c
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-[#313338] scale-110'
                      : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#b5bac1] mb-1.5">
              サーバー概要 (任意)
            </label>
            <input
              type="text"
              placeholder="このサーバーについての説明"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-[#1e1f22] text-white rounded-lg px-3.5 py-2 text-sm border border-[#2b2d31] focus:outline-none focus:border-[#5865F2]"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-between border-t border-[#2b2d31]">
            <button
              type="button"
              onClick={() => setIsCreateServerModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-[#dbdee1] hover:underline"
            >
              戻る
            </button>
            <button
              type="submit"
              disabled={isLoading || !serverName.trim()}
              className="px-6 py-2.5 bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-semibold rounded-lg shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? '作成中...' : '新規サーバー作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
