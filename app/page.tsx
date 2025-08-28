import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Camera, CheckCircle, Crown, Shield, AlertTriangle } from "lucide-react"

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
      // Get user profile to determine redirect
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("user_type, approval_status")
        .eq("id", user.id)
        .single()
      profile = userProfile

      if (profile?.user_type === "government" && profile.approval_status !== "approved") {
        // Don't redirect pending government users, let them see the home page with a message
      } else if (profile?.user_type === "admin" || profile?.user_type === "super_admin") {
        redirect("/admin")
      } else if (profile?.user_type === "government") {
        redirect("/dashboard")
      } else {
        redirect("/report")
      }
    }
  } catch (error) {
    // Check if this is a Next.js redirect (which is expected behavior)
    if (error && typeof error === 'object' && 'digest' in error) {
      const digest = (error as any).digest
      if (typeof digest === 'string' && digest.includes('NEXT_REDIRECT')) {
        // This is a redirect, not an error - let it propagate
        throw error
      }
    }
    
    // This is an actual Supabase configuration error
    console.error("[Samadhan] Supabase configuration error:", error)
    isSupabaseConfigured = false
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-6">
              <AlertTriangle className="w-16 h-16 text-amber-500 mr-4" />
              <div className="flex flex-col items-center">
                <h1 className="text-4xl md:text-6xl font-bold text-primary mb-2 text-balance">Samadhan</h1>
                <p className="text-lg text-secondary font-medium">Setup Required</p>
              </div>
            </div>

            <Card className="max-w-2xl mx-auto border-amber-200 bg-amber-50/50">
              <CardHeader>
                <CardTitle className="text-amber-800 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 mr-2" />
                  Environment Setup Required
                </CardTitle>
              </CardHeader>
              <CardContent className="text-left space-y-4">
                <p className="text-amber-700">
                  Your Samadhan app needs to be configured with Supabase credentials to work properly.
                </p>

                <div className="bg-white/80 p-4 rounded-lg border border-amber-200">
                  <h3 className="font-semibold text-amber-800 mb-2">Quick Setup Steps:</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-amber-700">
                    <li>
                      Create a <code className="bg-amber-100 px-1 rounded">.env.local</code> file in your project root
                    </li>
                    <li>
                      Copy your Supabase URL and keys from{" "}
                      <a
                        href="https://supabase.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        supabase.com
                      </a>
                    </li>
                    <li>
                      Add them to your <code className="bg-amber-100 px-1 rounded">.env.local</code> file
                    </li>
                    <li>
                      Restart your development server: <code className="bg-amber-100 px-1 rounded">npm run dev</code>
                    </li>
                  </ol>
                </div>

                <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono">
                  <div className="text-gray-400 mb-2"># .env.local</div>
                  <div>NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co</div>
                  <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here</div>
                  <div>SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here</div>
                </div>

                <p className="text-sm text-amber-600">
                  See the <code className="bg-amber-100 px-1 rounded">README.md</code> file for detailed setup
                  instructions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Crown className="w-16 h-16 text-accent mr-4" />
            <div className="flex flex-col items-center">
              <h1 className="text-4xl md:text-6xl font-bold text-primary mb-2 text-balance">Samadhan</h1>
              <p className="text-lg text-secondary font-medium">Civic Infrastructure Solutions</p>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-accent rounded-full mx-1" />
                <div className="w-3 h-3 bg-primary rounded-full mx-1" />
                <div className="w-3 h-3 bg-accent rounded-full mx-1" />
              </div>
            </div>
          </div>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto text-pretty">
            A sophisticated platform connecting citizens with government authorities to resolve infrastructure issues
            efficiently. Report problems, track solutions, and build better communities together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="text-lg px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Link href="/auth/sign-up">Join Samadhan</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="text-lg px-8 py-3 border-primary text-primary hover:bg-primary/10 bg-transparent"
            >
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center border-border/50 hover:border-accent/50 transition-colors">
            <CardHeader>
              <Camera className="w-12 h-12 mx-auto text-accent mb-4" />
              <CardTitle className="text-primary">Photo Evidence</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Capture issues with automatic geolocation for precise documentation and royal accountability
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center border-border/50 hover:border-primary/50 transition-colors">
            <CardHeader>
              <MapPin className="w-12 h-12 mx-auto text-primary mb-4" />
              <CardTitle className="text-primary">Precise Location</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                GPS coordinates ensure authorities can locate and address issues with royal precision
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center border-border/50 hover:border-accent/50 transition-colors">
            <CardHeader>
              <Shield className="w-12 h-12 mx-auto text-accent mb-4" />
              <CardTitle className="text-primary">Government Response</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Direct communication with approved authorities and real-time status updates
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center border-border/50 hover:border-primary/50 transition-colors">
            <CardHeader>
              <CheckCircle className="w-12 h-12 mx-auto text-primary mb-4" />
              <CardTitle className="text-primary">Royal Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Monitor your reports from submission to resolution with complete transparency
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="text-center bg-card/50 rounded-lg p-8 border border-border/50">
          <Crown className="w-12 h-12 mx-auto text-accent mb-4" />
          <h2 className="text-3xl font-bold text-primary mb-4">Ready to Make a Difference?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join Samadhan's network of engaged citizens and dedicated officials working together for infrastructure
            excellence
          </p>
          <Button
            asChild
            size="lg"
            className="text-lg px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Link href="/auth/sign-up">Get Started with Samadhan</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}