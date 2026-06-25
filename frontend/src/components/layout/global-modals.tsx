'use client'

import { EmailComposer } from '@/components/controls/email-composer'
import { Toast } from '@/components/ui/toast'
import { DataExposure } from '@/components/panels/data-exposure'

export function GlobalModals() {
  return (
    <>
      <EmailComposer />
      <Toast />
      <DataExposure />
    </>
  )
}
