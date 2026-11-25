export const ADDON_ID = "dt/theme-controller";
export const PANEL_ID = `${ADDON_ID}/panel`;
export const TOOL_ID = `${ADDON_ID}/tool`;

export const EVENTS = {
  OVERRIDE_CHANGED: `${ADDON_ID}/override-changed`,
  BINDINGS_CHANGED: `${ADDON_ID}/bindings-changed`,
  ADDED_PRIMITIVES_CHANGED: `${ADDON_ID}/added-primitives-changed`,
  REQUEST_STATE: `${ADDON_ID}/request-state`,
  STATE: `${ADDON_ID}/state`,
  MODE_CHANGED: `${ADDON_ID}/mode-changed`,
  ROLE_BINDINGS_CHANGED: `${ADDON_ID}/role-bindings-changed`,
  /** Preview → panel: the tokens the rendered story uses. */
  USED_TOKENS: `${ADDON_ID}/used-tokens`,
  /** Panel → preview: report the tokens in use now. */
  REQUEST_USED_TOKENS: `${ADDON_ID}/request-used-tokens`,
  /** Panel → preview: the motion level and slow-motion factor to preview with. */
  MOTION_PREVIEW_CHANGED: `${ADDON_ID}/motion-preview-changed`,
} as const;

export const STORAGE_KEY = "squonk-theme-controller:state:v1";
export const BINDINGS_STORAGE_KEY = "squonk-theme-controller:bindings:v1";
export const ADDED_PRIMITIVES_STORAGE_KEY = "squonk-theme-controller:added-primitives:v1";
export const ROLE_BINDINGS_STORAGE_KEY = "squonk-theme-controller:role-bindings:v1";
export const MOTION_PREVIEW_STORAGE_KEY = "squonk-theme-controller:motion-preview:v1";
