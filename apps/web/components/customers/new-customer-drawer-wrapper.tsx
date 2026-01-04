'use client';

import { NewCustomerDrawer } from './new-customer-drawer';
import { ButtonRoot } from '@/components/alignui/actions/button';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function NewCustomerDrawerWrapper() {
  const t = useTranslations('Customers');

  return (
    <NewCustomerDrawer
      trigger={
        <ButtonRoot className="gap-1.5 text-xs sm:text-sm h-8 sm:h-9">
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t('newCustomer')}</span>
          <span className="sm:hidden">{t('new')}</span>
        </ButtonRoot>
      }
    />
  );
}

