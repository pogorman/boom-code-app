import { Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Building2,
  Users,
  CheckSquare,
  Star,
  Lightbulb,
  TrendingUp,
  FileText,
  Briefcase,
} from "lucide-react"
import { ALL_ENTITY_CONFIGS } from "@/types/entities"

const ICON_MAP: Record<string, React.ElementType> = {
  Building2,
  Users,
  CheckSquare,
  Star,
  Lightbulb,
  TrendingUp,
  FileText,
  Briefcase,
}

export default function HomePage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Boom Code App</h1>
        <p className="text-muted-foreground mt-1">
          Manage your Dataverse records — pick a table below to get started.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ALL_ENTITY_CONFIGS.map((cfg) => {
          const Icon = ICON_MAP[cfg.icon] ?? Building2
          return (
            <Link key={cfg.route} to={cfg.route}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                  <div className="rounded-md bg-primary/10 p-2">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">{cfg.displayNamePlural}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    View, create, edit, and delete {cfg.displayNamePlural.toLowerCase()}.
                  </p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}