import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Edit, ChevronDown, Plus, GripVertical, MoreVertical, Power, Trash } from "lucide-react";
import { TaskCard } from "./TaskCard";
import { TaskDialog } from "./TaskDialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
interface PhaseCardProps {
  phase: any;
  onEdit: (phase: any) => void;
  onToggleActive: (id: string, is_active: boolean) => void;
  onDelete: (id: string) => void;
  courseVisibleTierIds?: string[];
  mode?: 'module' | 'task';
}
export const PhaseCard = ({ phase, onEdit, onToggleActive, onDelete, courseVisibleTierIds, mode = 'module' }: PhaseCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTaskDialogOpen, setDeleteTaskDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: phase.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const taskSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );
  const toDbPayload = (data: any) => {
    const { unlock_condition, ...rest } = data;
    let content: any = null;
    if (rest.unlock_type === "time") {
      content = {
        delay_days: Number(unlock_condition?.delay_days ?? 0),
      };
    } else if (rest.unlock_type === "completion" || rest.unlock_type === "previous_task") {
      if (unlock_condition?.required_task_id) {
        content = {
          required_task_id: unlock_condition.required_task_id,
        };
      }
    }
    return {
      ...rest,
      content,
    };
  };
  const createTask = useMutation({
    mutationFn: async (data: any) => {
      const payload = toDbPayload(data);
      const { error } = await supabase.from("tasks").insert([
        {
          ...payload,
          phase_id: phase.id,
          visible_tier_ids: courseVisibleTierIds || [],
          show_in_course: mode === 'module',
        },
      ]);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["phase-tasks-bulk"],
        refetchType: "active",
      });
      await queryClient.invalidateQueries({
        queryKey: ["phases"],
        refetchType: "active",
      });
      toast.success("Task created successfully");
      setIsTaskDialogOpen(false);
      setEditingTask(null);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
  const updateTask = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const payload = toDbPayload(data);
      const { error } = await supabase
        .from("tasks")
        .update({
          ...payload,
          visible_tier_ids: courseVisibleTierIds || [],
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["phase-tasks-bulk"],
        refetchType: "active",
      });
      await queryClient.invalidateQueries({
        queryKey: ["phases"],
        refetchType: "active",
      });
      toast.success("Task updated successfully");
      setIsTaskDialogOpen(false);
      setEditingTask(null);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["phase-tasks-bulk"], refetchType: "active" }),
        queryClient.invalidateQueries({ queryKey: ["phases"], refetchType: "active" }),
        queryClient.invalidateQueries({ queryKey: ["course-task-progress"] }),
        queryClient.invalidateQueries({ queryKey: ["inline-task-detail"] }),
        queryClient.invalidateQueries({ queryKey: ["tasks-with-sections"] }),
        queryClient.invalidateQueries({ queryKey: ["phases-with-tasks"] }),
        queryClient.invalidateQueries({ queryKey: ["phase-unlock-status"] }),
        queryClient.invalidateQueries({ queryKey: ["course-detail"] }),
      ]);
      toast.success("Task permanently deleted");
      setDeleteTaskDialogOpen(false);
      setTaskToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
  const reorderTasks = useMutation({
    mutationFn: async (
      updates: {
        id: string;
        task_order: number;
      }[],
    ) => {
      const promises = updates.map(({ id, task_order }) =>
        supabase
          .from("tasks")
          .update({
            task_order,
          })
          .eq("id", id),
      );
      const results = await Promise.all(promises);
      const errors = results.filter((r) => r.error);
      if (errors.length > 0) throw errors[0].error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["phase-tasks-bulk"],
        refetchType: "active",
      });
      await queryClient.invalidateQueries({
        queryKey: ["phases"],
        refetchType: "active",
      });
      toast.success("Task order updated");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
  const handleTaskDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !tasks) return;
    const activeIsActive = tasks.find((t: any) => t.id === active.id)?.is_active;
    const overIsActive = tasks.find((t: any) => t.id === over.id)?.is_active;

    // Only allow reordering within the same active status group
    if (activeIsActive !== overIsActive) return;
    const relevantTasks = tasks.filter((t: any) => t.is_active === activeIsActive);
    const oldIndex = relevantTasks.findIndex((t: any) => t.id === active.id);
    const newIndex = relevantTasks.findIndex((t: any) => t.id === over.id);
    if (oldIndex === newIndex) return;
    const reorderedTasks = arrayMove(relevantTasks, oldIndex, newIndex);

    // Update task_order for all affected tasks
    const updates = reorderedTasks.map((task: any, index) => ({
      id: task.id,
      task_order: index + 1,
    }));
    reorderTasks.mutate(updates);
  };
  const handleDeleteTask = (taskId: string) => {
    setTaskToDelete(taskId);
    setDeleteTaskDialogOpen(true);
  };
  const confirmDeleteTask = () => {
    if (taskToDelete) {
      deleteTask.mutate(taskToDelete);
    }
  };
  const allTasks = phase.tasks || [];
  const tasks = [...allTasks].sort((a: any, b: any) => {
    if (a.is_active === b.is_active) return 0;
    return a.is_active ? -1 : 1;
  });
  const itemLabel = mode === 'task' ? 'Task' : 'Module';
  const itemLabelPlural = mode === 'task' ? 'Tasks' : 'Modules';
  return (
    <Card ref={setNodeRef} style={style} className={`${!phase.is_active ? "opacity-60 bg-muted/30" : ""}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GripVertical
              {...attributes}
              {...listeners}
              className="h-5 w-5 text-muted-foreground cursor-grab hover:text-foreground transition-colors active:cursor-grabbing"
            />
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Phase {phase.phase_order}</Badge>
                <CardTitle className="text-xl">{phase.title}</CardTitle>
                {!phase.is_active && (
                  <Badge variant="destructive" className="text-xs">
                    Inactive
                  </Badge>
                )}
              </div>
              {phase.description && <p className="text-sm text-muted-foreground mt-1">{phase.description}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              {tasks.length} {itemLabelPlural}
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" onPointerDown={(e) => e.stopPropagation()}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 z-50 bg-background">
                <DropdownMenuItem onClick={() => onEdit(phase)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Phase
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleActive(phase.id, !phase.is_active)}>
                  <Power className="h-4 w-4 mr-2" />
                  {phase.is_active ? "Mark Inactive" : "Mark Active"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Delete Permanently
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <div className="flex items-center justify-between px-6 py-3 border-t">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{itemLabelPlural}</span>
          <Badge variant="secondary" className="text-xs">
            {tasks.length}
          </Badge>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)}>
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </Button>
        </div>
        <TaskDialog
          open={isTaskDialogOpen}
          onOpenChange={setIsTaskDialogOpen}
          task={editingTask}
          phaseId={phase.id}
          mode={mode}
          taskOrder={editingTask?.task_order}
          onSave={(data) => {
            if (editingTask) {
              updateTask.mutate({
                id: editingTask.id,
                ...data,
              });
            } else {
              createTask.mutate({
                ...data,
                task_order: tasks.length + 1,
              });
            }
          }}
        >
          <Button
            size="sm"
            onClick={() => {
              setEditingTask(null);
              setIsTaskDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add {itemLabel}
          </Button>
        </TaskDialog>
      </div>

      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent>
          <CardContent className="space-y-3">
            <DndContext id={`phase-tasks-dnd-${phase.id}`} sensors={taskSensors} collisionDetection={closestCenter} onDragEnd={handleTaskDragEnd}>
              {tasks.length > 0 ? (
                <div className="space-y-2">
                  {/* Active Tasks */}
                  {tasks.filter((t: any) => t.is_active).length > 0 && (
                    <SortableContext
                      items={tasks.filter((t: any) => t.is_active).map((t: any) => t.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {tasks
                        .filter((t: any) => t.is_active)
                        .map((task: any) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            mode={mode}
                            onEdit={(t) => {
                              setEditingTask(t);
                              setIsTaskDialogOpen(true);
                            }}
                            onDelete={handleDeleteTask}
                            onToggleActive={(id, is_active) => {
                              updateTask.mutate({
                                id,
                                is_active,
                              });
                            }}
                          />
                        ))}
                    </SortableContext>
                  )}

                  {/* Inactive Tasks */}
                  {tasks.filter((t: any) => !t.is_active).length > 0 && (
                    <SortableContext
                      items={tasks.filter((t: any) => !t.is_active).map((t: any) => t.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {tasks
                        .filter((t: any) => !t.is_active)
                        .map((task: any) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            mode={mode}
                            onEdit={(t) => {
                              setEditingTask(t);
                              setIsTaskDialogOpen(true);
                            }}
                            onDelete={handleDeleteTask}
                            onToggleActive={(id, is_active) => {
                              updateTask.mutate({
                                id,
                                is_active,
                              });
                            }}
                          />
                        ))}
                    </SortableContext>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No {itemLabelPlural.toLowerCase()} yet. Click 'Add {itemLabel}' to create one.</p>
              )}
            </DndContext>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Phase Permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the phase "{phase.title}" and all {tasks.length} tasks within it. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(phase.id);
                setDeleteDialogOpen(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteTaskDialogOpen} onOpenChange={setDeleteTaskDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task Permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this task from the database. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTaskToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteTask}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
