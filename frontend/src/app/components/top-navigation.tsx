import type React from "react"
import { FileText, Users, BarChart3, Download, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

export function TopNavigation() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <div className="font-semibold text-slate-900 text-xl">HWM</div>

          <nav className="hidden md:flex items-center space-x-1">
            <NavItem href="#" isActive icon={<FileText className="h-4 w-4" />}>
              Payments
            </NavItem>
            <NavItem href="#" icon={<BarChart3 className="h-4 w-4" />}>
              Quarterly Summary
            </NavItem>
            <NavItem href="#" icon={<Users className="h-4 w-4" />}>
              Contacts
            </NavItem>
            <NavItem href="#" icon={<Download className="h-4 w-4" />}>
              Export Data
            </NavItem>
            <NavItem href="#" icon={<Settings className="h-4 w-4" />}>
              Settings
            </NavItem>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-white text-sm font-medium">
              JD
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

interface NavItemProps {
  href: string
  children: React.ReactNode
  icon?: React.ReactNode
  isActive?: boolean
}

function NavItem({ href, children, icon, isActive }: NavItemProps) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
        isActive ? "text-slate-900 bg-slate-100" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50",
      )}
    >
      {icon}
      {children}
    </a>
  )
}

