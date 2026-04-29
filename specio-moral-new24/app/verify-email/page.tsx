"use client"

import React from "react"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react"
import { authApi } from "@/lib/api/client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type VerifyState = "loading" | "success" | "error"

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")

  const [state, setState] = useState<VerifyState>("loading")
  const [message, setMessage] = useState("")
  const [resendEmail, setResendEmail] = useState("")
  const [resendState, setResendState] = useState<"idle" | "loading" | "sent" | "error">("idle")
  const [resendMessage, setResendMessage] = useState("")

  useEffect(() => {
    if (!token) {
      setState("error")
      setMessage("No activation token provided. Please check your email for the correct link.")
      return
    }

    const verify = async () => {
      const result = await authApi.verifyEmail(token)
      if (result.success) {
        setState("success")
        setMessage(result.message || "Account activated successfully!")
      } else {
        setState("error")
        setMessage(result.error || "Activation failed. The link may be expired or invalid.")
      }
    }

    verify()
  }, [token])

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resendEmail) return
    setResendState("loading")
    const result = await authApi.resendVerification(resendEmail)
    if (result.success) {
      setResendState("sent")
      setResendMessage(result.message || "Verification email resent! If you don't see it in your inbox, please check your spam or junk folder.")
    } else {
      setResendState("error")
      setResendMessage(result.error || "Failed to resend. Please try again.")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Email Verification</CardTitle>
          <CardDescription>Account activation</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          {state === "loading" && (
            <>
              <div className="h-16 w-16 rounded-full bg-blue-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
              <p className="text-muted-foreground text-center">Activating your account...</p>
            </>
          )}

          {state === "success" && (
            <>
              <div className="h-16 w-16 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-center">
                <p className="text-green-700 font-medium text-lg">{message}</p>
                <p className="text-muted-foreground text-sm mt-2">You can now log in to your account.</p>
              </div>
              <Button onClick={() => router.push("/")} className="w-full">
                Go to Login
              </Button>
            </>
          )}

          {state === "error" && (
            <>
              <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <div className="text-center">
                <p className="text-red-700 font-medium text-lg">Activation Failed</p>
                <p className="text-muted-foreground text-sm mt-2">{message}</p>
              </div>

              <div className="w-full border-t pt-4">
                <p className="text-sm text-muted-foreground text-center mb-3">
                  Need a new activation link? Enter your email below.
                </p>
                <form onSubmit={handleResend} className="flex flex-col gap-3">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="resend-email">Email address</Label>
                    <Input
                      id="resend-email"
                      type="email"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <Button type="submit" variant="outline" disabled={resendState === "loading"} className="bg-transparent">
                    {resendState === "loading" ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Resend Activation Email
                      </>
                    )}
                  </Button>
                  {resendState === "sent" && (
                    <p className="text-sm text-green-600 text-center">{resendMessage}</p>
                  )}
                  {resendState === "error" && (
                    <p className="text-sm text-red-600 text-center">{resendMessage}</p>
                  )}
                </form>
              </div>

              <Button variant="ghost" onClick={() => router.push("/")} className="w-full">
                Back to Login
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
