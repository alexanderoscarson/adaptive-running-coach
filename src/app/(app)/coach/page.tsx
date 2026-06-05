'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Check, X, Edit3, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CoachMessage, CoachMode } from '@/types/database';

interface Proposal {
  modification_type: string;
  summary: string;
  reason: string;
  affected_session_ids?: string[];
  changes?: Record<string, unknown>;
}

export default function CoachPage() {
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [coachMode, setCoachMode] = useState<CoachMode>('suggest');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth/login'); return; }

    const [msgRes, profileRes] = await Promise.all([
      supabase.from('coach_messages').select('*').eq('user_id', user.id).order('created_at'),
      supabase.from('user_profiles').select('coach_mode').eq('id', user.id).single(),
    ]);

    setMessages(msgRes.data || []);
    setCoachMode((profileRes.data?.coach_mode as CoachMode) || 'suggest');
    setLoading(false);
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userMessage = input.trim();
    setInput('');
    setSending(true);

    const tempMsg: CoachMessage = {
      id: `temp-${Date.now()}`,
      user_id: '',
      role: 'user',
      content: userMessage,
      action_type: 'none',
      action_data: null,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);

    const res = await fetch('/api/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMessage }),
    });

    const data = await res.json();

    const assistantMsg: CoachMessage = {
      id: data.messageId || `temp-${Date.now() + 1}`,
      user_id: '',
      role: 'assistant',
      content: data.message,
      action_type: data.proposal ? 'proposal' : 'none',
      action_data: data.proposal,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, assistantMsg]);
    setSending(false);
  }

  async function handleProposalAction(messageId: string, action: 'apply' | 'skip', proposal: Proposal) {
    await fetch('/api/plan/adapt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, messageId, proposal }),
    });

    setMessages(prev =>
      prev.map(m =>
        m.id === messageId ? { ...m, action_type: action === 'apply' ? 'applied' : 'skipped' } : m
      )
    );
  }

  async function toggleMode() {
    const newMode = coachMode === 'suggest' ? 'auto_adapt' : 'suggest';
    setCoachMode(newMode);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('user_profiles').update({ coach_mode: newMode }).eq('id', user.id);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">Loading coach…</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-screen max-w-lg mx-auto">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <h1 className="font-bold">Coach</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {coachMode === 'suggest' ? 'Suggest' : 'Auto'}
          </span>
          <Switch checked={coachMode === 'auto_adapt'} onCheckedChange={toggleMode} />
        </div>
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-4 py-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <Bot className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm font-semibold">Your AI running coach</p>
              <p className="text-xs text-muted-foreground mt-1">Ask about your training, request changes, or get advice</p>
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                {['How is my training going?', 'I feel tired today', 'Can I swap tomorrow\'s run?', 'What pace for my long run?'].map(q => (
                  <Button key={q} variant="outline" size="sm" className="text-xs" onClick={() => { setInput(q); }}>
                    {q}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div className={cn(
                'max-w-[85%] space-y-2',
                msg.role === 'user' ? 'items-end' : 'items-start'
              )}>
                <div className={cn(
                  'rounded-2xl px-3.5 py-2.5 text-sm',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-muted rounded-bl-md'
                )}>
                  {msg.content}
                </div>

                {msg.action_type === 'proposal' && msg.action_data && (
                  <ProposalCard
                    proposal={msg.action_data as unknown as Proposal}
                    messageId={msg.id}
                    applied={false}
                    onAction={handleProposalAction}
                  />
                )}
                {msg.action_type === 'applied' && msg.action_data && (
                  <ProposalCard
                    proposal={msg.action_data as unknown as Proposal}
                    messageId={msg.id}
                    applied={true}
                    onAction={handleProposalAction}
                  />
                )}
                {msg.action_type === 'skipped' && (
                  <Badge variant="outline" className="text-xs">Skipped</Badge>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-foreground/10 flex items-center justify-center shrink-0">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {sending && (
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <form onSubmit={sendMessage} className="p-4 border-t bg-background">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask your coach…"
            disabled={sending}
            className="rounded-full"
          />
          <Button type="submit" size="icon" className="rounded-full shrink-0" disabled={sending || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}

function ProposalCard({
  proposal,
  messageId,
  applied,
  onAction,
}: {
  proposal: Proposal;
  messageId: string;
  applied: boolean;
  onAction: (messageId: string, action: 'apply' | 'skip', proposal: Proposal) => void;
}) {
  return (
    <Card className={cn('border-primary/30', applied && 'border-green-500/30 bg-green-50/50 dark:bg-green-950/20')}>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px]">{proposal.modification_type.replace('_', ' ')}</Badge>
          {applied && <Badge className="text-[10px] bg-green-500">Applied</Badge>}
        </div>
        <p className="text-sm font-semibold">{proposal.summary}</p>
        <p className="text-xs text-muted-foreground">{proposal.reason}</p>
        {!applied && (
          <div className="flex gap-2 pt-1">
            <Button size="sm" className="h-7 text-xs" onClick={() => onAction(messageId, 'apply', proposal)}>
              <Check className="h-3 w-3 mr-1" /> Apply
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onAction(messageId, 'skip', proposal)}>
              <X className="h-3 w-3 mr-1" /> Skip
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
