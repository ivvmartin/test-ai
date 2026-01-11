import { Button } from "@components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";

interface DeleteChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatTitle: string | null;
  onConfirm: () => void;
  isPending: boolean;
}

export function DeleteChatDialog({
  open,
  onOpenChange,
  chatTitle,
  onConfirm,
  isPending,
}: DeleteChatDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Изтриване на казус</DialogTitle>
          <DialogDescription>
            Сигурни ли сте, че искате да изтриете казуса &quot;
            {chatTitle}
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
