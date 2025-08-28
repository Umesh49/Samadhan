import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import DashboardStats from "@/components/dashboard-stats"
import IssuesList from "@/components/issues-list"
import { NotificationProvider } from "@/components/notification-provider"
import NotificationBell from "@/components/notification-bell"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, User, Settings, Crown, Menu, Shield } from "lucide-react"
import { Toaster } from "@/components/ui/toaster"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Get user profile and verify government access
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.user_type !== "government") {
    redirect("/report")
  }

  return (
    <NotificationProvider userId={user.id} userType={profile.user_type}>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10">
        <header className="bg-white/95 backdrop-blur-sm shadow-sm border-b sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              {/* Logo and Brand - Mobile Optimized */}
              <div className="flex items-center gap-3">
                <Crown className="w-8 h-8 sm:w-10 sm:h-10 text-accent" />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1 mb-1 sm:mb-0">
                    <div className="w-2 h-2 bg-accent rounded-full" />
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <div className="w-2 h-2 bg-accent rounded-full" />
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-primary">Samadhan</h1>
                  <p className="text-xs sm:text-sm text-secondary font-medium hidden sm:block">
                    Government Dashboard
                  </p>
                </div>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{profile.full_name}</span>
                  <div className="text-xs">{profile.organization}</div>
                </div>
                <NotificationBell />
                <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/10 rounded-full text-sm">
                  <Shield className="w-4 h-4 text-secondary" />
                  <span className="capitalize font-medium text-secondary">{profile.user_type}</span>
                </div>
                <Button variant="ghost" size="sm" className="hover:bg-accent/10 hover:text-accent">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
                <form action="/auth/logout" method="post">
                  <Button variant="ghost" size="sm" type="submit" className="hover:bg-destructive/10 hover:text-destructive">
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
                    <Button variant="ghost" size="sm" className="p-2">
                      <Menu className="w-5 h-5" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-3 py-2">
                      <p className="text-sm font-medium">{profile.full_name}</p>
                      <p className="text-xs text-muted-foreground">{profile.organization}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="flex items-center">
                      <Shield className="w-4 h-4 mr-2 text-secondary" />
                      <span className="capitalize">{profile.user_type}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <form action="/auth/logout" method="post" className="w-full">
                      <DropdownMenuItem asChild>
                        <button type="submit" className="w-full flex items-center text-destructive focus:text-destructive">
                          <LogOut className="w-4 h-4 mr-2" />
                          Sign Out
                        </button>
                      </DropdownMenuItem>
                    </form>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Mobile User Info */}
            <div className="md:hidden mt-2 pt-2 border-t border-border/50">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{profile.full_name}</span>
                <span className="text-xs block">{profile.organization}</span>
              </p>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 sm:py-8">
          <div className="space-y-6 sm:space-y-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-border/50 shadow-sm p-4 sm:p-6">
              <DashboardStats />
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-border/50 shadow-sm">
              <IssuesList userId={user.id} />
            </div>
          </div>
        </main>
      </div>
      <Toaster />
    </NotificationProvider>
  )
}