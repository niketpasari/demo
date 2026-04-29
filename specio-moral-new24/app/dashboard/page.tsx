"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Shield, Search, Package, CheckCircle, AlertTriangle, User, LogOut, History, Loader2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { authApi, verificationApi, getUser } from "@/lib/api/client"
import { useRouter } from "next/navigation"

interface VerificationItem {
  id: string
  productName: string
  brandName: string
  verifiedAt: string
  result: string
  productImageUrl?: string
}

interface Stats {
  totalVerifications: number
  authenticCount: number
  suspiciousCount: number
  failedCount: number
}

export default function Dashboard() {
  const [searchCode, setSearchCode] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [recentVerifications, setRecentVerifications] = useState<VerificationItem[]>([])
  const [stats, setStats] = useState<Stats>({ totalVerifications: 0, authenticCount: 0, suspiciousCount: 0, failedCount: 0 })
  const [user, setUser] = useState<any>(null)
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

    // Load user from localStorage
    const storedUser = getUser()
    setUser(storedUser)

    // Fetch dashboard data
    fetchDashboardData()
  }, [isMounted, router])

  const fetchDashboardData = async () => {
    try {
      // Fetch stats
      const statsResult = await verificationApi.getStats()
      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data)
      }

      // Fetch recent verifications
      const historyResult = await verificationApi.getHistory(0, 5)
      if (historyResult.success && historyResult.data) {
        setRecentVerifications(historyResult.data.content || historyResult.data)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!searchCode.trim()) return
    
    setIsVerifying(true)
    
    // Get user's location if available
    let location = undefined
    try {
      if (navigator.geolocation) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        })
        location = `${position.coords.latitude}, ${position.coords.longitude}`
      }
    } catch (e) {
      // Location not available, proceed without it
    }

    // Navigate to verify page with code
    router.push(`/verify?code=${encodeURIComponent(searchCode.trim())}${location ? `&location=${encodeURIComponent(location)}` : ''}`)
  }

  const handleLogout = () => {
    authApi.logout()
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins} minutes ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    return `${diffDays} days ago`
  }

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || 'U'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Shield className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">AuthentiGuard</h1>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder-user.jpg" alt="User" />
                    <AvatarFallback>{getInitials(user?.firstName, user?.lastName)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/history')}>
                  <History className="mr-2 h-4 w-4" />
                  <span>Verification History</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.firstName || 'User'}!
            </h2>
            <p className="text-gray-600 mt-2">Verify your products and protect yourself from counterfeits</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Verifications</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalVerifications}</div>
                <p className="text-xs text-muted-foreground">All time verifications</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Authentic Products</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.authenticCount}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalVerifications > 0 
                    ? `${((stats.authenticCount / stats.totalVerifications) * 100).toFixed(1)}% success rate`
                    : 'No verifications yet'
                  }
                </p>
              </CardContent>
            </Card>
            
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suspicious Items</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.suspiciousCount}</div>
              <p className="text-xs text-muted-foreground">Flagged for review</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed Lookups</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.failedCount}</div>
              <p className="text-xs text-muted-foreground">Invalid codes reported</p>
            </CardContent>
          </Card>
          </div>

          {/* Verification Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="h-5 w-5" />
                <span>Verify New Product</span>
              </CardTitle>
              <CardDescription>
                Scratch the label on your product and enter the unique code below
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-4">
                <Input
                  placeholder="Enter verification code (e.g., NIKE-2024-XXXX-YYYY-ZZZZ)"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                  className="flex-1"
                />
                <Button onClick={handleVerify} disabled={!searchCode.trim() || isVerifying}>
                  {isVerifying ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  Verify Product
                </Button>
              </div>
              <div className="text-sm text-gray-500">
                <p><strong>Tip:</strong> The verification code is hidden under the scratch label on your product packaging.</p>
              </div>
            </CardContent>
          </Card>

          {/* Recent Verifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <History className="h-5 w-5" />
                  <span>Recent Verifications</span>
                </span>
                <Button variant="outline" size="sm" onClick={() => router.push('/history')}>
                  View All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentVerifications.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No verifications yet</h3>
                  <p className="text-gray-500">Start by verifying your first product above</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentVerifications.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <img
                        src={item.productImageUrl || "/placeholder.svg"}
                        alt={item.productName}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.productName}</h4>
                        <p className="text-sm text-gray-500">{item.brandName} - {formatTimeAgo(item.verifiedAt)}</p>
                      </div>
                      <Badge 
                        variant={item.result === 'AUTHENTIC' ? 'default' : 'destructive'}
                        className={item.result === 'AUTHENTIC' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                      >
                        {item.result === 'AUTHENTIC' ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Authentic
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Suspicious
                          </>
                        )}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export function Loading() {
  return null
}
