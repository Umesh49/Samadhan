"use client"
import { createBrowserClient } from "@supabase/ssr"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Crown, LogOut, Shield, Home } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface AdminNavProps {
  userType?: string
  userName?: string
}

export default function AdminNav({ userType, userName }: AdminNavProps) {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      toast({
        title: "Logged out successfully",
        description: "You have been signed out of Samadhan.",
      })
      router.push("/")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <nav className="bg-card border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-2 text-primary hover:text-primary/80">
              <Crown className="w-6 h-6" />
              <span className="font-bold text-lg">Samadhan Admin</span>
            </Link>

            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/admin"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground px-3 py-2 rounded-md"
              >
                <Shield className="w-4 h-4" />
                Dashboard
              </Link>
              <Link
                href="/"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground px-3 py-2 rounded-md"
              >
                <Home className="w-4 h-4" />
                Public Site
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{userName || "Admin"}</span>
              <span className="ml-2 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                {userType === "super_admin" ? "Super Admin" : "Admin"}
              </span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
