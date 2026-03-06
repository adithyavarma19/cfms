import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signIn, studentLogin } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, ShieldCheck } from "lucide-react";
import { useEffect } from "react";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [studentRegNo, setStudentRegNo] = useState("");
  const [studentDob, setStudentDob] = useState("");
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, role, refresh } = useAuth();

  useEffect(() => {
    if (user && role) {
      navigate(role === "admin" ? "/admin" : "/student", { replace: true });
    }
  }, [user, role, navigate]);

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Students login with registration_number and DOB
      await studentLogin(studentRegNo, studentDob);
      await refresh();
      toast({ title: "Login successful", description: "Welcome back!" });
      navigate("/student", { replace: true });
    } catch {
      toast({ title: "Login failed", description: "Invalid registration number or date of birth.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(adminUsername, adminPassword);
      await refresh();
      toast({ title: "Login successful", description: "Welcome, Admin!" });
      navigate("/admin", { replace: true });
    } catch {
      toast({ title: "Login failed", description: "Invalid credentials.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">CFMS</h1>
        </div>

        <Card className="shadow-elevated">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Sign In</CardTitle>
            <CardDescription>Choose your role to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="student">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="student" className="gap-2">
                  <GraduationCap className="h-4 w-4" /> Student
                </TabsTrigger>
                <TabsTrigger value="admin" className="gap-2">
                  <ShieldCheck className="h-4 w-4" /> Admin
                </TabsTrigger>
              </TabsList>

              <TabsContent value="student">
                <form onSubmit={handleStudentLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="regNo">Registration Number</Label>
                    <Input
                      id="regNo"
                      placeholder="e.g. 21CS001"
                      value={studentRegNo}
                      onChange={(e) => setStudentRegNo(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dob">Password</Label>
                    <Input
                      id="dob"
                      type="password"
                      placeholder="YYYY-MM-DD or YYYYMMDD"
                      value={studentDob}
                      onChange={(e) => setStudentDob(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In as Student"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="admin">
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="adminUser">Admin User ID</Label>
                    <Input
                      id="adminUser"
                      type="text"

                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adminPass">Password</Label>
                    <Input
                      id="adminPass"
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In as Admin"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
