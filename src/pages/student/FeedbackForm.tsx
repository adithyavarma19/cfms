import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/auth";
import AppHeader from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { MCQ_QUESTIONS_1, MCQ_QUESTIONS_2, TEXT_QUESTIONS_1, TEXT_QUESTIONS_2 } from "@/lib/feedback-questions";

type FormWithDetails = {
  id: string;
  title: string;
  status: string;
  closes_at: string;
  course_name: string | null;
  code: string | null;
  faculty_name: string | null;
};

export default function FeedbackForm() {
  const { formId } = useParams<{ formId: string }>();
  const { student } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState<FormWithDetails | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadForm(); }, [formId]);

  const loadForm = async () => {
    if (!formId) {
      toast({ title: "Invalid form", description: "Feedback form ID is missing.", variant: "destructive" });
      setForm(null);
      setLoading(false);
      return;
    }
    try {
      const data = await api.getForm(formId);
      setForm((data as FormWithDetails) || null);
    } catch {
      toast({ title: "Form not found", description: "This feedback form could not be loaded.", variant: "destructive" });
      setForm(null);
    } finally {
      setLoading(false);
    }
  };

  const setAnswer = (key: string, value: string) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student || !formId) return;

    const mcqQuestions = [...MCQ_QUESTIONS_1, ...MCQ_QUESTIONS_2];
    const mcqKeys = mcqQuestions.map((q) => `q${q.qNumber}`);
    const unanswered = mcqKeys.filter(k => !answers[k]);
    if (unanswered.length > 0) {
      toast({ title: "Incomplete", description: `Please answer all ${unanswered.length} remaining rating questions.`, variant: "destructive" });
      return;
    }
    const hasInvalidOption = mcqQuestions.some((q) => {
      const value = answers[`q${q.qNumber}`];
      return !q.options.some((opt) => opt.value === value);
    });
    if (hasInvalidOption) {
      toast({ title: "Invalid response", description: "One or more selected options are invalid. Please review your answers.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, any> = { form_id: formId };

      MCQ_QUESTIONS_1.forEach((q) => { payload[`q${q.qNumber}`] = answers[`q${q.qNumber}`]; });
      TEXT_QUESTIONS_1.forEach((q) => { payload[`q${q.qNumber}`] = answers[`q${q.qNumber}`] || null; });
      MCQ_QUESTIONS_2.forEach((q) => { payload[`q${q.qNumber}`] = answers[`q${q.qNumber}`]; });
      TEXT_QUESTIONS_2.forEach((q) => { payload[`q${q.qNumber}`] = answers[`q${q.qNumber}`] || null; });

      await api.submitResponse(payload);
      toast({ title: "Feedback submitted!", description: "Thank you for your valuable feedback." });
      navigate("/student", { replace: true });
    } catch (err: any) {
      if (String(err?.message || "").toLowerCase().includes("already")) {
        toast({ title: "Already submitted", description: "You have already submitted feedback for this form.", variant: "destructive" });
      } else {
        toast({ title: "Error", description: "Failed to submit feedback. Please try again.", variant: "destructive" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  if (!form || form.status !== "active" || new Date(form.closes_at) <= new Date()) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container max-w-3xl py-12 text-center">
          <p className="text-muted-foreground">This feedback form is no longer available.</p>
          <Button className="mt-4" onClick={() => navigate("/student")}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container max-w-3xl py-6">
        <Card className="shadow-elevated mb-6">
          <CardHeader>
            <CardTitle>{form.title}</CardTitle>
            <CardDescription>
              {form.course_name} ({form.code}) · Prof. {form.faculty_name}
            </CardDescription>
          </CardHeader>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-4">
          {MCQ_QUESTIONS_1.map((q) => {
            const qKey = `q${q.qNumber}`;
            return (
              <RatingCard
                key={qKey}
                qNumber={q.qNumber}
                question={q.question}
                options={q.options}
                value={answers[qKey] || ""}
                onChange={(val) => setAnswer(qKey, val)}
              />
            );
          })}

          <div className="pt-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">Written Feedback</h3>
            {TEXT_QUESTIONS_1.map((q) => {
              const qKey = `q${q.qNumber}`;
              return (
                <TextCard
                  key={qKey}
                  qNumber={q.qNumber}
                  question={q.question}
                  value={answers[qKey] || ""}
                  onChange={(val) => setAnswer(qKey, val)}
                />
              );
            })}
          </div>

          <div className="pt-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">Continued Rating</h3>
            {MCQ_QUESTIONS_2.map((q) => {
              const qKey = `q${q.qNumber}`;
              return (
                <RatingCard
                  key={qKey}
                  qNumber={q.qNumber}
                  question={q.question}
                  options={q.options}
                  value={answers[qKey] || ""}
                  onChange={(val) => setAnswer(qKey, val)}
                />
              );
            })}
          </div>

          <div className="pt-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">Final Comments</h3>
            {TEXT_QUESTIONS_2.map((q) => {
              const qKey = `q${q.qNumber}`;
              return (
                <TextCard
                  key={qKey}
                  qNumber={q.qNumber}
                  question={q.question}
                  value={answers[qKey] || ""}
                  onChange={(val) => setAnswer(qKey, val)}
                />
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-4 pb-8">
            <Button type="button" variant="outline" onClick={() => navigate("/student")}>Cancel</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Feedback"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}

function RatingCard({
  qNumber,
  question,
  options,
  value,
  onChange,
}: {
  qNumber: number;
  question: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <Card className="shadow-card animate-fade-in">
      <CardContent className="pt-4 pb-3">
        <p className="text-sm font-medium mb-3">
          <span className="text-muted-foreground mr-2">{qNumber}.</span>{question}
        </p>
        <RadioGroup value={value} onValueChange={onChange} className="flex flex-wrap gap-3">
          {options.map((opt) => (
            <div key={opt.value} className="flex items-center space-x-1.5">
              <RadioGroupItem value={opt.value} id={`q${qNumber}-${opt.value}`} />
              <Label htmlFor={`q${qNumber}-${opt.value}`} className="text-xs cursor-pointer">{opt.label}</Label>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}

function TextCard({ qNumber, question, value, onChange }: { qNumber: number; question: string; value: string; onChange: (val: string) => void }) {
  return (
    <Card className="shadow-card mb-4">
      <CardContent className="pt-4">
        <Label className="text-sm font-medium mb-2 block">{qNumber}. {question}</Label>
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder="Type your response here..." rows={3} />
      </CardContent>
    </Card>
  );
}
