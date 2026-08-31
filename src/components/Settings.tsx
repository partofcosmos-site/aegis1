import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Save, User as UserIcon, Cpu, Trash2, CheckCircle, AlertCircle, RefreshCw, Zap, ShieldCheck, Sparkles, Clipboard, DownloadCloud, Code, Youtube } from 'lucide-react';
import { AIProviderConfig, ProviderType, PROVIDER_TEMPLATES, AIModelPreset } from '../services/aiProviderTypes';
import { AIVaultService } from '../services/aiVaultService';
import { YouTubeAudioService } from '../services/youtubeAudioService';
import { CloudSyncService } from '../services/cloudSyncService';

export const Settings = () => {
  const { user, profile, updateProfile, syncStatus, forceSyncNow } = useAppContext();
  const [displayName, setDisplayName] = useState(profile?.displayName || user?.displayName || '');
  const [schoolHours, setSchoolHours] = useState(profile?.schoolHours?.toString() || '0');
  const [targetExams, setTargetExams] = useState(profile?.targetExams?.join(', ') || '');
  const [isSaving, setIsSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // YouTube API Key State
  const [ytApiKey, setYtApiKey] = useState(() => YouTubeAudioService.getApiKey());
  const [ytSavedMessage, setYtSavedMessage] = useState<string | null>(null);

  // Multi-Provider States
  const [providers, setProviders] = useState<AIProviderConfig[]>([]);
  const [editingProvider, setEditingProvider] = useState<AIProviderConfig | null>(null);
  const [isTestingId, setIsTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});

  // Dynamic Remote Models State
  const [remoteModels, setRemoteModels] = useState<AIModelPreset[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);

  // Paste / Snippet Importer State
  const [snippetText, setSnippetText] = useState('');
  const [showSnippetModal, setShowSnippetModal] = useState(false);
  const [snippetMessage, setSnippetMessage] = useState<string | null>(null);

  useEffect(() => {
    setProviders(AIVaultService.getProviders());
  }, []);

  const handleTest = async (config: AIProviderConfig) => {
    setIsTestingId(config.id);
    const result = await AIVaultService.testConnection(config);
    setTestResults(prev => ({ ...prev, [config.id]: result }));
    setIsTestingId(null);
  };

  const handleSetDefault = (id: string) => {
    AIVaultService.setActiveProvider(id);
    setProviders(AIVaultService.getProviders());
  };

  const handleDeleteProvider = (id: string) => {
    const updated = providers.filter(p => p.id !== id);
    if (updated.length > 0 && !updated.some(p => p.isDefault)) {
      updated[0].isDefault = true;
    }
    AIVaultService.saveProviders(updated);
    setProviders(updated);
  };

  const handleCreateFromTemplate = (type: ProviderType) => {
    const tmpl = PROVIDER_TEMPLATES[type];
    const newConfig: AIProviderConfig = {
      id: 'prov_' + Date.now(),
      name: `${tmpl.label.split(' ')[0]} Config`,
      providerType: type,
      baseUrl: tmpl.defaultBaseUrl,
      apiKey: '',
      selectedModel: tmpl.defaultModels[0]?.id || '',
      temperature: 0.2,
      maxTokens: 4096,
      thinkingLevel: 'high',
      isDefault: providers.length === 0,
      createdAt: Date.now()
    };
    setEditingProvider(newConfig);
    setRemoteModels([]);
  };

  const handleFetchRemoteModels = async () => {
    if (!editingProvider || !editingProvider.baseUrl) return;
    setIsFetchingModels(true);
    try {
      const models = await AIVaultService.fetchRemoteModels(editingProvider.baseUrl, editingProvider.apiKey, editingProvider.providerType);
      setRemoteModels(models);
    } catch {
      setRemoteModels([]);
    } finally {
      setIsFetchingModels(false);
    }
  };

  const handleParseSnippet = () => {
    if (!snippetText.trim()) return;
    const parsed = AIVaultService.parseSnippetToConfig(snippetText);
    const newConfig: AIProviderConfig = {
      id: 'prov_' + Date.now(),
      name: (parsed.name || 'Imported Custom Model').trim(),
      providerType: 'openai-compatible',
      baseUrl: (parsed.baseUrl || 'https://api.openai.com/v1').trim(),
      apiKey: (parsed.apiKey || '').trim(),
      selectedModel: (parsed.selectedModel || 'custom-model').trim(),
      temperature: 0.2,
      maxTokens: 4096,
      thinkingLevel: 'high',
      isDefault: providers.length === 0,
      createdAt: Date.now()
    };
    setEditingProvider(newConfig);
    setShowSnippetModal(false);
    setSnippetText('');
  };

  const handleSaveProvider = (config: AIProviderConfig) => {
    const cleanedConfig: AIProviderConfig = {
      ...config,
      name: (config.name || 'AI Provider').trim(),
      baseUrl: (config.baseUrl || '').trim(),
      apiKey: (config.apiKey || '').trim(),
      selectedModel: (config.selectedModel || '').trim()
    };

    const index = providers.findIndex(p => p.id === cleanedConfig.id);
    let updated: AIProviderConfig[];
    if (index >= 0) {
      updated = [...providers];
      updated[index] = cleanedConfig;
    } else {
      updated = [...providers, cleanedConfig];
    }
    if (cleanedConfig.isDefault) {
      updated = updated.map(p => ({ ...p, isDefault: p.id === cleanedConfig.id }));
    }
    AIVaultService.saveProviders(updated);
    setProviders(updated);
    setEditingProvider(null);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-zinc-950">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100">Settings & Universal AI Providers</h2>
          <p className="text-zinc-400 mt-1">Use ANY AI model from any documentation, endpoint, or provider with zero hardcoding.</p>
        </div>

        {/* AI Provider Management Section */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-3">
              <Cpu className="w-6 h-6 text-indigo-400" />
              <div>
                <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
                  Universal AI Models & Endpoints
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Unrestricted Custom Models
                  </span>
                </h3>
                <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Zero-leakage: Secrets stored exclusively in your browser session.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowSnippetModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold transition-all self-start sm:self-auto"
            >
              <Code className="w-4 h-4" />
              Paste Doc / cURL Snippet
            </button>
          </div>

          {/* Quick Provider Templates Bar */}
          <div>
            <span className="text-xs uppercase font-semibold tracking-wider text-zinc-500 block mb-2">Templates & Presets</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
              {(Object.keys(PROVIDER_TEMPLATES) as ProviderType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => handleCreateFromTemplate(type)}
                  className="px-2.5 py-2 bg-zinc-800/70 hover:bg-indigo-600/20 hover:border-indigo-500 border border-zinc-700/50 rounded-lg text-xs font-medium text-zinc-200 transition-all text-center"
                >
                  {PROVIDER_TEMPLATES[type].label.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Active Provider Cards */}
          <div className="space-y-3">
            {providers.map((prov) => (
              <div
                key={prov.id}
                className={`p-4 rounded-xl border transition-all ${
                  prov.isDefault
                    ? 'bg-zinc-950/80 border-indigo-500/50 shadow-sm shadow-indigo-500/10'
                    : 'bg-zinc-950/40 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-zinc-200 text-sm">{prov.name}</span>
                      {prov.isDefault && (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full">
                          Active Model
                        </span>
                      )}
                      <span className="px-2 py-0.5 text-[10px] bg-zinc-800 text-zinc-300 font-mono rounded-md border border-zinc-700">
                        {prov.selectedModel}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500 mt-1 font-mono">{prov.baseUrl}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    {testResults[prov.id] && (
                      <span
                        className={`text-xs flex items-center gap-1 ${
                          testResults[prov.id].success ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {testResults[prov.id].success ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                        {testResults[prov.id].message}
                      </span>
                    )}

                    <button
                      onClick={() => handleTest(prov)}
                      disabled={isTestingId === prov.id}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                    >
                      {isTestingId === prov.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                      Test
                    </button>

                    {!prov.isDefault && (
                      <button
                        onClick={() => handleSetDefault(prov.id)}
                        className="px-3 py-1.5 bg-indigo-950/60 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/40 rounded-lg text-xs font-medium transition-colors"
                      >
                        Use This Model
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setEditingProvider(prov);
                        setRemoteModels([]);
                      }}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition-colors"
                    >
                      Edit
                    </button>

                    {providers.length > 1 && (
                      <button
                        onClick={() => handleDeleteProvider(prov.id)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Optional Google YouTube Data API v3 Section */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-500/10 rounded-xl text-rose-400 border border-rose-500/20">
                <Youtube className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">YouTube Focus Audio & Google Data API (Optional)</h3>
                <p className="text-xs text-zinc-400">10,000 Free Daily Units via Google Cloud YouTube Data API v3</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
              100% Free Forever
            </span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-xs text-zinc-300 space-y-2">
            <p>
              <strong>Distraction-Free Mode:</strong> Savantix automatically streams study audio, lofi beats, and classical compositions in a clean sandbox with <strong>0 recommended videos, 0 comments, 0 shorts, and 0 sidebar distraction feeds</strong>.
            </p>
            <p className="text-zinc-400 text-[11px]">
              Want live autocomplete search across all of YouTube? You can generate an optional free API Key from your Google Cloud Console (APIs & Services &rarr; Enable <em>YouTube Data API v3</em> &rarr; Credentials). Google provides 10,000 free search units daily with zero charges.
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="password"
              placeholder="Paste Google Cloud YouTube API Key (Optional)..."
              value={ytApiKey}
              onChange={(e) => setYtApiKey(e.target.value)}
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-rose-500 placeholder:text-zinc-600"
            />
            <button
              onClick={() => {
                YouTubeAudioService.setApiKey(ytApiKey);
                setYtSavedMessage('✓ YouTube Data API v3 Key saved successfully.');
                setTimeout(() => setYtSavedMessage(null), 3500);
              }}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-600/20"
            >
              <Save className="w-3.5 h-3.5" />
              Save Key
            </button>
          </div>

          {ytSavedMessage && (
            <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{ytSavedMessage}</span>
            </div>
          )}
        </div>

        {/* Multi-Device Data Sync & Backup Station */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                <RefreshCw className={`w-5 h-5 text-indigo-400 ${syncStatus?.isSyncing ? 'animate-spin' : ''}`} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
                  Multi-Device Cloud Sync & Backup
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Live Synced
                  </span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Connected as <span className="text-zinc-200 font-mono font-medium">{user?.email || 'Guest'}</span> • Last Synced: <span className="text-indigo-300 font-mono">{syncStatus?.lastSyncedAt || 'Just now'}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await forceSyncNow();
                    setProfileMessage({ type: res.success ? 'success' : 'error', text: res.message });
                  } catch (e: any) {
                    setProfileMessage({ type: 'error', text: 'Sync failed: ' + (e.message || '') });
                  }
                }}
                disabled={syncStatus?.isSyncing}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
                title="Force instant bidirectional cloud synchronization across all devices"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncStatus?.isSyncing ? 'animate-spin' : ''}`} />
                <span>{syncStatus?.isSyncing ? 'Syncing...' : 'Sync Now'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!user) return;
                  const code = CloudSyncService.generateSyncCode(user.email, user.uid);
                  navigator.clipboard.writeText(code);
                  setProfileMessage({ type: 'success', text: '1-Click Pairing Code copied! Paste it in Savantix on your phone/tablet to immediately pair.' });
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                title="Copy encrypted pairing token to pair with mobile or laptop in 1 second"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Pairing Code</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const input = prompt('Paste your 1-Click Pairing Code from your other device:');
                  if (!input || !input.trim()) return;
                  const res = CloudSyncService.importSyncCode(input.trim(), user?.email || 'scholar@savantix.app', user?.uid || 'guest_user');
                  if (res.success) {
                    forceSyncNow();
                    setProfileMessage({ type: 'success', text: 'Successfully paired and merged data from pairing code!' });
                  } else {
                    setProfileMessage({ type: 'error', text: res.message });
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                title="Paste pairing code from your PC or mobile to import all study history"
              >
                <Clipboard className="w-3.5 h-3.5 text-indigo-400" />
                <span>Paste Code</span>
              </button>

              <button
                onClick={() => {
                  try {
                    const localLogs = JSON.parse(localStorage.getItem(`savantix_user_logs_${user?.uid}`) || '[]');
                    const localGoals = JSON.parse(localStorage.getItem(`savantix_user_goals_${user?.uid}`) || '[]');
                    const localJournal = JSON.parse(localStorage.getItem(`savantix_user_journal_${user?.uid}`) || '[]');
                    const backupData = {
                      exportDate: new Date().toISOString(),
                      user: user?.email,
                      uid: user?.uid,
                      logs: localLogs,
                      goals: localGoals,
                      journal: localJournal
                    };
                    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `savantix_backup_${user?.email?.split('@')[0] || 'scholar'}_${new Date().toISOString().substring(0, 10)}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  } catch (e) {
                    console.error('Backup export failed:', e);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                title="Export JSON backup to keep your data safe"
              >
                <DownloadCloud className="w-4 h-4 text-emerald-400" />
                <span>Export JSON</span>
              </button>

              <label className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg text-xs font-semibold transition-all cursor-pointer">
                <Clipboard className="w-4 h-4 text-indigo-400" />
                <span>Merge Backup</span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      try {
                        const imported = JSON.parse(event.target?.result as string);
                        if (imported && (Array.isArray(imported.logs) || Array.isArray(imported))) {
                          const logsToMerge = Array.isArray(imported.logs) ? imported.logs : imported;
                          const currentLogs: any[] = JSON.parse(localStorage.getItem(`savantix_user_logs_${user?.uid}`) || '[]');
                          const existingIds = new Set(currentLogs.map(l => l.id || `${l.date}_${l.subject}_${l.topic}`));
                          const newUnique = logsToMerge.filter((l: any) => !existingIds.has(l.id || `${l.date}_${l.subject}_${l.topic}`));
                          const merged = [...newUnique, ...currentLogs];
                          localStorage.setItem(`savantix_user_logs_${user?.uid}`, JSON.stringify(merged));
                          window.location.reload();
                        }
                      } catch (err) {
                        alert('Failed to parse backup JSON file.');
                      }
                    };
                    reader.readAsText(file);
                  }}
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4">
              <div className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">Active Study Logs</div>
              <div className="text-2xl font-bold font-mono text-indigo-300 mt-1">
                {JSON.parse(localStorage.getItem(`savantix_user_logs_${user?.uid}`) || localStorage.getItem(`savantix_user_logs_${user?.canonicalId}`) || '[]').length}
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">Synced across all connected devices</div>
            </div>

            <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4">
              <div className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">Tracked Goals</div>
              <div className="text-2xl font-bold font-mono text-emerald-300 mt-1">
                {JSON.parse(localStorage.getItem(`savantix_user_goals_${user?.uid}`) || localStorage.getItem(`savantix_user_goals_${user?.canonicalId}`) || '[]').length}
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">Target milestones preserved</div>
            </div>

            <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4">
              <div className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">Journal Reflections</div>
              <div className="text-2xl font-bold font-mono text-purple-300 mt-1">
                {JSON.parse(localStorage.getItem(`savantix_user_journal_${user?.uid}`) || localStorage.getItem(`savantix_user_journal_${user?.canonicalId}`) || '[]').length}
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">Personal daily records</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-200/90 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Zero Data Loss Real-Time Guarantee:</strong> All synchronization is strictly additive and union-merged. Logging a session on your phone or tablet automatically propagates to your PC in real time without ever deleting or overwriting prior entries.
            </span>
          </div>
        </div>

        {/* User Profile Section */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
          <div className="p-6 border-b border-zinc-800 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-medium text-zinc-100">{user?.email || 'Active User'}</h3>
              <p className="text-xs text-zinc-500">Synced to Google Cloud Firestore</p>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Daily School / Class Hours</label>
              <input
                type="number"
                min="0"
                max="24"
                value={schoolHours}
                onChange={(e) => setSchoolHours(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Target Exams (comma separated)</label>
              <input
                type="text"
                placeholder="e.g., JEE Advanced 2026, IPhO, MIT SAT"
                value={targetExams}
                onChange={(e) => setTargetExams(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              {profileMessage && (
                <div className={`text-xs ${profileMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                  {profileMessage.text}
                </div>
              )}
              <button
                onClick={async () => {
                  setIsSaving(true);
                  try {
                    await updateProfile({
                      displayName,
                      schoolHours: parseInt(schoolHours) || 0,
                      targetExams: targetExams.split(',').map((e) => e.trim()).filter(Boolean)
                    });
                    setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
                  } catch {
                    setProfileMessage({ type: 'error', text: 'Failed to update profile.' });
                  } finally {
                    setIsSaving(false);
                  }
                }}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors ml-auto"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>

        {/* Snippet / Code Importer Modal */}
        {showSnippetModal && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                  <Code className="w-5 h-5 text-indigo-400" />
                  Paste Any Documentation / Code Snippet
                </h3>
              </div>
              <p className="text-xs text-zinc-400">
                Paste any Python code, cURL command, JavaScript fetch, or JSON configuration from any AI documentation. The parser will automatically extract the Base URL, Model ID, and Endpoint.
              </p>

              <textarea
                value={snippetText}
                onChange={(e) => setSnippetText(e.target.value)}
                placeholder={`e.g. paste python snippet:
client = OpenAI(base_url="https://api.together.xyz/v1", api_key="...")
response = client.chat.completions.create(model="meta-llama/Llama-3-70b-chat-hf")`}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 min-h-[140px] focus:outline-none focus:border-indigo-500"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowSnippetModal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleParseSnippet}
                  disabled={!snippetText.trim()}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg disabled:opacity-50"
                >
                  Auto-Detect & Configure
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Provider Modal */}
        {editingProvider && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="text-lg font-bold text-zinc-100">
                  Configure AI Model & Endpoint
                </h3>
              </div>

              <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Custom Display Name</label>
                  <input
                    type="text"
                    value={editingProvider.name}
                    onChange={(e) => setEditingProvider({ ...editingProvider, name: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">API Base URL (Any Endpoint)</label>
                  <input
                    type="text"
                    value={editingProvider.baseUrl}
                    onChange={(e) => setEditingProvider({ ...editingProvider, baseUrl: e.target.value })}
                    placeholder="https://openrouter.ai/api/v1, http://localhost:11434/v1, etc."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-zinc-100 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">API Key / Token</label>
                  <input
                    type="password"
                    placeholder="Enter API Key (Optional for local Ollama/LM Studio)"
                    value={editingProvider.apiKey}
                    onChange={(e) => setEditingProvider({ ...editingProvider, apiKey: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-zinc-100 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-zinc-400">Model Name / ID (Any String)</label>
                    <button
                      type="button"
                      onClick={handleFetchRemoteModels}
                      disabled={isFetchingModels || !editingProvider.baseUrl}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                    >
                      {isFetchingModels ? <RefreshCw className="w-3 h-3 animate-spin" /> : <DownloadCloud className="w-3 h-3" />}
                      Fetch Live Models from Endpoint
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editingProvider.selectedModel}
                      onChange={(e) => setEditingProvider({ ...editingProvider, selectedModel: e.target.value })}
                      placeholder="Type ANY model name e.g. deepseek/deepseek-r1:free, gemini-2.0-flash"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-zinc-100 font-mono focus:outline-none focus:border-indigo-500"
                    />

                    {/* Popular Free Models Quick Chips */}
                    <div className="pt-1">
                      <span className="text-[10px] uppercase font-semibold text-zinc-500 block mb-1.5">
                        Free Frontier Models (1-Click Select)
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { id: 'deepseek/deepseek-r1:free', label: 'DeepSeek R1 (Free)', desc: 'Reasoning' },
                          { id: 'liquid/lfm-40b:free', label: 'LFM 40B (Free)', desc: 'Speed' },
                          { id: 'nvidia/nemotron-3-super-120b-a12b:free', label: 'Nemotron 120B (Free)', desc: 'STEM Math' },
                          { id: 'meta-llama/llama-3.3-70b-instruct:free', label: 'Llama 3.3 70B (Free)', desc: 'General' },
                          { id: 'qwen/qwen-2.5-72b-instruct:free', label: 'Qwen 72B (Free)', desc: 'Math' },
                          { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', desc: 'Multimodal' },
                          { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', desc: '1M Context' },
                          { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', desc: 'Reasoning' }
                        ].map(preset => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => setEditingProvider({ ...editingProvider, selectedModel: preset.id })}
                            className={`px-2 py-0.5 rounded-lg text-[11px] font-mono border transition-all ${
                              editingProvider.selectedModel === preset.id
                                ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                                : 'bg-zinc-950/60 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                            }`}
                            title={`${preset.id} (${preset.desc})`}
                          >
                            <span>{preset.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Show Remote Models if fetched */}
                    {remoteModels.length > 0 && (
                      <div className="pt-2">
                        <span className="text-[10px] uppercase font-semibold text-zinc-500 block mb-1">
                          Fetched from Server ({remoteModels.length} models)
                        </span>
                        <select
                          onChange={(e) => setEditingProvider({ ...editingProvider, selectedModel: e.target.value })}
                          value={editingProvider.selectedModel}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 font-mono"
                        >
                          <option value="">Choose Fetched Model...</option>
                          {remoteModels.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      Temperature ({editingProvider.temperature})
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={editingProvider.temperature}
                      onChange={(e) =>
                        setEditingProvider({ ...editingProvider, temperature: parseFloat(e.target.value) })
                      }
                      className="w-full accent-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Reasoning Budget</label>
                    <select
                      value={editingProvider.thinkingLevel || 'high'}
                      onChange={(e) =>
                        setEditingProvider({
                          ...editingProvider,
                          thinkingLevel: e.target.value as any
                        })
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200"
                    >
                      <option value="none">Standard</option>
                      <option value="low">Low Reasoning</option>
                      <option value="medium">Medium Reasoning</option>
                      <option value="high">High Reasoning Budget</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
                <button
                  onClick={() => setEditingProvider(null)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveProvider(editingProvider)}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Save Provider
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
