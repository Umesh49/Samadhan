import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import EnhancedReportForm from "@/components/report-form"
import RecentIssues from "@/components/recent-issues"
import { NotificationProvider } from "@/components/notification-provider"
import NotificationBell from "@/components/notification-bell"
import RealTimeStatus from "@/components/real-time-status"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, User, Crown, Menu } from "lucide-react"
import { Toaster } from "@/components/ui/toaster"

export default async function ReportPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile) {
    redirect("/auth/login")
  }

  return (
    <NotificationProvider userId={user.id} userType={profile.user_type as "citizen" | "government"}>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10">
        <header className="bg-card/95 backdrop-blur-sm shadow-sm border-b border-border/50 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              {/* Logo and Brand - Mobile Optimized */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Crown className="w-8 h-8 sm:w-10 sm:h-10 text-accent drop-shadow-sm" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-secondary rounded-full animate-pulse" />
                </div>
                <div className="flex flex-col">
                  <h1 className="text-xl sm:text-2xl font-bold text-primary">Samadhan</h1>
                  <p className="text-xs sm:text-sm text-secondary-foreground font-medium hidden sm:block">
                    Civic Infrastructure Solutions
                  </p>
                </div>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  Welcome back, <span className="font-semibold text-primary">{profile.full_name}</span>
                </div>
                <NotificationBell />
                <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/20 rounded-full text-sm shadow-sm">
                  <User className="w-4 h-4 text-accent" />
                  <span className="capitalize font-semibold text-accent-foreground">{profile.user_type}</span>
                </div>
                <form action="/auth/logout" method="post">
                  <Button
                    variant="ghost"
                    size="sm"
                    type="submit"
                    className="hover:bg-destructive/10 hover:text-destructive border border-transparent hover:border-destructive/20 transition-all duration-200"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </form>
              </div>

              {/* Mobile Navigation */}
              <div className="md:hidden flex items-center gap-2">
                <NotificationBell />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="p-2 border border-border/30 hover:border-accent/40">
                      <Menu className="w-5 h-5 text-primary" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 border-border/50 shadow-xl">
                    <div className="px-3 py-2 bg-accent/5 border-b border-accent/20">
                      <p className="text-sm font-semibold text-primary">{profile.full_name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="flex items-center text-accent-foreground">
                      <User className="w-4 h-4 mr-2 text-accent" />
                      <span className="capitalize font-medium">{profile.user_type}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <form action="/auth/logout" method="post" className="w-full">
                      <DropdownMenuItem asChild>
                        <button type="submit" className="w-full flex items-center text-destructive focus:text-destructive hover:bg-destructive/5">
                          <LogOut className="w-4 h-4 mr-2" />
                          Sign Out
                        </button>
                      </DropdownMenuItem>
                    </form>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Mobile Welcome Message */}
            <div className="md:hidden mt-3 pt-3 border-t border-border/50 bg-accent/5 rounded-lg px-3 py-2 -mx-1">
              <p className="text-sm text-muted-foreground">
                Welcome back, <span className="font-semibold text-primary">{profile.full_name}</span>
              </p>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 sm:py-8">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-accent/20">
                <Crown className="w-6 h-6 text-accent drop-shadow-sm" />
                <h2 className="text-xl sm:text-2xl font-bold text-primary">Report New Issue</h2>
              </div>
              <div className="bg-card/90 backdrop-blur-sm rounded-xl border border-border/50 shadow-lg p-4 sm:p-6">
                <EnhancedReportForm userId={user.id} />
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-primary/20">
                <Crown className="w-6 h-6 text-primary drop-shadow-sm" />
                <h2 className="text-xl sm:text-2xl font-bold text-primary">Recent Issues</h2>
              </div>
              <div className="bg-card/90 backdrop-blur-sm rounded-xl border border-border/50 shadow-lg">
                <RecentIssues />
              </div>
            </div>
          </div>

          {/* Enhanced Status Cards for Mobile */}
          <div className="mt-8 lg:hidden">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                <Crown className="w-5 h-5 text-accent" />
                Status Overview
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-card/90 backdrop-blur-sm rounded-xl border border-accent/20 p-4 text-center shadow-lg hover:shadow-xl transition-shadow">
                <div className="text-2xl font-bold text-accent drop-shadow-sm">0</div>
                <div className="text-xs text-muted-foreground font-medium">Pending</div>
              </div>
              <div className="bg-card/90 backdrop-blur-sm rounded-xl border border-amber-200 p-4 text-center shadow-lg hover:shadow-xl transition-shadow">
                <div className="text-2xl font-bold text-amber-600 drop-shadow-sm">0</div>
                <div className="text-xs text-muted-foreground font-medium">In Progress</div>
              </div>
              <div className="bg-card/90 backdrop-blur-sm rounded-xl border border-green-200 p-4 text-center shadow-lg hover:shadow-xl transition-shadow sm:col-span-1 col-span-2">
                <div className="text-2xl font-bold text-green-600 drop-shadow-sm">0</div>
                <div className="text-xs text-muted-foreground font-medium">Resolved</div>
              </div>
            </div>
          </div>
        </main>

        <RealTimeStatus />
      </div>
      <Toaster />
    </NotificationProvider>
  )
}