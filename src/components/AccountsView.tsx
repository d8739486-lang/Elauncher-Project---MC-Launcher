import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Plus,
  Trash2,
  Check,
  Upload,
  X,
  AlertTriangle,
  Copy,
} from 'lucide-react';
import { Skin3DViewer } from './Skin3DViewer';
import type { Account } from '../types/account';
import {
  validateSkinFile,
  extractSkinAvatar,
  getDefaultSteveAvatar,
} from '../utils/skinRenderer';
import { createOfflineAccount } from '../utils/accountService';
import type { Language } from '../utils/i18n';
import { translations } from '../utils/i18n';
import { playPalateClick } from '../utils/sound';

/**
 * Avatar image component with Steve fallback
 */
export function AccountAvatar({
  account,
  size = 64,
  className = 'w-full h-full object-cover [image-rendering:pixelated]',
  onAvatarGenerated,
}: {
  account: Account;
  size?: number;
  className?: string;
  onAvatarGenerated?: (newAvatar: string) => void;
}) {
  const [avatar, setAvatar] = useState<string>(() => account.skinAvatarUrl || getDefaultSteveAvatar());

  useEffect(() => {
    if (account.skinAvatarUrl && account.skinAvatarUrl.length > 20) {
      setAvatar(account.skinAvatarUrl);
      return;
    }

    if (account.skinUrl && account.skinUrl.startsWith('data:')) {
      extractSkinAvatar(account.skinUrl, size).then((rendered) => {
        if (rendered) {
          setAvatar(rendered);
          onAvatarGenerated?.(rendered);
        }
      });
    } else {
      setAvatar(getDefaultSteveAvatar());
    }
  }, [account.skinAvatarUrl, account.skinUrl, size, onAvatarGenerated]);

  return (
    <img
      src={avatar || getDefaultSteveAvatar()}
      alt={account.username}
      onError={(e) => {
        const target = e.currentTarget;
        const fallback = getDefaultSteveAvatar();
        if (target.src !== fallback) {
          target.src = fallback;
        }
      }}
      className={className}
    />
  );
}

interface AccountsViewProps {
  accounts: Account[];
  activeAccountId: string;
  language?: Language;
  onSelectAccount: (id: string) => void;
  onAddAccount: (account: Account) => void;
  onDeleteAccount: (id: string) => void;
  onUpdateAccount: (account: Account) => void;
}

export function AccountsView({
  accounts,
  activeAccountId,
  language = 'ru',
  onSelectAccount,
  onAddAccount,
  onDeleteAccount,
  onUpdateAccount,
}: AccountsViewProps) {
  const t = translations[language];

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [selectedSkinDataUrl, setSelectedSkinDataUrl] = useState<string | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation modal state
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);

  // Profile modal state
  const [profileAccount, setProfileAccount] = useState<Account | null>(null);
  const [profileCopied, setProfileCopied] = useState(false);

  // Skin upload references
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const modalFileInputRef = useRef<HTMLInputElement | null>(null);
  const usernameInputRef = useRef<HTMLInputElement | null>(null);
  const [targetAccountForSkin, setTargetAccountForSkin] = useState<Account | null>(null);

  // Upload or replace skin for an account
  const handleSkinFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetAccountForSkin) return;

    const validation = await validateSkinFile(file);
    if (!validation.isValid || !validation.dataUrl) {
      setInputError(validation.error || 'Ошибка загрузки файла скина');
      return;
    }

    const avatarUrl = await extractSkinAvatar(validation.dataUrl, 64);
    const updated: Account = {
      ...targetAccountForSkin,
      skinUrl: validation.dataUrl,
      skinAvatarUrl: avatarUrl || targetAccountForSkin.skinAvatarUrl,
    };
    onUpdateAccount(updated);
    setProfileAccount(updated);
    setTargetAccountForSkin(null);
    e.target.value = '';
  };

  const handleModalSkinSelect = async (file: File) => {
    const validation = await validateSkinFile(file);
    if (!validation.isValid || !validation.dataUrl) {
      setInputError(validation.error || 'Неверный файл скина (нужен .PNG)');
      return;
    }
    setInputError(null);
    setSelectedSkinDataUrl(validation.dataUrl);
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setInputError(null);

    const val = usernameInput.trim();
    if (!val) {
      setInputError(language === 'ru' ? 'Введите имя игрока' : 'Enter player name');
      usernameInputRef.current?.focus();
      return;
    }

    // Standard Minecraft nick validation
    if (!/^[a-zA-Z0-9_]{3,16}$/.test(val)) {
      setInputError(
        language === 'ru'
          ? 'Имя должно быть от 3 до 16 символов (английские буквы, цифры, _)'
          : 'Name must be 3-16 chars (letters, digits, _)'
      );
      return;
    }

    const cleanNick = val.toLowerCase();
    const duplicate = accounts.find((a) => a.username.toLowerCase() === cleanNick);
    if (duplicate) {
      setInputError(
        language === 'ru'
          ? `Аккаунт с именем "${val}" уже есть в списке.`
          : `Account "${val}" already exists.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const newAcc = await createOfflineAccount(val, selectedSkinDataUrl || undefined);
      onAddAccount(newAcc);
      onSelectAccount(newAcc.id);
      setIsAddModalOpen(false);
      setUsernameInput('');
      setSelectedSkinDataUrl(null);
      setInputError(null);
    } catch (err: any) {
      setInputError(err?.message || 'Ошибка создания аккаунта');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col p-6 overflow-hidden select-none">
      {/* Hidden file input for changing skin */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".png"
        onChange={handleSkinFileChange}
        className="hidden"
      />

      {/* Header Bar */}
      <div className="flex items-center justify-between pb-5 border-b border-[#181a24] shrink-0">
        <div>
          <h2 className="text-xl font-black uppercase tracking-wider text-white font-['Barlow_Condensed',sans-serif] flex items-center gap-2.5">
            <User className="w-5 h-5 text-[#94a3b8]" />
            <span>{t.accountsTitle}</span>
          </h2>
          <p className="text-xs text-[#71788e] font-mono mt-0.5">
            {t.accountsSubtitle}
          </p>
        </div>

        {/* Add Account Button */}
        <button
          onClick={() => {
            playPalateClick(0.24);
            setInputError(null);
            setUsernameInput('');
            setSelectedSkinDataUrl(null);
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 h-9 rounded-xl bg-white hover:bg-[#e2e6f0] active:scale-95 text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer font-['Barlow_Condensed',sans-serif] shadow-sm"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>{t.accountsAddBtn}</span>
        </button>
      </div>

      {/* Accounts List */}
      <div className="flex-1 min-h-0 pt-5 overflow-y-auto pr-1">
        {accounts.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-[#64748b]">
            <span className="text-xs font-mono">{t.accountsNoAccounts}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {accounts.map((acc) => {
              const isActive = acc.id === activeAccountId;
              return (
                <div
                  key={acc.id}
                  onClick={() => {
                    playPalateClick(0.18);
                    setProfileAccount(acc);
                  }}
                  className={`group relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    isActive
                      ? 'bg-[#131620] border-[#38435f] shadow-lg ring-1 ring-[#415074]/30'
                      : 'bg-[#0f1118] hover:bg-[#141722] border-[#1d212d] hover:border-[#2b3245]'
                  }`}
                >
                  {/* Account Header */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Avatar */}
                      <div className="w-11 h-11 rounded-xl overflow-hidden bg-[#171b26] border border-[#272e40] shrink-0 [image-rendering:pixelated]">
                        <AccountAvatar
                          account={acc}
                          size={64}
                          className="w-full h-full object-cover [image-rendering:pixelated]"
                          onAvatarGenerated={(newAvatar) => {
                            onUpdateAccount({
                              ...acc,
                              skinAvatarUrl: newAvatar,
                            });
                          }}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-white tracking-wide truncate font-['Barlow_Condensed',sans-serif]">
                            {acc.username}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 mt-0.5 text-xs font-mono text-[#8a92a6]">
                          {acc.skinUrl ? (
                            <span className="text-cyan-400">Скин загружен</span>
                          ) : (
                            <span>Стандартный скин</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Select button if not active */}
                    <div className="flex items-center gap-2 shrink-0">
                      {!isActive ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            playPalateClick(0.2);
                            onSelectAccount(acc.id);
                          }}
                          className="px-3 h-8 rounded-xl bg-[#151924] hover:bg-[#202738] border border-[#283248] text-xs font-mono text-[#cbd5e1] hover:text-white transition-colors cursor-pointer"
                        >
                          {t.accountsSelectBtn}
                        </button>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-[#14231a] border border-[#214c33] text-emerald-400 font-bold text-[11px] font-mono">
                          {t.accountsActiveBadge}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Account Footer: View profile & Delete */}
                  <div className="pt-3 border-t border-[#1a1d29] flex items-center justify-between text-xs font-mono text-[#788298]">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        playPalateClick(0.18);
                        setProfileAccount(acc);
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#141822] hover:bg-[#1a202e] border border-[#273248] text-xs font-mono text-[#cbd5e1] hover:text-white transition-colors cursor-pointer"
                    >
                      <User className="w-3 h-3" />
                      <span>{t.accountViewProfile}</span>
                    </button>

                    {accounts.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          playPalateClick(0.2);
                          setAccountToDelete(acc);
                        }}
                        title={t.accountsDeleteBtn}
                        className="w-7 h-7 rounded-lg bg-transparent hover:bg-rose-950/40 text-[#64748b] hover:text-rose-400 border border-transparent hover:border-rose-900/50 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Account Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-xs cursor-pointer"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 w-full max-w-md rounded-2xl border border-[#222534] bg-[#0c0d12] shadow-[0_35px_80px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="h-14 px-6 border-b border-[#1c1f2b] flex items-center justify-between bg-[#10121a]">
                <span className="text-sm font-bold uppercase tracking-wider text-white font-['Barlow_Condensed',sans-serif]">
                  {t.accountModalTitle}
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-[#171924] hover:bg-[#282d3e] text-[#cbd5e1] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleCreateAccount} className="p-6 space-y-4">
                {/* Error Banner */}
                {inputError && (
                  <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs font-mono flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{inputError}</span>
                  </div>
                )}

                {/* Nickname input */}
                <div>
                  <label className="block text-xs font-mono text-[#8b92a5] mb-1.5">
                    {language === 'ru' ? 'Имя игрока (никнейм)' : 'Player Name'}
                  </label>
                  <input
                    ref={usernameInputRef}
                    type="text"
                    value={usernameInput}
                    onChange={(e) => {
                      setUsernameInput(e.target.value);
                      if (inputError) setInputError(null);
                    }}
                    placeholder="Player123"
                    className="w-full h-10 px-3.5 rounded-xl bg-[#141620] border border-[#232738] focus:border-white/50 text-white text-xs font-mono outline-hidden transition-colors placeholder:text-[#50576e]"
                    autoFocus
                    required
                  />
                </div>

                {/* Skin upload (.png) */}
                <div className="space-y-2 pt-1">
                  <label className="block text-xs font-mono text-[#8b92a5]">
                    {language === 'ru' ? 'Скин персонажа (.PNG)' : 'Player Skin (.PNG)'}
                  </label>

                  <input
                    ref={modalFileInputRef}
                    type="file"
                    accept=".png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleModalSkinSelect(file);
                    }}
                    className="hidden"
                  />

                  <div
                    onClick={() => modalFileInputRef.current?.click()}
                    className="p-3.5 rounded-xl border border-dashed border-[#2d3448] hover:border-white/40 bg-[#12141e] hover:bg-[#161926] transition-all cursor-pointer flex items-center justify-center gap-2.5 text-center"
                  >
                    <Upload className="w-4 h-4 text-[#8b92a5]" />
                    <span className="text-xs font-mono text-[#cbd5e1]">
                      {selectedSkinDataUrl
                        ? (language === 'ru' ? 'Скин выбран (.PNG)' : 'Skin selected (.PNG)')
                        : (language === 'ru' ? 'Выбрать .png скин (не обязательно)' : 'Select .png skin (optional)')}
                    </span>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-11 rounded-xl bg-white hover:bg-[#e4e7ee] active:scale-98 text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer font-['Barlow_Condensed',sans-serif] shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>{t.accountModalCreateOffline}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal (2-step confirm) */}
      <AnimatePresence>
        {accountToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAccountToDelete(null)}
              className="absolute inset-0 bg-black/85 backdrop-blur-xs cursor-pointer"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ duration: 0.18 }}
              className="relative z-10 w-full max-w-sm rounded-2xl border border-[#2b1f24] bg-[#0c0d12] shadow-[0_30px_70px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="p-5 pb-3 flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-800/60 flex items-center justify-center shrink-0 text-rose-400">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-black uppercase tracking-wider text-white font-['Barlow_Condensed',sans-serif]">
                    {t.accountsConfirmDelete}
                  </h3>
                  <div className="mt-1">
                    <span className="text-xs font-mono font-bold text-rose-300 truncate max-w-[200px] block">
                      {accountToDelete.username}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAccountToDelete(null)}
                  className="w-7 h-7 rounded-lg bg-[#141620] hover:bg-[#202434] text-[#8b92a5] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4 stroke-[2.2]" />
                </button>
              </div>

              {/* Message */}
              <div className="px-5 py-2 text-xs text-[#8c94a8] leading-relaxed">
                {language === 'ru'
                  ? 'Вы действительно хотите удалить этот аккаунт?'
                  : 'Are you sure you want to delete this account?'}
              </div>

              {/* Action Buttons */}
              <div className="p-4 pt-3 mt-2 border-t border-[#181a24] bg-[#090a0f] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    playPalateClick(0.18);
                    setAccountToDelete(null);
                  }}
                  className="px-4 h-9 rounded-xl bg-[#141620] hover:bg-[#1f2332] active:scale-95 border border-[#24293a] text-xs font-mono font-bold text-[#cbd5e1] hover:text-white transition-all cursor-pointer"
                >
                  {t.cancel}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playPalateClick(0.24);
                    onDeleteAccount(accountToDelete.id);
                    setAccountToDelete(null);
                  }}
                  className="px-5 h-9 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer font-['Barlow_Condensed',sans-serif] shadow-md shadow-rose-950/50 flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t.accountsDeleteBtn}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Profile Modal with Real 3D Skin Viewer */}
      <AnimatePresence>
        {profileAccount && (() => {
          const acc = profileAccount;
          const isActive = acc.id === activeAccountId;
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setProfileAccount(null)}
                className="absolute inset-0 bg-black/85 backdrop-blur-xs cursor-pointer"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 w-full max-w-md rounded-2xl border border-[#222534] bg-[#0c0d12] shadow-[0_35px_80px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden"
              >
                {/* Header */}
                <div className="h-14 px-5 border-b border-[#1c1f2b] flex items-center justify-between bg-[#10121a]">
                  <span className="text-sm font-black uppercase tracking-widest text-white font-['Barlow_Condensed',sans-serif]">
                    {t.accountProfileTitle}
                  </span>
                  <button
                    type="button"
                    onClick={() => setProfileAccount(null)}
                    className="w-8 h-8 rounded-lg bg-[#171924] hover:bg-[#282d3e] text-[#cbd5e1] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>

                {/* Avatar + Name section */}
                <div className="p-5 flex items-center gap-4 border-b border-[#181a24]">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#171b26] border border-[#272e40] shrink-0 [image-rendering:pixelated]">
                    <AccountAvatar
                      account={acc}
                      size={96}
                      className="w-full h-full object-cover [image-rendering:pixelated]"
                      onAvatarGenerated={(newAvatar) => {
                        onUpdateAccount({ ...acc, skinAvatarUrl: newAvatar });
                        setProfileAccount({ ...acc, skinAvatarUrl: newAvatar });
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xl font-black text-white tracking-wide font-['Barlow_Condensed',sans-serif]">
                        {acc.username}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Real 3D Interactive Skin Model */}
                <div className="px-5 pt-3 pb-3 border-b border-[#181a24]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                      <span>3D Скин</span>
                      <span className="text-[10px] text-[#71788e] font-normal">(вращение мышью)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setTargetAccountForSkin(acc);
                        fileInputRef.current?.click();
                      }}
                      className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Upload className="w-3 h-3" />
                      <span>{acc.skinUrl ? 'Сменить .png' : 'Загрузить .png'}</span>
                    </button>
                  </div>
                  <Skin3DViewer skinUrl={acc.skinUrl} />
                </div>

                {/* Info rows */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-[#71788e]">{t.accountProfileUUID}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-[#c0c8d8] truncate max-w-[180px]" title={acc.id}>
                        {acc.id.slice(0, 8)}...{acc.id.slice(-4)}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(acc.id).catch(() => {});
                          setProfileCopied(true);
                          setTimeout(() => setProfileCopied(false), 1800);
                        }}
                        title={t.accountProfileCopyUUID}
                        className="w-6 h-6 rounded-lg bg-[#141620] hover:bg-[#1d2130] border border-[#252a3b] flex items-center justify-center text-[#8b92a5] hover:text-white transition-colors cursor-pointer"
                      >
                        {profileCopied ? (
                          <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-[#71788e]">{t.accountSkinStatus}</span>
                    <span className="text-xs font-mono text-[#cbd5e1]">
                      {acc.skinUrl ? t.accountSkinCustom : t.accountSkinDefault}
                    </span>
                  </div>
                </div>

                {/* Actions footer */}
                <div className="px-5 pb-5 pt-1 flex gap-2">
                  {!isActive && (
                    <button
                      type="button"
                      onClick={() => {
                        playPalateClick(0.2);
                        onSelectAccount(acc.id);
                        setProfileAccount(null);
                      }}
                      className="flex-1 h-10 rounded-xl bg-white hover:bg-[#e4e7ee] active:scale-95 text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer font-['Barlow_Condensed',sans-serif] flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>{t.accountProfileMakeActive}</span>
                    </button>
                  )}

                  {accounts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        playPalateClick(0.2);
                        setProfileAccount(null);
                        setAccountToDelete(acc);
                      }}
                      className="w-10 h-10 rounded-xl bg-transparent hover:bg-rose-950/40 text-[#64748b] hover:text-rose-400 border border-[#1f212b] hover:border-rose-900/50 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
