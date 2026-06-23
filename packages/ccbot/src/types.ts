import type { ClaudeConfig } from './claude.js';
import type { FeishuConfig } from './feishu.js';

// Connection config for the vicvic.im adapter. The bot connects out over a
// WebSocket to app-server (no public address needed on this machine).
export interface VicvicConfig {
  // app-server base URL, e.g. https://api.vicvic.im (http(s) is rewritten to ws(s)).
  baseUrl: string;
  // Pairing token from the vicvic.im "Add AI Bot" dialog.
  token: string;
}

// ccbot.json shape. At least one adapter (feishu or vicvic) must be configured.
export interface Config {
  feishu?: FeishuConfig;
  vicvic?: VicvicConfig;
  claude: ClaudeConfig;
}
