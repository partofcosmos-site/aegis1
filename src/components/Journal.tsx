import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { format } from 'date-fns';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';

export const Journal = () => {
  const { user, journalEntries, addJournalEntry, updateJournalEntry, deleteJournalEntry } = useAppContext();
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSave = async () => {
    if (!user || !title.trim() || !content.trim()) return;

    try {
      if (editingId) {
        await updateJournalEntry(editingId, {
          title: title.trim().substring(0, 199),
          content: content.trim().substring(0, 9999),
        });
      } else {
        await addJournalEntry({
          title: title.trim().substring(0, 199),
          content: content.trim().substring(0, 9999),
          date: format(new Date(), 'yyyy-MM-dd')
        });
      }
      setIsAdding(false);
      setEditingId(null);
      setTitle('');
      setContent('');
    } catch (error) {
      console.error('Error saving journal entry:', error);
    }
  };

  const handleEdit = (entry: any) => {
    setEditingId(entry.id);
    setTitle(entry.title);
    setContent(entry.content);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteJournalEntry(id);
    } catch (error) {
      console.error('Error deleting journal entry:', error);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-zinc-950">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-zinc-100">Journal & Notes</h2>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Entry
            </button>
          )}
        </div>

        {isAdding && (
          <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 space-y-4">
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
            />
            <textarea
              placeholder="Write your thoughts, notable events, or study notes..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-48 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-100 focus:outline-none focus:border-indigo-500 resize-none"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsAdding(false);
                  setEditingId(null);
                  setTitle('');
                  setContent('');
                }}
                className="px-4 py-2 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!title.trim() || !content.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                {editingId ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-4">
          {journalEntries.map((entry) => (
            <div key={entry.id} className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium text-zinc-100">{entry.title}</h3>
                  <p className="text-sm text-zinc-500">{entry.date}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(entry)}
                    className="p-2 text-zinc-400 hover:text-indigo-400 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="p-2 text-zinc-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-zinc-300 whitespace-pre-wrap">{entry.content}</p>
            </div>
          ))}
          {journalEntries.length === 0 && !isAdding && (
            <div className="text-center py-12 text-zinc-500">
              No journal entries yet. Start writing!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
