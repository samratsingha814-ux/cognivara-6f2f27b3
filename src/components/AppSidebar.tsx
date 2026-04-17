import { LayoutDashboard, AudioLines, FileBarChart, Users, HeartPulse, HelpCircle, User, Plus } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export type NavSection = "overview" | "voiceLabs" | "reports" | "patients" | "health";

interface AppSidebarProps {
  activeSection: NavSection;
  onSectionChange: (section: NavSection) => void;
  onNewRecording: () => void;
  onAccountClick: () => void;
}

const NAV_ITEMS: { id: NavSection; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Cognitive Overview", icon: LayoutDashboard },
  { id: "voiceLabs", label: "Voice Labs", icon: AudioLines },
  { id: "reports", label: "Clinical Reports", icon: FileBarChart },
  { id: "patients", label: "Patient Data", icon: Users },
  { id: "health", label: "System Health", icon: HeartPulse },
];

const AppSidebar = ({ activeSection, onSectionChange, onNewRecording, onAccountClick }: AppSidebarProps) => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="px-4 py-5">
        {!collapsed ? (
          <div>
            <h1 className="font-heading text-xl font-bold text-primary tracking-tight">Cognivara</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium mt-0.5">
              Neural Horizon v1.0
            </p>
          </div>
        ) : (
          <div className="flex justify-center">
            <span className="font-heading text-lg font-bold text-primary">C</span>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <button
              onClick={onNewRecording}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-cta text-primary-foreground font-heading font-semibold text-sm mb-4 hover:opacity-90 transition-opacity"
              title="New Recording"
            >
              <Plus className="h-4 w-4 flex-shrink-0" />
              {!collapsed && "New Recording"}
            </button>

            <SidebarMenu>
              {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
                const isActive = activeSection === id;
                return (
                  <SidebarMenuItem key={id}>
                    <SidebarMenuButton
                      onClick={() => onSectionChange(id)}
                      isActive={isActive}
                      tooltip={label}
                      className={isActive ? "text-primary font-medium" : ""}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-2 pb-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Help Center">
              <HelpCircle className="h-4 w-4" />
              <span>Help Center</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onAccountClick} tooltip="Account">
              <User className="h-4 w-4" />
              <span>Account</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
