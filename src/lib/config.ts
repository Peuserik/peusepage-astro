import yaml from 'js-yaml';
// ?raw imports let Vite inline the file content at build time
import configYaml from '../data/config.yml?raw';
import translationsYaml from '../data/translations.yml?raw';

export const config: SiteConfig = yaml.load(configYaml) as SiteConfig;
export const translations: Translations = yaml.load(translationsYaml) as Translations;

export interface SiteConfig {
  person: { name: string; title: string; tagline: string };
  social: { linkedin: string; xing: string; x_handle: string; threads_handle: string; github: string; email: string };
  cv_summary: string;
  pinboard: {
    currently_working_on: Array<{ label: string; percent: number }>;
    latest_events: string[];
  };
  hobbies: Array<{ icon: string; id?: string; label_en: string; label_de: string; description_en: string; description_de: string }>;
  themes: { default: string; available: Array<{ id: string; label: string }> };
}

export interface Translations {
  en: Record<string, string>;
  de: Record<string, string>;
}
