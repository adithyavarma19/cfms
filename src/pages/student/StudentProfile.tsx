import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { changePassword } from "@/lib/auth";
import AppHeader from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function StudentProfile() {
  const { student } = useAuth();
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast({ title: "Password too short", description: "Minimum 6 characters.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await changePassword(newPassword);
      toast({ title: "Password changed successfully!" });
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast({ title: "Error", description: "Failed to change password.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container max-w-2xl py-6">
        <h1 className="text-2xl font-bold mb-6 text-foreground">My Profile</h1>

        <Card className="shadow-card mb-6">
          <CardHeader>
            <CardTitle className="text-base">Student Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Name</span>
                <p className="font-medium text-foreground">{student?.name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Registration No.</span>
                <p className="font-medium text-foreground">{student?.registration_number}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Date of Birth</span>
                <p className="font-medium text-foreground">{student?.dob}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Semester</span>
                <p className="font-medium text-foreground">{student?.semester}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Section</span>
                <p className="font-medium text-foreground">{student?.section}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Change Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPass">New Password</Label>
                <Input
                  id="newPass"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPass">Confirm New Password</Label>
                <Input
                  id="confirmPass"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? "Changing..." : "Change Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
