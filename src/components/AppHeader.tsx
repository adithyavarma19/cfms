import { signOut } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AppHeader() {
  const { user, role, student } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    await signOut();
    toast({ title: "Logged out" });
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-card shadow-card">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-foreground">CFMS</span>
          {role && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent text-accent-foreground capitalize">
              {role}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {student && (
            <span className="text-sm text-muted-foreground hidden sm:block">
              {student.name} ({student.registration_number})
            </span>
          )}
          {role === "student" && (
            <Button variant="ghost" size="sm" onClick={() => navigate("/student/profile")}>
              <User className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
