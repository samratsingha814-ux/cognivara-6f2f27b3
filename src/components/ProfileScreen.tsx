import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, User, ChevronRight, LogOut, Shield, Target, Bell as BellIcon, Activity } from "lucide-react";
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
        setJoinDate(
          new Date(profile.created_at).toLocaleDateString(undefined, {
            month: "long",
            year: "numeric",
          })
        );
      }
    };
    fetchProfile();
  }, [user]);

  const userId = user?.id?.slice(0, 8).toUpperCase() || "----";

  const menuItems = [
    {
      icon: User,
      title: "Account Details",
      subtitle: "Personal info & preferences",
      color: "bg-primary/15",
      iconColor: "text-primary",
    },
    {
      icon: Target,
      title: "Health Goals",
      subtitle: "Neuro-performance targets",
      color: "bg-accent/15",
      iconColor: "text-accent",
    },
    {
      icon: Shield,
      title: "Privacy & Security",
      subtitle: "Biometric & data encryption",
      color: "bg-primary/15",
      iconColor: "text-primary",
    },
    {
      icon: BellIcon,
      title: "Notifications",
      subtitle: "Alerts, insights & reminders",
      color: "bg-muted",
      iconColor: "text-muted-foreground",
    },
  ];

  return (
    <div className="px-5 pt-12 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <span className="font-heading text-lg font-bold tracking-tight">COGNIVARA</span>
        </div>
        <button className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center">
          <Bell className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Avatar Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center mb-8"
      >
        <div className="relative mb-4">
          <div className="h-24 w-24 rounded-2xl bg-gradient-card border border-border flex items-center justify-center shadow-card">
            <User className="h-12 w-12 text-muted-foreground" />
          </div>
          <div className="absolute -bottom-1.5 -right-1.5 h-7 w-7 rounded-full bg-primary flex items-center justify-center border-2 border-background">
            <svg
              className="h-3 w-3 text-primary-foreground"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            </svg>
          </div>
        </div>

        <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-semibold mb-1">
          Neural Resident
        </p>
        <h1 className="font-heading text-2xl font-bold text-foreground">{displayName}</h1>
        <p className="text-xs text-muted-foreground mt-1">
          {joinDate ? `Joined ${joinDate}` : ""} · ID: CNV-{userId}
        </p>
      </motion.div>

      {/* Menu Items */}
      <div className="space-y-3 mb-8">
        {menuItems.map((item, i) => (
          <motion.button
            key={item.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.06 }}
            className="w-full rounded-2xl bg-gradient-card border border-border p-4 flex items-center gap-4 text-left shadow-card hover:border-primary/20 transition-colors"
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
        className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-heading font-semibold text-primary uppercase tracking-wider"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>

      <p className="text-center text-[10px] text-muted-foreground mt-6">
        VERSION 2.4.0-BETA
      </p>
    </div>
  );
};

export default ProfileScreen;
