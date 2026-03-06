import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Clock, CheckCircle2 } from "lucide-react";

type StudentTargetForm = {
  id: string;
  title: string;
  subject_type: string;
  academic_year: string;
  semester: number;
  section: string | null;
  feedback_period: string;
  status: string;
  closes_at: string;
  course_name: string | null;
  code: string | null;
  faculty_name: string | null;
  target_status: string;
};

export default function StudentDashboard() {
  const { student } = useAuth();
  const [forms, setForms] = useState<StudentTargetForm[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!student) return;
    loadData();
  }, [student]);

  const loadData = async () => {
    if (!student) return;

    try {
      const targetsRes = await api.getMyTargets();
      const data = (targetsRes || []) as StudentTargetForm[];
      setForms(data);
    } catch (error) {
      console.error("Error loading data:", error);
      setForms([]);
    } finally {
      setLoading(false);
    }
  };

  const isFormActive = (form: StudentTargetForm) =>
    form.status === "active" && new Date(form.closes_at) > new Date();

  const getTimeRemaining = (closesAt: string) => {
    const diff = new Date(closesAt).getTime() - Date.now();
    if (diff <= 0) return "Closed";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m remaining`;
  };

  const pendingForms = forms.filter((form) => form.target_status !== "submitted");

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">My Feedback Forms</h1>
          <p className="text-muted-foreground">
            Semester {student?.semester} · Section {student?.section}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : pendingForms.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-12">
              <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No feedback forms available at this time.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {pendingForms.map((form) => {
              const submitted = form.target_status === "submitted";
              const active = isFormActive(form);
              return (
                <Card key={form.id} className="animate-fade-in shadow-card hover:shadow-elevated transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{form.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {form.course_name} ({form.code}) · Prof. {form.faculty_name}
                        </p>
                      </div>
                      {submitted ? (
                        <Badge className="bg-success text-success-foreground">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Submitted
                        </Badge>
                      ) : active ? (
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1" /> {getTimeRemaining(form.closes_at)}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Closed</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        <span>{form.academic_year}</span>
                        <span>·</span>
                        <span>{form.feedback_period === "mid_semester" ? "Mid Semester" : "End Semester"}</span>
                        <span>·</span>
                        <span>{form.subject_type === "elective" ? "Elective" : `Section ${form.section}`}</span>
                      </div>
                      {!submitted && active && (
                        <Button size="sm" onClick={() => navigate(`/student/feedback/${form.id}`)}>
                          Submit Feedback
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
