import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, ChevronRight, LogOut, Shield, Target, Bell, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ProfileScreenProps {
  onSignOut: () => void;
}

const ProfileScreen = ({ onSignOut }: ProfileScreenProps) => {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("User");
  const [joinDate, setJoinDate] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, created_at")
        .eq("user_id", user.id)
        .single();
      if (profile?.display_name) setDisplayName(profile.display_name);
      if (profile?.created_at) {
        setJoinDate(new Date(profile.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" }));
      }
    };
    fetchProfile();
  }, [user]);

  const userId = user?.id?.slice(0, 8).toUpperCase() || "----";

  const menuItems = [
    { icon: User, title: "Account Details", subtitle: "Personal info & preferences", color: "bg-primary/15", iconColor: "text-primary" },
    { icon: Target, title: "Health Goals", subtitle: "Neuro-performance targets", color: "bg-accent/15", iconColor: "text-accent" },
    { icon: Shield, title: "Privacy & Security", subtitle: "Biometric & data encryption", color: "bg-primary/15", iconColor: "text-primary" },
    { icon: Bell, title: "Notifications", subtitle: "Alerts, insights & reminders", color: "bg-muted", iconColor: "text-muted-foreground" },
  ];

  return (
    <div className="p-6 max-w-2xl">
      {/* Avatar Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-6 mb-8">
        <div className="h-20 w-20 rounded-2xl bg-gradient-card border border-border flex items-center justify-center shadow-card">
          <User className="h-10 w-10 text-muted-foreground" />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-semibold mb-0.5">Neural Resident</p>
          <h1 className="font-heading text-2xl font-bold text-foreground">{displayName}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {joinDate ? `Joined ${joinDate}` : ""} · ID: CNV-{userId}
          </p>
        </div>
      </motion.div>

      {/* Menu Items */}
      <div className="space-y-3 mb-8">
        {menuItems.map((item, i) => (
          <motion.button
            key={item.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.06 }}
            className="w-full rounded-xl bg-gradient-card border border-border p-4 flex items-center gap-4 text-left shadow-card hover:border-primary/20 transition-colors"
          >
            <div className={`h-11 w-11 rounded-xl ${item.color} flex items-center justify-center flex-shrink-0`}>
              <item.icon className={`h-5 w-5 ${item.iconColor}`} />
            </div>
            <div className="flex-1">
              <h3 className="font-heading text-sm font-semibold text-foreground">{item.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{item.subtitle}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </motion.button>
        ))}
      </div>

      {/* Sign Out */}
      <button
        onClick={onSignOut}
        className="flex items-center gap-2 py-3 text-sm font-heading font-semibold text-destructive uppercase tracking-wider hover:opacity-80 transition-opacity"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>

      <p className="text-[10px] text-muted-foreground mt-6">VERSION 2.4.0-BETA</p>
    </div>
  );
};

export default ProfileScreen;
