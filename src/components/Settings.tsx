import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Save, User as UserIcon } from 'lucide-react';

export const Settings = () => {
  const { user, profile, updateProfile } = useAppContext();
  const [displayName, setDisplayName] = useState(profile?.displayName || user?.displayName || '');
  const [schoolHours, setSchoolHours] = useState(profile?.schoolHours?.toString() || '0');
  const [targetExams, setTargetExams] = useState(profile?.targetExams?.join(', ') || '');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || user?.displayName || '');
      setSchoolHours(profile.schoolHours?.toString() || '0');
      setTargetExams(profile.targetExams?.join(', ') || '');
    }
  }, [profile, user]);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      await updateProfile({
        displayName,
        schoolHours: parseInt(schoolHours) || 0,
        targetExams: targetExams.split(',').map(e => e.trim()).filter(e => e),
      });
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-zinc-950">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100">Settings</h2>
          <p className="text-zinc-400 mt-1">Manage your profile and preferences.</p>
        </div>

        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
          <div className="p-6 border-b border-zinc-800 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <UserIcon className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-zinc-100">{user?.email}</h3>
              <p className="text-sm text-zinc-500">Account linked via Google</p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Daily School/Class Hours</label>
              <input
                type="number"
                min="0"
                max="24"
                value={schoolHours}
                onChange={(e) => setSchoolHours(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
              />
              <p className="text-xs text-zinc-500 mt-1">Used to calculate your available study time.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Target Exams (comma separated)</label>
              <input
                type="text"
                placeholder="e.g., JEE, NEET, SAT"
                value={targetExams}
                onChange={(e) => setTargetExams(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="pt-4 flex items-center justify-between">
              {message ? (
                <div className={`text-sm ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                  {message.text}
                </div>
              ) : (
                <div></div>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
