/**
 * Everything Android may run while the app UI isn't open. Imported from the app entry (index.ts)
 * so the handlers exist before any headless task fires.
 */
import { registerWidgets } from '@/widget';

import './hyperfocus';

registerWidgets();
