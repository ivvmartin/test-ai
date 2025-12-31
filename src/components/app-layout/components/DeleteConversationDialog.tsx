import { Button } from "@components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";

interface DeleteConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationTitle: string | null;
  onConfirm: () => void;
  isPending: boolean;
}

export function DeleteConversationDialog({
  open,
  onOpenChange,
  conversationTitle,
  onConfirm,
  isPending,
}: DeleteConversationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Изтриване на чат</DialogTitle>
          <DialogDescription>
            Сигурни ли сте, че искате да изтриете чата &quot;
            {conversationTitle}
            &quot;? Това действие не може да бъде отменено
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Отказ
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? "Изтриване..." : "Изтрий"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
