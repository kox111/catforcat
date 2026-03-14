export type PrivacyLevel = "standard" | "private" | "confidential";

export interface PrivacyConfig {
  aiEnabled: boolean;
  myMemoryEnabled: boolean;
  smartReviewEnabled: boolean;
  cloudTmEnabled: boolean;
  label: string;
  icon: string; // Lucide icon name
  description: string;
}

export const PRIVACY_CONFIGS: Record<PrivacyLevel, PrivacyConfig> = {
  standard: {
    aiEnabled: true,
    myMemoryEnabled: true,
    smartReviewEnabled: true,
    cloudTmEnabled: true,
    label: "Standard",
    icon: "Globe",
    description: "Full features. AI, public TM, Smart Review enabled.",
  },
  private: {
    aiEnabled: true,
    myMemoryEnabled: false,
    smartReviewEnabled: true,
    cloudTmEnabled: false,
    label: "Private",
    icon: "Lock",
    description: "No data sent to public TMs. AI uses your private API key only.",
  },
  confidential: {
    aiEnabled: false,
    myMemoryEnabled: false,
    smartReviewEnabled: false,
    cloudTmEnabled: false,
    label: "Confidential",
    icon: "Shield",
    description: "Maximum security. Zero external API calls. 100% local processing.",
  },
};

export function getPrivacyConfig(level: PrivacyLevel): PrivacyConfig {
  return PRIVACY_CONFIGS[level] || PRIVACY_CONFIGS.standard;
}
