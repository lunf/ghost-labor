export const SUPPORTED_PROVIDERS = [
  "Adobe",
  "Confluence",
  "Figma",
  "Google Workspace",
  "Jira",
  "Microsoft Entra ID",
  "Slack"
] as const;

export function isSupportedProvider(value: string) {
  return SUPPORTED_PROVIDERS.includes(value as (typeof SUPPORTED_PROVIDERS)[number]);
}
