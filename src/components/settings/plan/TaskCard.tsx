import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Video, FileText, ClipboardList, MoreVertical, Edit, Power, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTiers } from "@/hooks/useTiers";

interface TaskCardProps {
  task: any;
  onEdit: (task: any) => void;
  onDelete: (id: string) => void;
  onToggleActive?: (id: string, is_active: boolean) => void;
  mode?: 'module' | 'task';
}

export const TaskCard = ({ task, onEdit, onDelete, onToggleActive, mode = 'module' }: TaskCardProps) => {
  const { data: tiers = [] } = useTiers();

  // Fetch sections for this task
  const { data: sections } = useQuery({
    queryKey: ["task-sections", task.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("discipline_task_sections")
        .select("*")
        .eq("task_id", task.id)
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch form fields count
  const { data: formFields } = useQuery({
    queryKey: ["task-form-fields", task.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("discipline_task_form_fields").select("id").eq("task_id", task.id);

      if (error) throw error;
      return data || [];
    },
  });

  const videoSections = sections?.filter((s) => s.section_type === "video") || [];
  const readoutSections = sections?.filter((s) => s.section_type === "readout") || [];
  const formSections = sections?.filter((s) => s.section_type === "form") || [];

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} className={`bg-muted/50 ${!task.is_active ? "opacity-60 bg-muted/20" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <GripVertical
              {...attributes}
              {...listeners}
              className="h-4 w-4 text-muted-foreground cursor-grab hover:text-foreground transition-colors active:cursor-grabbing"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">{task.title}</span>

                {/* Section indicators */}
                {videoSections.length > 0 && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <Video className="h-3 w-3" />
                    {videoSections.length} {videoSections.length === 1 ? "video" : "videos"}
                  </Badge>
                )}
                {readoutSections.length > 0 && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <FileText className="h-3 w-3" />
                    {readoutSections.length} {readoutSections.length === 1 ? "readout" : "readouts"}
                  </Badge>
                )}
                {formSections.length > 0 && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <ClipboardList className="h-3 w-3" />
                    Form ({formFields?.length || 0} fields)
                  </Badge>
                )}

                {task.tier && (
                  <Badge variant="outline" className="text-xs">
                    {task.tier}
                  </Badge>
                )}
                {!task.is_active && (
                  <Badge variant="destructive" className="text-xs">
                    Inactive
                  </Badge>
                )}
              </div>
              {task.description && <p className="text-sm text-muted-foreground mt-1">{task.description}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {task.unlock_type === "time" && task.content?.delay_days !== undefined && (
              <Badge variant="secondary" className="text-xs">
                +{task.content.delay_days}d
              </Badge>
            )}
            {(task.unlock_type === "completion" || task.unlock_type === "previous_task") &&
              task.content?.required_task_id && (
                <Badge variant="secondary" className="text-xs">
                  Requires task
                </Badge>
              )}
            {task.visible_tiers && task.visible_tiers.length > 0 && !task.visible_tiers.includes("all") && (
              <>
                {task.visible_tiers.map((tierKey: string) => {
                  const tier = tiers.find((t) => t.tier_key === tierKey);
                  return tier ? (
                    <Badge key={tierKey} variant="outline" className="text-xs">
                      {tier.display_name}
                    </Badge>
                  ) : null;
                })}
              </>
            )}
            <Badge variant="outline">{task.points} pts</Badge>
            {task.duration_minutes && <Badge variant="outline">{task.duration_minutes} min</Badge>}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" onPointerDown={(e) => e.stopPropagation()}>
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 z-50 bg-background">
                <DropdownMenuItem onClick={() => onEdit(task)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit {mode === 'task' ? 'Task' : 'Module'}
                </DropdownMenuItem>
                {onToggleActive && (
                  <DropdownMenuItem onClick={() => onToggleActive(task.id, !task.is_active)}>
                    <Power className="h-4 w-4 mr-2" />
                    {task.is_active ? "Mark Inactive" : "Mark Active"}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete(task.id)} className="text-destructive focus:text-destructive">
                  <Trash className="h-4 w-4 mr-2" />
                  Delete Permanently
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
