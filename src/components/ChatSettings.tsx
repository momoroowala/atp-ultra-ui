import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, Save } from "lucide-react";
import { toast } from "sonner";

interface ChatSettingsProps {
  systemPrompt: string;
  onSystemPromptChange: (prompt: string) => void;
}

export function ChatSettings({ systemPrompt, onSystemPromptChange }: ChatSettingsProps) {
  const [prompt, setPrompt] = useState(systemPrompt);
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    setPrompt(systemPrompt);
  }, [systemPrompt]);

  const handleSave = () => {
    onSystemPromptChange(prompt);
    localStorage.setItem('chatSystemPrompt', prompt);
    setIsOpen(false);
    toast.success("Settings saved");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Chat Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">System Prompt</label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your system prompt here..."
              className="min-h-[200px] resize-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}