'use client'

import { useEffect, useRef, useState } from 'react'
import useSWR from 'swr'
import { MessageCircle, Send } from 'lucide-react'
import { toast } from 'sonner'

import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/components/auth/auth-provider'
import { messagingApi } from '@/lib/api'
import type { PatientDoctorConversation, PatientDoctorConversationSummary } from '@/lib/api'

const MAX_MESSAGE_LENGTH = 4000
const REFRESH_INTERVAL_MS = 15_000

class MessagingRequestError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
  }
}

async function loadInbox() {
  const result = await messagingApi.getInbox()
  if (!result.data) throw new MessagingRequestError(result.error ?? 'Could not load messages', result.status)
  return result.data
}

async function loadConversation(id: string) {
  const result = await messagingApi.getConversation(id)
  if (!result.data) throw new MessagingRequestError(result.error ?? 'Could not load conversation', result.status)
  return result.data
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

function formatDate(value?: string, includeTime = false) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(undefined, includeTime
    ? { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }
    : { month: 'numeric', day: 'numeric', year: 'numeric' }).format(date)
}

export function MessagingInbox() {
  const { user } = useAuth()
  const isDoctor = user?.roles.includes('doctor') ?? false
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [isOpening, setIsOpening] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const markingReadFor = useRef<string | null>(null)
  const messageListRef = useRef<HTMLDivElement>(null)

  const {
    data: inbox = [],
    error: inboxError,
    isLoading: isInboxLoading,
    mutate: mutateInbox,
  } = useSWR<PatientDoctorConversationSummary[]>('patient-doctor-inbox', loadInbox, {
    refreshInterval: REFRESH_INTERVAL_MS,
    isPaused: () => typeof document !== 'undefined' && document.hidden,
    revalidateOnFocus: true,
  })

  const {
    data: thread,
    error: threadError,
    isLoading: isThreadLoading,
    mutate: mutateThread,
  } = useSWR<PatientDoctorConversation>(
    selectedConversationId ? ['patient-doctor-conversation', selectedConversationId] as const : null,
    ([, id]: readonly [string, string]) => loadConversation(id),
    {
      refreshInterval: REFRESH_INTERVAL_MS,
      isPaused: () => typeof document !== 'undefined' && document.hidden,
      revalidateOnFocus: true,
      onError: (error) => {
        const conversationId = selectedConversationId
        if (!isDoctor || !(error instanceof MessagingRequestError) || (error.status !== 403 && error.status !== 404)) return
        if (!conversationId) return
        setSelectedConversationId((current) => current === conversationId ? null : current)
        void mutateInbox()
        toast.error('This conversation is no longer available because access is inactive.')
      },
    },
  )

  useEffect(() => {
    if (!thread || !selectedConversationId || thread.unread_count === 0) return
    if (markingReadFor.current === selectedConversationId) return
    const conversationId = selectedConversationId
    markingReadFor.current = conversationId
    void messagingApi.markRead(conversationId).then(async (result) => {
      if (result.data) {
        await mutateThread((current) => current ? { ...current, unread_count: result.data!.unread_count } : current, false)
        await mutateInbox()
      }
    }).finally(() => {
      if (markingReadFor.current === conversationId) markingReadFor.current = null
    })
  }, [thread, selectedConversationId, mutateInbox, mutateThread])

  useEffect(() => {
    messageListRef.current?.scrollTo({ top: messageListRef.current.scrollHeight, behavior: 'smooth' })
  }, [thread?.messages.length, selectedConversationId])

  const openConversation = async (summary: PatientDoctorConversationSummary) => {
    if (summary.conversation_id) {
      setSelectedConversationId(summary.conversation_id)
      setDraft('')
      return
    }
    if (!summary.can_send) return
    setIsOpening(true)
    const result = await messagingApi.openConversation(summary.participant_id)
    setIsOpening(false)
    if (!result.data) {
      toast.error(result.error ?? 'Could not open conversation')
      return
    }
    setSelectedConversationId(result.data.conversation_id ?? null)
    setDraft('')
    await mutateInbox()
  }

  const sendMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedConversationId || !thread?.can_send || isSending) return
    const content = draft.trim()
    if (!content || content.length > MAX_MESSAGE_LENGTH) return
    setIsSending(true)
    const result = await messagingApi.sendMessage(selectedConversationId, content)
    setIsSending(false)
    if (!result.data) {
      toast.error(result.error ?? 'Message could not be sent')
      if (result.status === 403 || result.status === 404) {
        if (isDoctor) setSelectedConversationId(null)
        await mutateInbox()
      }
      return
    }
    setDraft('')
    await Promise.all([mutateThread(), mutateInbox()])
  }

  const selectedSummary = inbox.find((row) => row.conversation_id === selectedConversationId)
  const hasActiveAccess = selectedSummary?.grant_status === 'active' || inbox.some((row) => row.grant_status === 'active')
  const accessLabel = hasActiveAccess ? 'Access active' : 'Access inactive'

  return (
    <section className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-[1280px] flex-col px-0 py-2 text-foreground">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight">Messages</h1>
          <p className="mt-2 max-w-2xl text-[15px] text-muted-foreground">
            Private conversations are available while patient-approved doctor access is active.
          </p>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 font-mono text-[11px] uppercase tracking-wider ${hasActiveAccess ? 'border-emerald-700/20 bg-emerald-700/10 text-emerald-800 dark:text-emerald-300' : 'border-border bg-muted text-muted-foreground'}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${hasActiveAccess ? 'bg-emerald-700 dark:bg-emerald-400' : 'bg-muted-foreground'}`} />
          {accessLabel}
        </span>
      </header>

      {inboxError && <p role="alert" className="mb-4 text-sm text-destructive">{inboxError.message}</p>}

      <div className="grid min-h-[min(640px,calc(100vh-190px))] flex-1 items-stretch gap-5 lg:grid-cols-[minmax(260px,340px)_minmax(0,1fr)] max-lg:grid-cols-1">
        <aside className="flex min-h-0 flex-col overflow-hidden rounded-2xl border bg-card max-lg:max-h-[320px]" aria-label="Inbox">
          <div className="border-b px-5 pb-4 pt-5">
            <h2 className="font-serif text-xl font-semibold tracking-tight">Inbox</h2>
            <p className="mt-1 font-mono text-xs text-muted-foreground" aria-live="polite">
              {inbox.length} conversation{inbox.length === 1 ? '' : 's'}
            </p>
          </div>
          {isInboxLoading ? (
            <div className="flex flex-1 items-center justify-center py-10"><Spinner /></div>
          ) : inbox.length === 0 ? (
            <p className="p-5 text-sm leading-relaxed text-muted-foreground">
              {isDoctor
                ? 'Patients who have granted and activated access will appear here.'
                : 'Messages become available after a doctor accepts your access request.'}
            </p>
          ) : (
            <ul className="flex-1 space-y-1 overflow-y-auto p-2.5" role="listbox" aria-label="Conversations">
              {inbox.map((item) => {
                const selected = item.conversation_id === selectedConversationId
                const active = item.grant_status === 'active'
                return (
                  <li key={`${item.patient_id}-${item.doctor_id}`}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => void openConversation(item)}
                      disabled={isOpening || (!item.conversation_id && !item.can_send)}
                      className={`w-full rounded-xl border px-3.5 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default disabled:opacity-70 ${selected ? 'border-primary/20 bg-primary/10' : 'border-transparent hover:bg-muted/70'}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold tracking-tight">{item.participant_name}</span>
                        {item.unread_count > 0 && <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[11px] font-semibold text-primary-foreground" aria-label={`${item.unread_count} unread`}>{item.unread_count}</span>}
                      </div>
                      <p className="mt-1 truncate text-[13px] text-muted-foreground">{item.last_message ?? 'Start a conversation'}</p>
                      <div className="mt-2.5 flex items-center justify-between gap-2">
                        <span className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide ${active ? 'text-emerald-800 dark:text-emerald-300' : 'text-muted-foreground'}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-700 dark:bg-emerald-400' : 'bg-muted-foreground/60'}`} />
                          {active ? 'Access active' : `${item.grant_status} · read only`}
                        </span>
                        {item.last_message_at && <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">{formatDate(item.last_message_at)}</span>}
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </aside>

        <section className="flex min-h-[520px] min-w-0 flex-col overflow-hidden rounded-2xl border bg-card" aria-label="Conversation">
          {thread && selectedConversationId ? (
            <>
              <header className="flex items-center gap-3.5 border-b px-5 py-4 sm:px-6">
                <div aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-full border bg-muted font-mono text-xs font-semibold tracking-wide">
                  {initials(thread.participant_name)}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate font-serif text-[22px] font-semibold leading-tight tracking-tight">{thread.participant_name}</h2>
                  <p className="mt-0.5 text-[13px] text-muted-foreground">
                    {thread.can_send ? 'Patient-approved access is active.' : 'Read-only conversation history. Messaging is unavailable while access is inactive.'}
                  </p>
                </div>
              </header>

              <div ref={messageListRef} className="flex flex-1 flex-col gap-[18px] overflow-y-auto bg-background px-4 py-6 sm:px-6 sm:py-7" aria-live="polite" aria-relevant="additions" role="log">
                {thread.messages.length === 0 ? (
                  <div className="grid flex-1 place-items-center px-4 py-10 text-center text-muted-foreground">
                    <div>
                      <h3 className="mb-2 font-serif text-[22px] font-semibold text-foreground">No messages yet</h3>
                      <p className="text-sm">Start the conversation below.</p>
                    </div>
                  </div>
                ) : thread.messages.map((message) => {
                  const isOwnMessage = message.sender_id === user?.id
                  return (
                    <article key={message.id} className={`flex max-w-[min(420px,82%)] flex-col gap-1.5 ${isOwnMessage ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                      <p className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${isOwnMessage ? 'rounded-br-[5px] bg-primary text-primary-foreground' : 'rounded-bl-[5px] border bg-card text-card-foreground'}`}>
                        {message.content}
                      </p>
                      <time dateTime={message.created_at} className="px-1 font-mono text-[11px] tabular-nums text-muted-foreground">
                        {formatDate(message.created_at, true)}
                      </time>
                    </article>
                  )
                })}
              </div>

              {thread.can_send ? (
                <form onSubmit={sendMessage} className="flex shrink-0 flex-col gap-3 border-t bg-card px-4 pb-4 pt-4 sm:px-[18px] sm:pb-[18px]">
                  <label htmlFor="message-composer" className="sr-only">Write a message</label>
                  <textarea
                    id="message-composer"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value.slice(0, MAX_MESSAGE_LENGTH))}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault()
                        event.currentTarget.form?.requestSubmit()
                      }
                    }}
                    maxLength={MAX_MESSAGE_LENGTH}
                    rows={3}
                    placeholder="Write a message…"
                    className="min-h-[88px] max-h-[180px] w-full resize-y rounded-[10px] border bg-background px-4 py-3.5 text-[15px] leading-relaxed outline-none transition-colors placeholder:text-muted-foreground hover:border-foreground/20 focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/15"
                  />
                  <div className="flex items-center justify-between gap-4">
                    <span aria-live="polite" className={`font-mono text-xs tabular-nums ${draft.length > MAX_MESSAGE_LENGTH * 0.9 ? 'text-primary' : 'text-muted-foreground'}`}>
                      {draft.length} / {MAX_MESSAGE_LENGTH}
                    </span>
                    <button type="submit" disabled={isSending || !draft.trim()} className="inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-primary bg-primary px-5 text-[15px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45">
                      {isSending ? <Spinner size="sm" /> : <Send className="h-4 w-4" aria-hidden="true" />}
                      Send
                    </button>
                  </div>
                </form>
              ) : (
                <p className="shrink-0 border-t px-5 py-4 text-sm leading-relaxed text-muted-foreground">
                  You can read this conversation, but messages are disabled because access is inactive.
                </p>
              )}
            </>
          ) : isThreadLoading ? (
            <div className="flex flex-1 items-center justify-center"><Spinner /></div>
          ) : (
            <div className="grid flex-1 place-items-center p-8 text-center">
              <div className="max-w-sm text-muted-foreground">
                <MessageCircle className="mx-auto mb-3 h-9 w-9" aria-hidden="true" />
                <h2 className="font-serif text-[22px] font-semibold text-foreground">Choose a conversation</h2>
                <p className="mt-2 text-sm leading-relaxed">Select someone from your inbox to read or send a message.</p>
              </div>
            </div>
          )}
          {selectedSummary && selectedSummary.grant_status !== 'active' && !thread && !threadError && (
            <p className="border-t p-4 text-sm text-muted-foreground">Loading read-only conversation history…</p>
          )}
          {threadError && !(threadError instanceof MessagingRequestError && isDoctor && (threadError.status === 403 || threadError.status === 404)) && (
            <p role="alert" className="border-t p-4 text-sm text-destructive">{threadError.message}</p>
          )}
        </section>
      </div>
    </section>
  )
}
