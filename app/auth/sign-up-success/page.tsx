import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Mail, CheckCircle, Shield, ArrowRight, Home } from "lucide-react"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-gradient-to-br from-blue-50/80 via-background to-green-50/60">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/3 left-1/4 w-32 h-32 bg-blue-200 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-40 h-40 bg-green-200 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative w-full max-w-lg">
        <Card className="border-border/40 shadow-2xl bg-card/95 backdrop-blur-sm overflow-hidden">
          {/* Success Header with Icon */}
          <div className="bg-gradient-to-r from-green-500 to-blue-600 p-6 text-white">
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                  <CheckCircle className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                  <Mail className="w-3 h-3 text-green-800" />
                </div>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center text-white mb-2">
              Account Created Successfully!
            </CardTitle>
            <CardDescription className="text-center text-green-100 font-medium">
              Welcome to Samadhan - Civic Infrastructure Solutions
            </CardDescription>
          </div>

          <CardContent className="p-8 space-y-6">
            {/* Email Verification Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 rounded-full p-2">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-blue-900">Email Verification Required</h3>
              </div>
              <p className="text-sm text-blue-800 leading-relaxed pl-10">
                We've sent a verification link to your email address. Please check your inbox and click the link to activate your account and start reporting infrastructure issues.
              </p>
            </div>

            {/* What's Next Section */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-gray-100 rounded-full p-2">
                  <Shield className="w-5 h-5 text-gray-600" />
                </div>
                <h3 className="font-semibold text-gray-900">What's Next?</h3>
              </div>
              <div className="pl-10 space-y-3">
                <div className="flex items-start gap-3 text-sm text-gray-700">
                  <div className="bg-blue-500 rounded-full w-1.5 h-1.5 mt-2 flex-shrink-0"></div>
                  <span>Check your email and click the verification link</span>
                </div>
                <div className="flex items-start gap-3 text-sm text-gray-700">
                  <div className="bg-blue-500 rounded-full w-1.5 h-1.5 mt-2 flex-shrink-0"></div>
                  <span>Sign in to your account and complete your profile</span>
                </div>
                <div className="flex items-start gap-3 text-sm text-gray-700">
                  <div className="bg-blue-500 rounded-full w-1.5 h-1.5 mt-2 flex-shrink-0"></div>
                  <span>Start reporting infrastructure issues in your community</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  asChild
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 h-11"
                >
                  <Link href="/auth/login" className="flex items-center justify-center gap-2">
                    Continue to Sign In
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium h-11"
                >
                  <Link href="/" className="flex items-center justify-center gap-2">
                    <Home className="w-4 h-4" />
                    Return Home
                  </Link>
                </Button>
              </div>

              {/* Help Text */}
              <div className="text-center text-xs text-muted-foreground space-y-1">
                <p>Didn't receive the email? Check your spam folder.</p>
                <p className="text-blue-600">Need help? Contact our support team</p>
              </div>
            </div>

            {/* Footer Message */}
            <div className="pt-6 border-t border-border/30 text-center">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Join thousands of engaged citizens working together to improve infrastructure and build stronger communities through Samadhan's comprehensive reporting platform.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Decorative Elements */}
        <div className="absolute -top-3 -left-3 w-6 h-6 border-2 border-blue-300/40 rounded-full animate-bounce delay-300" />
        <div className="absolute -bottom-3 -right-3 w-4 h-4 border-2 border-green-300/40 rounded-full animate-bounce delay-700" />
      </div>
    </div>
  )
}