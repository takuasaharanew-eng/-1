import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { SidebarServers } from './components/SidebarServers';
import { SidebarChannels } from './components/SidebarChannels';
import { ChatArea } from './components/ChatArea';
import { VoiceStageView } from './components/VoiceStageView';
import { MembersSidebar } from './components/MembersSidebar';
import { AuthModal } from './components/AuthModal';
import { UserSettingsModal } from './components/UserSettingsModal';
import { CreateChannelModal } from './components/CreateChannelModal';
import { CreateServerModal } from './components/CreateServerModal';

const DiscordApp: React.FC = () => {
  const { isVoiceStageOpen } = useApp();

  return (
    <div className="flex h-screen w-screen bg-[#1e1f22] text-[#dbdee1] overflow-hidden font-sans">
      {/* 1. Server Icons Rail (Left) */}
      <SidebarServers />

      {/* 2. Channel Tree & User Tray (Middle Left) */}
      <SidebarChannels />

      {/* 3. Main Center Area (Voice Stage or Text Chat) */}
      <div className="flex-1 flex min-w-0 h-full overflow-hidden">
        {isVoiceStageOpen ? <VoiceStageView /> : <ChatArea />}
        {/* 4. Members Sidebar (Right) */}
        {!isVoiceStageOpen && <MembersSidebar />}
      </div>

      {/* Modals */}
      <AuthModal />
      <UserSettingsModal />
      <CreateChannelModal />
      <CreateServerModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <DiscordApp />
    </AppProvider>
  );
}
