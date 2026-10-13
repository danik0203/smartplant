import React, { useState } from 'react';
import {
  Droplets,
  SprayCan,
  Sprout,
  Clock,
  Stethoscope,
  Plus
} from 'lucide-react';
import { PlantCareLog, HouseholdMember, CareActionType } from '../types';
import { formatRelativeDateHe } from '../utils/plantCalculations';

interface ActivityHistoryTabProps {
  logs: PlantCareLog[];
  members: HouseholdMember[];
}

export const ActivityHistoryTab: React.FC<ActivityHistoryTabProps> = ({ logs, members }) => {
  const [filterMember, setFilterMember] = useState<string>('all');

  const filteredLogs = logs.filter(
    (log) => filterMember === 'all' || log.performedBy === filterMember
  );

  const contributionCounts: Record<string, number> = {};
  logs.forEach((log) => {
    contributionCounts[log.performedBy] = (contributionCounts[log.performedBy] || 0) + 1;
  });

  const getActionIcon = (action: CareActionType) => {
    switch (action) {
      case 'watered':
        return <Droplets className="w-4 h-4 text-sky-500" />;
      case 'misted':
        return <SprayCan className="w-4 h-4 text-teal-500" />;
      case 'fertilized':
        return <Sprout className="w-4 h-4 text-emerald-500" />;
      case 'snoozed':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'diagnosed':
        return <Stethoscope className="w-4 h-4 text-purple-500" />;
      case 'added':
        return <Plus className="w-4 h-4 text-green-500" />;
      default:
        return <Sprout className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-4 pb-24">
      {/* 1-Tap Member Filter & Score Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        <button
          onClick={() => setFilterMember('all')}
          className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold whitespace-nowrap transition ${
            filterMember === 'all'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-void-900 border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300'
          }`}
        >
          הכל ({logs.length})
        </button>

        {members.map((member) => {
          const count = contributionCounts[member.name] || 0;
          const active = filterMember === member.name;
          return (
            <button
              key={member.id}
              onClick={() => setFilterMember(active ? 'all' : member.name)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 border transition ${
                active
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-white dark:bg-void-900 border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-200'
              }`}
            >
              <span>{member.avatar}</span>
              <span>{member.name}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10 text-[10px] font-black">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Minimalist Activity Feed */}
      <div className="space-y-2">
        {filteredLogs.map((log) => (
          <div
            key={log.id}
            className="rounded-2xl bg-white dark:bg-void-900 border border-slate-200/80 dark:border-white/10 px-3.5 py-2.5 flex items-center justify-between gap-3 shadow-sm"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-void-800 flex items-center justify-center shrink-0">
                {getActionIcon(log.action)}
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                  {log.plantName}
                </h4>
                <span className="text-[11px] text-slate-400 font-semibold block truncate">
                  {log.performedBy} {log.notes ? `• ${log.notes}` : ''}
                </span>
              </div>
            </div>

            <span className="text-[10px] font-bold text-slate-400 shrink-0">
              {formatRelativeDateHe(log.timestamp)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
