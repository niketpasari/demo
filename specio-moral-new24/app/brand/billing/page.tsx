"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Shield,
  Building2,
  LogOut,
  CheckCircle,
  Clock,
  CreditCard,
  ChevronDown,
  ArrowLeft,
  History,
  FileText,
  AlertCircle,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { brandApi, getUser, authApi } from "@/lib/api/client"

interface BillingItem {
  year: number
  month: number
  codesGenerated: number
  isPaid: boolean
  paidAt?: string
}

const MONTH_NAMES = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

export default function BrandBillingPage() {
  const router = useRouter()
  const [brandId, setBrandId] = useState("")
  const [brandName, setBrandName] = useState("")
  const [billing, setBilling] = useState<BillingItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const user = getUser()
    if (!user || user.role !== "BRAND_ADMIN") {
      router.push("/")
      return
    }
    const bId = user.brand?.id
    setBrandId(bId)
    setBrandName(user.brand?.name || "Brand")
    loadBilling(bId)
  }, [router])

  const loadBilling = async (bId: string) => {
    setIsLoading(true)
    const result = await brandApi.getBilling(bId)
    if (result.success) {
      setBilling(result.data || [])
    } else {
      setError(result.error || "Failed to load billing data")
    }
    setIsLoading(false)
  }

  const handleLogout = () => {
    authApi.logout()
    router.push("/")
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-"
    return new Date(dateStr).toLocaleDateString()
  }

  const totalCodes = billing.reduce((sum, b) => sum + b.codesGenerated, 0)
  const paidMonths = billing.filter(b => b.isPaid).length
  const unpaidMonths = billing.filter(b => !b.isPaid).length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-gray-900" />
            <div>
              <h1 className="text-lg font-bold text-gray-900">Brand Portal</h1>
              <p className="text-xs text-gray-500">Billing & Payments</p>
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

      <main className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" onClick={() => router.push("/brand/dashboard")} className="p-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-bold text-gray-900">Billing & Payments</h2>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
          <Card>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{totalCodes.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Total Codes Generated</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{paidMonths}</p>
                  <p className="text-xs text-gray-500">Months Paid</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
                  <Clock className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{unpaidMonths}</p>
                  <p className="text-xs text-gray-500">Months Unpaid</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Billing table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Monthly Billing
            </CardTitle>
            <CardDescription>Overview of codes generated and payment status per month</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-gray-500">Loading billing data...</p>
            ) : (
              <div className="border rounded-lg overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Period</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Codes Generated</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Payment Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Paid On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billing.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-gray-500">
                          <CreditCard className="h-10 w-10 mx-auto mb-2 opacity-30" />
                          <p>No billing records found yet</p>
                        </td>
                      </tr>
                    ) : (
                      billing.map((b, i) => (
                        <tr key={`${b.year}-${b.month}`} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-900">{MONTH_NAMES[b.month]} {b.year}</td>
                          <td className="py-3 px-4">{b.codesGenerated.toLocaleString()}</td>
                          <td className="py-3 px-4">
                            {b.isPaid ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                                <CheckCircle className="h-3.5 w-3.5" />
                                Paid
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                                <Clock className="h-3.5 w-3.5" />
                                Unpaid
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-xs text-gray-500">{b.paidAt ? formatDate(b.paidAt) : "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
