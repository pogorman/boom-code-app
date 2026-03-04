import { NavLink } from "react-router-dom";
import {
  Building2,
  Users,
  CheckSquare,
  Star,
  Lightbulb,
  TrendingUp,
  FileText,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { EntityConfig } from "@/types/entities";
import { ALL_ENTITY_CONFIGS } from "@/types/entities";

const ICON_MAP: Record<string, React.ElementType> = {
  Building2,
  Users,
  CheckSquare,
  Star,
  Lightbulb,
  TrendingUp,
  FileText,
  Briefcase,
};

function NavItem({ config }: { config: EntityConfig }) {
  const Icon = ICON_MAP[config.icon] ?? Building2;

  return (
    <NavLink
      to={config.route}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          isActive
            ? "bg-accent text-accent-foreground font-medium"
            : "text-muted-foreground",
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      {config.displayNamePlural}
    </NavLink>
  );
}

export function SidebarNav() {
  return (
    <nav className="flex flex-col gap-1 px-2 py-4">
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
            "hover:bg-accent hover:text-accent-foreground",
            isActive
              ? "bg-accent text-accent-foreground font-medium"
              : "text-muted-foreground",
          )
        }
      >
        <Building2 className="h-4 w-4 shrink-0" />
        Home
      </NavLink>

      <div className="my-2 h-px bg-border" />

      {ALL_ENTITY_CONFIGS.map((cfg) => (
        <NavItem key={cfg.route} config={cfg} />
      ))}
    </nav>
  );
}
