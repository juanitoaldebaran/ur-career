const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      // For FormData the browser must set the type itself, with the multipart boundary.
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  })

  if (res.status === 204) {
    return undefined as T
  }

  const body = await res.json().catch(() => null)

  if (!res.ok) {
    const message =
      body && typeof body.error === 'string' ? body.error : `request failed (${res.status})`
    throw new ApiError(res.status, message)
  }

  return body as T
}

export interface AuthUser {
  user_id: string
  email: string
}

export interface RegisteredUser {
  id: string
  email: string
  created_at: string
}

export interface TokenPair {
  access_token: string
  refresh_token: string
}

export interface Profile {
  user_id: string
  full_name: string
  current_role: string
  target_role: string
  updated_at: string
}

export interface RoadmapSummary {
  id: string
  slug: string
  title: string
  node_count: number
}

export interface RoadmapNode {
  id: string
  parent_id: string | null
  title: string
  position: number
  status: string
}

export function register(email: string, password: string): Promise<RegisteredUser> {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function login(email: string, password: string): Promise<TokenPair> {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function refresh(refreshToken: string): Promise<TokenPair> {
  return request('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
}

export function logout(refreshToken: string): Promise<void> {
  return request('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
}

export function me(accessToken: string): Promise<AuthUser> {
  return request('/auth/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function getProfile(accessToken: string): Promise<Profile> {
  return request('/profile', {
    headers: { Authorization: `Bearer ${accessToken}`},
  })
}

export interface ProfileInput {
  full_name: string
  current_role: string
  target_role: string
}

export function updateProfile(input: ProfileInput, accessToken: string): Promise<Profile> {
  return request('/profile', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(input),
  })
}

export interface RoadmapProgressStats {
  slug: string
  title: string
  total_nodes: number
  done_nodes: number
}

export interface QuizStats {
  total_taken: number
  best_score: number
  average_score: number
}

export interface PracticeStats {
  total_attempts: number
  best_score: number
  average_score: number
}

export interface StreakStats {
  current: number
  longest: number
  active_today: boolean
}

export interface ProfileStats {
  roadmaps: RoadmapProgressStats[]
  quiz: QuizStats
  practice: PracticeStats
  streak: StreakStats
}

export function getProfileStats(accessToken: string): Promise<ProfileStats> {
  const tz = encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone)
  return request(`/profile/stats?tz=${tz}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function listRoadmaps(accessToken: string): Promise<RoadmapSummary[]> {
  return request('/roadmaps', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function getRoadmap(slug: string, accessToken: string): Promise<RoadmapNode[]> {
  return request(`/roadmap/${slug}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function updateNodeStatus(
  nodeId: string,
  status: string,
  accessToken: string,
): Promise<void> {
  return request(`/roadmap/nodes/${nodeId}/progress`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ status }),
  })
}

export type PracticeCategory = 'coding' | 'system_design'

export interface PracticeQuestion {
  id: string
  category: PracticeCategory
  difficulty: 'easy' | 'medium' | 'hard'
  prompt: string
  approach: string
  evaluating: string
  best_score: number | null
}

export interface PracticeCriterion {
  name: string
  score: number
  max: number
  comment: string
}

export interface PracticeResult {
  attempt_id: string
  score: number
  feedback: string
  criteria: PracticeCriterion[]
  reference_answer: string
}

export function listPracticeQuestions(
  role: string,
  accessToken: string,
): Promise<PracticeQuestion[]> {
  return request(`/practice/questions?role=${encodeURIComponent(role)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function submitPracticeAnswer(
  questionId: string,
  answer: string,
  accessToken: string,
): Promise<PracticeResult> {
  return request(`/practice/questions/${questionId}/attempts`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ answer }),
  })
}

export interface QuizQuestion {
  id: string
  prompt: string
  options: string[]
}

export interface QuizSession {
  id: string
  role: string
  questions: QuizQuestion[]
}

export interface QuizReviewItem {
  question_id: string
  selected: number | null
  correct: number
  is_correct: boolean
  explanation: string
}

export interface Streak {
  current: number
  longest: number
  is_new_day: boolean
}

export interface QuizResult {
  score: number
  correct: number
  total: number
  review: QuizReviewItem[]
  streak: Streak | null
}

export function createQuiz(role: string, accessToken: string): Promise<QuizSession> {
  return request('/practice/quizzes', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ role }),
  })
}

export function submitQuiz(
  quizId: string,
  answers: Record<string, number>,
  accessToken: string,
): Promise<QuizResult> {
  return request(`/practice/quizzes/${quizId}/submit`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({
      answers,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }),
  })
}

// ---- Consultation (AI career chat) ----

export interface Conversation {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  status: 'complete' | 'interrupted' | 'error'
  created_at: string
}

export interface Page<T> {
  items: T[]
  has_more: boolean
  next_cursor?: string
}

const auth = (accessToken: string) => ({ Authorization: `Bearer ${accessToken}` })

export function listConversations(accessToken: string, cursor?: string): Promise<Page<Conversation>> {
  const qs = new URLSearchParams({ limit: '20' })
  if (cursor) qs.set('cursor', cursor)
  return request(`/consultations?${qs}`, { headers: auth(accessToken) })
}

export function createConversation(accessToken: string): Promise<Conversation> {
  return request('/consultations', { method: 'POST', headers: auth(accessToken) })
}

export function deleteConversation(id: string, accessToken: string): Promise<void> {
  return request(`/consultations/${id}`, { method: 'DELETE', headers: auth(accessToken) })
}

// Messages come back oldest-first inside the page; next_cursor asks for older ones.
export function listMessages(id: string, accessToken: string, cursor?: string): Promise<Page<ChatMessage>> {
  const qs = new URLSearchParams({ limit: '20' })
  if (cursor) qs.set('cursor', cursor)
  return request(`/consultations/${id}/messages?${qs}`, { headers: auth(accessToken) })
}

export interface StreamHandlers {
  onDelta: (text: string) => void
  onDone: (info: { message_id?: string; status?: string }) => void
  onError: () => void
}

// Sends a message and reads the Server-Sent Events reply. EventSource can't POST or
// send an Authorization header, so this uses fetch + a stream reader.
// Throws ApiError for failures before the first token (404/409/429/...), and the
// browser's AbortError if the signal fires.
export async function streamMessage(
  id: string,
  content: string,
  accessToken: string,
  signal: AbortSignal,
  handlers: StreamHandlers,
): Promise<void> {
  const res = await fetch(`${API_URL}/consultations/${id}/messages`, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json', ...auth(accessToken) },
    body: JSON.stringify({
      content,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }),
  })

  if (!res.ok || !res.body) {
    const body = await res.json().catch(() => null)
    const message = body && typeof body.error === 'string' ? body.error : `request failed (${res.status})`
    throw new ApiError(res.status, message)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  const dispatch = (frame: string) => {
    let event = 'message'
    let data = ''
    for (const line of frame.split('\n')) {
      if (line.startsWith('event:')) event = line.slice(6).trim()
      else if (line.startsWith('data:')) data += line.slice(5).trim()
    }
    if (!data) return
    let payload: Record<string, unknown>
    try {
      payload = JSON.parse(data)
    } catch {
      return
    }
    if (event === 'delta' && typeof payload.text === 'string') handlers.onDelta(payload.text)
    else if (event === 'done')
      handlers.onDone({
        message_id: typeof payload.message_id === 'string' ? payload.message_id : undefined,
        status: typeof payload.status === 'string' ? payload.status : undefined,
      })
    else if (event === 'error') handlers.onError()
  }

  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    // A frame ends with a blank line, and one can be split across network chunks.
    let cut: number
    while ((cut = buffer.indexOf('\n\n')) !== -1) {
      dispatch(buffer.slice(0, cut))
      buffer = buffer.slice(cut + 2)
    }
  }
}

export interface CvCriterion {
  name: string
  score: number
  max: number
  comment: string
}

export interface CvReview {
  id: string
  target_role: string
  score: number
  summary: string
  criteria: CvCriterion[]
  created_at: string
}

export function reviewCv(file: File, targetRole: string, accessToken: string): Promise<CvReview> {
  const form = new FormData()
  form.append('file', file)
  form.append('target_role', targetRole)
  return request('/cv/reviews', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  })
}
