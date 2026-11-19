import type { ReactNode, RefObject } from 'react'
import { Link } from 'react-router-dom'
import type { Conversation } from '../../lib/api'
import HistoryPanel from './HistoryPanel'
import { Icon, type IconName } from '../icons'

// Collapsed: a 56px icon rail with tooltips. Expanded: a 240px drawer with labels and
// the Recent list. Below md it becomes a slide-over drawer with a backdrop.

const ROW =
  'flex h-9 items-center gap-3 rounded-full text-[13px] font-medium transition-colors duration-150 focus-visible:outline-white'

function Tip({ label, show, children }: { label: string; show: boolean; children: ReactNode }) {
  return (
    <div className="group/tip relative">
      {children}
      {show && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-md bg-ink px-2.5 py-1.5 text-xs font-medium text-white opacity-0 transition-opacity duration-150 group-focus-within/tip:opacity-100 group-hover/tip:opacity-100"
        >
          {label}
        </span>
      )}
    </div>
  )
}

function NavRow({
  label,
  icon,
  labels,
  active,
  onClick,
  to,
  expandedState,
}: {
  label: string
  icon: IconName
  labels: boolean
  active?: boolean
  onClick?: () => void
  to?: string
  expandedState?: boolean
}) {
  const cls = `${ROW} ${labels ? 'w-full px-2.5' : 'w-9 justify-center'} ${
    active ? 'bg-white/20 text-white' : 'text-white hover:bg-white/10'
  }`
  const content = (
    <>
      <Icon name={icon} className="h-[17px] w-[17px] shrink-0" />
      {labels && <span className="truncate">{label}</span>}
    </>
  )
  // Collapsed rows have no visible text, so they carry the accessible name themselves.
  const aria = labels ? undefined : label

  return (
    <Tip label={label} show={!labels}>
      {to ? (
        <Link to={to} className={cls} aria-label={aria}>
          {content}
        </Link>
      ) : (
        <button type="button" onClick={onClick} className={cls} aria-label={aria} aria-expanded={expandedState} aria-current={active ? 'page' : undefined}>
          {content}
        </button>
      )}
    </Tip>
  )
}

export default function Sidebar({
  panelRef,
  isDesktop,
  expanded,
  drawerOpen,
  newActive,
  onToggle,
  onCloseDrawer,
  onNewChat,
  onOpenHistory,
  conversations,
  loading,
  hasMore,
  onLoadMore,
  activeId,
  onDelete,
}: {
  panelRef: RefObject<HTMLElement | null>
  isDesktop: boolean
  expanded: boolean // desktop only
  drawerOpen: boolean // mobile only
  newActive: boolean
  onToggle: () => void
  onCloseDrawer: () => void
  onNewChat: () => void
  onOpenHistory: () => void
  conversations: Conversation[]
  loading: boolean
  hasMore: boolean
  onLoadMore: () => void
  activeId?: string
  onDelete: (id: string) => void
}) {
  const labels = isDesktop ? expanded : true
  const modal = !isDesktop && drawerOpen

  return (
    <aside
      ref={panelRef}
      id="chat-sidebar"
      inert={!isDesktop && !drawerOpen}
      aria-label="Sidebar"
      role={modal ? 'dialog' : undefined}
      aria-modal={modal ? true : undefined}
      className={`fixed inset-y-0 left-0 z-[60] flex w-[240px] flex-col bg-brand pt-5 transition-[width,transform] duration-200 ease-out motion-reduce:transition-none md:z-10 md:translate-x-0 ${
        drawerOpen ? 'translate-x-0' : '-translate-x-full'
      } ${expanded ? 'md:w-[240px]' : 'md:w-14'}`}
    >
      <div className={`flex flex-col gap-1 px-2.5 ${labels ? '' : 'items-center'}`}>
        <NavRow
          label={isDesktop ? (expanded ? 'Collapse sidebar' : 'Expand sidebar') : 'Close sidebar'}
          icon={isDesktop ? 'menu' : 'close'}
          labels={false}
          onClick={isDesktop ? onToggle : onCloseDrawer}
          expandedState={isDesktop ? expanded : drawerOpen}
        />
        <div className="h-2" aria-hidden="true" />
        <NavRow label="New chat" icon="newChat" labels={labels} active={newActive} onClick={onNewChat} />
        {!labels && <NavRow label="Recent chats" icon="history" labels={false} onClick={onOpenHistory} />}
      </div>

      {labels ? (
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2.5 pb-2 pt-3">
          <HistoryPanel
            conversations={conversations}
            loading={loading}
            hasMore={hasMore}
            onLoadMore={onLoadMore}
            activeId={activeId}
            onDelete={onDelete}
            onNavigate={onCloseDrawer}
          />
        </div>
      ) : (
        <div className="flex-1" />
      )}

      <div className={`flex flex-col gap-1 px-2.5 pb-4 pt-2 ${labels ? '' : 'items-center'}`}>
        <NavRow label="Profile" icon="user" labels={labels} to="/profile" />
      </div>
    </aside>
  )
}
