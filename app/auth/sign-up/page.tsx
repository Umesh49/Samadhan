"use client"
import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Crown, Shield, Users, Info, AlertCircle } from "lucide-react"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [userType, setUserType] = useState<string>("")
  const [organization, setOrganization] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (!userType) {
      setError("Please select your account type")
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/report`,
          data: {
            full_name: fullName,
            user_type: userType,
            organization: userType === "government" ? organization : null,
          },
        },
      })
      if (error) throw error
      router.push("/auth/sign-up-success")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-gradient-to-br from-primary/8 via-background to-accent/8">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-accent rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-secondary rounded-full blur-3xl" />
      </div>
      
      <div className="relative w-full max-w-lg">
        <Card className="border-border/50 shadow-2xl bg-card/95 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4 pb-6">
            <div className="flex items-center justify-center mb-2">
              <div className="relative">
                <Crown className="w-10 h-10 text-accent mr-3 drop-shadow-lg" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-secondary rounded-full animate-pulse shadow-lg" />
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold text-primary">Join Samadhan</CardTitle>
              <CardDescription className="text-muted-foreground font-medium">
                Create your account for civic infrastructure solutions
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSignUp} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-foreground font-semibold text-sm">
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="border-border/50 focus:border-accent focus:ring-accent/20 bg-background/50 backdrop-blur-sm h-11"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground font-semibold text-sm">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border-border/50 focus:border-accent focus:ring-accent/20 bg-background/50 backdrop-blur-sm h-11"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground font-semibold text-sm">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-border/50 focus:border-accent focus:ring-accent/20 bg-background/50 backdrop-blur-sm h-11"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="userType" className="text-foreground font-semibold text-sm">
                    Account Type
                  </Label>
                  <Select value={userType} onValueChange={setUserType}>
                    <SelectTrigger className="border-border/50 focus:border-accent focus:ring-accent/20 bg-background/50 backdrop-blur-sm h-11">
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                    <SelectContent className="bg-card/95 backdrop-blur-sm border-border/50">
                      <SelectItem value="citizen" className="flex items-center focus:bg-accent/10">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2 text-accent" />
                          Citizen
                        </div>
                      </SelectItem>
                      <SelectItem value="government" className="flex items-center focus:bg-accent/10">
                        <div className="flex items-center">
                          <Shield className="w-4 h-4 mr-2 text-accent" />
                          Government Official
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {userType === "government" && (
                  <>
                    <Alert className="border-accent/30 bg-accent/5 backdrop-blur-sm">
                      <Info className="h-4 w-4 text-accent" />
                      <AlertDescription className="text-sm font-medium">
                        <strong>Government Registration:</strong> Your account will require admin approval before you
                        can access the system. You'll receive an email notification once approved.
                      </AlertDescription>
                    </Alert>
                    <div className="space-y-2">
                      <Label htmlFor="organization" className="text-foreground font-semibold text-sm">
                        Organization
                      </Label>
                      <Input
                        id="organization"
                        type="text"
                        placeholder="City Public Works Department"
                        required
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        className="border-border/50 focus:border-accent focus:ring-accent/20 bg-background/50 backdrop-blur-sm h-11"
                      />
                    </div>
                  </>
                )}
              </div>

              {error && (
                <Alert className="border-destructive/30 bg-destructive/5 backdrop-blur-sm">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-destructive text-sm font-medium">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-11 shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin" />
                    Creating account...
                  </div>
                ) : (
                  "Join Samadhan"
                )}
              </Button>
            </form>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/30" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground font-medium">Or</span>
              </div>
            </div>
            
            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="text-primary hover:text-primary/80 underline underline-offset-4 font-semibold transition-colors"
              >
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
        
        {/* Decorative elements */}
        <div className="absolute -top-4 -left-4 w-8 h-8 border-2 border-accent/30 rounded-full" />
        <div className="absolute -bottom-4 -right-4 w-6 h-6 border-2 border-secondary/30 rounded-full" />
      </div>
    </div>
  )
}