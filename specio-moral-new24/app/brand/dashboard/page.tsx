"use client"

import React from "react"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Shield, 
  Package, 
  QrCode, 
  Building2, 
  LogOut, 
  Plus,
  Download,
  Copy,
  CheckCircle,
  AlertCircle,
  Tag,
  Clock,
  Gift,
  RefreshCw,
  Search,
  Calendar,
  Eye,
  EyeOff,
  Key,
  ChevronDown,
  History,
  FileText
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { brandApi, getUser, authApi } from "@/lib/api/client"

interface DashboardData {
  brandId: string
  brandName: string
  totalCodes: number
  verifiedCodes: number
  unusedCodes: number
  suspiciousCodes: number
  failedVerifications: number
  totalProducts: number
  products: Array<{
    id: string
    name: string
    category?: string
    description?: string
    modelNumber?: string
    totalCodes: number
  }>
  recentBatches: Array<{
    batchId: string
    quantity: number
    createdAt: string
    productName: string
  }>
}

interface GeneratedCodes {
  batchId: string
  quantity: number
  productId: string
  productName: string
  codes: string[]
  hasSpecialOffer: boolean
  specialOfferDescription?: string
  generatedAt: string
}

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
}

export default function BrandDashboard() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [generatedCodes, setGeneratedCodes] = useState<GeneratedCodes | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [brandId, setBrandId] = useState<string>("")
  const [activeTab, setActiveTab] = useState<string>("products")

  // Form state for code generation
  const [quantity, setQuantity] = useState<string>("100")
  const [selectedProduct, setSelectedProduct] = useState<string>("")

  // Product registration form state
  const [registerProductName, setRegisterProductName] = useState("")
  const [registerProductCategory, setRegisterProductCategory] = useState("")
  const [registerProductDescription, setRegisterProductDescription] = useState("")
  const [registerProductModelNumber, setRegisterProductModelNumber] = useState("")
  const [isRegisteringProduct, setIsRegisteringProduct] = useState(false)

  // View & Manage Codes tab state
  const [viewCodesProduct, setViewCodesProduct] = useState<string>("all")
  const [viewCodesBatch, setViewCodesBatch] = useState<string>("all")
  const [viewCodesDate, setViewCodesDate] = useState<string>("")
  const [viewCodes, setViewCodes] = useState<CodeItem[]>([])
  const [isLoadingViewCodes, setIsLoadingViewCodes] = useState(false)
  const [viewCodesSelectedCodes, setViewCodesSelectedCodes] = useState<Set<string>>(new Set())
  const [viewCodesOfferDescription, setViewCodesOfferDescription] = useState("")
  const [viewCodesOfferDiscount, setViewCodesOfferDiscount] = useState("")
  const [isApplyingViewCodesOffer, setIsApplyingViewCodesOffer] = useState(false)
  
  // Selection mode: individual or random
  const [selectionMode, setSelectionMode] = useState<"individual" | "random">("individual")
  const [randomCount, setRandomCount] = useState<string>("10")

  // Available batches for filtering
  const [availableBatches, setAvailableBatches] = useState<string[]>([])

  const loadDashboard = useCallback(async () => {
    if (!brandId) return

    setIsLoading(true)
    try {
      const result = await brandApi.getDashboard(brandId)
      
      if (result.success && result.data) {
        setDashboard(result.data)
        // Collect all batches for filtering
        const batches = result.data.recentBatches?.map((b: { batchId: string }) => b.batchId) || []
        setAvailableBatches(batches)
      } else {
        setError(result.error || "Failed to load dashboard")
      }
    } catch (err) {
      console.log("[v0] Dashboard load error:", err)
      setError("Failed to load dashboard. Please try again.")
    }
    setIsLoading(false)
  }, [brandId])

  const loadViewCodes = useCallback(async () => {
    if (!brandId) return

    setIsLoadingViewCodes(true)
    setError(null)
    try {
      const result = await brandApi.getCodes(brandId, {
        productId: viewCodesProduct !== "all" ? viewCodesProduct : undefined,
        batchId: viewCodesBatch !== "all" ? viewCodesBatch : undefined,
        size: 200,
      })
      
      if (result.success && result.data) {
        let filteredCodes = result.data.codes || []
        
        // Filter by date if specified
        if (viewCodesDate) {
          const filterDate = new Date(viewCodesDate).toDateString()
          filteredCodes = filteredCodes.filter((code: CodeItem) => {
            const codeDate = new Date(code.createdAt).toDateString()
            return codeDate === filterDate
          })
        }
        
        setViewCodes(filteredCodes)
        
        // Update available batches from loaded codes
        const batchesFromCodes = [...new Set(filteredCodes.map((c: CodeItem) => c.batchId).filter(Boolean))]
        if (batchesFromCodes.length > 0) {
          setAvailableBatches(prev => [...new Set([...prev, ...batchesFromCodes])])
        }
      } else {
        setError(result.error || "Failed to load codes")
      }
    } catch (err) {
      console.log("[v0] Load codes error:", err)
      setError("Failed to load codes. Please try again.")
    }
    setIsLoadingViewCodes(false)
  }, [brandId, viewCodesProduct, viewCodesBatch, viewCodesDate])

  useEffect(() => {
    // Check authentication first
    if (!authApi.isAuthenticated()) {
      router.push("/")
      return
    }

    const currentUser = getUser()
    if (!currentUser?.brand?.id) {
      router.push("/")
      return
    }

    // Set brandId from user
    setBrandId(currentUser.brand.id)
  }, [router])

  // Load dashboard when brandId is set
  useEffect(() => {
    if (brandId) {
      loadDashboard()
    }
  }, [brandId, loadDashboard])

  const handleRegisterProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsRegisteringProduct(true)
    setError(null)
    setSuccess(null)

    if (!registerProductName.trim()) {
      setError("Product name is required")
      setIsRegisteringProduct(false)
      return
    }

    if (!brandId) {
      setError("Brand ID not found")
      setIsRegisteringProduct(false)
      return
    }

    const productData = {
      name: registerProductName,
      category: registerProductCategory || undefined,
      description: registerProductDescription || undefined,
      modelNumber: registerProductModelNumber || undefined,
    }

    try {
      const result = await brandApi.createProduct(brandId, productData)

      if (result.success) {
        setSuccess(`Product "${registerProductName}" registered successfully!`)
        // Reset form
        setRegisterProductName("")
        setRegisterProductCategory("")
        setRegisterProductDescription("")
        setRegisterProductModelNumber("")
        // Refresh dashboard to update product list
        await loadDashboard()
      } else {
        setError(result.error || "Failed to register product")
      }
    } catch (err) {
      console.log("[v0] Register product error:", err)
      setError("Failed to register product. Please try again.")
    }

    setIsRegisteringProduct(false)
  }

  const handleGenerateCodes = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGenerating(true)
    setError(null)
    setSuccess(null)
    setGeneratedCodes(null)

    const qty = parseInt(quantity)
    if (qty < 100 || qty % 100 !== 0) {
      setError("Quantity must be a multiple of 100")
      setIsGenerating(false)
      return
    }

    if (!selectedProduct) {
      setError("Please select a product. If no products exist, register one first in the Products tab.")
      setIsGenerating(false)
      return
    }

    if (!brandId) {
      setError("Brand ID not found")
      setIsGenerating(false)
      return
    }

    const request = {
      quantity: qty,
      productId: selectedProduct,
    }

    try {
      const result = await brandApi.generateCodes(brandId, request)

      if (result.success && result.data) {
        setGeneratedCodes(result.data)
        setSuccess(`Successfully generated ${result.data.quantity} codes!`)
        // Refresh dashboard stats
        await loadDashboard()
      } else {
        setError(result.error || "Failed to generate codes")
      }
    } catch (err) {
      console.log("[v0] Generate codes error:", err)
      setError("Failed to generate codes. Please try again.")
    }

    setIsGenerating(false)
  }

  const handleApplyViewCodesOffer = async () => {
    if (!viewCodesOfferDescription.trim()) {
      setError("Please enter a special offer description")
      return
    }

    if (selectionMode === "individual" && viewCodesSelectedCodes.size === 0) {
      setError("Please select at least one code")
      return
    }

    if (selectionMode === "random") {
      const count = parseInt(randomCount)
      if (!count || count < 1) {
        setError("Please enter a valid number of codes for random selection")
        return
      }
    }

    if (!brandId) {
      setError("Brand ID not found")
      return
    }

    setIsApplyingViewCodesOffer(true)
    setError(null)
    setSuccess(null)

    const request = {
      selectionMode,
      codeIds: selectionMode === "individual" ? Array.from(viewCodesSelectedCodes) : undefined,
      randomCount: selectionMode === "random" ? parseInt(randomCount) : undefined,
      productId: viewCodesProduct !== "all" ? viewCodesProduct : undefined,
      batchId: viewCodesBatch !== "all" ? viewCodesBatch : undefined,
      description: viewCodesOfferDescription,
      discountPercent: viewCodesOfferDiscount ? parseInt(viewCodesOfferDiscount) : undefined,
    }

    try {
      const result = await brandApi.enableSpecialOfferForCodes(brandId, request)

      if (result.success && result.data) {
        setSuccess(`Special offer applied to ${result.data.updatedCount} codes!`)
        setViewCodesSelectedCodes(new Set())
        setViewCodesOfferDescription("")
        setViewCodesOfferDiscount("")
        setRandomCount("10")
        // Refresh codes list
        await loadViewCodes()
      } else {
        setError(result.error || "Failed to apply special offer")
      }
    } catch (err) {
      console.log("[v0] Apply offer error:", err)
      setError("Failed to apply special offer. Please try again.")
    }

    setIsApplyingViewCodesOffer(false)
  }

  const toggleViewCodeSelection = (codeId: string) => {
    const newSelected = new Set(viewCodesSelectedCodes)
    if (newSelected.has(codeId)) {
      newSelected.delete(codeId)
    } else {
      newSelected.add(codeId)
    }
    setViewCodesSelectedCodes(newSelected)
  }

  const selectAllViewCodes = () => {
    const eligibleCodes = viewCodes.filter(c => c.status === "UNUSED" && !c.hasSpecialOffer)
    setViewCodesSelectedCodes(new Set(eligibleCodes.map(c => c.id)))
  }

  const deselectAllViewCodes = () => {
    setViewCodesSelectedCodes(new Set())
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const copyAllCodes = () => {
    if (generatedCodes) {
      navigator.clipboard.writeText(generatedCodes.codes.join("\n"))
      setSuccess("All codes copied to clipboard!")
    }
  }

  const downloadCodes = () => {
    if (generatedCodes) {
      const content = generatedCodes.codes.join("\n")
      const blob = new Blob([content], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `codes-${generatedCodes.batchId}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const downloadViewCodes = () => {
    if (viewCodes.length > 0) {
      const content = viewCodes.map(c => `${c.code},${c.productName},${c.batchId},${c.status},${c.hasSpecialOffer ? 'HAS_OFFER' : 'NO_OFFER'}`).join("\n")
      const header = "Code,Product,Batch,Status,Special Offer\n"
      const blob = new Blob([header + content], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `codes-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError("")
    setPasswordSuccess("")

    if (newPassword !== confirmNewPassword) {
      setPasswordError("New passwords do not match")
      return
    }
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters")
      return
    }

    const result = await brandApi.resetPassword(currentPassword, newPassword)
    if (result.success) {
      setPasswordSuccess("Password reset successfully")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmNewPassword("")
      setTimeout(() => {
        setShowPasswordDialog(false)
        setPasswordSuccess("")
      }, 1500)
    } else {
      setPasswordError(result.error || "Failed to reset password")
    }
  }

  const handleLogout = () => {
    authApi.logout()
    router.push("/")
  }

  // Get products list safely
  const products = dashboard?.products || []

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
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
                  <span className="font-medium text-gray-900">{dashboard?.brandName || "Your Brand"}</span>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => router.push("/brand/verification-history")}>
                  <History className="h-4 w-4 mr-2" />
                  Verification History
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/brand/report")}>
                  <FileText className="h-4 w-4 mr-2" />
                  Report
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/brand/billing")}>
                  <Tag className="h-4 w-4 mr-2" />
                  Billing
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="bg-transparent">
                  <Key className="h-4 w-4 mr-1" />
                  Reset Password
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reset Password</DialogTitle>
                  <DialogDescription>Enter your current password and a new password</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleResetPassword} className="flex flex-col gap-4 mt-4">
                  {passwordError && (
                    <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{passwordError}</AlertDescription></Alert>
                  )}
                  {passwordSuccess && (
                    <Alert><CheckCircle className="h-4 w-4" /><AlertDescription>{passwordSuccess}</AlertDescription></Alert>
                  )}
                  <div className="flex flex-col gap-2">
                    <Label>Current Password</Label>
                    <div className="relative">
                      <Input
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        required
                      />
                      <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>New Password</Label>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        required
                      />
                      <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Confirm New Password</Label>
                    <Input
                      type="password"
                      value={confirmNewPassword}
                      onChange={e => setConfirmNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit">Reset Password</Button>
                </form>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={handleLogout} className="bg-transparent">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Codes</p>
                  <p className="text-3xl font-bold text-gray-900">{(dashboard?.totalCodes || 0).toLocaleString()}</p>
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
                  <p className="text-3xl font-bold text-green-600">{(dashboard?.verifiedCodes || 0).toLocaleString()}</p>
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
                  <p className="text-3xl font-bold text-gray-600">{(dashboard?.unusedCodes || 0).toLocaleString()}</p>
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
                  <p className="text-3xl font-bold text-red-600">{(dashboard?.suspiciousCodes || 0).toLocaleString()}</p>
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
                  <p className="text-sm text-gray-500">Failed Reports</p>
                  <p className="text-3xl font-bold text-orange-600">{(dashboard?.failedVerifications || 0).toLocaleString()}</p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700 text-xl leading-none">&times;</button>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <span>{success}</span>
            <button onClick={() => setSuccess(null)} className="ml-auto text-green-500 hover:text-green-700 text-xl leading-none">&times;</button>
          </div>
        )}

        <Tabs defaultValue="products" className="space-y-6" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="products" className="data-[state=active]:bg-blue-50">
              <Package className="h-4 w-4 mr-2" />
              Products
            </TabsTrigger>
            <TabsTrigger value="generate" className="data-[state=active]:bg-blue-50">
              <QrCode className="h-4 w-4 mr-2" />
              Generate Codes
            </TabsTrigger>
            <TabsTrigger value="view-codes" className="data-[state=active]:bg-blue-50" onClick={() => loadViewCodes()}>
              <Eye className="h-4 w-4 mr-2" />
              View Codes & Special Offers
            </TabsTrigger>
            <TabsTrigger value="batches" className="data-[state=active]:bg-blue-50">
              <Tag className="h-4 w-4 mr-2" />
              Batches
            </TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Register New Product Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Register New Product
                  </CardTitle>
                  <CardDescription>
                    Add a new product to your brand before generating verification codes.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegisterProduct} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="regProductName">Product Name *</Label>
                      <Input
                        id="regProductName"
                        value={registerProductName}
                        onChange={(e) => setRegisterProductName(e.target.value)}
                        placeholder="Enter product name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="regProductCategory">Category</Label>
                      <Select value={registerProductCategory} onValueChange={setRegisterProductCategory}>
                        <SelectTrigger id="regProductCategory">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="electronics">Electronics</SelectItem>
                          <SelectItem value="apparel">Apparel</SelectItem>
                          <SelectItem value="footwear">Footwear</SelectItem>
                          <SelectItem value="accessories">Accessories</SelectItem>
                          <SelectItem value="cosmetics">Cosmetics</SelectItem>
                          <SelectItem value="luxury">Luxury Goods</SelectItem>
                          <SelectItem value="pharmaceuticals">Pharmaceuticals</SelectItem>
                          <SelectItem value="food">Food & Beverages</SelectItem>
                          <SelectItem value="automotive">Automotive Parts</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="regProductModel">Model Number</Label>
                      <Input
                        id="regProductModel"
                        value={registerProductModelNumber}
                        onChange={(e) => setRegisterProductModelNumber(e.target.value)}
                        placeholder="e.g., SKU-12345"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="regProductDesc">Description</Label>
                      <Input
                        id="regProductDesc"
                        value={registerProductDescription}
                        onChange={(e) => setRegisterProductDescription(e.target.value)}
                        placeholder="Brief product description"
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isRegisteringProduct}>
                      {isRegisteringProduct ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Registering...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Register Product
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Existing Products List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Your Products ({products.length})
                  </CardTitle>
                  <CardDescription>
                    Manage your registered products and their verification codes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {products.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {products.map((product) => (
                        <div key={product.id} className="p-4 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-900">{product.name}</h4>
                              {product.category && (
                                <Badge variant="secondary" className="mt-1 text-xs">
                                  {product.category}
                                </Badge>
                              )}
                              {product.modelNumber && (
                                <p className="text-xs text-gray-400 mt-1">Model: {product.modelNumber}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                {product.totalCodes} codes
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p>No products registered yet</p>
                      <p className="text-sm mt-1">Use the form to register your first product</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Generate Codes Tab */}
          <TabsContent value="generate">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Code Generation Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Generate New Codes
                  </CardTitle>
                  <CardDescription>
                    Generate unique scratch codes for your products. Codes are generated in multiples of 100.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleGenerateCodes} className="space-y-6">
                    {/* Product Selection */}
                    <div className="space-y-2">
                      <Label>Select Product *</Label>
                      
                      {products.length > 0 ? (
                        <Select 
                          value={selectedProduct} 
                          onValueChange={setSelectedProduct}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                <div className="flex items-center gap-2">
                                  <span>{product.name}</span>
                                  <span className="text-gray-400 text-xs">({product.totalCodes} existing codes)</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                          <p className="text-sm text-yellow-800">
                            No products found. Please register a product first in the <strong>Products</strong> tab before generating codes.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Quantity Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity (multiples of 100)</Label>
                      <Select value={quantity} onValueChange={setQuantity}>
                        <SelectTrigger id="quantity">
                          <SelectValue placeholder="Select quantity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="100">100 codes</SelectItem>
                          <SelectItem value="200">200 codes</SelectItem>
                          <SelectItem value="500">500 codes</SelectItem>
                          <SelectItem value="1000">1,000 codes</SelectItem>
                          <SelectItem value="2000">2,000 codes</SelectItem>
                          <SelectItem value="5000">5,000 codes</SelectItem>
                          <SelectItem value="10000">10,000 codes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isGenerating || products.length === 0 || !selectedProduct}
                    >
                      {isGenerating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <QrCode className="h-4 w-4 mr-2" />
                          Generate {quantity} Codes
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Generated Codes Display */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Generated Codes
                    </span>
                    {generatedCodes && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={copyAllCodes} className="bg-transparent">
                          <Copy className="h-4 w-4 mr-1" />
                          Copy All
                        </Button>
                        <Button variant="outline" size="sm" onClick={downloadCodes} className="bg-transparent">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    )}
                  </CardTitle>
                  {generatedCodes && (
                    <CardDescription>
                      Batch ID: {generatedCodes.batchId} | Product: {generatedCodes.productName}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {generatedCodes ? (
                    <div className="space-y-4">
                      <div className="max-h-96 overflow-y-auto border rounded-lg">
                        <div className="grid grid-cols-2 gap-2 p-4">
                          {generatedCodes.codes.map((code, index) => (
                            <div 
                              key={index}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded font-mono text-sm"
                            >
                              <span>{code}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyCode(code)}
                                className="h-6 w-6 p-0"
                              >
                                {copiedCode === code ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 text-center">
                        Total: {generatedCodes.quantity} codes generated
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <QrCode className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p>Generated codes will appear here</p>
                      <p className="text-sm mt-1">Fill in the form and click generate to create codes</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* View Codes & Special Offers Tab */}
          <TabsContent value="view-codes">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    View Codes & Assign Special Offers
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={loadViewCodes} className="bg-transparent">
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Refresh
                    </Button>
                    <Button variant="outline" size="sm" onClick={downloadViewCodes} disabled={viewCodes.length === 0} className="bg-transparent">
                      <Download className="h-4 w-4 mr-1" />
                      Export CSV
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>
                  Filter codes by product, batch, and date. Select codes to assign special offers. Codes with existing offers are highlighted in orange.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-xs flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      Product
                    </Label>
                    <Select value={viewCodesProduct} onValueChange={setViewCodesProduct}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Products</SelectItem>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      Batch
                    </Label>
                    <Select value={viewCodesBatch} onValueChange={setViewCodesBatch}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Batches</SelectItem>
                        {availableBatches.map((b) => (
                          <SelectItem key={b} value={b}>{b}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Date
                    </Label>
                    <Input
                      type="date"
                      value={viewCodesDate}
                      onChange={(e) => setViewCodesDate(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={loadViewCodes} className="w-full">
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </Button>
                  </div>
                </div>

                {/* Selection Mode Toggle */}
                <div className="flex flex-wrap gap-4 mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-4">
                    <Label className="text-sm font-medium">Selection Mode:</Label>
                    <div className="flex gap-2">
                      <Button 
                        variant={selectionMode === "individual" ? "default" : "outline"} 
                        size="sm" 
                        onClick={() => setSelectionMode("individual")}
                        className={selectionMode === "individual" ? "" : "bg-transparent"}
                      >
                        Individual Selection
                      </Button>
                      <Button 
                        variant={selectionMode === "random" ? "default" : "outline"} 
                        size="sm" 
                        onClick={() => setSelectionMode("random")}
                        className={selectionMode === "random" ? "" : "bg-transparent"}
                      >
                        Random Selection
                      </Button>
                    </div>
                  </div>
                  
                  {selectionMode === "random" && (
                    <div className="flex items-center gap-2">
                      <Label htmlFor="randomCount" className="text-sm">Number of codes:</Label>
                      <Input
                        id="randomCount"
                        type="number"
                        min="1"
                        max={viewCodes.filter(c => c.status === "UNUSED" && !c.hasSpecialOffer).length || 100}
                        value={randomCount}
                        onChange={(e) => setRandomCount(e.target.value)}
                        className="w-24"
                      />
                      <span className="text-xs text-gray-500">
                        (Max: {viewCodes.filter(c => c.status === "UNUSED" && !c.hasSpecialOffer).length} eligible)
                      </span>
                    </div>
                  )}
                </div>

                {/* Selection Actions (only for individual mode) */}
                {selectionMode === "individual" && (
                  <div className="flex flex-wrap gap-2 mb-4 items-center">
                    <Button variant="outline" size="sm" onClick={selectAllViewCodes} className="bg-transparent">
                      Select All Eligible
                    </Button>
                    <Button variant="outline" size="sm" onClick={deselectAllViewCodes} className="bg-transparent">
                      Deselect All
                    </Button>
                    <span className="text-sm text-gray-500 ml-auto">
                      {viewCodesSelectedCodes.size} selected | {viewCodes.length} codes shown
                    </span>
                  </div>
                )}

                {/* Legend */}
                <div className="flex flex-wrap gap-4 mb-4 p-3 bg-gray-100 rounded-lg text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-orange-100 border-l-4 border-l-orange-400 rounded"></div>
                    <span>Has special offer</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">UNUSED</Badge>
                    <span>Can select for offer</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="text-xs">VERIFIED</Badge>
                    <span>Already verified</span>
                  </div>
                </div>

                {/* Codes Table */}
                {isLoadingViewCodes ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-500">Loading codes...</p>
                  </div>
                ) : viewCodes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <QrCode className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No codes found with current filters</p>
                    <p className="text-sm">Try adjusting your filters or click Search</p>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="max-h-96 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100 sticky top-0">
                          <tr>
                            <th className="p-3 text-left w-10"></th>
                            <th className="p-3 text-left">Code</th>
                            <th className="p-3 text-left">Product</th>
                            <th className="p-3 text-left">Batch</th>
                            <th className="p-3 text-left">Status</th>
                            <th className="p-3 text-left">Special Offer</th>
                            <th className="p-3 text-left">Created</th>
                          </tr>
                        </thead>
                        <tbody>
                          {viewCodes.map((code) => (
                            <tr 
                              key={code.id} 
                              className={`border-t hover:bg-gray-50 ${
                                code.hasSpecialOffer ? 'bg-orange-50 border-l-4 border-l-orange-400' : ''
                              }`}
                            >
                              <td className="p-3">
                                {selectionMode === "individual" ? (
                                  <Checkbox
                                    checked={viewCodesSelectedCodes.has(code.id)}
                                    onCheckedChange={() => toggleViewCodeSelection(code.id)}
                                    disabled={code.hasSpecialOffer || code.status !== "UNUSED"}
                                  />
                                ) : (
                                  <span className="text-gray-300">-</span>
                                )}
                              </td>
                              <td className="p-3 font-mono text-xs">{code.code}</td>
                              <td className="p-3 text-xs">{code.productName}</td>
                              <td className="p-3 text-xs font-mono">{code.batchId}</td>
                              <td className="p-3">
                                <Badge 
                                  variant={code.status === "UNUSED" ? "secondary" : code.status === "VERIFIED" ? "default" : "destructive"} 
                                  className="text-xs"
                                >
                                  {code.status}
                                </Badge>
                              </td>
                              <td className="p-3">
                                {code.hasSpecialOffer ? (
                                  <div>
                                    <Badge className="bg-orange-100 text-orange-800 text-xs">
                                      <Gift className="h-3 w-3 mr-1" />
                                      Has Offer
                                    </Badge>
                                    {code.specialOfferDescription && (
                                      <p className="text-xs text-orange-600 mt-1 truncate max-w-32" title={code.specialOfferDescription}>
                                        {code.specialOfferDescription}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-xs">No offer</span>
                                )}
                              </td>
                              <td className="p-3 text-xs text-gray-500">
                                {new Date(code.createdAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Apply Special Offer Section */}
                {(selectionMode === "individual" ? viewCodesSelectedCodes.size > 0 : viewCodes.filter(c => c.status === "UNUSED" && !c.hasSpecialOffer).length > 0) && (
                  <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <h4 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
                      <Gift className="h-5 w-5" />
                      Apply Special Offer 
                      {selectionMode === "individual" 
                        ? ` to ${viewCodesSelectedCodes.size} Selected Codes`
                        : ` to ${randomCount} Random Codes`
                      }
                    </h4>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="viewOfferDesc">Offer Description *</Label>
                        <Input
                          id="viewOfferDesc"
                          value={viewCodesOfferDescription}
                          onChange={(e) => setViewCodesOfferDescription(e.target.value)}
                          placeholder="e.g., Get 20% off!"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="viewOfferDiscount">Discount % (optional)</Label>
                        <Input
                          id="viewOfferDiscount"
                          type="number"
                          min="1"
                          max="100"
                          value={viewCodesOfferDiscount}
                          onChange={(e) => setViewCodesOfferDiscount(e.target.value)}
                          placeholder="e.g., 20"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button 
                          onClick={handleApplyViewCodesOffer}
                          disabled={isApplyingViewCodesOffer || !viewCodesOfferDescription.trim() || (selectionMode === "individual" && viewCodesSelectedCodes.size === 0)}
                          className="w-full bg-orange-600 hover:bg-orange-700"
                        >
                          {isApplyingViewCodesOffer ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Applying...
                            </>
                          ) : (
                            <>
                              <Gift className="h-4 w-4 mr-2" />
                              Apply Offer
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recent Batches Tab */}
          <TabsContent value="batches">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Recent Code Batches
                </CardTitle>
                <CardDescription>
                  History of generated code batches. Click on a batch to view its codes in the View Codes tab.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dashboard?.recentBatches && dashboard.recentBatches.length > 0 ? (
                  <div className="space-y-4">
                    {dashboard.recentBatches.map((batch, index) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={async () => {
                  setViewCodesBatch(batch.batchId)
                  setViewCodesProduct("all")
                  setViewCodesDate("")
                  setActiveTab("view-codes")
                  // Load codes for this batch
                  setIsLoadingViewCodes(true)
                  try {
                    const result = await brandApi.getCodes(brandId, {
                      batchId: batch.batchId,
                      size: 200,
                    })
                    if (result.success && result.data) {
                      setViewCodes(result.data.codes || [])
                    }
                  } catch (err) {
                    console.log("[v0] Load batch codes error:", err)
                  }
                  setIsLoadingViewCodes(false)
                  }}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-medium">{batch.batchId}</span>
                            <Badge variant="secondary">{batch.quantity} codes</Badge>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">Product: {batch.productName}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">
                            {new Date(batch.createdAt).toLocaleDateString()}
                          </div>
                          <Button variant="ghost" size="sm" className="mt-1">
                            <Eye className="h-4 w-4 mr-1" />
                            View Codes
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Tag className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p>No batches generated yet</p>
                    <p className="text-sm mt-1">Generate codes to see batch history</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
