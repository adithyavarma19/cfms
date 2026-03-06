import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/lib/auth";
import AppHeader from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

type Course = {
  id: string;
  code: string;
  course_name: string;
  short_name: string;
  semester: number;
  course_type: string;
};

type Faculty = {
  id: string;
  faculty_id: string;
  name: string;
};

export default function CreateForms() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultMode = searchParams.get("mode") === "bulk" ? "bulk" : "single";
  const { toast } = useToast();

  const [courses, setCourses] = useState<Course[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);

  const [title, setTitle] = useState("");
  const [subjectType, setSubjectType] = useState("core");
  const [academicYear, setAcademicYear] = useState("");
  const [semester, setSemester] = useState("1");
  const [section, setSection] = useState("A");
  const [feedbackPeriod, setFeedbackPeriod] = useState("mid_semester");
  const [courseId, setCourseId] = useState("");
  const [facultyId, setFacultyId] = useState("");

  const [bulkTitle, setBulkTitle] = useState("");
  const [bulkSubjectType, setBulkSubjectType] = useState("core");
  const [bulkAcademicYear, setBulkAcademicYear] = useState("");
  const [bulkSemester, setBulkSemester] = useState("1");
  const [bulkSection, setBulkSection] = useState("A");
  const [bulkFeedbackPeriod, setBulkFeedbackPeriod] = useState("mid_semester");
  const [bulkFacultyMap, setBulkFacultyMap] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([api.getCourses(), api.getFaculty()])
      .then(([courseData, facultyData]) => {
        setCourses(courseData || []);
        setFaculty(facultyData || []);
      })
      .catch((err: any) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      });
  }, [toast]);

  const filteredCourses = courses.filter(c => c.semester === parseInt(semester, 10) && c.course_type === subjectType);
  const bulkFilteredCourses = courses.filter(c => c.semester === parseInt(bulkSemester, 10) && c.course_type === bulkSubjectType);

  const validateAcademicYear = (val: string) => /^\d{4}-\d{2}$/.test(val);

  const handleCreateSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAcademicYear(academicYear)) {
      toast({ title: "Invalid format", description: "Academic year must be like 2025-26", variant: "destructive" });
      return;
    }
    try {
      const closesAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
      await api.createForm({
        title, subject_type: subjectType, academic_year: academicYear,
        semester: parseInt(semester, 10), section: subjectType === "elective" ? null : section,
        feedback_period: feedbackPeriod, course_id: courseId, faculty_id: facultyId, closes_at: closesAt,
      });
      toast({ title: "Form created" });
      navigate("/admin");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleCreateBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAcademicYear(bulkAcademicYear)) {
      toast({ title: "Invalid format", description: "Academic year must be like 2025-26", variant: "destructive" });
      return;
    }
    const closesAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    let success = 0;
    let failed = 0;
    for (const course of bulkFilteredCourses) {
      const fId = bulkFacultyMap[course.id];
      if (!fId) { failed++; continue; }
      try {
        await api.createForm({
          title: bulkTitle || `${course.short_name} Feedback`,
          subject_type: bulkSubjectType, academic_year: bulkAcademicYear,
          semester: parseInt(bulkSemester, 10), section: bulkSubjectType === "elective" ? null : bulkSection,
          feedback_period: bulkFeedbackPeriod, course_id: course.id, faculty_id: fId, closes_at: closesAt,
        });
        success++;
      } catch {
        failed++;
      }
    }
    toast({ title: "Bulk creation complete", description: `${success} created, ${failed} failed.` });
    navigate("/admin");
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container max-w-3xl py-6">
        <Button variant="ghost" className="mb-4" onClick={() => navigate("/admin")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Admin
        </Button>

        <Tabs defaultValue={defaultMode}>
          <TabsList className="mb-6">
            <TabsTrigger value="single">Single Form</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Create</TabsTrigger>
          </TabsList>

          <TabsContent value="single">
            <Card className="shadow-card">
              <CardHeader><CardTitle>Create Feedback Form</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleCreateSingle} className="space-y-4">
                  <div className="space-y-1"><Label>Form Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} required /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Subject Type</Label>
                      <Select value={subjectType} onValueChange={setSubjectType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="core">Core</SelectItem><SelectItem value="elective">Elective</SelectItem></SelectContent></Select>
                    </div>
                    <div className="space-y-1"><Label>Academic Year</Label><Input value={academicYear} onChange={e => setAcademicYear(e.target.value)} placeholder="2025-26" required /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label>Semester</Label>
                      <Select value={semester} onValueChange={setSemester}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[1,2,3,4,5,6,7,8].map(s => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}</SelectContent></Select>
                    </div>
                    {subjectType !== "elective" && (
                      <div className="space-y-1">
                        <Label>Section</Label>
                        <Select value={section} onValueChange={setSection}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["A","B","C"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
                      </div>
                    )}
                    <div className="space-y-1">
                      <Label>Feedback Period</Label>
                      <Select value={feedbackPeriod} onValueChange={setFeedbackPeriod}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="mid_semester">Mid Semester</SelectItem><SelectItem value="end_semester">End Semester</SelectItem></SelectContent></Select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Course</Label>
                    <Select value={courseId} onValueChange={setCourseId}><SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger><SelectContent>{filteredCourses.map(c => <SelectItem key={c.id} value={c.id}>{c.course_name} ({c.code})</SelectItem>)}</SelectContent></Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Faculty</Label>
                    <Select value={facultyId} onValueChange={setFacultyId}><SelectTrigger><SelectValue placeholder="Select faculty" /></SelectTrigger><SelectContent>{faculty.map(f => <SelectItem key={f.id} value={f.id}>{f.faculty_id} - {f.name}</SelectItem>)}</SelectContent></Select>
                  </div>
                  <Button type="submit" className="w-full">Create Form</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bulk">
            <Card className="shadow-card">
              <CardHeader><CardTitle>Bulk Create Forms</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleCreateBulk} className="space-y-4">
                  <div className="space-y-1"><Label>Form Title (prefix)</Label><Input value={bulkTitle} onChange={e => setBulkTitle(e.target.value)} placeholder="Optional prefix" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Subject Type</Label>
                      <Select value={bulkSubjectType} onValueChange={setBulkSubjectType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="core">Core</SelectItem><SelectItem value="elective">Elective</SelectItem></SelectContent></Select>
                    </div>
                    <div className="space-y-1"><Label>Academic Year</Label><Input value={bulkAcademicYear} onChange={e => setBulkAcademicYear(e.target.value)} placeholder="2025-26" required /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label>Semester</Label>
                      <Select value={bulkSemester} onValueChange={setBulkSemester}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[1,2,3,4,5,6,7,8].map(s => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}</SelectContent></Select>
                    </div>
                    {bulkSubjectType !== "elective" && (
                      <div className="space-y-1">
                        <Label>Section</Label>
                        <Select value={bulkSection} onValueChange={setBulkSection}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["A","B","C"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
                      </div>
                    )}
                    <div className="space-y-1">
                      <Label>Feedback Period</Label>
                      <Select value={bulkFeedbackPeriod} onValueChange={setBulkFeedbackPeriod}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="mid_semester">Mid Semester</SelectItem><SelectItem value="end_semester">End Semester</SelectItem></SelectContent></Select>
                    </div>
                  </div>
                  {bulkFilteredCourses.length > 0 ? (
                    <div className="space-y-2 border rounded-lg p-3">
                      <h4 className="font-medium text-sm">Assign Faculty to Courses</h4>
                      {bulkFilteredCourses.map(c => (
                        <div key={c.id} className="flex items-center gap-3">
                          <span className="text-sm min-w-[200px]">{c.course_name} ({c.code})</span>
                          <Select value={bulkFacultyMap[c.id] || ""} onValueChange={val => setBulkFacultyMap(prev => ({ ...prev, [c.id]: val }))}>
                            <SelectTrigger className="flex-1"><SelectValue placeholder="Select faculty" /></SelectTrigger>
                            <SelectContent>{faculty.map(f => <SelectItem key={f.id} value={f.id}>{f.faculty_id} - {f.name}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4 text-center">No {bulkSubjectType} courses found for semester {bulkSemester}</p>
                  )}
                  <Button type="submit" className="w-full" disabled={bulkFilteredCourses.length === 0}>
                    Create {bulkFilteredCourses.length} Forms
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
