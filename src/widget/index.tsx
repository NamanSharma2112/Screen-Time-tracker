import { isRunningInExpoGo } from 'expo';
import { Platform, TurboModuleRegistry } from 'react-native';

import { TodayWidget } from './TodayWidget';
import { loadWidgetData } from './data';

export const WIDGET_NAME = 'TodayDial';

type WidgetLib = typeof import('react-native-android-widget');

/**
 * The widget library throws on import when its native module isn't present (Expo Go, web), so it
 * is only loaded in builds that include it.
 */
export const widgetsAvailable =
  Platform.OS === 'android' && !isRunningInExpoGo() && TurboModuleRegistry.get('AndroidWidget') != null;

function lib(): WidgetLib | null {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return widgetsAvailable ? (require('react-native-android-widget') as WidgetLib) : null;
}

async function render(width: number, height: number) {
  const { data, theme } = await loadWidgetData();
  const view = (scheme: 'light' | 'dark') => <TodayWidget data={data} width={width} height={height} scheme={scheme} />;
  if (theme === 'system') return { light: view('light'), dark: view('dark') };
  return view(theme);
}

/** Redraws every placed Today widget. Safe to call anywhere; a no-op where widgets aren't supported. */
export async function refreshWidgets() {
  const w = lib();
  if (!w) return;
  try {
    await w.requestWidgetUpdate({ widgetName: WIDGET_NAME, renderWidget: (info) => render(info.width, info.height) });
  } catch {
    // Widgets are a nice-to-have; never let them break the app.
  }
}

/** Asks the launcher to add the widget to the home screen. Resolves false if unsupported. */
export async function pinWidget(): Promise<boolean> {
  const w = lib();
  if (!w) return false;
  try {
    return await w.requestPinWidget({ widgetName: WIDGET_NAME });
  } catch {
    return false;
  }
}

/** Registered from the app entry: draws the widget when Android asks (added, resized, periodic update). */
export function registerWidgets() {
  const w = lib();
  if (!w) return;
  w.registerWidgetTaskHandler(async ({ widgetInfo, widgetAction, renderWidget }) => {
    if (widgetAction === 'WIDGET_DELETED' || widgetAction === 'WIDGET_CLICK') return;
    try {
      renderWidget(await render(widgetInfo.width, widgetInfo.height));
    } catch {
      // Leave the previous rendering in place.
    }
  });
}
