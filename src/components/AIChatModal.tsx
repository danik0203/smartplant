import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Camera,
  Bot,
  Volume2,
  VolumeX,
  Sparkles,
  Key,
  ExternalLink,
  Loader2,
  Check,
  AlertCircle,
  HelpCircle,
  Trash2
} from 'lucide-react';
import { Plant, ChatMessage } from '../types';
import {
  chatWithPlantAI,
  compressPlantPhoto,
  getStoredGeminiKey,
  saveStoredGeminiKey,
  testGeminiApiKey,
  speakTextHebrew,
  stopSpeaking,
  ChatHistoryItem
} from '../services/geminiPlantAi';

interface AIChatModalProps {
  onClose: () => void;
  plants: Plant[];
  currentMemberName: string;
}

const DEFAULT_SUGGESTIONS = [
  '💧 מתי להשקות את הצמחים שלי בבית?',
  '🍂 למה יש קצוות חומים או עלים צהובים?',
  '☀️ איזה צמח הכי מתאים לחדר שינה או צל?',
  '🐛 יש לי ברחשים קטנים באדמה - מה לעשות?'
];

const CHAT_STORAGE_KEY = 'plants_care_ai_chat_history';

export const AIChatModal: React.FC<AIChatModalProps> = ({
  onClose,
  plants,
  currentMemberName
}) => {
  const [apiKey, setApiKey] = useState(() => getStoredGeminiKey());
  const [tempApiKeyInput, setTempApiKeyInput] = useState('');
  const [isVerifyingKey, setIsVerifyingKey] = useState(false);
  const [keyFeedback, setKeyFeedback] = useState<{ success?: boolean; message?: string } | null>(
    null
  );
  const [showKeyConfig, setShowKeyConfig] = useState(!getStoredGeminiKey());

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}

    return [
      {
        id: 'welcome',
        sender: 'ai',
        text: `שלום ${currentMemberName}! 👋 אני "הבוטנאי של הבית" מבוסס Gemini AI 🌿\nאני מכיר את כל הצמחים בבית שלך, את תדירות ההשקיה והאור שלהם.\n\nאפשר לשאול אותי כל שאלה, לצלם עלים או קרקע, או לבקש טיפים לטיפול!`,
        timestamp: Date.now()
      }
    ];
  });

  const [inputMessage, setInputMessage] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<{ dataUrl: string; base64: string; mime: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeakingId, setIsSpeakingId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Persist messages
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-30)));
    } catch {}
  }, [messages]);

  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempApiKeyInput.trim()) return;

    setIsVerifyingKey(true);
    setKeyFeedback(null);

    const testRes = await testGeminiApiKey(tempApiKeyInput.trim());
    setIsVerifyingKey(false);
    setKeyFeedback(testRes);

    if (testRes.success) {
      saveStoredGeminiKey(tempApiKeyInput.trim());
      setApiKey(tempApiKeyInput.trim());
      setShowKeyConfig(false);
    }
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressPlantPhoto(file, 800);
      setSelectedPhoto({
        dataUrl: compressed.dataUrl,
        base64: compressed.base64,
        mime: compressed.mimeType
      });
    } catch (err) {
      console.error('Failed to compress chat photo', err);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text && !selectedPhoto) return;

    if (!apiKey) {
      setShowKeyConfig(true);
      return;
    }

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: text || 'צירפתי תמונה של הצמח, אנא בחן אותה 📸',
      imageUrl: selectedPhoto?.dataUrl,
      timestamp: Date.now()
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputMessage('');
    const photoPayload = selectedPhoto;
    setSelectedPhoto(null);
    setIsLoading(true);

    try {
      // Build conversation for Gemini API
      const conversationHistory: ChatHistoryItem[] = newMessages
        .slice(-6)
        .map((m) => ({
          role: m.sender === 'user' ? 'user' : 'model',
          text: m.text,
          imageBase64: m.id === userMsg.id && photoPayload ? photoPayload.base64 : undefined,
          imageMime: m.id === userMsg.id && photoPayload ? photoPayload.mime : undefined
        }));

      const replyText = await chatWithPlantAI(conversationHistory, plants, apiKey);

      const aiReply: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: replyText,
        timestamp: Date.now()
      };

      setMessages((prev) => [...prev, aiReply]);
    } catch (err: any) {
      const errorReply: ChatMessage = {
        id: `ai_err_${Date.now()}`,
        sender: 'ai',
        text: `⚠️ ${err.message || 'לא הצלחתי להתחבר ל-Gemini. אנא ודא שמפתח ה-API תקין.'}`,
        timestamp: Date.now()
      };
      setMessages((prev) => [...prev, errorReply]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSpeak = (msgId: string, text: string) => {
    if (isSpeakingId === msgId) {
      stopSpeaking();
      setIsSpeakingId(null);
    } else {
      const success = speakTextHebrew(text);
      if (success) {
        setIsSpeakingId(msgId);
      }
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('האם למחוק את היסטוריית השיחה עם הבוט?')) {
      stopSpeaking();
      localStorage.removeItem(CHAT_STORAGE_KEY);
      setMessages([
        {
          id: 'welcome_reset',
          sender: 'ai',
          text: `השיחה אופסה. שאל אותי כל דבר על הצמחים בבית שלך! 🌿`,
          timestamp: Date.now()
        }
      ]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-[#FAF8F5] dark:bg-void-950 w-full max-w-lg h-[92vh] sm:h-[85vh] sm:rounded-3xl rounded-t-3xl shadow-2xl border border-slate-200/80 dark:border-white/10 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-void-900/70 backdrop-blur-md flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-600/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  הבוטנאי של הבית AI
                </h3>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-[11px] text-slate-400 font-bold">
                {plants.length > 0
                  ? `מחובר ל-${plants.length} צמחים בגינה שלך 🌿`
                  : 'מומחה צמחים ביתיים ואקלים ישראלי'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowKeyConfig(!showKeyConfig)}
              title="הגדרת מפתח Gemini API"
              className={`p-2 rounded-xl text-xs font-bold transition ${
                apiKey
                  ? 'text-slate-500 hover:text-emerald-600'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-200 animate-pulse'
              }`}
            >
              <Key className="w-4 h-4" />
            </button>

            <button
              onClick={handleClearHistory}
              title="נקה היסטוריית שיחה"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-500 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                stopSpeaking();
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-slate-200/70 dark:bg-void-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* API Key Banner / Config (if clicked or missing) */}
        {showKeyConfig && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200/60 dark:border-amber-900/40 shrink-0 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>חיבור מפתח Gemini API (בחינם לחלוטין)</span>
              </span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-amber-700 dark:text-amber-300 underline flex items-center gap-1"
              >
                <span>הפק מפתח חינם בגוגל</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <form onSubmit={handleSaveApiKey} className="flex gap-1.5">
              <input
                type="password"
                placeholder={apiKey ? '••••••••••••••••••••' : 'הדבק מפתח AIza... כאן'}
                value={tempApiKeyInput}
                onChange={(e) => setTempApiKeyInput(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-void-900 border border-amber-300/60 dark:border-amber-800/60 text-xs font-mono focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={isVerifyingKey || !tempApiKeyInput.trim()}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shrink-0 disabled:opacity-50 flex items-center gap-1"
              >
                {isVerifyingKey ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>אמת ושמור</span>
              </button>
            </form>

            {keyFeedback && (
              <p
                className={`text-[11px] font-bold text-center ${
                  keyFeedback.success ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-600'
                }`}
              >
                {keyFeedback.message}
              </p>
            )}
          </div>
        )}

        {/* Chat Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-3xl p-3.5 shadow-sm text-xs leading-relaxed whitespace-pre-wrap ${
                  m.sender === 'user'
                    ? 'bg-emerald-600 text-white rounded-br-none'
                    : 'bg-white dark:bg-void-900 border border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-slate-100 rounded-bl-none'
                }`}
              >
                {m.imageUrl && (
                  <img
                    src={m.imageUrl}
                    alt="צילום צמח"
                    className="w-full max-h-52 object-cover rounded-2xl mb-2.5 border border-white/20"
                  />
                )}
                <p>{m.text}</p>
              </div>

              {/* Action buttons under message */}
              <div className="flex items-center gap-2 mt-1 px-1">
                {m.sender === 'ai' && (
                  <button
                    onClick={() => handleToggleSpeak(m.id, m.text)}
                    title={isSpeakingId === m.id ? 'עצור דיבור' : 'הקרא תשובה בקול בעברית 🔊'}
                    className="text-[10px] text-slate-400 hover:text-emerald-600 flex items-center gap-1 font-bold"
                  >
                    {isSpeakingId === m.id ? (
                      <>
                        <VolumeX className="w-3 h-3 text-emerald-600 animate-pulse" />
                        <span className="text-emerald-600">עצור</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3 h-3" />
                        <span>הקרא בקול</span>
                      </>
                    )}
                  </button>
                )}
                <span className="text-[9px] text-slate-400">
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold p-2 bg-white dark:bg-void-900 rounded-2xl border border-slate-200/60 dark:border-white/10 w-fit">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span>הבוטנאי מנתח ומנסח תשובה...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-3 py-1.5 border-t border-slate-200/50 dark:border-white/5 bg-slate-50/70 dark:bg-void-900/40 overflow-x-auto flex gap-1.5 no-scrollbar shrink-0">
          {DEFAULT_SUGGESTIONS.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(s)}
              className="text-[11px] font-bold px-3 py-1 rounded-full bg-white dark:bg-void-800 border border-slate-200/70 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 whitespace-nowrap active:scale-95 transition"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Photo Preview if attached */}
        {selectedPhoto && (
          <div className="px-4 py-2 bg-slate-100 dark:bg-void-900 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <img
                src={selectedPhoto.dataUrl}
                alt="מצורפת לבדיקה"
                className="w-10 h-10 rounded-xl object-cover border border-emerald-500"
              />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                התמונה תצורף לשאלה שלך
              </span>
            </div>
            <button
              onClick={() => setSelectedPhoto(null)}
              className="w-6 h-6 rounded-full bg-slate-200 dark:bg-void-800 flex items-center justify-center text-slate-500"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 bg-white dark:bg-void-900 border-t border-slate-200/80 dark:border-white/10 flex items-center gap-2 shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoSelect}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            title="צלם או העלה תמונה לצ׳אט"
            className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-void-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-void-700 flex items-center justify-center active:scale-95 transition shrink-0"
          >
            <Camera className="w-5 h-5" />
          </button>

          <input
            type="text"
            placeholder="שאל כל שאלה על הצמח, השקיה או קרקע..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-void-800 border border-transparent focus:border-emerald-500 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none transition"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || (!inputMessage.trim() && !selectedPhoto)}
            aria-label="שלח הודעה"
            className="w-10 h-10 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-600/30 active:scale-95 transition disabled:opacity-40 shrink-0"
          >
            <Send className="w-4 h-4 rtl:-scale-x-100" />
          </button>
        </div>
      </div>
    </div>
  );
};
