"use client"

import React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, CheckCircle, Users, Package, AlertCircle, Building2 } from 'lucide-react'
import { authApi } from "@/lib/api/client"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Check if already logged in
  useEffect(() => {
    if (!isMounted) return
    if (authApi.isAuthenticated()) {
      router.push('/dashboard')
    }
  }, [router, isMounted])

  const handleCustomerLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    const email = formData.get('login-email') as string
    const password = formData.get('login-password') as string

    const result = await authApi.login(email, password)

    if (!result.success) {
      setError(result.error || 'Login failed')
      setIsLoading(false)
      return
    }

    router.push('/dashboard')
  }

  const handleCustomerRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)
    
    const formData = new FormData(e.currentTarget)
    const email = formData.get('register-email') as string
    const password = formData.get('register-password') as string
    const confirmPassword = formData.get('register-confirm-password') as string
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const phone = formData.get('phone') as string

    if (password !== confirmPassword) {
      setError("Passwords don't match")
      setIsLoading(false)
      return
    }

    const result = await authApi.register({
      email,
      password,
      firstName,
      lastName,
      phone,
    })

    if (!result.success) {
      setError(result.error || 'Registration failed')
      setIsLoading(false)
      return
    }

    setSuccess(result.message || 'Registration successful! Please check your email to activate your account. If you don\'t see it in your inbox, please check your spam or junk folder.')
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding */}
        <div className="hidden lg:block space-y-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">AuthentiGuard</h1>
            </div>
            <p className="text-xl text-gray-600">
              Protect your brand and customers from counterfeit products
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900">Instant Verification</h3>
                <p className="text-gray-600">Scratch and verify products in seconds</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <Users className="h-6 w-6 text-blue-500 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900">Customer Trust</h3>
                <p className="text-gray-600">Build confidence with authentic products</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <Package className="h-6 w-6 text-purple-500 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900">Brand Protection</h3>
                <p className="text-gray-600">Safeguard your reputation and revenue</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <Building2 className="h-6 w-6 text-orange-500 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900">Brand Portal</h3>
                <p className="text-gray-600">Generate unique codes and manage products</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="w-full max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="lg:hidden flex items-center justify-center space-x-2 mb-4">
                <Shield className="h-6 w-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">AuthentiGuard</h1>
              </div>
              <CardTitle className="text-2xl">Customer Portal</CardTitle>
              <CardDescription>
                Verify your products and protect yourself from counterfeits
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  {success}
                </div>
              )}

              <Tabs defaultValue="login" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Sign In</TabsTrigger>
                    <TabsTrigger value="register">Sign Up</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="login" className="space-y-4">
                    <form onSubmit={handleCustomerLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email">Email</Label>
                        <Input
                          id="login-email"
                          name="login-email"
                          type="email"
                          placeholder="Enter your email"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="login-password">Password</Label>
                        <Input
                          id="login-password"
                          name="login-password"
                          type="password"
                          placeholder="Enter your password"
                          required
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={isLoading}
                      >
                        {isLoading ? "Signing in..." : "Sign In"}
                      </Button>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="register" className="space-y-4">
                    <form onSubmit={handleCustomerRegister} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            name="firstName"
                            placeholder="John"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            name="lastName"
                            placeholder="Doe"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-email">Email</Label>
                        <Input
                          id="register-email"
                          name="register-email"
                          type="email"
                          placeholder="john@example.com"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-password">Password</Label>
                        <Input
                          id="register-password"
                          name="register-password"
                          type="password"
                          placeholder="Create a password (min 8 characters)"
                          minLength={8}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-confirm-password">Confirm Password</Label>
                        <Input
                          id="register-confirm-password"
                          name="register-confirm-password"
                          type="password"
                          placeholder="Re-enter your password"
                          minLength={8}
                          required
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={isLoading}
                      >
                        {isLoading ? "Creating account..." : "Create Account"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>

              <div className="mt-4 text-center text-sm text-gray-600">
                Are you a brand?{" "}
                <Link href="/brand" className="text-blue-600 hover:underline font-medium">
                  Sign in here
                </Link>
              </div>
            </CardContent>
          </Card>
          <div className="mt-4 text-right">
            <p className="text-xs text-gray-500">
              Email: <a href="mailto:support@thegrehvitti.com" className="text-blue-600 hover:underline">support@thegrehvitti.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
