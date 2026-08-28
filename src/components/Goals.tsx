import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';

export const Goals = () => {
  const { user, goals } = useAppContext();
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');

  const handleSave = async () => {
    if (!user || !title.trim()) return;

    try {
      await addDoc(collection(db, 'users', user.uid, 'goals'), {
        uid: user.uid,
        title: title.substring(0, 199),
        description: description.substring(0, 999),
        targetDate: targetDate.trim() || "",
        completed: false,
        createdAt: serverTimestamp()
      });
      setIsAdding(false);
      setTitle('');
      setDescription('');
      setTargetDate('');
    } catch (error) {
      console.error('Error saving goal:', error);
    }
  };

  const toggleComplete = async (goal: any) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'goals', goal.id), {
        completed: !goal.completed
      });
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'goals', id));
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-zinc-950">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-zinc-100">Syllabus & Goals</h2>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Goal
            </button>
          )}
        </div>

        {isAdding && (
          <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 space-y-4">
            <input
              type="text"
              placeholder="Goal Title (e.g., Complete Chapter 5 Physics)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
            />
            <textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-100 focus:outline-none focus:border-indigo-500 resize-none"
            />
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-zinc-400 mb-1">Target Date (Optional)</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setIsAdding(false);
                  setTitle('');
                  setDescription('');
                  setTargetDate('');
                }}
                className="px-4 py-2 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!title.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                Save Goal
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-4">
          {goals.map((goal) => (
            <div key={goal.id} className={`bg-zinc-900 p-4 rounded-xl border transition-colors ${goal.completed ? 'border-indigo-500/30 bg-indigo-500/5' : 'border-zinc-800'}`}>
              <div className="flex items-start gap-4">
                <button
                  onClick={() => toggleComplete(goal)}
                  className={`mt-1 flex-shrink-0 ${goal.completed ? 'text-indigo-500' : 'text-zinc-500 hover:text-indigo-400'}`}
                >
                  {goal.completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                </button>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-lg font-medium ${goal.completed ? 'text-zinc-400 line-through' : 'text-zinc-100'}`}>
                    {goal.title}
                  </h3>
                  {goal.description && (
                    <p className={`mt-1 text-sm ${goal.completed ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      {goal.description}
                    </p>
                  )}
                  {goal.targetDate && (
                    <p className="mt-2 text-xs font-medium text-indigo-400">
                      Target: {goal.targetDate}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(goal.id)}
                  className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {goals.length === 0 && !isAdding && (
            <div className="text-center py-12 text-zinc-500">
              No goals set yet. Add your syllabus or targets!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
