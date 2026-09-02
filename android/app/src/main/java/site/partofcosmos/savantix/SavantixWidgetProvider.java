package site.partofcosmos.savantix;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.widget.RemoteViews;

public class SavantixWidgetProvider extends AppWidgetProvider {

    private static final String PREFS_NAME = "CapacitorStorage";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    public static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            
            String attendancePct = prefs.getString("savantix_widget_pct", "68.92%");
            String attendanceSub = prefs.getString("savantix_widget_sub", "Safe Leaves: 12d (75%)");
            String todayStudy = prefs.getString("savantix_widget_study", "Today: Active");
            String streak = prefs.getString("savantix_widget_streak", "CBSE XI-Science");

            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.savantix_widget_layout);

            views.setTextViewText(R.id.widget_attendance_pct, attendancePct);
            views.setTextViewText(R.id.widget_attendance_sub, attendanceSub);
            views.setTextViewText(R.id.widget_today_study, todayStudy);
            views.setTextViewText(R.id.widget_streak_count, streak);

            // PendingIntent for Quick Log
            Intent logIntent = new Intent(context, MainActivity.class);
            logIntent.setData(Uri.parse("https://site.partofcosmos.savantix/?action=microlog"));
            logIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent logPending = PendingIntent.getActivity(context, 101, logIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            views.setOnClickPendingIntent(R.id.btn_quick_log, logPending);

            // PendingIntent for STEM AI
            Intent stemIntent = new Intent(context, MainActivity.class);
            stemIntent.setData(Uri.parse("https://site.partofcosmos.savantix/?tab=stem_solver"));
            stemIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent stemPending = PendingIntent.getActivity(context, 102, stemIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            views.setOnClickPendingIntent(R.id.btn_stem_ai, stemPending);

            // PendingIntent for Attendance
            Intent attIntent = new Intent(context, MainActivity.class);
            attIntent.setData(Uri.parse("https://site.partofcosmos.savantix/?tab=attendance"));
            attIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent attPending = PendingIntent.getActivity(context, 103, attIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            views.setOnClickPendingIntent(R.id.btn_attendance, attPending);
            views.setOnClickPendingIntent(R.id.widget_root, attPending);

            appWidgetManager.updateAppWidget(appWidgetId, views);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static void refreshAllWidgets(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        ComponentName componentName = new ComponentName(context, SavantixWidgetProvider.class);
        int[] ids = manager.getAppWidgetIds(componentName);
        for (int id : ids) {
            updateAppWidget(context, manager, id);
        }
    }
}
