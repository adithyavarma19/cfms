import { useEffect, useState } from "react";
import { api } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";

type Faculty = {
  id: string;
  faculty_id: string;
  name: string;
  department: string;
  designation: string;
};

export default function FacultyTab() {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<Faculty | null>(null);
  const { toast } = useToast();

  const [facultyId, setFacultyId] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");

  useEffect(() => { loadFaculty(); }, []);

  const loadFaculty = async () => {
    try {
      const data = await api.getFaculty();
      const sorted = (data || []).slice().sort((a, b) => a.faculty_id.localeCompare(b.faculty_id));
      setFaculty(sorted);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFacultyId(""); setName(""); setDepartment(""); setDesignation("");
    setEditing(null);
  };

  const openAdd = () => { resetForm(); setShowDialog(true); };

  const openEdit = (f: Faculty) => {
    setEditing(f);
    setFacultyId(f.faculty_id);
    setName(f.name);
    setDepartment(f.department);
    setDesignation(f.designation);
    setShowDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.updateFaculty(editing.id, {
          faculty_id: facultyId, name, department, designation,
        });
        toast({ title: "Faculty updated" });
      } else {
        await api.createFaculty({
          faculty_id: facultyId, name, department, designation,
        });
        toast({ title: "Faculty added" });
      }
      setShowDialog(false);
      resetForm();
      loadFaculty();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this faculty member?")) return;
    try {
      await api.deleteFaculty(id);
      toast({ title: "Faculty removed" });
      loadFaculty();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground">{faculty.length} faculty members</span>
        <Dialog open={showDialog} onOpenChange={(o) => { setShowDialog(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-1" /> Add Faculty</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Faculty</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <Label>Faculty ID</Label>
                <Input value={facultyId} onChange={e => setFacultyId(e.target.value)} required disabled={!!editing} />
              </div>
              <div className="space-y-1">
                <Label>Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>Department</Label>
                <Input value={department} onChange={e => setDepartment(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>Designation</Label>
                <Input value={designation} onChange={e => setDesignation(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full">{editing ? "Save" : "Add"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Faculty ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {faculty.map(f => (
                  <TableRow key={f.id}>
                    <TableCell className="font-mono text-sm">{f.faculty_id}</TableCell>
                    <TableCell className="font-medium">{f.name}</TableCell>
                    <TableCell>{f.department}</TableCell>
                    <TableCell>{f.designation}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(f)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(f.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {faculty.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No faculty added yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
