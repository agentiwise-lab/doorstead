import type { ReactNode } from 'react'
import type { Session } from '@/lib/auth/contract'
import { BuyerAuthCluster } from './BuyerAuthCluster'

interface PublicHeaderProps {
  contextLabel?: string
  contextLabelAs?: 'h1' | 'p'
  action?: ReactNode
  maxWidth?: '4xl' | '6xl'
  session?: Session | null
}

export function PublicHeader({
  contextLabel,
  contextLabelAs = 'p',
  action,
  maxWidth = '6xl',
  session = null,
}: PublicHeaderProps = {}) {
  const ContextEl = contextLabelAs === 'h1' ? 'h1' : 'p'
  const widthClass = maxWidth === '4xl' ? 'max-w-4xl' : 'max-w-6xl'

  return (
    <header className="border-b border-brand-100 bg-white">
      <div
        className={`mx-auto grid grid-cols-3 items-center gap-4 px-4 py-3 sm:px-6 ${widthClass}`}
      >
        <p className="col-start-1 text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">
          Marlowe &amp; Hart
        </p>

        {contextLabel && (
          <ContextEl className="col-start-2 min-w-0 truncate text-center text-sm font-medium text-brand-900">
            {contextLabel}
          </ContextEl>
        )}

        <div className="col-start-3 flex items-center justify-end gap-4">
          {action}
          <BuyerAuthCluster session={session} />
        </div>
      </div>
    </header>
  )
}
