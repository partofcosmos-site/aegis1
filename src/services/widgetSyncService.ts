import { Preferences } from '@capacitor/preferences';

export interface WidgetDataPayload {
  effectivePct: number;
  safeLeaves75: number;
  safeLeaves60: number;
  todayMinutes?: number;
  activeStreak?: number;
}

export class WidgetSyncService {
  /**
   * Syncs latest study and attendance stats to native Android SharedPreferences
   * so the Android Home Screen Widget updates in real time.
   */
  static async syncToNativeWidget(data: WidgetDataPayload): Promise<void> {
    try {
      const pctStr = `${data.effectivePct.toFixed(2)}%`;
      const subStr = `Safe Leaves: ${data.safeLeaves75}d (75%)`;
      const studyStr = data.todayMinutes !== undefined && data.todayMinutes > 0
        ? `Today: ${data.todayMinutes} min`
        : 'Today: Active';
      const streakStr = data.activeStreak !== undefined && data.activeStreak > 0
        ? `🔥 ${data.activeStreak}d Streak`
        : 'CBSE XI-Science';

      await Preferences.set({ key: 'savantix_widget_pct', value: pctStr });
      await Preferences.set({ key: 'savantix_widget_sub', value: subStr });
      await Preferences.set({ key: 'savantix_widget_study', value: studyStr });
      await Preferences.set({ key: 'savantix_widget_streak', value: streakStr });
    } catch (e) {
      // In web fallback environments, Preferences gracefully logs or no-ops
    }
  }
}
