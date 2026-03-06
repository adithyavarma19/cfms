import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Upload, HelpCircle, Trash2 } from "lucide-react";

type Student = {
  id: string;
  registration_number: string;
  name: string;
  dob: string;
  semester: number;
  section: string;
};

type CsvRow = Record<string, string>;

function parseCsvRows(rawText: string): { headers: string[]; rows: CsvRow[] } {
  const cleaned = rawText.replace(/^\uFEFF/, "");
  const lines = cleaned
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return { headers: [], rows: [] };
  }

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    const row: CsvRow = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || "";
    });
    rows.push(row);
  }

  return { headers, rows };
}

function normalizeRegNo(v: string) {
  return String(v || "").trim().toUpperCase();
}

function formatDob(dob: string) {
  if (!dob) return "";
  return dob.includes("T") ? dob.split("T")[0] : dob;
}

export default function StudentsTab() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const { toast } = useToast();

  const [filterSemester, setFilterSemester] = useState<string>("all");
  const [filterSection, setFilterSection] = useState<string>("all");

  const [name, setName] = useState("");
  const [regNo, setRegNo] = useState("");
  const [dob, setDob] = useState("");
  const [semester, setSemester] = useState("1");
  const [section, setSection] = useState("A");

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const data = await api.getStudents();
      setStudents(data || []);
    } catch (error) {
      console.error("Error loading students:", error);
      toast({ title: "Error", description: "Failed to load students.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const studentIdByRegNo = useMemo(() => {
    const map = new Map<string, string>();
    students.forEach((s) => map.set(normalizeRegNo(s.registration_number), s.id));
    return map;
  }, [students]);

  const resetForm = () => {
    setName("");
    setRegNo("");
    setDob("");
    setSemester("1");
    setSection("A");
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createStudent({
        registration_number: regNo.trim(),
        name: name.trim(),
        dob,
        semester: parseInt(semester, 10),
        section,
      });
      toast({ title: "Student added successfully" });
      setShowAdd(false);
      resetForm();
      await loadStudents();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const { headers, rows } = parseCsvRows(text);
    if (rows.length === 0) {
      toast({ title: "Invalid CSV", description: "CSV must have a header and at least one data row.", variant: "destructive" });
      return;
    }

    const requiredHeaders = ["name", "registration_number", "dob", "semester", "section"];
    const missing = requiredHeaders.filter((h) => !headers.includes(h));
    if (missing.length > 0) {
      toast({ title: "Invalid CSV", description: `Missing columns: ${missing.join(", ")}`, variant: "destructive" });
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    for (const row of rows) {
      try {
        await api.createStudent({
          registration_number: normalizeRegNo(row.registration_number),
          name: row.name,
          dob: row.dob,
          semester: parseInt(row.semester, 10),
          section: row.section.toUpperCase(),
        });
        successCount++;
      } catch {
        errorCount++;
      }
    }

    await loadStudents();
    toast({ title: "CSV Upload Complete", description: `${successCount} added, ${errorCount} failed.` });
    e.target.value = "";
  };

  const handleAssignmentCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const { headers, rows } = parseCsvRows(text);
    if (rows.length === 0) {
      toast({ title: "Invalid CSV", description: "CSV must have a header and at least one data row.", variant: "destructive" });
      return;
    }

    const required = ["registration_number", "semester", "section"];
    const missing = required.filter((h) => !headers.includes(h));
    if (missing.length > 0) {
      toast({ title: "Invalid CSV", description: `Missing columns: ${missing.join(", ")}`, variant: "destructive" });
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const row of rows) {
      const studentId = studentIdByRegNo.get(normalizeRegNo(row.registration_number));
      if (!studentId) {
        errorCount++;
        continue;
      }

      try {
        await api.updateStudent(studentId, {
          semester: parseInt(row.semester, 10),
          section: row.section.toUpperCase(),
        });
        successCount++;
      } catch {
        errorCount++;
      }
    }

    await loadStudents();
    toast({ title: "Assignments Updated", description: `${successCount} updated, ${errorCount} failed.` });
    e.target.value = "";
  };

  const handleDeleteAllAssignments = async () => {
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const student of students) {
        try {
          await api.updateStudent(student.id, { semester: 1, section: "A" });
          successCount++;
        } catch {
          errorCount++;
        }
      }

      await loadStudents();
      toast({ title: "Assignments Reset", description: `${successCount} reset, ${errorCount} failed.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDeleteCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const { headers, rows } = parseCsvRows(text);
    if (rows.length === 0) {
      toast({ title: "Invalid CSV", description: "CSV must have a header and at least one data row.", variant: "destructive" });
      return;
    }

    if (!headers.includes("registration_number")) {
      toast({ title: "Invalid CSV", description: "Missing 'registration_number' column.", variant: "destructive" });
      return;
    }

    const regNos = rows.map((r) => normalizeRegNo(r.registration_number)).filter(Boolean);
    if (regNos.length === 0) return;
    if (!confirm(`Delete ${regNos.length} students? This cannot be undone.`)) return;

    let successCount = 0;
    let errorCount = 0;

    for (const regNoValue of regNos) {
      const studentId = studentIdByRegNo.get(regNoValue);
      if (!studentId) {
        errorCount++;
        continue;
      }
      try {
        await api.deleteStudent(studentId);
        successCount++;
      } catch {
        errorCount++;
      }
    }

    await loadStudents();
    toast({ title: "Delete Complete", description: `${successCount} deleted, ${errorCount} failed.` });
    e.target.value = "";
  };

  let filtered = students;
  if (filterSemester !== "all") filtered = filtered.filter((s) => s.semester === parseInt(filterSemester, 10));
  if (filterSection !== "all") filtered = filtered.filter((s) => s.section === filterSection);

  const grouped = filtered
    .slice()
    .sort((a, b) =>
      a.semester - b.semester ||
      a.section.localeCompare(b.section) ||
      normalizeRegNo(a.registration_number).localeCompare(normalizeRegNo(b.registration_number))
    )
    .reduce((acc, studentRow) => {
      const sem = studentRow.semester;
      const sec = studentRow.section;
      if (!acc[sem]) acc[sem] = {};
      if (!acc[sem][sec]) acc[sem][sec] = [];
      acc[sem][sec].push(studentRow);
      return acc;
    }, {} as Record<number, Record<string, Student[]>>);

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg">All Students</CardTitle>
            <div className="flex gap-2 flex-wrap">
              <Select value={filterSemester} onValueChange={setFilterSemester}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Semester" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterSection} onValueChange={setFilterSection}>
                <SelectTrigger className="w-32"><SelectValue placeholder="Section" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {["A", "B", "C"].map((s) => <SelectItem key={s} value={s}>Section {s}</SelectItem>)}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground self-center">{filtered.length} students</span>

              <div className="flex items-center gap-1">
                <label>
                  <input type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
                  <Button variant="outline" size="sm" asChild>
                    <span className="cursor-pointer"><Upload className="h-4 w-4 mr-1" /> Add CSV</span>
                  </Button>
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><HelpCircle className="h-4 w-4 text-muted-foreground" /></Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 text-sm" side="bottom" align="end">
                    <p className="font-semibold mb-2">CSV Format</p>
                    <code className="block bg-muted rounded p-2 text-xs mb-2">name,registration_number,dob,semester,section</code>
                    <p className="text-xs text-muted-foreground">Example: John Doe,21CS001,2003-05-15,3,A</p>
                  </PopoverContent>
                </Popover>
              </div>

              <Dialog open={showAdd} onOpenChange={setShowAdd}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Student</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Student</DialogTitle></DialogHeader>
                  <form onSubmit={handleAdd} className="space-y-3">
                    <div className="space-y-1"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
                    <div className="space-y-1"><Label>Registration Number</Label><Input value={regNo} onChange={(e) => setRegNo(e.target.value)} required /></div>
                    <div className="space-y-1"><Label>Date of Birth</Label><Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} required /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label>Semester</Label>
                        <Select value={semester} onValueChange={setSemester}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[1, 2, 3, 4, 5, 6, 7, 8].map((s) => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}</SelectContent></Select>
                      </div>
                      <div className="space-y-1">
                        <Label>Section</Label>
                        <Select value={section} onValueChange={setSection}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["A", "B", "C"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
                      </div>
                    </div>
                    <Button type="submit" className="w-full">Add Student</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="text-center text-muted-foreground py-8">No students found</div>
          ) : (
            Object.keys(grouped).map((semKey) => {
              const sem = Number(semKey);
              return (
                <Card key={sem} className="shadow-card">
                  <CardContent className="p-0">
                    <div className="px-4 py-2 border-b bg-muted/50">
                      <h3 className="font-semibold text-sm text-foreground">Semester {sem}</h3>
                    </div>
                    {Object.keys(grouped[sem]).sort().map((sec) => (
                      <div key={sec} className="border-b last:border-b-0">
                        <div className="px-4 py-2 bg-background">
                          <h4 className="text-sm font-medium text-muted-foreground">Section {sec}</h4>
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Reg. No.</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>DOB</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {grouped[sem][sec].map((s) => (
                              <TableRow key={s.id}>
                                <TableCell className="font-mono text-sm">{s.registration_number}</TableCell>
                                <TableCell className="font-medium">{s.name}</TableCell>
                                <TableCell>{formatDob(s.dob)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg">Update Semester & Section Assignments</CardTitle>
            <div className="flex gap-2">
              <div className="flex items-center gap-1">
                <label>
                  <input type="file" accept=".csv" className="hidden" onChange={handleAssignmentCSVUpload} />
                  <Button variant="outline" size="sm" asChild>
                    <span className="cursor-pointer"><Upload className="h-4 w-4 mr-1" /> Upload CSV</span>
                  </Button>
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><HelpCircle className="h-4 w-4 text-muted-foreground" /></Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 text-sm" side="bottom" align="end">
                    <p className="font-semibold mb-2">Assignment CSV Format</p>
                    <code className="block bg-muted rounded p-2 text-xs mb-2">registration_number,semester,section</code>
                    <p className="text-xs text-muted-foreground">Example: 21CS001,4,B</p>
                  </PopoverContent>
                </Popover>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4 mr-1" /> Reset All</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset All Assignments?</AlertDialogTitle>
                    <AlertDialogDescription>This will reset all students' semester to 1 and section to A. This cannot be undone.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAllAssignments}>Reset All</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="shadow-card border-destructive/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg text-destructive">Delete Students by CSV</CardTitle>
            <div className="flex items-center gap-1">
              <label>
                <input type="file" accept=".csv" className="hidden" onChange={handleDeleteCSVUpload} />
                <Button variant="destructive" size="sm" asChild>
                  <span className="cursor-pointer"><Trash2 className="h-4 w-4 mr-1" /> Upload CSV to Delete</span>
                </Button>
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><HelpCircle className="h-4 w-4 text-muted-foreground" /></Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 text-sm" side="bottom" align="end">
                  <p className="font-semibold mb-2">Delete CSV Format</p>
                  <code className="block bg-muted rounded p-2 text-xs mb-2">registration_number</code>
                  <p className="text-xs text-muted-foreground">One registration number per row. Deletes student account and associated data.</p>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
