import { useState } from "react";
import AppHeader from "@/components/AppHeader";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar } from "@/components/ui/sidebar";
import { Users, BookOpen, GraduationCap, ClipboardList } from "lucide-react";
import StudentsTab from "@/components/admin/StudentsTab";
import FacultyTab from "@/components/admin/FacultyTab";
import CoursesTab from "@/components/admin/CoursesTab";
import FormsTab from "@/components/admin/FormsTab";

const navItems = [
  { title: "Students", value: "students", icon: GraduationCap },
  { title: "Faculty", value: "faculty", icon: Users },
  { title: "Courses", value: "courses", icon: BookOpen },
  { title: "Forms", value: "forms", icon: ClipboardList },
];

function AdminSidebar({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (v: string) => void }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="pt-[3.75rem]">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.value}>
                  <SidebarMenuButton
                    isActive={activeTab === item.value}
                    onClick={() => setActiveTab(item.value)}
                    tooltip={item.title}
                  >
                    {!collapsed && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("students");

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <SidebarProvider>
        <div className="flex w-full">
          <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
          <main className="flex-1 p-6">
            <div className="flex items-center gap-2 mb-6">
              <SidebarTrigger />
              <h1 className="text-2xl font-bold text-foreground">
                {navItems.find(n => n.value === activeTab)?.title}
              </h1>
            </div>
            {activeTab === "students" && <StudentsTab />}
            {activeTab === "faculty" && <FacultyTab />}
            {activeTab === "courses" && <CoursesTab />}
            {activeTab === "forms" && <FormsTab />}
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
}
