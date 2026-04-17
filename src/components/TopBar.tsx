import { Search, RefreshCw, Bell, Settings, User } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface TopBarProps {
  activeTab: "dashboard" | "analytics" | "patients";
  onTabChange: (tab: "dashboard" | "analytics" | "patients") => void;
  onSync?: () => void;
}

const TABS: { id: "dashboard" | "analytics" | "patients"; label: string }[] = [
  { id: "dashboard", label: "DASHBOARD" },
  { id: "analytics", label: "ANALYTICS" },
  { id: "patients", label: "PATIENTS" },
];

const TopBar = ({ activeTab, onTabChange, onSync }: TopBarProps) => {
  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-3 sm:px-6 bg-card/50 backdrop-blur-sm flex-shrink-0 gap-2">
      <div className="flex items-center gap-3 sm:gap-6 min-w-0">
        <SidebarTrigger className="flex-shrink-0" />

        {/* Search — hidden on mobile */}
        <div className="hidden md:flex items-center gap-2 bg-secondary rounded-lg px-3 py-2 w-56">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search Patient Records..."
            className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none w-full"
          />
        </div>

        {/* Tabs — hidden on small mobile */}
        <nav className="hidden sm:flex items-center gap-4">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`text-[11px] font-semibold tracking-wider transition-colors pb-0.5 ${
                activeTab === id
                  ? "text-primary border-b border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <button
          onClick={onSync}
          className="flex items-center gap-1.5 bg-primary/20 text-primary px-2.5 sm:px-3.5 py-1.5 rounded-lg text-[11px] font-semibold tracking-wider hover:bg-primary/30 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">SYNC DATA</span>
        </button>
        <button className="hidden sm:flex h-8 w-8 rounded-lg bg-secondary items-center justify-center hover:bg-secondary/80 transition-colors">
          <Bell className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <button className="hidden sm:flex h-8 w-8 rounded-lg bg-secondary items-center justify-center hover:bg-secondary/80 transition-colors">
          <Settings className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
          <User className="h-4 w-4 text-primary-foreground" />
        </div>
      </div>
    </header>
  );
};

export default TopBar;
