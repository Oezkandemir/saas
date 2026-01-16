import { Settings } from "lucide-react";

export interface SettingDefinition {
  key: string;
  label: string;
  description: string;
  category: string;
  group?: string;
  type: "text" | "textarea" | "number" | "boolean" | "select" | "password" | "url" | "email";
  options?: string[];
  defaultValue: string;
  validation?: (value: string) => boolean | string;
  placeholder?: string;
  helpText?: string;
  sensitive?: boolean;
}

export interface SettingCategory {
  id: string;
  label: string;
  icon: typeof Settings;
  description: string;
}
