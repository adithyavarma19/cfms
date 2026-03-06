import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, ChevronDown, Clock, FileText, Users } from "lucide-react";

type TargetWithStudent = {
  id: string;
  status: string;
  student_name: string | null;
  registration_number: string | null;
};

type FormWithDetails = {
  id: string;
  title: string;
  subject_type: string;
  academic_year: string;
  semester: number;
  section: string | null;
  feedback_period: string;
  status: string;
  closes_at: string;
  response_count: number;
  course_name: string | null;
  code: string | null;
  faculty_name: string | null;
};

export default function FormsTab() {
  const [forms, setForms] = useState<FormWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [trackingFormId, setTrackingFormId] = useState<string | null>(null);
  const [trackingTargets, setTrackingTargets] = useState<TargetWithStudent[]>([]);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingForm, setTrackingForm] = useState<FormWithDetails | null>(null);

  useEffect(() => { loadForms(); }, []);

  const loadForms = async () => {
    try {
      const data = await api.getForms();
      setForms((data as FormWithDetails[]) || []);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (formId: string) => {
    if (!confirm("Delete this form and all its feedback data?")) return;
    try {
      await api.deleteForm(formId);
      toast({ title: "Form deleted" });
      loadForms();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const openTracking = async (form: FormWithDetails) => {
    setTrackingFormId(form.id);
    setTrackingForm(form);
    setTrackingLoading(true);
    try {
      const data = await api.getFormTargets(form.id);
      setTrackingTargets((data || []) as TargetWithStudent[]);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setTrackingTargets([]);
    } finally {
      setTrackingLoading(false);
    }
  };

  const groupedForms = forms.reduce((acc, f) => {
    const key = f.academic_year;
    if (!acc[key]) acc[key] = {};
    const semKey = `Semester ${f.semester}`;
    if (!acc[key][semKey]) acc[key][semKey] = {};
    const secKey = f.subject_type === "elective" ? "Elective" : `Section ${f.section}`;
    if (!acc[key][semKey][secKey]) acc[key][semKey][secKey] = [];
    acc[key][semKey][secKey].push(f);
    return acc;
  }, {} as Record<string, Record<string, Record<string, FormWithDetails[]>>>);

  const FormCard = ({ form }: { form: FormWithDetails }) => {
    const isActive = form.status === "active" && new Date(form.closes_at) > new Date();
    return (
      <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:shadow-card transition-shadow">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-medium text-sm truncate">{form.title}</span>
            <Badge variant={isActive ? "default" : "outline"} className="shrink-0 text-xs">{isActive ? "Active" : "Closed"}</Badge>
          </div>
          <div className="flex gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
            <span>{form.course_name}</span><span>·</span>
            <span>Prof. {form.faculty_name}</span><span>·</span>
            <span>{form.academic_year}</span><span>·</span>
            <span>{form.feedback_period === "mid_semester" ? "Mid Sem" : "End Sem"}</span><span>·</span>
            <span>{form.subject_type === "elective" ? "Elective" : `Sec ${form.section}`}</span><span>·</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(form.closes_at).toLocaleDateString()}</span><span>·</span>
            <span>{form.response_count} responses</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => openTracking(form)} title="Submission tracking"><Users className="h-4 w-4 text-muted-foreground" /></Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(form.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground">{forms.length} forms</span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate("/admin/forms/create?mode=bulk")}>
            <Plus className="h-4 w-4 mr-1" /> Bulk Create
          </Button>
          <Button size="sm" onClick={() => navigate("/admin/forms/create")}>
            <Plus className="h-4 w-4 mr-1" /> Create Form
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
      ) : (
        <Tabs defaultValue="ordered">
          <TabsList className="mb-4">
            <TabsTrigger value="ordered">Ordered Display</TabsTrigger>
            <TabsTrigger value="sequence">Sequence Display</TabsTrigger>
          </TabsList>
          <TabsContent value="ordered">
            {Object.keys(groupedForms).length === 0 ? (
              <Card className="shadow-card"><CardContent className="py-8 text-center text-muted-foreground">No forms created yet</CardContent></Card>
            ) : (
              Object.entries(groupedForms).map(([year, semesters]) => (
                <Collapsible key={year} defaultOpen>
                  <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-muted mb-1">
                    <ChevronDown className="h-4 w-4" /><span className="font-semibold text-sm">{year}</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-4">
                    {Object.entries(semesters).map(([sem, sections]) => (
                      <Collapsible key={sem} defaultOpen>
                        <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 rounded hover:bg-muted mb-1">
                          <ChevronDown className="h-3 w-3" /><span className="font-medium text-sm">{sem}</span>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pl-4">
                          {Object.entries(sections).map(([sec, secForms]) => (
                            <Collapsible key={sec} defaultOpen>
                              <CollapsibleTrigger className="flex items-center gap-2 w-full p-1.5 rounded hover:bg-muted mb-1">
                                <ChevronDown className="h-3 w-3" /><span className="text-sm text-muted-foreground">{sec}</span>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="pl-4 space-y-2 mb-2">
                                {secForms.map(f => <FormCard key={f.id} form={f} />)}
                              </CollapsibleContent>
                            </Collapsible>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))
            )}
          </TabsContent>
          <TabsContent value="sequence">
            {forms.length === 0 ? (
              <Card className="shadow-card"><CardContent className="py-8 text-center text-muted-foreground">No forms created yet</CardContent></Card>
            ) : (
              <div className="space-y-2">{forms.map(f => <FormCard key={f.id} form={f} />)}</div>
            )}
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={!!trackingFormId} onOpenChange={(open) => { if (!open) setTrackingFormId(null); }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Submission Tracking</DialogTitle></DialogHeader>
          {trackingLoading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
          ) : trackingTargets.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No targets generated yet.</p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {trackingForm?.subject_type === "core" ? "Students who have NOT submitted:" : "Students who HAVE submitted:"}
              </p>
              {(() => {
                const filtered = trackingForm?.subject_type === "core"
                  ? trackingTargets.filter(t => t.status !== "submitted")
                  : trackingTargets.filter(t => t.status === "submitted");
                if (filtered.length === 0) return (
                  <p className="text-sm text-center py-4 text-muted-foreground">
                    {trackingForm?.subject_type === "core" ? "All students have submitted!" : "No submissions yet."}
                  </p>
                );
                return filtered.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-2 rounded border">
                    <div>
                      <span className="text-sm font-medium">{t.student_name}</span>
                      <span className="text-xs text-muted-foreground ml-2">{t.registration_number}</span>
                    </div>
                    <Badge variant={t.status === "submitted" ? "default" : "outline"} className="text-xs">{t.status}</Badge>
                  </div>
                ));
              })()}
              <p className="text-xs text-muted-foreground text-right">
                {trackingForm?.subject_type === "elective"
                  ? `${trackingTargets.filter(t => t.status === "submitted").length} responses received`
                  : `${trackingTargets.filter(t => t.status === "submitted").length} / ${trackingTargets.length} submitted`}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
