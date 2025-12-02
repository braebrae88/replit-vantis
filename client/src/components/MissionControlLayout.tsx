import { Menu, FileSpreadsheet, FileText } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ProjectSidebar } from "./ProjectSidebar";
import { Link } from "wouter";
import forgeVantisLogo from "@assets/forge_vantis_logo_1764654100313.png";

export default function MissionControlLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Header for branding */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-black border-b border-black z-50 flex items-center px-4 md:px-6">
        {/* Mobile menu button */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden mr-2 text-white hover:bg-white/10">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <ProjectSidebar />
          </SheetContent>
        </Sheet>

        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" data-testid="link-home">
            <img 
              src={forgeVantisLogo} 
              alt="Forge Vantis" 
              className="h-8 w-auto"
            />
            <p className="text-[10px] text-white font-mono tracking-wider uppercase">Mission Control</p>
          </div>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <Link href="/proposals">
            <Button variant="ghost" size="sm" className="gap-2 text-white hover:bg-white/10 hover:text-white" data-testid="link-proposals">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Proposals</span>
            </Button>
          </Link>
          <Link href="/timesheet">
            <Button variant="ghost" size="sm" className="gap-2 text-white hover:bg-white/10 hover:text-white" data-testid="link-timesheet">
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Timesheet</span>
            </Button>
          </Link>
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
