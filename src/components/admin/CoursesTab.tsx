import { useEffect, useState } from "react";
import { api } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Pencil } from "lucide-react";

type Course = {
  id: string;
  code: string;
  course_name: string;
  short_name: string;
  credits: number;
  semester: number;
  course_type: string;
};

type CourseFormProps = {
  code: string;
  setCode: (v: string) => void;
  courseName: string;
  setCourseName: (v: string) => void;
  shortName: string;
  setShortName: (v: string) => void;
  credits: string;
  setCredits: (v: string) => void;
  semester: string;
  setSemester: (v: string) => void;
  courseType: string;
  setCourseType: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel: string;
};

function CourseForm({
  code,
  setCode,
  courseName,
  setCourseName,
  shortName,
  setShortName,
  credits,
  setCredits,
  semester,
  setSemester,
  courseType,
  setCourseType,
  onSubmit,
  submitLabel,
}: CourseFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1"><Label>Code</Label><Input value={code} onChange={e => setCode(e.target.value)} placeholder="CS301" required /></div>
      <div className="space-y-1"><Label>Course Name</Label><Input value={courseName} onChange={e => setCourseName(e.target.value)} required /></div>
      <div className="space-y-1"><Label>Short Name</Label><Input value={shortName} onChange={e => setShortName(e.target.value)} required /></div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1"><Label>Credits</Label><Input type="number" min={1} max={6} value={credits} onChange={e => setCredits(e.target.value)} required /></div>
        <div className="space-y-1">
          <Label>Semester</Label>
          <Select value={semester} onValueChange={setSemester}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[1, 2, 3, 4, 5, 6, 7, 8].map(s => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}</SelectContent></Select>
        </div>
        <div className="space-y-1">
          <Label>Type</Label>
          <Select value={courseType} onValueChange={setCourseType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="core">Core</SelectItem><SelectItem value="elective">Elective</SelectItem></SelectContent></Select>
        </div>
      </div>
      <Button type="submit" className="w-full">{submitLabel}</Button>
    </form>
  );
}

export default function CoursesTab() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const { toast } = useToast();

  const [code, setCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [shortName, setShortName] = useState("");
  const [credits, setCredits] = useState("3");
  const [semester, setSemester] = useState("1");
  const [courseType, setCourseType] = useState("core");

  useEffect(() => { loadCourses(); }, []);

  const loadCourses = async () => {
    try {
      const data = await api.getCourses();
      setCourses(data || []);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCode("");
    setCourseName("");
    setShortName("");
    setCredits("3");
    setSemester("1");
    setCourseType("core");
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCourse({
        code,
        course_name: courseName,
        short_name: shortName,
        credits: parseInt(credits, 10),
        semester: parseInt(semester, 10),
        course_type: courseType,
      });
      toast({ title: "Course added" });
      setShowAdd(false);
      resetForm();
      loadCourses();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const openEdit = (c: Course) => {
    setEditingCourse(c);
    setCode(c.code);
    setCourseName(c.course_name);
    setShortName(c.short_name);
    setCredits(String(c.credits));
    setSemester(String(c.semester));
    setCourseType(c.course_type);
    setShowEdit(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;
    try {
      await api.updateCourse(editingCourse.id, {
        code,
        course_name: courseName,
        short_name: shortName,
        credits: parseInt(credits, 10),
        semester: parseInt(semester, 10),
        course_type: courseType,
      });
      toast({ title: "Course updated" });
      setShowEdit(false);
      setEditingCourse(null);
      resetForm();
      loadCourses();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this course?")) return;
    try {
      await api.deleteCourse(id);
      toast({ title: "Course removed" });
      loadCourses();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const grouped = courses.reduce((acc, c) => {
    const key = c.semester;
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {} as Record<number, Course[]>);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground">{courses.length} courses</span>
        <Dialog open={showAdd} onOpenChange={(o) => { setShowAdd(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Course</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Course</DialogTitle></DialogHeader>
            <CourseForm
              code={code}
              setCode={setCode}
              courseName={courseName}
              setCourseName={setCourseName}
              shortName={shortName}
              setShortName={setShortName}
              credits={credits}
              setCredits={setCredits}
              semester={semester}
              setSemester={setSemester}
              courseType={courseType}
              setCourseType={setCourseType}
              onSubmit={handleAdd}
              submitLabel="Add Course"
            />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
      ) : (
        Object.keys(grouped).sort((a, b) => Number(a) - Number(b)).map(sem => (
          <Card key={sem} className="shadow-card mb-4">
            <CardContent className="p-0">
              <div className="px-4 py-2 border-b bg-muted/50">
                <h3 className="font-semibold text-sm text-foreground">Semester {sem}</h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Course Name</TableHead>
                    <TableHead>Short Name</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grouped[Number(sem)].map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-sm">{c.code}</TableCell>
                      <TableCell className="font-medium">{c.course_name}</TableCell>
                      <TableCell>{c.short_name}</TableCell>
                      <TableCell>{c.credits}</TableCell>
                      <TableCell><Badge variant={c.course_type === "core" ? "default" : "secondary"}>{c.course_type}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))
      )}
      {!loading && courses.length === 0 && (
        <Card className="shadow-card"><CardContent className="py-8 text-center text-muted-foreground">No courses added yet</CardContent></Card>
      )}

      <Dialog open={showEdit} onOpenChange={(o) => { setShowEdit(o); if (!o) { setEditingCourse(null); resetForm(); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Course</DialogTitle></DialogHeader>
          <CourseForm
            code={code}
            setCode={setCode}
            courseName={courseName}
            setCourseName={setCourseName}
            shortName={shortName}
            setShortName={setShortName}
            credits={credits}
            setCredits={setCredits}
            semester={semester}
            setSemester={setSemester}
            courseType={courseType}
            setCourseType={setCourseType}
            onSubmit={handleEdit}
            submitLabel="Save Changes"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
