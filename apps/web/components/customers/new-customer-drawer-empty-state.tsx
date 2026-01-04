'use client';

import { NewCustomerDrawer } from './new-customer-drawer';
import { ButtonRoot } from '@/components/alignui/actions/button';
import { useTranslations } from 'next-intl';

export function NewCustomerDrawerEmptyState() {
  const t = useTranslations('Customers');

  return (
    <NewCustomerDrawer
      trigger={
        <ButtonRoot size="sm" variant="outline" className="mt-3 h-8 text-xs">
          {t('empty.createFirst')}
        </ButtonRoot>
      }
    />
  );
}

