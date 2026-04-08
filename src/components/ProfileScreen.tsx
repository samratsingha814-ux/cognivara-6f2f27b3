import { Brain, ChevronRight, Download, LogOut, Settings, User } from "lucide-react";

const ProfileScreen = () => {
  return (
    <div className="px-5 pt-14 pb-24">
      <h1 className="font-heading text-2xl font-bold mb-6">Profile</h1>

      {/* User card */}
      <div className="rounded-2xl bg-card border border-border p-5 flex items-center gap-4 mb-6">
        <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-7 w-7 text-primary" />
        </div>
        <div>
          <p className="font-heading font-semibold">COGNIVARA User</p>
          <p className="text-xs text-muted-foreground">Baseline Established · 3 recordings</p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="rounded-xl bg-card border border-border p-4 text-center">
          <p className="font-heading text-2xl font-bold">17</p>
          <p className="text-[10px] text-muted-foreground">Total Recordings</p>
        </div>
        <div className="rounded-xl bg-card border border-border p-4 text-center">
          <p className="font-heading text-2xl font-bold text-primary">Low</p>
          <p className="text-[10px] text-muted-foreground">Risk Level</p>
        </div>
      </div>

      {/* Menu */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        {[
          { icon: Settings, label: "Account Settings" },
          { icon: Download, label: "Export Report (PDF)" },
          { icon: Brain, label: "About COGNIVARA" },
        ].map(({ icon: Icon, label }, i) => (
          <button
            key={label}
            className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm text-left hover:bg-secondary/50 transition-colors ${
              i < 2 ? "border-b border-border" : ""
            }`}
          >
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1">{label}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>

      <button className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl border border-destructive/30 py-3 text-sm text-destructive hover:bg-destructive/10 transition-colors">
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>

      <p className="text-center text-[10px] text-muted-foreground mt-8">
        COGNIVARA v1.0 · For investigational use only
      </p>
    </div>
  );
};

export default ProfileScreen;
