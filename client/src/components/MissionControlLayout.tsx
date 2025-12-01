import { Hexagon, Menu } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ProjectSidebar } from "./ProjectSidebar";

export default function MissionControlLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Header for branding */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-card border-b border-border z-50 flex items-center px-4 md:px-6">
        {/* Mobile menu button */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden mr-2">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <ProjectSidebar />
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary text-primary-foreground flex items-center justify-center rounded-sm">
            <Hexagon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight">FORGE VANTIS</h1>
            <p className="text-[10px] text-muted-foreground font-mono tracking-wider uppercase">Mission Control</p>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-72 shrink-0 fixed left-0 top-14 bottom-0 z-40">
        <ProjectSidebar />
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-72 pt-14 min-h-screen">
        <div className="h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
