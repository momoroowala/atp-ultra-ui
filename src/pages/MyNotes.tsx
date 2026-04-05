import { useState } from 'react';
import { useMyNotes, type NoteWithTask } from '@/hooks/useMyNotes';
import { useSprintTaskNotes } from '@/hooks/useSprintTaskNotes';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Textarea } from '@/components/ui/textarea';
import { StickyNote, Check, Loader2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const NoteEditor = ({ note, isExpanded, onToggle }: { note: NoteWithTask; isExpanded: boolean; onToggle: () => void }) => {
  const { content, updateContent, loading, saved } = useSprintTaskNotes(isExpanded ? note.sprint_task_id : null);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle}
      className={cn(
        "w-full text-left rounded-xl border border-border bg-card p-4 transition-all hover:shadow-sm",
        isExpanded && "ring-1 ring-primary/20"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-medium text-sm text-foreground truncate">
            Day {note.day_number}: {note.task_title}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {saved && <Check className="h-3.5 w-3.5 text-green-500" />}
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
          </span>
        </div>
      </div>

      {!isExpanded && (
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
          {note.content}
        </p>
      )}

      {isExpanded && (
        <div className="mt-3" onClick={(e) => e.stopPropagation()}>
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Textarea
              value={content}
              onChange={(e) => updateContent(e.target.value)}
              placeholder="Write your notes..."
              className="min-h-[120px] resize-y text-sm"
            />
          )}
        </div>
      )}
    </div>
  );
};

const MyNotes = () => {
  const { data: groups, isLoading } = useMyNotes();
  const [expandedNote, setExpandedNote] = useState<string | null>(null);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
            <StickyNote className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">My Notes</h1>
            <p className="text-sm text-muted-foreground">All your roadmap task notes in one place</p>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && (!groups || groups.length === 0) && (
          <div className="text-center py-16">
            <StickyNote className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">No notes yet</h3>
            <p className="text-sm text-muted-foreground">
              Start taking notes from your Roadmap tasks — they'll appear here.
            </p>
          </div>
        )}

        {/* Notes grouped by phase */}
        {groups && groups.length > 0 && (
          <Accordion type="multiple" defaultValue={groups.map(g => g.phase_id)} className="space-y-3">
            {groups.map((group) => (
              <AccordionItem key={group.phase_id} value={group.phase_id} className="border rounded-xl bg-card/50 px-4">
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">{group.phase_title}</span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {group.notes.length} {group.notes.length === 1 ? 'note' : 'notes'}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="space-y-2">
                    {group.notes.map((note) => (
                      <NoteEditor
                        key={note.id}
                        note={note}
                        isExpanded={expandedNote === note.id}
                        onToggle={() => setExpandedNote(prev => prev === note.id ? null : note.id)}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  );
};

export default MyNotes;
