-- Add conversation_id to coach_messages for grouping chat sessions
alter table public.coach_messages add column if not exists conversation_id uuid;

-- Index for efficient conversation lookups
create index if not exists idx_coach_messages_conversation on public.coach_messages(user_id, conversation_id, created_at);
