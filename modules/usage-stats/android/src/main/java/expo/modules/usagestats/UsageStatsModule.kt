package expo.modules.usagestats

import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.Drawable
import android.os.Build
import android.os.Process
import android.provider.Settings
import android.util.Base64
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.ByteArrayOutputStream

/**
 * Thin bridge over Android's UsageStatsManager.
 *
 * Instead of the pre-aggregated (and bucket-aligned) UsageStats, we replay the raw
 * UsageEvents stream and rebuild foreground "sessions" ourselves. That gives us exact
 * per-hour/per-day attribution, session counts and a timeline, which the JS side
 * aggregates into the numbers shown in the UI.
 */
class UsageStatsModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("UsageStats")

    Function("hasPermission") {
      hasUsageAccess()
    }

    Function("openUsageAccessSettings") {
      val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      context.startActivity(intent)
    }

    AsyncFunction("queryUsage") { startMs: Double, endMs: Double ->
      queryUsage(startMs.toLong(), endMs.toLong())
    }

    AsyncFunction("getAppsInfo") { packages: List<String> ->
      packages.map { appInfo(it) }
    }
  }

  private fun hasUsageAccess(): Boolean {
    val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
    val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      appOps.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName)
    } else {
      @Suppress("DEPRECATION")
      appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName)
    }
    if (mode == AppOpsManager.MODE_DEFAULT) {
      return context.checkCallingOrSelfPermission(android.Manifest.permission.PACKAGE_USAGE_STATS) ==
        PackageManager.PERMISSION_GRANTED
    }
    return mode == AppOpsManager.MODE_ALLOWED
  }

  private fun queryUsage(startMs: Long, endMs: Long): Map<String, Any> {
    val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
    val events = usm.queryEvents(startMs, endMs)
    val ignored = ignoredPackages()

    val sessions = mutableListOf<Map<String, Any>>()
    val unlocks = mutableListOf<Double>()
    var currentPkg: String? = null
    var currentStart = 0L

    fun close(at: Long) {
      val pkg = currentPkg ?: return
      if (at - currentStart >= MIN_SESSION_MS && pkg !in ignored) {
        sessions.add(
          mapOf(
            "packageName" to pkg,
            "start" to currentStart.toDouble(),
            "end" to at.toDouble()
          )
        )
      }
      currentPkg = null
    }

    val event = UsageEvents.Event()
    while (events.hasNextEvent()) {
      events.getNextEvent(event)
      val ts = event.timeStamp
      when (event.eventType) {
        EVENT_RESUMED -> {
          if (event.packageName != currentPkg) {
            close(ts)
            currentPkg = event.packageName
            currentStart = ts
          }
        }
        EVENT_PAUSED, EVENT_STOPPED -> {
          if (event.packageName == currentPkg) close(ts)
        }
        EVENT_SCREEN_OFF, EVENT_SHUTDOWN -> close(ts)
        EVENT_KEYGUARD_HIDDEN -> unlocks.add(ts.toDouble())
      }
    }
    // An app still in the foreground at the end of the window.
    close(minOf(endMs, System.currentTimeMillis()))

    return mapOf("sessions" to sessions, "unlocks" to unlocks)
  }

  private fun ignoredPackages(): Set<String> {
    val pm = context.packageManager
    val home = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)
    val launchers = pm.queryIntentActivities(home, PackageManager.MATCH_DEFAULT_ONLY)
      .map { it.activityInfo.packageName }
    return (launchers + listOf("com.android.systemui", context.packageName)).toSet()
  }

  private fun appInfo(pkg: String): Map<String, Any> {
    val pm = context.packageManager
    val result = mutableMapOf<String, Any>("packageName" to pkg, "label" to pkg, "category" to -1, "isSystem" to false)
    try {
      val info = pm.getApplicationInfo(pkg, 0)
      result["label"] = pm.getApplicationLabel(info).toString()
      result["isSystem"] = (info.flags and ApplicationInfo.FLAG_SYSTEM) != 0
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        result["category"] = info.category
      }
      drawableToBase64(pm.getApplicationIcon(info))?.let { result["icon"] = it }
    } catch (_: PackageManager.NameNotFoundException) {
      // Uninstalled since, or not visible to us — fall back to the package name.
    }
    return result
  }

  private fun drawableToBase64(drawable: Drawable): String? = try {
    val bitmap = Bitmap.createBitmap(ICON_SIZE, ICON_SIZE, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    drawable.setBounds(0, 0, ICON_SIZE, ICON_SIZE)
    drawable.draw(canvas)
    val out = ByteArrayOutputStream()
    bitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
    bitmap.recycle()
    Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP)
  } catch (_: Exception) {
    null
  }

  companion object {
    private const val MIN_SESSION_MS = 1_000L
    private const val ICON_SIZE = 96

    // UsageEvents.Event constants, inlined so older API levels compile cleanly.
    private const val EVENT_RESUMED = 1 // ACTIVITY_RESUMED / MOVE_TO_FOREGROUND
    private const val EVENT_PAUSED = 2 // ACTIVITY_PAUSED / MOVE_TO_BACKGROUND
    private const val EVENT_SCREEN_OFF = 16 // SCREEN_NON_INTERACTIVE (API 28)
    private const val EVENT_KEYGUARD_HIDDEN = 18 // device unlocked (API 28)
    private const val EVENT_STOPPED = 23 // ACTIVITY_STOPPED (API 29)
    private const val EVENT_SHUTDOWN = 26 // DEVICE_SHUTDOWN (API 29)
  }
}
