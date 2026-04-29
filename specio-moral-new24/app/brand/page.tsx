"use client"

import React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, CheckCircle, Users, Package, AlertCircle, Building2 } from 'lucide-react'
import { brandApi } from "@/lib/api/client"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function BrandLoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (user) {
      try {
        const parsed = JSON.parse(user)
        if (parsed.role === 'BRAND_ADMIN') {
          router.push('/brand/dashboard')
        }
      } catch {}
    }
  }, [router, isMounted])

  const handleBrandLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    const email = formData.get('brand-login-email') as string
    const password = formData.get('brand-login-password') as string

    const result = await brandApi.login(email, password)

    if (!result.success) {
      setError(result.error || 'Login failed')
      setIsLoading(false)
      return
    }

    router.push('/brand/dashboard')
  }

  const handleBrandRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)
    
    const formData = new FormData(e.currentTarget)
    const brandPassword = formData.get('brand-register-password') as string
    const brandConfirmPassword = formData.get('brand-register-confirm-password') as string

    if (brandPassword !== brandConfirmPassword) {
      setError("Passwords don't match")
      setIsLoading(false)
      return
    }
    
    const result = await brandApi.register({
      brandName: formData.get('brandName') as string,
      description: formData.get('description') as string,
      websiteUrl: formData.get('websiteUrl') as string,
      supportEmail: formData.get('supportEmail') as string,
      supportPhone: formData.get('supportPhone') as string,
      contactFirstName: formData.get('contactFirstName') as string,
      contactLastName: formData.get('contactLastName') as string,
      contactPhone: formData.get('contactPhone') as string,
      email: formData.get('brand-register-email') as string,
      password: formData.get('brand-register-password') as string,
    })

    if (!result.success) {
      setError(result.error || 'Registration failed')
      setIsLoading(false)
      return
    }

    setSuccess(result.message || 'Brand registered! Please check your email to activate your account. If you don\'t see it in your inbox, please check your spam or junk folder.')
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
              Brand Portal - Manage your products and verification codes
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <Package className="h-6 w-6 text-blue-500 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900">Product Management</h3>
                <p className="text-gray-600">Add and manage your product catalog</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900">Code Generation</h3>
                <p className="text-gray-600">Generate unique verification codes for your products</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <Users className="h-6 w-6 text-purple-500 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900">Analytics Dashboard</h3>
                <p className="text-gray-600">Track verifications and customer engagement</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <Building2 className="h-6 w-6 text-orange-500 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900">Brand Protection</h3>
                <p className="text-gray-600">Safeguard your reputation and revenue</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Brand Login Form */}
        <div className="w-full max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="lg:hidden flex items-center justify-center space-x-2 mb-4">
                <Shield className="h-6 w-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">AuthentiGuard</h1>
              </div>
              <CardTitle className="text-2xl">Brand Portal</CardTitle>
              <CardDescription>
                Manage your products and generate verification codes
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
                  <TabsTrigger value="register">Register Brand</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="space-y-4">
                  <form onSubmit={handleBrandLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="brand-login-email">Email</Label>
                      <Input
                        id="brand-login-email"
                        name="brand-login-email"
                        type="email"
                        placeholder="Enter your brand admin email"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="brand-login-password">Password</Label>
                      <Input
                        id="brand-login-password"
                        name="brand-login-password"
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
                      {isLoading ? "Signing in..." : "Sign In to Brand Portal"}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="register" className="space-y-4">
                  <form onSubmit={handleBrandRegister} className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {/* Brand Information */}
                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-900 border-b pb-2">Brand Information</h3>
                      <div className="space-y-2">
                        <Label htmlFor="brandName">Brand Name *</Label>
                        <Input
                          id="brandName"
                          name="brandName"
                          placeholder="Your Brand Name"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input
                          id="description"
                          name="description"
                          placeholder="Brief description of your brand"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="websiteUrl">Website URL</Label>
                        <Input
                          id="websiteUrl"
                          name="websiteUrl"
                          type="url"
                          placeholder="https://yourbrand.com"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="supportEmail">Support Email</Label>
                          <Input
                            id="supportEmail"
                            name="supportEmail"
                            type="email"
                            placeholder="support@brand.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="supportPhone">Support Phone</Label>
                          <Input
                            id="supportPhone"
                            name="supportPhone"
                            type="tel"
                            placeholder="+1 (555) 123-4567"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Contact Person */}
                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-900 border-b pb-2">Contact Person</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="contactFirstName">First Name *</Label>
                          <Input
                            id="contactFirstName"
                            name="contactFirstName"
                            placeholder="John"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contactLastName">Last Name *</Label>
                          <Input
                            id="contactLastName"
                            name="contactLastName"
                            placeholder="Doe"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contactPhone">Contact Phone</Label>
                        <Input
                          id="contactPhone"
                          name="contactPhone"
                          type="tel"
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                    </div>

                    {/* Account Credentials */}
                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-900 border-b pb-2">Account Credentials</h3>
                      <div className="space-y-2">
                        <Label htmlFor="brand-register-email">Email *</Label>
                        <Input
                          id="brand-register-email"
                          name="brand-register-email"
                          type="email"
                          placeholder="admin@yourbrand.com"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="brand-register-password">Password *</Label>
                        <Input
                          id="brand-register-password"
                          name="brand-register-password"
                          type="password"
                          placeholder="Create a password (min 8 characters)"
                          minLength={8}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="brand-register-confirm-password">Confirm Password *</Label>
                        <Input
                          id="brand-register-confirm-password"
                          name="brand-register-confirm-password"
                          type="password"
                          placeholder="Re-enter your password"
                          minLength={8}
                          required
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isLoading}
                    >
                      {isLoading ? "Registering brand..." : "Register Brand"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <div className="mt-4 text-center text-sm text-gray-600">
                Are you a customer?{" "}
                <Link href="/" className="text-blue-600 hover:underline font-medium">
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
