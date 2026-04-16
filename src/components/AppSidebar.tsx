import { LayoutDashboard, AudioLines, FileBarChart, Users, HeartPulse, HelpCircle, User, Plus } from "lucide-react";
import { motion } from "framer-motion";

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
  return (
    <aside className="w-56 min-h-screen bg-card border-r border-border flex flex-col py-6 px-4 flex-shrink-0">
      {/* Logo */}
      <div className="mb-8">
        <h1 className="font-heading text-xl font-bold text-primary tracking-tight">Cognivara</h1>
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium mt-0.5">
          Neural Horizon v1.0
        </p>
      </div>

      {/* New Recording Button */}
      <button
        onClick={onNewRecording}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-cta text-primary-foreground font-heading font-semibold text-sm mb-8 hover:opacity-90 transition-opacity"
      >
        <Plus className="h-4 w-4" />
        New Recording
      </button>

      {/* Nav Items */}
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activeSection === id;
          return (
            <button
              key={id}
              onClick={() => onSectionChange(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebarActive"
                  className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="space-y-1 mt-6">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
          <HelpCircle className="h-4 w-4" />
          Help Center
        </button>
        <button
          onClick={onAccountClick}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          <User className="h-4 w-4" />
          Account
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
