"use client"

import React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Shield, ArrowLeft, Calendar, Award, Bell, Lock, Download, Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { authApi, userApi, verificationApi, getUser } from "@/lib/api/client"
import { useRouter } from "next/navigation"

interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  address?: string
  trustScore: number
  createdAt: string
}

interface Stats {
  totalVerifications: number
  authenticCount: number
  suspiciousCount: number
}

export default function Profile() {
  const [isLoading, setIsLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<Stats>({ totalVerifications: 0, authenticCount: 0, suspiciousCount: 0 })
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: ''
  })
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true
  })
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const router = useRouter()

  // Handle hydration - only access localStorage after mount
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return

    // Check if user is authenticated
    if (!authApi.isAuthenticated()) {
      router.push('/')
      return
    }

    fetchProfileData()
  }, [isMounted, router])

  const fetchProfileData = async () => {
    setIsLoading(true)
    
    try {
      // Fetch profile
      const profileResult = await userApi.getProfile()
      if (profileResult.success && profileResult.data) {
        setProfile(profileResult.data)
        setFormData({
          firstName: profileResult.data.firstName || '',
          lastName: profileResult.data.lastName || '',
          phone: profileResult.data.phone || '',
          address: profileResult.data.address || ''
        })
      } else {
        // Fallback to local storage
        const user = getUser()
        if (user) {
          setProfile({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone || '',
            address: '',
            trustScore: 100,
            createdAt: new Date().toISOString()
          })
          setFormData({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            phone: user.phone || '',
            address: ''
          })
        }
      }

      // Fetch stats
      const statsResult = await verificationApi.getStats()
      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data)
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    setSuccess(null)

    const result = await userApi.updateProfile(formData)

    if (!result.success) {
      setError(result.error || 'Failed to update profile')
      setIsSaving(false)
      return
    }

    setProfile(result.data)
    setSuccess('Profile updated successfully!')
    setIsEditing(false)
    setIsSaving(false)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError("")
    setPasswordSuccess("")

    if (newPassword !== confirmNewPassword) {
      setPasswordError("Passwords do not match")
      return
    }
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters")
      return
    }

    setIsChangingPassword(true)
    const result = await userApi.changePassword(currentPassword, newPassword)
    if (result.success) {
      setPasswordSuccess("Password changed successfully")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmNewPassword("")
      setTimeout(() => {
        setShowPasswordDialog(false)
        setPasswordSuccess("")
      }, 1500)
    } else {
      setPasswordError(result.error || "Failed to change password")
    }
    setIsChangingPassword(false)
  }

  const handleDownloadData = async () => {
    setIsDownloading(true)
    const result = await userApi.downloadData()
    if (result.success && result.data) {
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `account-data-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } else {
      setError(result.error || "Failed to download data")
    }
    setIsDownloading(false)
  }

  const handleLogout = () => {
    authApi.logout()
  }

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || 'U'
  }

  const getDaysActive = (createdAt: string) => {
    const created = new Date(createdAt)
    const now = new Date()
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/dashboard')}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center space-x-4">
              <Shield className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              {error}
            </div>
          )}
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              {success}
            </div>
          )}

          {/* Profile Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Manage your account details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src="/placeholder-user.jpg" alt="Profile" />
                  <AvatarFallback className="text-2xl">
                    {getInitials(profile?.firstName, profile?.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {profile?.firstName} {profile?.lastName}
                  </h3>
                  <p className="text-gray-600">{profile?.email}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <Badge className="bg-green-100 text-green-800">
                      <Award className="h-3 w-3 mr-1" />
                      Trust Score: {profile?.trustScore || 100}%
                    </Badge>
                    <Badge variant="outline">
                      <Calendar className="h-3 w-3 mr-1" />
                      Member since {profile?.createdAt ? new Date(profile.createdAt).getFullYear() : new Date().getFullYear()}
                    </Badge>
                  </div>
                </div>
                <Button 
                  variant={isEditing ? "default" : "outline"}
                  onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : isEditing ? 'Save Changes' : 'Edit Profile'}
                </Button>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile?.email || ''}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="flex justify-end gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsEditing(false)
                      setFormData({
                        firstName: profile?.firstName || '',
                        lastName: profile?.lastName || '',
                        phone: profile?.phone || '',
                        address: profile?.address || ''
                      })
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Account Statistics</CardTitle>
              <CardDescription>
                Your verification activity and trust metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{stats.totalVerifications}</div>
                  <p className="text-sm text-gray-600 mt-1">Total Verifications</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{stats.authenticCount}</div>
                  <p className="text-sm text-gray-600 mt-1">Authentic Products</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{profile?.trustScore || 100}%</div>
                  <p className="text-sm text-gray-600 mt-1">Trust Score</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">
                    {profile?.createdAt ? getDaysActive(profile.createdAt) : 0}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Days Active</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Notification Preferences</span>
              </CardTitle>
              <CardDescription>
                Choose how you want to receive updates and alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-gray-600">Receive verification results and updates via email</p>
                </div>
                <Switch
                  checked={notifications.email}
                  onCheckedChange={(checked) => setNotifications({...notifications, email: checked})}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">SMS Notifications</p>
                  <p className="text-sm text-gray-600">Get instant alerts via text message</p>
                </div>
                <Switch
                  checked={notifications.sms}
                  onCheckedChange={(checked) => setNotifications({...notifications, sms: checked})}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-gray-600">Browser notifications for important updates</p>
                </div>
                <Switch
                  checked={notifications.push}
                  onCheckedChange={(checked) => setNotifications({...notifications, push: checked})}
                />
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lock className="h-5 w-5" />
                <span>Security Settings</span>
              </CardTitle>
              <CardDescription>
                Manage your account security and privacy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Dialog open={showPasswordDialog} onOpenChange={(open) => {
                setShowPasswordDialog(open)
                if (!open) {
                  setPasswordError("")
                  setPasswordSuccess("")
                  setCurrentPassword("")
                  setNewPassword("")
                  setConfirmNewPassword("")
                }
              }}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Lock className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                    <DialogDescription>Enter your current password and choose a new one</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleChangePassword} className="flex flex-col gap-4 mt-4">
                    {passwordError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700 text-sm">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        {passwordError}
                      </div>
                    )}
                    {passwordSuccess && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-md flex items-center gap-2 text-green-700 text-sm">
                        <CheckCircle className="h-4 w-4 shrink-0" />
                        {passwordSuccess}
                      </div>
                    )}
                    <div className="flex flex-col gap-2">
                      <Label>Current Password</Label>
                      <div className="relative">
                        <Input
                          type={showCurrentPw ? "text" : "password"}
                          value={currentPassword}
                          onChange={e => setCurrentPassword(e.target.value)}
                          required
                        />
                        <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>New Password</Label>
                      <div className="relative">
                        <Input
                          type={showNewPw ? "text" : "password"}
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          minLength={8}
                          required
                        />
                        <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Confirm New Password</Label>
                      <Input
                        type="password"
                        value={confirmNewPassword}
                        onChange={e => setConfirmNewPassword(e.target.value)}
                        minLength={8}
                        required
                      />
                    </div>
                    <Button type="submit" disabled={isChangingPassword}>
                      {isChangingPassword ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Changing...
                        </>
                      ) : "Change Password"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
              <Button variant="outline" className="w-full justify-start bg-transparent" onClick={handleDownloadData} disabled={isDownloading}>
                {isDownloading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download Account Data
                  </>
                )}
              </Button>
              <Separator />
              <Button variant="destructive" className="w-full" onClick={handleLogout}>
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
