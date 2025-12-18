import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import { MapPin, Camera, CheckCircle, Crown, Shield, AlertTriangle, ArrowRight, Activity } from "lucide-react"

export default async function HomePage() {
  let user = null
  let profile = null
  let isSupabaseConfigured = true

  try {
    const supabase = await createClient()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    user = authUser

    if (user) {
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("user_type, approval_status")
        .eq("id", user.id)
        .single()
      profile = userProfile

      if (profile?.user_type === "government" && profile.approval_status !== "approved") {
        // Pending government users stay here
      } else if (profile?.user_type === "admin" || profile?.user_type === "super_admin") {
        redirect("/admin")
      } else if (profile?.user_type === "government") {
        redirect("/dashboard")
      } else {
        redirect("/report")
      }
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'digest' in error) {
      const digest = (error as any).digest
      if (typeof digest === 'string' && digest.includes('NEXT_REDIRECT')) {
        throw error
      }
    }
    console.error("[Samadhan] Supabase configuration error:", error)
    isSupabaseConfigured = false
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <GlassCard className="max-w-xl w-full p-8 border-amber-500/30 bg-amber-500/10">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center mb-6">
              <AlertTriangle className="w-10 h-10 text-amber-500" />
            </div>
            <h1 className="text-3xl font-bold text-amber-600 mb-2">Configuration Required</h1>
            <p className="text-amber-800/80 mb-6">
              Samadhan needs Supabase credentials to function. Please check your setup.
            </p>
            <div className="bg-black/50 p-4 rounded-lg text-left w-full overflow-x-auto mb-6">
              <code className="text-green-400 text-sm">
                NEXT_PUBLIC_SUPABASE_URL=...<br />
                NEXT_PUBLIC_SUPABASE_ANON_KEY=...
              </code>
            </div>
            <p className="text-sm text-amber-700">
              Refer to <span className="font-semibold bg-amber-200/50 px-1 rounded">README.md</span> for details.
            </p>
          </div>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/60 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-6 h-6 text-accent" />
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80 dark:from-white dark:to-white/80">
              Samadhan
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Button asChild className="rounded-full px-6 shadow-lg">
              <Link href="/auth/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background/50 border border-border/50 text-accent-foreground text-sm font-medium mb-6 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
              </span>
              Modern Civic Infrastructure
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight tracking-tight">
              Report. Track. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent/60">
                Resolve Together.
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Empowering citizens with next-gen tools to report infrastructure issues and tracking government resolution in real-time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="rounded-full text-lg h-14 px-8 bg-accent text-primary hover:bg-accent/90 shadow-lg shadow-accent/20">
                <Link href="/auth/sign-up">
                  Launch Platform <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full text-lg h-14 px-8 border-border/50 bg-background/50 text-foreground hover:bg-background/80 backdrop-blur-sm">
                <Link href="/auth/login">Access Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-6">
            <GlassCard className="p-8 group">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Camera className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Smart Reporting</h3>
              <p className="text-muted-foreground leading-relaxed">
                Capture photo evidence with automatic geolocation. AI-assisted categorization ensures reports reach the right department instantly.
              </p>
            </GlassCard>

            <GlassCard className="p-8 group" gradient>
              <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Activity className="w-7 h-7 text-accent" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Real-time Tracking</h3>
              <p className="text-muted-foreground leading-relaxed">
                Watch as your reports move from "Received" to "Resolved". Get instant notifications and visual proof of completion.
              </p>
            </GlassCard>

            <GlassCard className="p-8 group">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Verified Resolution</h3>
              <p className="text-muted-foreground leading-relaxed">
                Government officials provide location-verified proof of fixes. Transparency ensures accountability at every level.
              </p>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Stats/Trust Section */}
      <section className="py-20 border-t border-border/50 bg-background/50 backdrop-blur-sm">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-foreground mb-2">100%</div>
              <div className="text-muted-foreground font-medium">Digital Workflow</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-foreground mb-2">GPS</div>
              <div className="text-muted-foreground font-medium">Precise Location</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-foreground mb-2">24/7</div>
              <div className="text-muted-foreground font-medium">System Availability</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-foreground mb-2">Secure</div>
              <div className="text-muted-foreground font-medium">Enterprise Grade</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/40 mt-auto bg-background/30 backdrop-blur-sm">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-muted-foreground" />
            <span className="text-muted-foreground font-medium">Samadhan by Government of India</span>
          </div>
          <div className="flex gap-8 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link href="/doctors" className="hover:text-foreground transition-colors">Contact Support</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}