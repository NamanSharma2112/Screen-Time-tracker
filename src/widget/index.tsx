import { isRunningInExpoGo } from 'expo';
import { Platform, TurboModuleRegistry } from 'react-native';

import { TodayWidget } from './TodayWidget';
import { loadTreeData, loadWidgetData } from './data';
import { TreeWidget } from './TreeWidget';

export const WIDGET_NAME = 'TodayDial';
export const TREE_WIDGET_NAME = 'StreakTree';

type WidgetLib = typeof import('react-native-android-widget');

/**
 * The widget library throws on import when its native module isn't present (Expo Go, web), so it
 * is only loaded in builds that include it.
 */
export const widgetsAvailable =
  Platform.OS === 'android' && !isRunningInExpoGo() && TurboModuleRegistry.get('AndroidWidget') != null;

function lib(): WidgetLib | null {
  if (!widgetsAvailable) return null;
  // A require inside try/catch is an *optional* dependency for Metro: if the package isn't
  // installed, bundling still succeeds and widgets are simply unavailable.
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('react-native-android-widget') as WidgetLib;
  } catch {
    return null;
  }
}

async function render(ui: WidgetLib, name: string, width: number, height: number) {
  if (name === TREE_WIDGET_NAME) {
    const { tree, accent, theme } = await loadTreeData();
    const view = (scheme: 'light' | 'dark') => (
      <TreeWidget tree={tree} accent={accent} width={width} height={height} scheme={scheme} ui={ui} />
    );
    return theme === 'system' ? { light: view('light'), dark: view('dark') } : view(theme);
  }
  const { data, theme } = await loadWidgetData();
  const view = (scheme: 'light' | 'dark') => (
    <TodayWidget data={data} width={width} height={height} scheme={scheme} ui={ui} />
  );
  return theme === 'system' ? { light: view('light'), dark: view('dark') } : view(theme);
}

/** Redraws every placed widget (dial + tree). Safe anywhere; a no-op where widgets aren't supported. */
export async function refreshWidgets() {
  const w = lib();
  if (!w) return;
  for (const name of [WIDGET_NAME, TREE_WIDGET_NAME]) {
    try {
      await w.requestWidgetUpdate({
        widgetName: name,
        renderWidget: (info) => render(w, name, info.width, info.height),
      });
    } catch {
      // Widgets are a nice-to-have; never let them break the app.
    }
  }
}

/** Asks the launcher to add a widget to the home screen. Resolves false if unsupported. */
export async function pinWidget(name: string = WIDGET_NAME): Promise<boolean> {
  const w = lib();
  if (!w) return false;
  try {
    return await w.requestPinWidget({ widgetName: name });
  } catch {
    return false;
  }
}

/** Registered from the app entry: draws widgets when Android asks (added, resized, periodic update). */
export function registerWidgets() {
  const w = lib();
  if (!w) return;
  w.registerWidgetTaskHandler(async ({ widgetInfo, widgetAction, renderWidget }) => {
    if (widgetAction === 'WIDGET_DELETED' || widgetAction === 'WIDGET_CLICK') return;
    try {
      renderWidget(await render(w, widgetInfo.widgetName, widgetInfo.width, widgetInfo.height));
    } catch {
      // Leave the previous rendering in place.
    }
  });
}
