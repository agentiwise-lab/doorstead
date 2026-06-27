import type { ReactNode } from 'react'

interface PublicHeaderProps {
  contextLabel?: string
  action?: ReactNode
}

export function PublicHeader({ contextLabel, action }: PublicHeaderProps = {}) {
  return (
    <header className="border-b border-brand-100 bg-white">
      <div className="mx-auto flex max-w-6xl items-center px-4 py-3 sm:px-6">
        <p className="shrink-0 text-sm font-semibold tracking-[0.2em] text-brand-700 uppercase">
          Marlowe &amp; Hart
        </p>

        {contextLabel && (
          <p className="mx-4 min-w-0 flex-1 truncate text-center text-sm font-medium text-brand-900">
            {contextLabel}
          </p>
        )}

        {action && (
          <div className={contextLabel ? 'shrink-0' : 'ml-auto'}>
            {action}
          </div>
        )}
      </div>
    </header>
  )
}
