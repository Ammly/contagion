'use client'

import { useSimulationStore } from '@/stores/simulation-store'

export function LiveIndicator() {
  const connected = useSimulationStore(s => s.sseConnected)

  return (
    <div className={[
      'flex items-center gap-1.5 rounded-full border px-3 py-1',
      connected
        ? 'border-green-400 bg-green-50 dark:border-green-700 dark:bg-green-950'
        : 'border-[#E2EBE2] bg-[#F8FAF8] dark:border-[#283828] dark:bg-[#1a2a1a]',
    ].join(' ')}>
      <span
        className={[
          'h-1.5 w-1.5 rounded-full',
          connected ? 'bg-[#3AA335] pulse-green' : 'bg-[#C5D8C5] dark:bg-[#3a5a3a]',
        ].join(' ')}
      />
      <span className={[
        'font-mono text-[11px] font-semibold',
        connected
          ? 'text-green-700 dark:text-green-400'
          : 'text-[#8A9E8A] dark:text-[#5a7a5a]',
      ].join(' ')}>
        {connected ? 'LIVE' : 'CONNECTING'}
      </span>
    </div>
  )
}
