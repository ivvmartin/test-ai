import { useNavigate } from "@/lib/navigation";
import { useSidebar } from "@components/ui/sidebar";

export function ChatNotFound() {
  const navigate = useNavigate();
  const { isMobile } = useSidebar();

  return (
    <div
      className={`flex h-[calc(70vh-2.5rem)] w-full items-center justify-center p-4 ${
        isMobile ? "" : "pl-14"
      }`}
    >
      <div className="flex w-full max-w-md flex-col items-center justify-center space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="font-semibold text-xl tracking-tight">
            Чатът не е намерен
          </h1>
          <p className="text-muted-foreground text-sm">
            Не успяхме да намерим този чат
          </p>
        </div>
        <button
          onClick={() => navigate("/app/chat")}
          className="bg-[#21355a] text-primary-foreground hover:bg-[#35517f] rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        >
          Започнете нов чат
        </button>
      </div>
    </div>
  );
}
