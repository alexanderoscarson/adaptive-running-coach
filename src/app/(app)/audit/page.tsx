'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, Undo2, Clock } from 'lucide-react';
import type { AuditEntry } from '@/types/database';
import { format, parseISO } from 'date-fns';

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadEntries(); }, []);

  async function loadEntries() {
    const res = await fetch('/api/audit');
    const data = await res.json();
    setEntries(data);
    setLoading(false);
  }

  async function undoEntry(auditId: string) {
    await fetch('/api/plan/adapt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'undo', auditId }),
    });
    loadEntries();
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-pulse text-muted-foreground">Loading…</div></div>;
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 space-y-4">
      <h1 className="text-2xl font-bold">Audit Log</h1>
      <p className="text-sm text-muted-foreground">Every plan adaptation with reason and timestamp</p>

      <ScrollArea>
        <div className="space-y-2">
          {entries.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <RefreshCw className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium">No adaptations yet</p>
                <p className="text-xs text-muted-foreground mt-1">Changes to your plan will appear here</p>
              </CardContent>
            </Card>
          ) : (
            entries.map(entry => (
              <Card key={entry.id} className={entry.undone ? 'opacity-50' : ''}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-[10px]">{entry.action}</Badge>
                        {entry.undone && <Badge variant="outline" className="text-[10px]">Undone</Badge>}
                      </div>
                      <p className="text-sm">{entry.reason}</p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(parseISO(entry.created_at), 'MMM d, h:mm a')}
                      </div>
                    </div>
                    {!entry.undone && entry.undo_data && (
                      <Button variant="ghost" size="sm" className="shrink-0" onClick={() => undoEntry(entry.id)}>
                        <Undo2 className="h-3.5 w-3.5 mr-1" /> Undo
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
