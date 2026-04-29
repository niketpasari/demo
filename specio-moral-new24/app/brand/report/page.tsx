"use client"

import React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Shield, 
  Building2, 
  LogOut, 
  QrCode,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowLeft,
  Gift,
  ChevronDown,
  History,
  FileText,
  MapPin,
  XCircle,
  Download,
  CreditCard
} from "lucide-react"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { brandApi, getUser, authApi } from "@/lib/api/client"

interface VerificationItem {
  id: string
  code: string
  productId: string
  productName: string
  batchId: string
  status: string
  result: string
  hasSpecialOffer: boolean
  specialOfferDescription?: string
  verifiedAt: string
  verifiedByEmail: string
  location?: string
  city?: string
  state?: string
  country?: string
}

interface FailedVerificationItem {
  id: string
  attemptedCode: string
  userEmail: string
  createdAt: string
  location?: string
  city?: string
  state?: string
  country?: string
  failureReason?: string
}

interface ReportData {
  totalCodes: number
  verifiedCodes: number
  unusedCodes: number
  suspiciousCodes: number
  failedVerifications: number
  verifications: VerificationItem[]
  failedItems: FailedVerificationItem[]
}

export default function ReportPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [brandId, setBrandId] = useState<string>("")
  const [brandName, setBrandName] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  // Filter states
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [locationFilter, setLocationFilter] = useState<string>("all")
  const [cityFilter, setCityFilter] = useState<string>("all")
  const [stateFilter, setStateFilter] = useState<string>("all")
  const [countryFilter, setCountryFilter] = useState<string>("all")

  // Data state
  const [rawReportData, setRawReportData] = useState<ReportData | null>(null)
  const [isLoadingReport, setIsLoadingReport] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("verifications")

  // Unique values for dropdown options (derived from full unfiltered data)
  const [uniqueLocations, setUniqueLocations] = useState<string[]>([])
  const [uniqueCities, setUniqueCities] = useState<string[]>([])
  const [uniqueStates, setUniqueStates] = useState<string[]>([])
  const [uniqueCountries, setUniqueCountries] = useState<string[]>([])

  // Client-side filtered data
  const reportData = useMemo(() => {
    if (!rawReportData) return null

    const matchesLocationFilters = (item: { location?: string; city?: string; state?: string; country?: string }) => {
      if (locationFilter !== "all" && item.location !== locationFilter) return false
      if (cityFilter !== "all" && item.city !== cityFilter) return false
      if (stateFilter !== "all" && item.state !== stateFilter) return false
      if (countryFilter !== "all" && item.country !== countryFilter) return false
      return true
    }

    return {
      ...rawReportData,
      verifications: rawReportData.verifications?.filter(matchesLocationFilters) || [],
      failedItems: rawReportData.failedItems?.filter(matchesLocationFilters) || [],
    }
  }, [rawReportData, locationFilter, cityFilter, stateFilter, countryFilter])

  const loadReport = useCallback(async () => {
    if (!brandId) return

    setIsLoadingReport(true)
    setError(null)
    try {
      const filters: { status?: string } = {}
      if (selectedStatus !== "all") {
        filters.status = selectedStatus
      }

      const result = await brandApi.getVerificationReport(brandId, filters)
      if (result.success && result.data) {
        setRawReportData(result.data)
        
        // Extract unique values for dropdown options from full data
        const locations = new Set<string>()
        const cities = new Set<string>()
        const states = new Set<string>()
        const countries = new Set<string>()
        result.data.verifications?.forEach((v: VerificationItem) => {
          if (v.location) locations.add(v.location)
          if (v.city) cities.add(v.city)
          if (v.state) states.add(v.state)
          if (v.country) countries.add(v.country)
        })
        result.data.failedItems?.forEach((f: FailedVerificationItem) => {
          if (f.location) locations.add(f.location)
          if (f.city) cities.add(f.city)
          if (f.state) states.add(f.state)
          if (f.country) countries.add(f.country)
        })
        setUniqueLocations(Array.from(locations).sort())
        setUniqueCities(Array.from(cities).sort())
        setUniqueStates(Array.from(states).sort())
        setUniqueCountries(Array.from(countries).sort())
      } else {
        setError(result.error || "Failed to load report")
      }
    } catch (err) {
      setError("Failed to load report. Please try again.")
    }
    setIsLoadingReport(false)
  }, [brandId, selectedStatus])

  useEffect(() => {
    if (!authApi.isAuthenticated()) {
      router.push("/")
      return
    }

    const currentUser = getUser()
    if (!currentUser?.brand?.id) {
      router.push("/")
      return
    }

    setBrandId(currentUser.brand.id)
    setBrandName(currentUser.brand.name || "Your Brand")
    setIsLoading(false)
  }, [router])

  useEffect(() => {
    if (brandId) {
      loadReport()
    }
  }, [brandId, loadReport])

  const handleLogout = () => {
    authApi.logout()
    router.push("/")
  }

  const downloadVerificationsCSV = () => {
    if (reportData?.verifications && reportData.verifications.length > 0) {
      const header = "Code,Product,Batch,Status,Result,Special Offer,Verified At,Verified By,Pincode,City,State,Country\n"
      const content = reportData.verifications.map(v => 
        `${v.code},${v.productName},${v.batchId},${v.status},${v.result},${v.hasSpecialOffer ? v.specialOfferDescription || 'HAS_OFFER' : 'NO_OFFER'},${v.verifiedAt || ''},${v.verifiedByEmail || ''},${v.location || ''},${v.city || ''},${v.state || ''},${v.country || ''}`
      ).join("\n")
      const blob = new Blob([header + content], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `verifications-report-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const downloadFailedCSV = () => {
    if (reportData?.failedItems && reportData.failedItems.length > 0) {
      const header = "Attempted Code,User Email,Timestamp,Pincode,City,State,Country,Failure Reason\n"
      const content = reportData.failedItems.map(f => 
        `${f.attemptedCode},${f.userEmail},${f.createdAt || ''},${f.location || ''},${f.city || ''},${f.state || ''},${f.country || ''},${f.failureReason || 'Invalid code'}`
      ).join("\n")
      const blob = new Blob([header + content], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `failed-verifications-report-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Verified</Badge>
      case "SUSPICIOUS":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Suspicious</Badge>
      case "UNUSED":
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Unused</Badge>
      case "INVALID":
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Invalid</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getResultBadge = (result: string) => {
    switch (result) {
      case "AUTHENTIC":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Authentic</Badge>
      case "SUSPICIOUS":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Suspicious</Badge>
      case "COUNTERFEIT":
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Counterfeit</Badge>
      default:
        return <Badge variant="outline">{result}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">AuthentiGuard</h1>
              <p className="text-sm text-gray-500">Brand Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-gray-500" />
                  <span className="font-medium text-gray-900">{brandName}</span>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => router.push("/brand/dashboard")}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/brand/verification-history")}>
                  <History className="h-4 w-4 mr-2" />
                  Verification History
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/brand/report")}>
                  <FileText className="h-4 w-4 mr-2" />
                  Report
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/brand/billing")}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Billing
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" onClick={handleLogout} className="bg-transparent">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => router.push("/brand/dashboard")} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Verification Report</h2>
            <p className="text-gray-500">Summary of verifications, suspicious activities, and failed attempts</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700 text-xl leading-none">&times;</button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Codes</p>
                  <p className="text-3xl font-bold text-gray-900">{(reportData?.totalCodes || 0).toLocaleString()}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <QrCode className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Verified</p>
                  <p className="text-3xl font-bold text-green-600">{(reportData?.verifiedCodes || 0).toLocaleString()}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Unused</p>
                  <p className="text-3xl font-bold text-gray-600">{(reportData?.unusedCodes || 0).toLocaleString()}</p>
                </div>
                <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Suspicious</p>
                  <p className="text-3xl font-bold text-red-600">{(reportData?.suspiciousCodes || 0).toLocaleString()}</p>
                </div>
                <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Failed</p>
                  <p className="text-3xl font-bold text-orange-600">{(reportData?.failedVerifications || 0).toLocaleString()}</p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <Label>Status</Label>
                <Select value={selectedStatus} onValueChange={(val) => { setSelectedStatus(val) }}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="AUTHENTIC">Authentic</SelectItem>
                    <SelectItem value="SUSPICIOUS">Suspicious</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Pincode</Label>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Pincodes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Pincodes</SelectItem>
                    {uniqueLocations.map((loc) => (
                      <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>City</Label>
                <Select value={cityFilter} onValueChange={setCityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Cities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {uniqueCities.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>State</Label>
                <Select value={stateFilter} onValueChange={setStateFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All States" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    {uniqueStates.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Country</Label>
                <Select value={countryFilter} onValueChange={setCountryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Countries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Countries</SelectItem>
                    {uniqueCountries.map((co) => (
                      <SelectItem key={co} value={co}>{co}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={loadReport} disabled={isLoadingReport}>
                  {isLoadingReport ? "Loading..." : "Reload Data"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border mb-4">
            <TabsTrigger value="verifications" className="data-[state=active]:bg-blue-50">
              <CheckCircle className="h-4 w-4 mr-2" />
              Verifications ({reportData?.verifications?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="failed" className="data-[state=active]:bg-blue-50">
              <XCircle className="h-4 w-4 mr-2" />
              Failed Attempts ({reportData?.failedItems?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="verifications">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Verified & Suspicious Codes</CardTitle>
                    <CardDescription>Codes that have been verified with their verification details</CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={downloadVerificationsCSV} 
                    disabled={!reportData?.verifications || reportData.verifications.length === 0}
                    className="bg-transparent"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left py-3 px-3">Code</th>
                        <th className="text-left py-3 px-3">Product</th>
                        <th className="text-left py-3 px-3">Batch</th>
                        <th className="text-left py-3 px-3">Status</th>
                        <th className="text-left py-3 px-3">Result</th>
                        <th className="text-left py-3 px-3">Special Offer</th>
                        <th className="text-left py-3 px-3">Timestamp</th>
                        <th className="text-left py-3 px-3">Verified By</th>
                        <th className="text-left py-3 px-3">Pincode</th>
                        <th className="text-left py-3 px-3">City</th>
                        <th className="text-left py-3 px-3">State</th>
                        <th className="text-left py-3 px-3">Country</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!reportData?.verifications || reportData.verifications.length === 0 ? (
                        <tr>
                          <td colSpan={12} className="py-8 text-center text-gray-500">
                            {isLoadingReport ? "Loading verifications..." : "No verifications found"}
                          </td>
                        </tr>
                      ) : (
                        reportData.verifications.map((v) => (
                          <tr key={v.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-3 font-mono text-xs">{v.code}</td>
                            <td className="py-3 px-3">{v.productName}</td>
                            <td className="py-3 px-3 text-xs">{v.batchId}</td>
                            <td className="py-3 px-3">{getStatusBadge(v.status)}</td>
                            <td className="py-3 px-3">{getResultBadge(v.result)}</td>
                            <td className="py-3 px-3">
                              {v.hasSpecialOffer ? (
                                <span className="flex items-center gap-1 text-green-600 text-xs">
                                  <Gift className="h-3 w-3" />
                                  {v.specialOfferDescription || "Yes"}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-xs">{formatDate(v.verifiedAt)}</td>
                            <td className="py-3 px-3 text-xs">{v.verifiedByEmail}</td>
                            <td className="py-3 px-3">
                              {v.location ? (
                                <span className="flex items-center gap-1 text-xs">
                                  <MapPin className="h-3 w-3 text-gray-400" />
                                  {v.location}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-xs">{v.city || "-"}</td>
                            <td className="py-3 px-3 text-xs">{v.state || "-"}</td>
                            <td className="py-3 px-3 text-xs">{v.country || "-"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="failed">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Failed Verification Attempts</CardTitle>
                    <CardDescription>Invalid codes that customers tried to verify</CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={downloadFailedCSV} 
                    disabled={!reportData?.failedItems || reportData.failedItems.length === 0}
                    className="bg-transparent"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left py-3 px-3">Attempted Code</th>
                        <th className="text-left py-3 px-3">User Email</th>
                        <th className="text-left py-3 px-3">Timestamp</th>
                        <th className="text-left py-3 px-3">Pincode</th>
                        <th className="text-left py-3 px-3">City</th>
                        <th className="text-left py-3 px-3">State</th>
                        <th className="text-left py-3 px-3">Country</th>
                        <th className="text-left py-3 px-3">Failure Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!reportData?.failedItems || reportData.failedItems.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-gray-500">
                            {isLoadingReport ? "Loading failed attempts..." : "No failed attempts found"}
                          </td>
                        </tr>
                      ) : (
                        reportData.failedItems.map((f) => (
                          <tr key={f.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-3 font-mono text-xs">{f.attemptedCode}</td>
                            <td className="py-3 px-3 text-xs">{f.userEmail}</td>
                            <td className="py-3 px-3 text-xs">{formatDate(f.createdAt)}</td>
                            <td className="py-3 px-3">
                              {f.location ? (
                                <span className="flex items-center gap-1 text-xs">
                                  <MapPin className="h-3 w-3 text-gray-400" />
                                  {f.location}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-xs">{f.city || "-"}</td>
                            <td className="py-3 px-3 text-xs">{f.state || "-"}</td>
                            <td className="py-3 px-3 text-xs">{f.country || "-"}</td>
                            <td className="py-3 px-3 text-xs text-red-600">{f.failureReason || "Invalid code"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
