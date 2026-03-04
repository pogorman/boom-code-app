import { Outlet, NavLink } from "react-router-dom"
import { SidebarNav } from "@/components/sidebar-nav"
import { ModeToggle } from "@/components/mode-toggle"

type LayoutProps = { showHeader?: boolean }

export default function Layout({ showHeader: _showHeader = true }: LayoutProps) {
  return (
    <div className="min-h-dvh flex flex-col">
      {/* Top header */}
      <header className="h-12 border-b flex items-center shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30">
        <div className="w-full px-4 flex items-center justify-between">
          <NavLink to="/" className="font-semibold text-sm tracking-tight">
            Boom Code App
          </NavLink>
          <ModeToggle />
        </div>
      </header>

      {/* Body: sidebar + main */}
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-56 shrink-0 border-r overflow-y-auto bg-card hidden md:block">
          <SidebarNav />
        </aside>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}