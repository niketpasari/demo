"use client"

import { useState, useEffect, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Shield, CheckCircle, AlertTriangle, ArrowLeft, Calendar, MapPin, Package, Award, ExternalLink, Download, XCircle, Loader2, HelpCircle } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSearchParams, useRouter } from "next/navigation"
import { authApi, verificationApi } from "@/lib/api/client"
import Loading from './loading'

interface VerificationResult {
  verificationId: string
  result: string
  message: string
  verifiedAt: string
  isFirstVerification: boolean
  verificationCount: number
  product: {
    id: string
    name: string
    description: string
    modelNumber: string
    category: string
    imageUrl: string
    price: number
    manufacturingDate: string
    manufacturingLocation: string
    batchNumber: string
    warrantyMonths: number
    warrantyExpiry: string
  }
  brand: {
    id: string
    name: string
    description: string
    logoUrl: string
    websiteUrl: string
    supportEmail: string
    supportPhone: string
    verificationBadge: boolean
  }
  details: {
    scratchCode: string
    firstVerifiedAt: string
    firstVerifiedBy: string
    totalVerifications: number
    status: string
  }
  specialOffer?: {
    hasSpecialOffer: boolean
    description: string
    discountPercent: number
    validUntil: string
    isExpired: boolean
  }
}

interface BrandOption {
  id: string
  name: string
  logoUrl: string
}

function VerifyContent() {
  const [isLoading, setIsLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
  const [brands, setBrands] = useState<BrandOption[]>([])
  const [selectedBrandId, setSelectedBrandId] = useState<string>("")
  const [isReporting, setIsReporting] = useState(false)
  const [reportSubmitted, setReportSubmitted] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const code = searchParams?.get('code') || ''
  const location = searchParams?.get('location') || undefined

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

    if (!code) {
      setError('No verification code provided')
      setIsLoading(false)
      return
    }

    // Perform verification
    performVerification()
  }, [isMounted, code, router])

  const performVerification = async () => {
    setIsLoading(true)
    setError(null)

    const result = await verificationApi.verify(code, location)

    if (!result.success) {
      setError(result.error || 'Verification failed')
      // Fetch brands for the failed verification report
      const brandsResult = await verificationApi.getBrands()
      if (brandsResult.success && brandsResult.data) {
        setBrands(brandsResult.data)
      }
      setIsLoading(false)
      return
    }

    setVerificationResult(result.data)
    setIsLoading(false)
  }

  const handleReportFailedVerification = async () => {
    setIsReporting(true)
    const result = await verificationApi.reportFailed(
      code,
      selectedBrandId || undefined,
      location
    )
    setIsReporting(false)
    if (result.success) {
      setReportSubmitted(true)
    }
  }

  const handleDownloadCertificate = () => {
    if (!verificationResult) return

    const canvas = document.createElement("canvas")
    canvas.width = 900
    canvas.height = 600
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Background
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, 900, 600)

    // Border
    ctx.strokeStyle = "#1d4ed8"
    ctx.lineWidth = 4
    ctx.strokeRect(20, 20, 860, 560)

    // Inner border
    ctx.strokeStyle = "#93c5fd"
    ctx.lineWidth = 1
    ctx.strokeRect(30, 30, 840, 540)

    // Header accent line
    ctx.fillStyle = "#1d4ed8"
    ctx.fillRect(40, 70, 820, 3)

    // Title
    ctx.fillStyle = "#1e3a5f"
    ctx.font = "bold 32px Georgia, serif"
    ctx.textAlign = "center"
    ctx.fillText("Certificate of Authenticity", 450, 55)

    // Shield icon (simple drawn shape)
    ctx.fillStyle = "#16a34a"
    ctx.beginPath()
    ctx.moveTo(450, 95)
    ctx.lineTo(475, 105)
    ctx.lineTo(475, 130)
    ctx.quadraticCurveTo(450, 150, 450, 150)
    ctx.quadraticCurveTo(450, 150, 425, 130)
    ctx.lineTo(425, 105)
    ctx.closePath()
    ctx.fill()

    // Checkmark inside shield
    ctx.strokeStyle = "#ffffff"
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(439, 122)
    ctx.lineTo(447, 132)
    ctx.lineTo(462, 112)
    ctx.stroke()

    // Verified text
    ctx.fillStyle = "#16a34a"
    ctx.font = "bold 18px Arial, sans-serif"
    ctx.fillText("VERIFIED AUTHENTIC", 450, 175)

    // Product name
    ctx.fillStyle = "#1e293b"
    ctx.font = "bold 24px Arial, sans-serif"
    ctx.fillText(verificationResult.product.name, 450, 215)

    // Brand
    ctx.fillStyle = "#475569"
    ctx.font = "16px Arial, sans-serif"
    ctx.fillText(`by ${verificationResult.brand.name}`, 450, 242)

    // Divider
    ctx.fillStyle = "#e2e8f0"
    ctx.fillRect(150, 260, 600, 1)

    // Details section
    ctx.textAlign = "left"
    ctx.fillStyle = "#64748b"
    ctx.font = "13px Arial, sans-serif"

    const detailsStartY = 290
    const leftCol = 180
    const rightCol = 500
    const lineHeight = 35

    const details = [
      { label: "Verification Code:", value: verificationResult.details?.scratchCode || code },
      { label: "Verified On:", value: new Date(verificationResult.verifiedAt).toLocaleString() },
      { label: "Verification ID:", value: verificationResult.verificationId },
      { label: "Model Number:", value: verificationResult.product.modelNumber || "N/A" },
      { label: "Batch Number:", value: verificationResult.product.batchNumber || "N/A" },
    ]

    details.forEach((detail, i) => {
      const y = detailsStartY + i * lineHeight
      const col = i < 3 ? leftCol : rightCol
      const row = i < 3 ? i : i - 3

      ctx.fillStyle = "#64748b"
      ctx.font = "12px Arial, sans-serif"
      ctx.fillText(detail.label, col, detailsStartY + row * lineHeight)

      ctx.fillStyle = "#1e293b"
      ctx.font = "14px Arial, sans-serif"
      ctx.fillText(detail.value, col, detailsStartY + row * lineHeight + 16)
    })

    // Warranty info
    if (verificationResult.product.warrantyExpiry) {
      ctx.fillStyle = "#64748b"
      ctx.font = "12px Arial, sans-serif"
      ctx.fillText("Warranty Valid Until:", 500, detailsStartY + 2 * lineHeight)
      ctx.fillStyle = "#1e293b"
      ctx.font = "14px Arial, sans-serif"
      ctx.fillText(
        new Date(verificationResult.product.warrantyExpiry).toLocaleDateString(),
        500, detailsStartY + 2 * lineHeight + 16
      )
    }

    // Footer divider
    ctx.fillStyle = "#e2e8f0"
    ctx.fillRect(40, 500, 820, 1)

    // Footer
    ctx.textAlign = "center"
    ctx.fillStyle = "#94a3b8"
    ctx.font = "11px Arial, sans-serif"
    ctx.fillText(
      "This certificate was generated by VerifyAuth Product Authentication System",
      450, 530
    )
    ctx.fillText(
      `Generated on ${new Date().toLocaleString()}`,
      450, 548
    )

    // Download
    const link = document.createElement("a")
    link.download = `certificate-${verificationResult.verificationId}.png`
    link.href = canvas.toDataURL("image/png")
    link.click()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Verifying Product...</h3>
            <p className="text-sm text-gray-500 mt-2">Please wait while we authenticate your product</p>
            <p className="text-xs text-gray-400 mt-4 font-mono">{code}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <XCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Verification Failed</h3>
            <p className="text-sm text-gray-500 mt-2 text-center">{error}</p>
            <p className="text-xs text-gray-400 mt-2 font-mono">{code}</p>
            
            {/* Brand Selection for Failed Verification */}
            {!reportSubmitted && brands.length > 0 && (
              <div className="w-full mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <HelpCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-amber-800 font-medium">
                      This code could not be verified.
                    </p>
                    <p className="text-sm text-amber-700 mt-1">
                      {"If you'd like, you can help us by confirming the brand printed on the product. This helps brands combat counterfeits."}
                    </p>
                    
                    <div className="mt-4 space-y-3">
                      <Select value={selectedBrandId} onValueChange={setSelectedBrandId}>
                        <SelectTrigger className="w-full bg-white">
                          <SelectValue placeholder="Select brand (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {brands.map((brand) => (
                            <SelectItem key={brand.id} value={brand.id}>
                              {brand.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Button 
                        onClick={handleReportFailedVerification}
                        disabled={isReporting}
                        variant="outline"
                        className="w-full bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200"
                      >
                        {isReporting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          'Submit Report'
                        )}
                      </Button>
                      <p className="text-xs text-amber-600 text-center">
                        This is optional and helps improve our counterfeit detection.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {reportSubmitted && (
              <div className="w-full mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <p className="text-sm text-green-800">
                    Thank you for helping us combat counterfeits. Your report has been submitted.
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex gap-4 mt-6">
              <Button variant="outline" onClick={() => router.push('/dashboard')} className="bg-transparent">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <Button onClick={performVerification}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!verificationResult) return null

  const isAuthentic = verificationResult.result === 'AUTHENTIC'

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
              <h1 className="text-2xl font-bold text-gray-900">Product Verification</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Verification Status */}
          <Card className={isAuthentic ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            <CardContent className="flex items-center space-x-4 py-6">
              <div className="flex-shrink-0">
                {isAuthentic ? (
                  <CheckCircle className="h-12 w-12 text-green-600" />
                ) : (
                  <XCircle className="h-12 w-12 text-red-600" />
                )}
              </div>
              <div className="flex-1">
                <h2 className={`text-2xl font-bold ${isAuthentic ? 'text-green-900' : 'text-red-900'}`}>
                  {isAuthentic ? 'Product Authenticated!' : 'Warning: Code Already Used'}
                </h2>
                <p className={`mt-1 ${isAuthentic ? 'text-green-700' : 'text-red-700'}`}>
                  {verificationResult.message}
                </p>
                {isAuthentic && !verificationResult.isFirstVerification && (
                  <p className="text-sm mt-2 text-green-600">
                    This code has been verified {verificationResult.verificationCount} time(s) by you.
                  </p>
                )}
                {!isAuthentic && (
                  <p className="text-sm mt-2 text-red-600 font-medium">
                    Please contact the brand support or the retailer for assistance.
                  </p>
                )}
              </div>
              <Badge className={`text-lg px-4 py-2 ${isAuthentic ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {isAuthentic ? (
                  <>
                    <Award className="h-4 w-4 mr-2" />
                    Verified Authentic
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Code Used
                  </>
                )}
              </Badge>
            </CardContent>
          </Card>

          {/* Special Offer Section */}
          {isAuthentic && verificationResult.specialOffer?.hasSpecialOffer && (
            <Card className={verificationResult.specialOffer.isExpired ? "border-gray-300 bg-gray-50" : "border-orange-300 bg-orange-50"}>
              <CardContent className="py-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <Award className={`h-12 w-12 ${verificationResult.specialOffer.isExpired ? 'text-gray-400' : 'text-orange-500'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className={`text-xl font-bold ${verificationResult.specialOffer.isExpired ? 'text-gray-600' : 'text-orange-900'}`}>
                        Special Offer {verificationResult.specialOffer.isExpired ? '(Expired)' : ''}
                      </h3>
                      {verificationResult.specialOffer.discountPercent && !verificationResult.specialOffer.isExpired && (
                        <Badge className="bg-orange-500 text-white text-lg px-3 py-1">
                          {verificationResult.specialOffer.discountPercent}% OFF
                        </Badge>
                      )}
                    </div>
                    <p className={`mt-2 text-lg ${verificationResult.specialOffer.isExpired ? 'text-gray-500' : 'text-orange-800'}`}>
                      {verificationResult.specialOffer.description}
                    </p>
                    {verificationResult.specialOffer.validUntil && (
                      <p className={`mt-2 text-sm ${verificationResult.specialOffer.isExpired ? 'text-gray-400' : 'text-orange-600'}`}>
                        {verificationResult.specialOffer.isExpired 
                          ? `Expired on ${new Date(verificationResult.specialOffer.validUntil).toLocaleDateString()}`
                          : `Valid until ${new Date(verificationResult.specialOffer.validUntil).toLocaleDateString()}`
                        }
                      </p>
                    )}
                    {!verificationResult.specialOffer.isExpired && (
                      <p className="mt-3 text-sm text-orange-700 font-medium">
                        Present this verification to claim your special offer at the retailer or brand store.
                      </p>
                    )}
                    {(verificationResult.brand.supportPhone || verificationResult.brand.supportEmail) && (
                      <div className="mt-4 pt-4 border-t border-orange-200">
                        <p className="text-sm font-semibold text-orange-900">Brand Support Contact</p>
                        <div className="flex flex-col gap-1 mt-1">
                          {verificationResult.brand.supportPhone && (
                            <p className="text-sm text-orange-800">
                              Phone: <a href={`tel:${verificationResult.brand.supportPhone}`} className="underline">{verificationResult.brand.supportPhone}</a>
                            </p>
                          )}
                          {verificationResult.brand.supportEmail && (
                            <p className="text-sm text-orange-800">
                              Email: <a href={`mailto:${verificationResult.brand.supportEmail}`} className="underline">{verificationResult.brand.supportEmail}</a>
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Product Details */}
            <Card>
              <CardHeader>
                <CardTitle>Product Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-4">
                  {verificationResult.product.imageUrl && (
                    <img
                      src={verificationResult.product.imageUrl || "/placeholder.svg"}
                      alt={verificationResult.product.name}
                      className="w-24 h-24 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {verificationResult.product.name}
                    </h3>
                    <p className="text-gray-600">{verificationResult.brand.name}</p>
                    {verificationResult.product.category && (
                      <p className="text-sm text-gray-500">{verificationResult.product.category}</p>
                    )}
                  </div>
                </div>

                {(verificationResult.product.modelNumber || verificationResult.product.batchNumber || verificationResult.product.manufacturingLocation || verificationResult.product.price) && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {verificationResult.product.modelNumber && (
                        <div>
                          <p className="font-medium text-gray-900">Model</p>
                          <p className="text-gray-600">{verificationResult.product.modelNumber}</p>
                        </div>
                      )}
                      {verificationResult.product.batchNumber && (
                        <div>
                          <p className="font-medium text-gray-900">Batch</p>
                          <p className="text-gray-600">{verificationResult.product.batchNumber}</p>
                        </div>
                      )}
                      {verificationResult.product.manufacturingLocation && (
                        <div>
                          <p className="font-medium text-gray-900">Manufacturing Location</p>
                          <p className="text-gray-600">{verificationResult.product.manufacturingLocation}</p>
                        </div>
                      )}
                      {verificationResult.product.price && (
                        <div>
                          <p className="font-medium text-gray-900">Price</p>
                          <p className="text-gray-600">{`$${verificationResult.product.price}`}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {verificationResult.product.description && (
                  <>
                    <Separator />
                    <div>
                      <p className="font-medium text-gray-900 mb-2">Description</p>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {verificationResult.product.description}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Verification Details */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Verification Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Package className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">Verification Code</p>
                      <p className="text-gray-600 font-mono text-sm">{verificationResult.details?.scratchCode || code}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">Verified On</p>
                      <p className="text-gray-600">
                        {new Date(verificationResult.verifiedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">Status</p>
                      <p className="text-gray-600">{verificationResult.details?.status || verificationResult.result}</p>
                    </div>
                  </div>

                  {verificationResult.details?.totalVerifications && (
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">Total Verifications</p>
                        <p className="text-gray-600">{verificationResult.details.totalVerifications}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {(verificationResult.product.manufacturingDate || verificationResult.product.warrantyMonths || verificationResult.product.warrantyExpiry) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Product Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {verificationResult.product.manufacturingDate && (
                      <div>
                        <p className="font-medium text-gray-900">Manufacturing Date</p>
                        <p className="text-gray-600">
                          {new Date(verificationResult.product.manufacturingDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {verificationResult.product.warrantyMonths && (
                      <div>
                        <p className="font-medium text-gray-900">Warranty Period</p>
                        <p className="text-gray-600">{`${verificationResult.product.warrantyMonths} months`}</p>
                      </div>
                    )}
                    {verificationResult.product.warrantyExpiry && (
                      <div>
                        <p className="font-medium text-gray-900">Warranty Expires</p>
                        <p className="text-gray-600">
                          {new Date(verificationResult.product.warrantyExpiry).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Brand Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    {verificationResult.brand?.logoUrl && (
                      <img
                        src={verificationResult.brand.logoUrl || "/placeholder.svg"}
                        alt="Brand Logo"
                        className="h-12 w-auto"
                      />
                    )}
                    <div>
                      <p className="font-semibold text-lg">{verificationResult.brand?.name}</p>
                      {verificationResult.brand?.verificationBadge && (
                        <Badge className="bg-blue-100 text-blue-800 text-xs">Verified Brand</Badge>
                      )}
                    </div>
                  </div>
                  {verificationResult.brand?.description && (
                    <p className="text-sm text-gray-600">{verificationResult.brand.description}</p>
                  )}
                  <div className="space-y-2">
                    {verificationResult.brand?.websiteUrl && (
                      <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                        <a href={verificationResult.brand.websiteUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Visit Official Website
                        </a>
                      </Button>
                    )}
                    {verificationResult.brand?.supportEmail && (
                      <p className="text-sm text-gray-600">
                        <strong>Support:</strong> {verificationResult.brand.supportEmail}
                      </p>
                    )}
                    {verificationResult.brand?.supportPhone && (
                      <p className="text-sm text-gray-600">
                        <strong>Phone:</strong> {verificationResult.brand.supportPhone}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Actions */}
          {isAuthentic && (
            <Card>
              <CardContent className="flex flex-col sm:flex-row gap-4 py-6">
                <Button className="flex-1" onClick={handleDownloadCertificate}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Certificate
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}

export default function VerifyProduct() {
  return (
    <Suspense fallback={<Loading />}>
      <VerifyContent />
    </Suspense>
  )
}
