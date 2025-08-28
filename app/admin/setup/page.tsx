"use client"
import type React from "react"

import { useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Crown, Shield, AlertTriangle, Sparkles } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export default function AdminSetup() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [loading, setLoading] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const createInitialAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // First, sign up the admin user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            user_type: "admin",
            organization: "Samadhan Administration",
          },
        },
      })

      if (authError) throw authError

      if (authData.user) {
        // Update the profile to super admin status
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            user_type: "super_admin",
            approval_status: "approved",
            approved_at: new Date().toISOString(),
            full_name: fullName,
            organization: "Samadhan Administration",
          })
          .eq("id", authData.user.id)

        if (profileError) throw profileError

        toast({
          title: "Admin Created Successfully",
          description: "Initial super admin account has been created. Please check your email to verify your account.",
        })

        // Redirect to login
        setTimeout(() => {
          window.location.href = "/auth/login"
        }, 2000)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border border-border shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.01]">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-6">
            <div className="bg-primary/10 p-4 rounded-full border border-primary/20 shadow-lg hover:shadow-xl hover:bg-primary/20 transition-all duration-300">
              <Crown className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-foreground mb-2">
            Setup Samadhan Admin
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground leading-relaxed">
            Create the initial super administrator account for the Samadhan platform.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Security Warning */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 hover:shadow-md transition-all duration-300">
            <div className="flex items-start gap-3">
              <div className="p-1 bg-amber-100 dark:bg-amber-900/50 rounded-full">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <p className="font-semibold mb-2 text-amber-900 dark:text-amber-100">Important Security Notice</p>
                <p className="leading-relaxed">
                  This page should only be used for initial setup. After creating the first admin, this page should be
                  disabled or removed for security.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={createInitialAdmin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium text-foreground/90">
                Full Name
              </Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Administrator Name"
                required
                className="h-12 border border-border hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground/90">
                Admin Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@samadhan.gov"
                required
                className="h-12 border border-border hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground/90">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Strong password"
                required
                minLength={8}
                className="h-12 border border-border hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 bg-background"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mr-3" />
                  <span className="animate-pulse">Creating Admin...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Shield className="w-5 h-5 mr-2 drop-shadow-sm" />
                  <span>Create Super Admin</span>
                </div>
              )}
            </Button>
          </form>

          <div className="pt-4 border-t border-border">
            <div className="text-center text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
              <p className="leading-relaxed">
                After setup, admins login through the regular login page.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}