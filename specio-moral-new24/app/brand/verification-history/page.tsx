"use client"

import React from "react"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
  CheckCircle,
  AlertCircle,
  Clock,
  Search,
  ArrowLeft,
  Gift,
  ChevronDown,
  History,
  FileText,
  Download
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { brandApi, getUser, authApi } from "@/lib/api/client"

interface CodeItem {
  id: string
  code: string
  productId: string
  productName: string
  batchId: string
  status: string
  hasSpecialOffer: boolean
  specialOfferDescription?: string
  specialOfferDiscountPercent?: number
  createdAt: string
  verifiedAt?: string
  verificationLocation?: string
  verifiedByEmail?: string
}

interface CodeDetails {
  id: string
  code: string
  productId: string
  productName: string
  batchId: string
  status: string
  hasSpecialOffer: boolean
  specialOfferDescription?: string
  specialOfferDiscountPercent?: number
  specialOfferValidUntil?: string
  createdAt: string
  firstVerifiedAt?: string
  firstVerifiedByEmail?: string
  verificationCount: number
  verificationHistory: Array<{
    id: string
    result: string
    verifiedAt: string
    verifiedByEmail: string
    location?: string
    city?: string
    state?: string
    country?: string
    ipAddress?: string
  }>
}

interface Product {
  id: string
  name: string
}

export default function VerificationHistoryPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [brandId, setBrandId] = useState<string>("")
  const [brandName, setBrandName] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  // Filter states
  const [selectedProduct, setSelectedProduct] = useState<string>("all")
  const [selectedBatch, setSelectedBatch] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [selectedSpecialOffer, setSelectedSpecialOffer] = useState<string>("all")
  const [searchCode, setSearchCode] = useState<string>("")

  // Data states
  const [products, setProducts] = useState<Product[]>([])
  const [batches, setBatches] = useState<string[]>([])
  const [codes, setCodes] = useState<CodeItem[]>([])
  const [isLoadingCodes, setIsLoadingCodes] = useState(false)
  const [filteredCodes, setFilteredCodes] = useState<CodeItem[]>([])

  // Code details modal state
  const [codeDetails, setCodeDetails] = useState<CodeDetails | null>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  const loadProducts = useCallback(async () => {
    if (!brandId) return
    try {
      const result = await brandApi.getProducts(brandId)
      if (result.success && result.data) {
        setProducts(result.data)
      }
    } catch (err) {
      console.log("[v0] Load products error:", err)
    }
  }, [brandId])

  const loadCodes = useCallback(async () => {
    if (!brandId) return

    setIsLoadingCodes(true)
    setError(null)
    try {
      const filters: { productId?: string; batchId?: string; status?: string } = {}
      
      if (selectedProduct !== "all") {
        filters.productId = selectedProduct
      }
      if (selectedBatch !== "all" && selectedProduct !== "all") {
        filters.batchId = selectedBatch
      }
      if (selectedStatus !== "all") {
        filters.status = selectedStatus
      }

      const result = await brandApi.getCodes(brandId, {
        ...filters,
        size: 500,
      })

      if (result.success && result.data) {
        let filteredCodes = result.data.codes || []
        
        // Filter by special offer
        if (selectedSpecialOffer === "yes") {
          filteredCodes = filteredCodes.filter((c: CodeItem) => c.hasSpecialOffer)
        } else if (selectedSpecialOffer === "no") {
          filteredCodes = filteredCodes.filter((c: CodeItem) => !c.hasSpecialOffer)
        }

        setCodes(filteredCodes)
        setFilteredCodes(filteredCodes)

        // Extract unique batches
        const uniqueBatches = [...new Set(filteredCodes.map((c: CodeItem) => c.batchId).filter(Boolean))]
        setBatches(uniqueBatches)
      } else {
        setError(result.error || "Failed to load codes")
      }
    } catch (err) {
      console.log("[v0] Load codes error:", err)
      setError("Failed to load codes. Please try again.")
    }
    setIsLoadingCodes(false)
  }, [brandId, selectedProduct, selectedBatch, selectedStatus, selectedSpecialOffer])

  const searchCodeDetails = useCallback(async () => {
    if (!brandId || !searchCode.trim()) return

    setIsLoadingDetails(true)
    setError(null)
    try {
      const result = await brandApi.getCodeDetails(brandId, searchCode.trim())
      if (result.success && result.data) {
        setCodeDetails(result.data)
        setShowDetails(true)
      } else {
        setError(result.error || "Code not found")
      }
    } catch (err) {
      console.log("[v0] Search code error:", err)
      setError("Failed to search code. Please try again.")
    }
    setIsLoadingDetails(false)
  }, [brandId, searchCode])

  const handleViewCodeDetails = async (code: string) => {
    setSearchCode(code)
    setIsLoadingDetails(true)
    setError(null)
    try {
      const result = await brandApi.getCodeDetails(brandId, code)
      if (result.success && result.data) {
        setCodeDetails(result.data)
        setShowDetails(true)
      } else {
        setError(result.error || "Failed to load code details")
      }
    } catch (err) {
      console.log("[v0] View code details error:", err)
      setError("Failed to load code details")
    }
    setIsLoadingDetails(false)
  }

  const downloadCSV = () => {
    if (filteredCodes.length > 0) {
      const header = "Code,Product,Batch,Status,Special Offer,Created At,Verified At,Verification Location\n"
      const content = filteredCodes.map(c => 
        `${c.code},${c.productName},${c.batchId},${c.status},${c.hasSpecialOffer ? c.specialOfferDescription || 'HAS_OFFER' : 'NO_OFFER'},${c.createdAt || ''},${c.verifiedAt || ''},${c.verificationLocation || ''}`
      ).join("\n")
      const blob = new Blob([header + content], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `verification-history-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

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
      loadProducts()
      loadCodes()
    }
  }, [brandId, loadProducts, loadCodes])

  // Reset batch selection when product changes to "all"
  useEffect(() => {
    if (selectedProduct === "all") {
      setSelectedBatch("all")
    }
  }, [selectedProduct])

  const handleLogout = () => {
    authApi.logout()
    router.push("/")
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
                  <Clock className="h-4 w-4 mr-2" />
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push("/brand/dashboard")} className="p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Verification History</h2>
              <p className="text-gray-500">View and search all scratch codes and their verification status</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={downloadCSV} disabled={filteredCodes.length === 0} className="bg-transparent">
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700 text-xl leading-none">&times;</button>
          </div>
        )}

        {/* Search Code Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search by Code
            </CardTitle>
            <CardDescription>Enter a specific code to view all its details and verification history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Enter code (e.g., XXXX-XXXX-XXXX-XXXX)"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => e.key === "Enter" && searchCodeDetails()}
              />
              <Button onClick={searchCodeDetails} disabled={isLoadingDetails || !searchCode.trim()}>
                {isLoadingDetails ? "Searching..." : "Search"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Code Details Modal */}
        {showDetails && codeDetails && (
          <Card className="mb-6 border-2 border-blue-200 bg-blue-50/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Code Details: {codeDetails.code}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowDetails(false)}>
                  &times;
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Product</p>
                  <p className="font-medium">{codeDetails.productName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Batch</p>
                  <p className="font-medium">{codeDetails.batchId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  {getStatusBadge(codeDetails.status)}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="font-medium">{formatDate(codeDetails.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Verification Count</p>
                  <p className="font-medium">{codeDetails.verificationCount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Special Offer</p>
                  <p className="font-medium">
                    {codeDetails.hasSpecialOffer ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <Gift className="h-4 w-4" />
                        {codeDetails.specialOfferDescription || "Yes"}
                      </span>
                    ) : (
                      "No"
                    )}
                  </p>
                </div>
              </div>

              {/* Verification History */}
              {codeDetails.verificationHistory && codeDetails.verificationHistory.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Verification History</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="text-left py-2 px-3">Result</th>
                          <th className="text-left py-2 px-3">Verified At</th>
                          <th className="text-left py-2 px-3">Verified By</th>
                          <th className="text-left py-2 px-3">Pincode</th>
                          <th className="text-left py-2 px-3">City</th>
                          <th className="text-left py-2 px-3">State</th>
                          <th className="text-left py-2 px-3">Country</th>
                        </tr>
                      </thead>
                      <tbody>
                        {codeDetails.verificationHistory.map((v) => (
                          <tr key={v.id} className="border-b">
                            <td className="py-2 px-3">
                              <Badge className={
                                v.result === "AUTHENTIC" 
                                  ? "bg-green-100 text-green-800 border-green-200" 
                                  : "bg-red-100 text-red-800 border-red-200"
                              }>
                                {v.result}
                              </Badge>
                            </td>
                            <td className="py-2 px-3">{formatDate(v.verifiedAt)}</td>
                            <td className="py-2 px-3">{v.verifiedByEmail}</td>
                            <td className="py-2 px-3">{v.location || "-"}</td>
                            <td className="py-2 px-3">{v.city || "-"}</td>
                            <td className="py-2 px-3">{v.state || "-"}</td>
                            <td className="py-2 px-3">{v.country || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Product</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Products" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Batch</Label>
                <Select 
                  value={selectedBatch} 
                  onValueChange={setSelectedBatch}
                  disabled={selectedProduct === "all"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedProduct === "all" ? "Select product first" : "All Batches"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Batches</SelectItem>
                    {batches.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="UNUSED">Unused</SelectItem>
                    <SelectItem value="VERIFIED">Verified</SelectItem>
                    <SelectItem value="SUSPICIOUS">Suspicious</SelectItem>
                    <SelectItem value="INVALID">Invalid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Special Offer</Label>
                <Select value={selectedSpecialOffer} onValueChange={setSelectedSpecialOffer}>
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="yes">With Offer</SelectItem>
                    <SelectItem value="no">Without Offer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Codes Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Scratch Codes ({codes.length})</span>
              {isLoadingCodes && (
                <span className="text-sm font-normal text-gray-500">Loading...</span>
              )}
            </CardTitle>
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
                    <th className="text-left py-3 px-3">Special Offer</th>
                    <th className="text-left py-3 px-3">Created</th>
                    <th className="text-left py-3 px-3">Verified At</th>
                    <th className="text-left py-3 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {codes.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-gray-500">
                        {isLoadingCodes ? "Loading codes..." : "No codes found matching the filters"}
                      </td>
                    </tr>
                  ) : (
                    codes.map((code) => (
                      <tr key={code.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-3 font-mono text-xs">{code.code}</td>
                        <td className="py-3 px-3">{code.productName}</td>
                        <td className="py-3 px-3 text-xs">{code.batchId}</td>
                        <td className="py-3 px-3">{getStatusBadge(code.status)}</td>
                        <td className="py-3 px-3">
                          {code.hasSpecialOffer ? (
                            <span className="flex items-center gap-1 text-green-600 text-xs">
                              <Gift className="h-3 w-3" />
                              {code.specialOfferDiscountPercent ? `${code.specialOfferDiscountPercent}%` : "Yes"}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-xs">{formatDate(code.createdAt)}</td>
                        <td className="py-3 px-3 text-xs">{code.verifiedAt ? formatDate(code.verifiedAt) : "-"}</td>
                        <td className="py-3 px-3">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewCodeDetails(code.code)}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
