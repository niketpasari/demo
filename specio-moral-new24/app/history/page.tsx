"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Shield, Search, Filter, CheckCircle, AlertTriangle, ArrowLeft, Calendar, Package, Eye, Loader2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { authApi, verificationApi } from "@/lib/api/client"
import { useRouter } from "next/navigation"

interface VerificationItem {
  id: string
  scratchCode: string
  productName: string
  brandName: string
  verifiedAt: string
  result: string
  productImageUrl?: string
  category?: string
}

interface Stats {
  totalVerifications: number
  authenticCount: number
  suspiciousCount: number
}

export default function VerificationHistory() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const [verifications, setVerifications] = useState<VerificationItem[]>([])
  const [stats, setStats] = useState<Stats>({ totalVerifications: 0, authenticCount: 0, suspiciousCount: 0 })
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
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

    fetchData()
  }, [isMounted, router])

  const fetchData = async () => {
    setIsLoading(true)

    try {
      // Fetch stats
      const statsResult = await verificationApi.getStats()
      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data)
      }

      // Fetch verifications
      const historyResult = await verificationApi.getHistory(0, 20)
      if (historyResult.success && historyResult.data) {
        const data = historyResult.data.content || historyResult.data
        setVerifications(data)
        setHasMore(historyResult.data.totalPages > 1)
      }
    } catch (error) {
      console.error('Failed to fetch history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadMore = async () => {
    const nextPage = page + 1
    const historyResult = await verificationApi.getHistory(nextPage, 20)
    
    if (historyResult.success && historyResult.data) {
      const newData = historyResult.data.content || historyResult.data
      setVerifications([...verifications, ...newData])
      setPage(nextPage)
      setHasMore(historyResult.data.totalPages > nextPage + 1)
    }
  }

  const filteredVerifications = verifications.filter(item => {
    const matchesSearch = 
      item.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brandName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.scratchCode?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const isAuthentic = item.result === "AUTHENTIC"
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "authentic" && isAuthentic) ||
      (statusFilter === "suspicious" && !isAuthentic)
    
    return matchesSearch && matchesStatus
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading verification history...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Verification History</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Filter & Search</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search by product name, brand, or code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="authentic">Authentic</SelectItem>
                    <SelectItem value="suspicious">Suspicious</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Verifications</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalVerifications}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Authentic Products</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.authenticCount}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Suspicious Items</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.suspiciousCount}</div>
              </CardContent>
            </Card>
          </div>

          {/* Verification List */}
          <Card>
            <CardHeader>
              <CardTitle>Your Verifications</CardTitle>
              <CardDescription>
                Complete history of all your product verifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredVerifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No verifications found</h3>
                    <p className="text-gray-500">
                      {verifications.length === 0 
                        ? 'Start by verifying your first product'
                        : 'Try adjusting your search or filter criteria'
                      }
                    </p>
                    {verifications.length === 0 && (
                      <Button className="mt-4" onClick={() => router.push('/dashboard')}>
                        Verify a Product
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    {filteredVerifications.map((item) => {
                      const isAuthentic = item.result === 'AUTHENTIC'
                      return (
                      <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <img
                          src={item.productImageUrl || "/placeholder.svg"}
                          alt={item.productName}
                          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900 truncate">{item.productName}</h4>
                              <p className="text-sm text-gray-500">{item.brandName}</p>
                              <p className="text-xs text-gray-400 font-mono mt-1">{item.scratchCode}</p>
                            </div>
                            <Badge 
                              variant={isAuthentic ? 'default' : 'destructive'}
                              className={isAuthentic ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                            >
                              {isAuthentic ? (
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
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center text-xs text-gray-500">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDate(item.verifiedAt)}
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => router.push(`/verify?code=${item.scratchCode}`)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    )})}
                    
                    {hasMore && (
                      <div className="text-center pt-4">
                        <Button variant="outline" onClick={loadMore}>
                          Load More
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
