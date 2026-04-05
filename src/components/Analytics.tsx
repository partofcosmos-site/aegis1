import React, { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { format, subDays, parseISO, eachDayOfInterval, startOfToday, endOfToday } from 'date-fns';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#3b82f6'];

export const Analytics = () => {
  const { logs } = useAppContext();

  const analyticsData = useMemo(() => {
    if (!logs.length) return null;

    // Calculate total time per subject
    const subjectTime: Record<string, number> = {};
    let totalMinutes = 0;
    let totalProblems = 0;

    // Create a map of all dates with logs
    const datesWithLogs = logs.map(log => log.date).filter(Boolean).sort();
    const firstDate = datesWithLogs.length > 0 ? parseISO(datesWithLogs[0]) : startOfToday();
    const lastDate = endOfToday();

    // Generate all days from the first log to today
    const allDays = eachDayOfInterval({ start: firstDate, end: lastDate });
    
    // Initialize daily data with 0
    const dailyDataMap: Record<string, number> = {};
    allDays.forEach(day => {
      dailyDataMap[format(day, 'yyyy-MM-dd')] = 0;
    });

    logs.forEach(log => {
      const duration = log.durationMinutes || 0;
      totalMinutes += duration;
      totalProblems += log.problemsSolved || 0;

      const subject = log.subject || 'Uncategorized';
      subjectTime[subject] = (subjectTime[subject] || 0) + duration;

      if (log.date && dailyDataMap[log.date] !== undefined) {
        dailyDataMap[log.date] += duration;
      }
    });

    const pieData = Object.entries(subjectTime)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const timelineData = Object.entries(dailyDataMap)
      .map(([date, minutes]) => ({
        date: format(parseISO(date), 'MMM dd'),
        minutes,
        hours: (minutes / 60).toFixed(1)
      }));

    const formatTime = (mins: number) => {
      const h = Math.floor(mins / 60);
      const m = Math.round(mins % 60);
      if (h > 0 && m > 0) return `${h}h ${m}m`;
      if (h > 0) return `${h}h`;
      return `${m}m`;
    };

    return {
      pieData,
      timelineData,
      totalFormatted: formatTime(totalMinutes),
      totalProblems,
      avgDailyFormatted: formatTime(totalMinutes / Math.max(1, allDays.length))
    };
  }, [logs]);

  if (!analyticsData) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-950 text-zinc-500">
        No data available yet. Start logging your study sessions!
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-zinc-950">
      <div className="max-w-6xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-zinc-100 mb-6">Study Analytics</h2>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
            <h3 className="text-sm font-medium text-zinc-400 mb-1">Total Study Time</h3>
            <p className="text-3xl font-bold text-zinc-100">{analyticsData.totalFormatted}</p>
          </div>
          <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
            <h3 className="text-sm font-medium text-zinc-400 mb-1">Daily Average</h3>
            <p className="text-3xl font-bold text-zinc-100">{analyticsData.avgDailyFormatted} <span className="text-lg text-zinc-500">/ day</span></p>
          </div>
          <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
            <h3 className="text-sm font-medium text-zinc-400 mb-1">Problems Solved</h3>
            <p className="text-3xl font-bold text-zinc-100">{analyticsData.totalProblems}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Timeline Chart */}
          <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 lg:col-span-2">
            <h3 className="text-lg font-medium text-zinc-100 mb-6">Study Timeline</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsData.timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#71717a" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={30}
                  />
                  <YAxis 
                    stroke="#71717a" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}h`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '0.5rem' }}
                    itemStyle={{ color: '#e4e4e7' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="hours" 
                    stroke="#6366f1" 
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, fill: '#6366f1', stroke: '#18181b', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Subject Distribution */}
          <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
            <h3 className="text-lg font-medium text-zinc-100 mb-6">Subject Distribution</h3>
            <div className="h-64 flex flex-col">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {analyticsData.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '0.5rem' }}
                    itemStyle={{ color: '#e4e4e7' }}
                    formatter={(value: number) => [`${Math.round(value / 60)} hrs ${value % 60} mins`, 'Time']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {analyticsData.pieData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-xs text-zinc-400">{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Subject Bar Chart */}
          <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
            <h3 className="text-lg font-medium text-zinc-100 mb-6">Time per Subject (Minutes)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.pieData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={100} stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '0.5rem' }}
                    cursor={{ fill: '#27272a' }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {analyticsData.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
