import { useState } from 'react';
import { InGameWebMenu } from './InGameWebMenu';
import { type Language } from '../utils/i18n';

export function InGameOverlayRoot() {
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('elauncher_app_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.language === 'ru' || parsed.language === 'en_uk' || parsed.language === 'en') {
          return parsed.language;
        }
      }
    } catch {}
    return 'en';
  });

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    try {
      const saved = localStorage.getItem('elauncher_app_settings');
      const settings = saved ? JSON.parse(saved) : {};
      settings.language = newLang;
      localStorage.setItem('elauncher_app_settings', JSON.stringify(settings));
    } catch {}
    if (window.electronAPI?.updateLanguage) {
      window.electronAPI.updateLanguage(newLang);
    }
  };

  const handleTriggerGameAction = async (action: string) => {
    try {
      if (window.electronAPI?.triggerGameMenuAction) {
        await window.electronAPI.triggerGameMenuAction(action);
      } else {
        await fetch('http://127.0.0.1:28751/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        });
      }
    } catch (e) {
      console.error('Trigger game action failed:', e);
    }
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#050608]">
      <InGameWebMenu
        language={language}
        onLanguageChange={handleLanguageChange}
        onSingleplayer={() => handleTriggerGameAction('singleplayer')}
        onMultiplayer={() => handleTriggerGameAction('multiplayer')}
        onSettings={() => handleTriggerGameAction('settings')}
        onVanilla={() => handleTriggerGameAction('vanilla')}
        onQuit={() => handleTriggerGameAction('quit')}
      />
    </div>
  );
}
