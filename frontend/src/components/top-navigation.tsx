"use client"

import { PieChart, Search, Settings, UserCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"

export function TopNavigation() {
  return (
    <div className="h-14 border-b bg-white flex items-center justify-between px-4">
      <div className="flex items-center">
        <div className="mr-8 font-semibold text-blue-600 text-lg">401K Manager</div>
        <div className="hidden md:flex items-center rounded-md border border-slate-200 bg-white px-2 w-80">
          <Search className="h-4 w-4 text-slate-400" />
          <Input
            type="search"
            placeholder="Search..."
            className="h-9 border-0 focus:border-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
          <PieChart className="h-5 w-5 text-slate-600" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
          <Settings className="h-5 w-5 text-slate-600" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
          <UserCircle className="h-5 w-5 text-slate-600" />
        </Button>
      </div>
    </div>
  )
}
