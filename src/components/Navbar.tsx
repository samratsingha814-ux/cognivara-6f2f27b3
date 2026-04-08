import { useState } from "react";
import { motion } from "framer-motion";
import { Brain } from "lucide-react";

const navItems = ["Home", "Record", "Dashboard"];

const Navbar = ({ activeSection, onNavigate }: { activeSection: string; onNavigate: (s: string) => void }) => {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 glass"
    >
      <div className="container mx-auto flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          <span className="font-heading text-lg font-bold text-foreground tracking-tight">COGNIVARA</span>
        </div>
        <div className="flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item}
              onClick={() => onNavigate(item.toLowerCase())}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeSection === item.toLowerCase()
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
