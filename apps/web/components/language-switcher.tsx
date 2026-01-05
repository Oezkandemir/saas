'use client';

import { useLocale, useTranslations } from 'next-intl';

import * as Select from '@/components/ui/select';
import { useRouter as useI18nRouter, usePathname } from '@/i18n/routing';
import { logger } from "@/lib/logger";

const languages = [
  {
    value: 'en',
    label: 'English',
    flag: '🇺🇸',
  },
  {
    value: 'de',
    label: 'Deutsch',
    flag: '🇩🇪',
  },
];

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useI18nRouter();
  const pathname = usePathname();
  const t = useTranslations('Navigation');

  const switchLanguage = async (newLocale: string) => {
    // Save locale preference to cookie
    try {
      await fetch('/api/locale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ locale: newLocale }),
      });
    } catch (error) {
      logger.error('Failed to save locale preference:', error);
    }

    // Navigate to new locale
    router.replace(pathname, { locale: newLocale });
  };

  const currentLanguage = languages.find((lang) => lang.value === locale) || languages[0];

  return (
    <Select.Root
      value={locale}
      onValueChange={switchLanguage}
    >
      <Select.Trigger 
        variant="compact" 
        className="pl-2.5 w-auto min-w-[auto] border-0 bg-transparent hover:bg-muted"
        aria-label={t('switchLanguage')}
      >
        <div className="flex items-center">
          <span className="flex size-5 items-center justify-center rounded-full bg-background text-base leading-none ring-1 ring-border">
            {currentLanguage.flag}
          </span>
        </div>
      </Select.Trigger>
      <Select.Content align="center">
        {languages.map((item) => (
          <Select.Item
            key={item.value}
            value={item.value}
          >
            <div className="flex items-center gap-2">
              <span className="flex size-5 items-center justify-center rounded-full bg-background text-base leading-none ring-1 ring-border">
                {item.flag}
              </span>
              <span>{item.label}</span>
            </div>
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  );
}

