"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Crown, AlertCircle, Eye, EyeOff, ArrowLeft } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error

      // Get user profile to determine redirect and check approval status
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type, approval_status")
        .eq("id", (await supabase.auth.getUser()).data.user?.id)
        .single()

      if (profile?.user_type === "government" && profile.approval_status !== "approved") {
        setError(
          "Your government account is pending admin approval. Please wait for approval before accessing the system.",
        )
        await supabase.auth.signOut()
        setIsLoading(false)
        return
      }

      if (
        profile?.user_type === "government" ||
        profile?.user_type === "admin" ||
        profile?.user_type === "super_admin"
      ) {
        if (profile.user_type === "admin" || profile.user_type === "super_admin") {
          router.push("/admin")
        } else {
          router.push("/dashboard")
        }
      } else {
        router.push("/report")
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 relative">
      <Link href="/" className="absolute top-6 left-6 text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
        <ArrowLeft className="w-4 h-4" /> <span className="text-sm font-medium">Back to Home</span>
      </Link>

      <div className="relative w-full max-w-md">
        <GlassCard className="p-8 backdrop-blur-xl">
          <div className="text-center space-y-4 pb-8">
            <div className="flex items-center justify-center mb-2">
              <div className="relative">
                <Crown className="w-12 h-12 text-accent drop-shadow-lg" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-secondary rounded-full animate-pulse shadow-lg" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Welcome Back</h1>
              <p className="text-muted-foreground font-medium">
                Sign in to your civic solutions account
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground font-medium text-sm">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-background/50 border-input text-foreground placeholder:text-muted-foreground focus:border-accent focus:ring-accent/20 h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground font-medium text-sm">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-background/50 border-input text-foreground placeholder:text-muted-foreground focus:border-accent focus:ring-accent/20 h-12 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-12 px-3 hover:bg-background/50 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {error && (
                <Alert className="border-destructive/50 bg-destructive/10 text-destructive">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <AlertDescription>
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin" />
                    Signing in...
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/40" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-transparent px-2 text-muted-foreground font-medium">Or</span>
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link
                href="/auth/sign-up"
                className="text-primary hover:text-primary/80 hover:underline underline-offset-4 font-semibold transition-colors"
              >
                Create account
              </Link>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}