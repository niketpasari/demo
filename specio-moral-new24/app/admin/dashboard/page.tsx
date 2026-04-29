"use client"

import React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Shield,
  Users,
  Building2,
  LogOut,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  CreditCard,
  FileText,
  Download,
  Key,
  Eye,
  EyeOff,
} from "lucide-react"
import { adminApi, authApi, getUser } from "@/lib/api/client"

interface UserItem {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  totalVerifications: number
  authenticCount: number
  suspiciousCount: number
  trustScore: number
  createdAt: string
}

interface BrandItem {
  id: string
  name: string
  description?: string
  websiteUrl?: string
  supportEmail?: string
  isActive: boolean
  totalCodes: number
  createdAt: string
}

interface BillingItem {
  id: string
  year: number
  month: number
  codesGenerated: number
  isPaid: boolean
  paidAt?: string
  markedPaidBy?: string
}

interface VerificationItem {
  id: string
  code: string
  productName: string
  brandName: string
  result: string
  location?: string
  city?: string
  state?: string
  country?: string
  verifiedAt: string
}

interface BrandReportData {
  totalCodes: number
  verifiedCodes: number
  unusedCodes: number
  suspiciousCodes: number
  failedVerifications: number
  verifications: Array<{
    id: string
    code: string
    productName: string
    batchId: string
    status: string
    result: string
    verifiedAt: string
    verifiedByEmail: string
    location?: string
    city?: string
    state?: string
    country?: string
  }>
}

const MONTH_NAMES = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

export default function AdminDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("users")
  const [error, setError] = useState("")

  // Password reset
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  // Users
  const [users, setUsers] = useState<UserItem[]>([])
  const [selectedUserId, setSelectedUserId] = useState("")
  const [userStats, setUserStats] = useState<any>(null)
  const [userVerifications, setUserVerifications] = useState<VerificationItem[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [isLoadingUserData, setIsLoadingUserData] = useState(false)

  // Reset password for users/brands
  const [isResettingUserPassword, setIsResettingUserPassword] = useState(false)
  const [isResettingBrandPassword, setIsResettingBrandPassword] = useState(false)
  const [isTogglingBrandActive, setIsTogglingBrandActive] = useState(false)
  const [resetMessage, setResetMessage] = useState("")

  // Brands
  const [brands, setBrands] = useState<BrandItem[]>([])
  const [selectedBrandId, setSelectedBrandId] = useState("")
  const [brandBilling, setBrandBilling] = useState<BillingItem[]>([])
  const [brandReport, setBrandReport] = useState<BrandReportData | null>(null)
  const [isLoadingBrands, setIsLoadingBrands] = useState(false)
  const [isLoadingBrandData, setIsLoadingBrandData] = useState(false)
  const [brandActiveTab, setBrandActiveTab] = useState("billing")

  useEffect(() => {
    const user = getUser()
    if (!user || user.role !== "ADMIN") {
      router.push("/admin")
      return
    }
    loadUsers()
    loadBrands()
  }, [router])

  const loadUsers = async () => {
    setIsLoadingUsers(true)
    const result = await adminApi.getUsers()
    if (result.success) {
      setUsers(result.data || [])
    } else {
      setError(result.error || "Failed to load users")
    }
    setIsLoadingUsers(false)
  }

  const loadBrands = async () => {
    setIsLoadingBrands(true)
    const result = await adminApi.getBrands()
    if (result.success) {
      setBrands(result.data || [])
    } else {
      setError(result.error || "Failed to load brands")
    }
    setIsLoadingBrands(false)
  }

  const handleResetUserPassword = async () => {
    if (!selectedUserId) return
    const selectedUser = users.find(u => u.id === selectedUserId)
    if (!confirm(`Are you sure you want to reset the password for ${selectedUser?.email}? A temporary password will be sent to their email.`)) return

    setIsResettingUserPassword(true)
    setResetMessage("")
    setError("")
    const result = await adminApi.resetUserPassword(selectedUserId)
    if (result.success) {
      setResetMessage(result.data?.message || "Password reset email sent successfully")
    } else {
      setError(result.error || "Failed to reset password")
    }
    setIsResettingUserPassword(false)
  }

  const handleResetBrandPassword = async () => {
    if (!selectedBrandId) return
    const selectedBrand = brands.find(b => b.id === selectedBrandId)
    if (!confirm(`Are you sure you want to reset the password for brand "${selectedBrand?.name}"? A temporary password will be sent to the brand admin's email.`)) return

    setIsResettingBrandPassword(true)
    setResetMessage("")
    setError("")
    const result = await adminApi.resetBrandPassword(selectedBrandId)
    if (result.success) {
      setResetMessage(result.data?.message || "Password reset email sent successfully")
    } else {
      setError(result.error || "Failed to reset password")
    }
    setIsResettingBrandPassword(false)
  }

  const handleToggleBrandActive = async () => {
    if (!selectedBrandId) return
    const selectedBrand = brands.find(b => b.id === selectedBrandId)
    const action = selectedBrand?.isActive ? "deactivate" : "activate"
    if (!confirm(`Are you sure you want to ${action} brand "${selectedBrand?.name}"?${selectedBrand?.isActive ? " The brand will not be able to log in." : ""}`)) return

    setIsTogglingBrandActive(true)
    setResetMessage("")
    setError("")
    const result = await adminApi.toggleBrandActive(selectedBrandId)
    if (result.success) {
      setResetMessage(result.data?.message || `Brand ${action}d successfully`)
      // Update the brand in the local state
      setBrands(prev => prev.map(b =>
        b.id === selectedBrandId ? { ...b, isActive: result.data?.isActive ?? !b.isActive } : b
      ))
    } else {
      setError(result.error || `Failed to ${action} brand`)
    }
    setIsTogglingBrandActive(false)
  }

  const loadUserData = useCallback(async (userId: string) => {
    setIsLoadingUserData(true)
    setError("")
    const [statsResult, verificationsResult] = await Promise.all([
      adminApi.getUserStats(userId),
      adminApi.getUserVerifications(userId),
    ])
    if (statsResult.success) setUserStats(statsResult.data)
    if (verificationsResult.success) setUserVerifications(verificationsResult.data || [])
    setIsLoadingUserData(false)
  }, [])

  const loadBrandData = useCallback(async (brandId: string) => {
    setIsLoadingBrandData(true)
    setError("")
    const [billingResult, reportResult] = await Promise.all([
      adminApi.getBrandBilling(brandId),
      adminApi.getBrandReport(brandId),
    ])
    if (billingResult.success) setBrandBilling(billingResult.data || [])
    if (reportResult.success) setBrandReport(reportResult.data)
    setIsLoadingBrandData(false)
  }, [])

  useEffect(() => {
    if (selectedUserId) loadUserData(selectedUserId)
  }, [selectedUserId, loadUserData])

  useEffect(() => {
    if (selectedBrandId) loadBrandData(selectedBrandId)
  }, [selectedBrandId, loadBrandData])

  const handleMarkPaid = async (billingId: string, currentlyPaid: boolean) => {
    const result = await adminApi.markBillingPaid(billingId, !currentlyPaid)
    if (result.success) {
      setBrandBilling(prev => prev.map(b => 
        b.id === billingId 
          ? { ...b, isPaid: !currentlyPaid, paidAt: result.data?.paidAt, markedPaidBy: result.data?.markedPaidBy }
          : b
      ))
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError("")
    setPasswordSuccess("")

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match")
      return
    }
    if (newPassword.length < 4) {
      setPasswordError("Password must be at least 4 characters")
      return
    }

    const result = await adminApi.resetPassword(currentPassword, newPassword)
    if (result.success) {
      setPasswordSuccess("Password reset successfully")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
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
    router.push("/admin")
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-"
    return new Date(dateStr).toLocaleString()
  }

  const getResultBadge = (result: string) => {
    switch (result) {
      case "AUTHENTIC":
        return <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700"><CheckCircle className="h-3 w-3" />Authentic</span>
      case "SUSPICIOUS":
        return <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"><AlertCircle className="h-3 w-3" />Suspicious</span>
      case "COUNTERFEIT":
        return <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700"><XCircle className="h-3 w-3" />Counterfeit</span>
      default:
        return <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-700">{result}</span>
    }
  }

  const downloadUserVerificationsCSV = () => {
    if (userVerifications.length === 0) return
    const header = "Code,Product,Brand,Result,Pincode,City,State,Country,Verified At\n"
    const content = userVerifications.map(v =>
    `${v.code},${v.productName},${v.brandName},${v.result},${v.location || ''},${v.city || ''},${v.state || ''},${v.country || ''},${v.verifiedAt || ''}`
    ).join("\n")
    const blob = new Blob([header + content], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `user-verifications-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadBillingCSV = () => {
    if (brandBilling.length === 0) return
    const header = "Year,Month,Codes Generated,Paid,Paid At,Marked By\n"
    const content = brandBilling.map(b =>
      `${b.year},${MONTH_NAMES[b.month]},${b.codesGenerated},${b.isPaid ? 'Yes' : 'No'},${b.paidAt || ''},${b.markedPaidBy || ''}`
    ).join("\n")
    const blob = new Blob([header + content], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `brand-billing-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadBrandReportCSV = () => {
    if (!brandReport?.verifications || brandReport.verifications.length === 0) return
    const header = "Code,Product,Batch,Status,Result,Verified At,Verified By,Pincode,City,State,Country\n"
    const content = brandReport.verifications.map(v =>
    `${v.code},${v.productName},${v.batchId},${v.status},${v.result},${v.verifiedAt || ''},${v.verifiedByEmail || ''},${v.location || ''},${v.city || ''},${v.state || ''},${v.country || ''}`
    ).join("\n")
    const blob = new Blob([header + content], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `brand-report-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-xs text-gray-500">System Administration</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="bg-transparent">
                  <Key className="h-4 w-4 mr-1" />
                  Reset Password
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reset Admin Password</DialogTitle>
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
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit">Reset Password</Button>
                </form>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={handleLogout} className="bg-transparent">
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {resetMessage && (
          <Alert className="mb-4 border-green-300 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">{resetMessage}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="brands" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Brands
            </TabsTrigger>
          </TabsList>

          {/* ========== USERS TAB ========== */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Registered Users
                </CardTitle>
                <CardDescription>Select a user to view their verification stats and history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-6">
                  <div className="flex items-end gap-4">
                    <div className="flex-1 max-w-sm">
                      <Label>Select User</Label>
                      <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingUsers ? "Loading users..." : "Choose a user"} />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map(u => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.email} ({u.firstName} {u.lastName})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {selectedUserId && (
                      <>
                        <Button variant="outline" size="sm" onClick={downloadUserVerificationsCSV} disabled={userVerifications.length === 0} className="bg-transparent">
                          <Download className="h-4 w-4 mr-1" />
                          Export CSV
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleResetUserPassword} disabled={isResettingUserPassword} className="bg-transparent text-red-600 border-red-300 hover:bg-red-50">
                          <Key className="h-4 w-4 mr-1" />
                          {isResettingUserPassword ? "Resetting..." : "Reset Password"}
                        </Button>
                      </>
                    )}
                  </div>

                  {isLoadingUserData && <p className="text-gray-500 text-sm">Loading user data...</p>}

                  {selectedUserId && userStats && !isLoadingUserData && (
                    <>
                      {/* Stats summary */}
                      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                        <Card>
                          <CardContent className="pt-4 pb-4 text-center">
                            <p className="text-2xl font-bold text-gray-900">{userStats.totalVerifications}</p>
                            <p className="text-xs text-gray-500">Total Verifications</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-4 pb-4 text-center">
                            <p className="text-2xl font-bold text-green-600">{userStats.authenticCount}</p>
                            <p className="text-xs text-gray-500">Authentic</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-4 pb-4 text-center">
                            <p className="text-2xl font-bold text-amber-600">{userStats.suspiciousCount}</p>
                            <p className="text-xs text-gray-500">Suspicious</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-4 pb-4 text-center">
                            <p className="text-2xl font-bold text-red-600">{userStats.failedCount}</p>
                            <p className="text-xs text-gray-500">Failed</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-4 pb-4 text-center">
                            <p className="text-2xl font-bold text-blue-600">{userStats.trustScore}</p>
                            <p className="text-xs text-gray-500">Trust Score</p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Verification History */}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Verification History</h3>
                        <div className="border rounded-lg overflow-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b">
                              <tr>
                                <th className="text-left py-3 px-3">Code</th>
                                <th className="text-left py-3 px-3">Product</th>
                                <th className="text-left py-3 px-3">Brand</th>
                                <th className="text-left py-3 px-3">Result</th>
                                <th className="text-left py-3 px-3">Pincode</th>
                                <th className="text-left py-3 px-3">City</th>
                                <th className="text-left py-3 px-3">State</th>
                                <th className="text-left py-3 px-3">Country</th>
                                <th className="text-left py-3 px-3">Verified At</th>
                              </tr>
                            </thead>
                            <tbody>
                              {userVerifications.length === 0 ? (
                                <tr>
                                  <td colSpan={9} className="py-8 text-center text-gray-500">No verifications found</td>
                                </tr>
                              ) : (
                                userVerifications.map(v => (
                                  <tr key={v.id} className="border-b hover:bg-gray-50">
                                    <td className="py-3 px-3 font-mono text-xs">{v.code}</td>
                                    <td className="py-3 px-3">{v.productName}</td>
                                    <td className="py-3 px-3">{v.brandName}</td>
                                    <td className="py-3 px-3">{getResultBadge(v.result)}</td>
                                    <td className="py-3 px-3 text-xs">{v.location || "-"}</td>
                                    <td className="py-3 px-3 text-xs">{v.city || "-"}</td>
                                    <td className="py-3 px-3 text-xs">{v.state || "-"}</td>
                                    <td className="py-3 px-3 text-xs">{v.country || "-"}</td>
                                    <td className="py-3 px-3 text-xs">{formatDate(v.verifiedAt)}</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}

                  {!selectedUserId && !isLoadingUsers && (
                    <div className="text-center py-12 text-gray-400">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Select a user from the dropdown to view their details</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========== BRANDS TAB ========== */}
          <TabsContent value="brands">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Registered Brands
                </CardTitle>
                <CardDescription>Select a brand to manage billing and view reports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-6">
                  <div className="flex items-end gap-4">
                    <div className="flex-1 max-w-sm">
                      <Label>Select Brand</Label>
                      <Select value={selectedBrandId} onValueChange={setSelectedBrandId}>
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingBrands ? "Loading brands..." : "Choose a brand"} />
                        </SelectTrigger>
                        <SelectContent>
                          {brands.map(b => (
                            <SelectItem key={b.id} value={b.id}>
                              {b.name} ({b.totalCodes} codes){!b.isActive ? " [Inactive]" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {selectedBrandId && (
                      <>
                        <Button variant="outline" size="sm" onClick={handleResetBrandPassword} disabled={isResettingBrandPassword} className="bg-transparent text-red-600 border-red-300 hover:bg-red-50">
                          <Key className="h-4 w-4 mr-1" />
                          {isResettingBrandPassword ? "Resetting..." : "Reset Password"}
                        </Button>
                        {(() => {
                          const selectedBrand = brands.find(b => b.id === selectedBrandId)
                          const isActive = selectedBrand?.isActive ?? true
                          return (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleToggleBrandActive}
                              disabled={isTogglingBrandActive}
                              className={isActive
                                ? "bg-transparent text-orange-600 border-orange-300 hover:bg-orange-50"
                                : "bg-transparent text-green-600 border-green-300 hover:bg-green-50"
                              }
                            >
                              {isTogglingBrandActive
                                ? "Processing..."
                                : isActive ? "Deactivate Brand" : "Activate Brand"
                              }
                            </Button>
                          )
                        })()}
                      </>
                    )}
                  </div>

                  {isLoadingBrandData && <p className="text-gray-500 text-sm">Loading brand data...</p>}

                  {selectedBrandId && !isLoadingBrandData && (
                    <Tabs value={brandActiveTab} onValueChange={setBrandActiveTab}>
                      <TabsList>
                        <TabsTrigger value="billing" className="flex items-center gap-1">
                          <CreditCard className="h-3.5 w-3.5" />
                          Billing
                        </TabsTrigger>
                        <TabsTrigger value="report" className="flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5" />
                          Report
                        </TabsTrigger>
                      </TabsList>

                      {/* Billing Tab */}
                      <TabsContent value="billing" className="mt-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-semibold text-gray-700">Monthly Code Generation & Billing</h3>
                          <Button variant="outline" size="sm" onClick={downloadBillingCSV} disabled={brandBilling.length === 0} className="bg-transparent">
                            <Download className="h-4 w-4 mr-1" />
                            Export CSV
                          </Button>
                        </div>
                        <div className="border rounded-lg overflow-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b">
                              <tr>
                                <th className="text-left py-3 px-4">Period</th>
                                <th className="text-left py-3 px-4">Codes Generated</th>
                                <th className="text-left py-3 px-4">Payment Status</th>
                                <th className="text-left py-3 px-4">Paid At</th>
                                <th className="text-left py-3 px-4">Marked By</th>
                                <th className="text-left py-3 px-4">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {brandBilling.length === 0 ? (
                                <tr>
                                  <td colSpan={6} className="py-8 text-center text-gray-500">No billing records found</td>
                                </tr>
                              ) : (
                                brandBilling.map(b => (
                                  <tr key={b.id} className="border-b hover:bg-gray-50">
                                    <td className="py-3 px-4 font-medium">{MONTH_NAMES[b.month]} {b.year}</td>
                                    <td className="py-3 px-4">{b.codesGenerated.toLocaleString()}</td>
                                    <td className="py-3 px-4">
                                      {b.isPaid ? (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                                          <CheckCircle className="h-3 w-3" />Paid
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                                          <Clock className="h-3 w-3" />Unpaid
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-3 px-4 text-xs">{b.paidAt ? formatDate(b.paidAt) : "-"}</td>
                                    <td className="py-3 px-4 text-xs">{b.markedPaidBy || "-"}</td>
                                    <td className="py-3 px-4">
                                      <Button
                                        variant={b.isPaid ? "outline" : "default"}
                                        size="sm"
                                        onClick={() => handleMarkPaid(b.id, b.isPaid)}
                                        className={b.isPaid ? "bg-transparent" : ""}
                                      >
                                        {b.isPaid ? "Mark Unpaid" : "Mark Paid"}
                                      </Button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </TabsContent>

                      {/* Report Tab */}
                      <TabsContent value="report" className="mt-4">
                        {brandReport && (
                          <>
                            {/* Summary cards */}
                            <div className="grid grid-cols-2 gap-4 mb-6 md:grid-cols-5">
                              <Card>
                                <CardContent className="pt-4 pb-4 text-center">
                                  <p className="text-2xl font-bold text-gray-900">{brandReport.totalCodes}</p>
                                  <p className="text-xs text-gray-500">Total Codes</p>
                                </CardContent>
                              </Card>
                              <Card>
                                <CardContent className="pt-4 pb-4 text-center">
                                  <p className="text-2xl font-bold text-green-600">{brandReport.verifiedCodes}</p>
                                  <p className="text-xs text-gray-500">Verified</p>
                                </CardContent>
                              </Card>
                              <Card>
                                <CardContent className="pt-4 pb-4 text-center">
                                  <p className="text-2xl font-bold text-blue-600">{brandReport.unusedCodes}</p>
                                  <p className="text-xs text-gray-500">Unused</p>
                                </CardContent>
                              </Card>
                              <Card>
                                <CardContent className="pt-4 pb-4 text-center">
                                  <p className="text-2xl font-bold text-amber-600">{brandReport.suspiciousCodes}</p>
                                  <p className="text-xs text-gray-500">Suspicious</p>
                                </CardContent>
                              </Card>
                              <Card>
                                <CardContent className="pt-4 pb-4 text-center">
                                  <p className="text-2xl font-bold text-red-600">{brandReport.failedVerifications}</p>
                                  <p className="text-xs text-gray-500">Failed</p>
                                </CardContent>
                              </Card>
                            </div>

                            {/* Verifications table */}
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-sm font-semibold text-gray-700">Verification Details</h3>
                              <Button variant="outline" size="sm" onClick={downloadBrandReportCSV} disabled={!brandReport.verifications || brandReport.verifications.length === 0} className="bg-transparent">
                                <Download className="h-4 w-4 mr-1" />
                                Export CSV
                              </Button>
                            </div>
                            <div className="border rounded-lg overflow-auto">
                              <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b">
                                  <tr>
                                    <th className="text-left py-3 px-3">Code</th>
                                    <th className="text-left py-3 px-3">Product</th>
                                    <th className="text-left py-3 px-3">Batch</th>
                                    <th className="text-left py-3 px-3">Status</th>
                                    <th className="text-left py-3 px-3">Result</th>
                                    <th className="text-left py-3 px-3">Verified At</th>
                                    <th className="text-left py-3 px-3">Verified By</th>
                                    <th className="text-left py-3 px-3">Pincode</th>
                                    <th className="text-left py-3 px-3">City</th>
                                    <th className="text-left py-3 px-3">State</th>
                                    <th className="text-left py-3 px-3">Country</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(!brandReport.verifications || brandReport.verifications.length === 0) ? (
                                    <tr>
                                      <td colSpan={11} className="py-8 text-center text-gray-500">No verifications found</td>
                                    </tr>
                                  ) : (
                                    brandReport.verifications.map(v => (
                                      <tr key={v.id} className="border-b hover:bg-gray-50">
                                        <td className="py-3 px-3 font-mono text-xs">{v.code}</td>
                                        <td className="py-3 px-3">{v.productName}</td>
                                        <td className="py-3 px-3 text-xs">{v.batchId}</td>
                                        <td className="py-3 px-3">{getResultBadge(v.status)}</td>
                                        <td className="py-3 px-3">{getResultBadge(v.result)}</td>
                                        <td className="py-3 px-3 text-xs">{formatDate(v.verifiedAt)}</td>
                                        <td className="py-3 px-3 text-xs">{v.verifiedByEmail}</td>
                                        <td className="py-3 px-3 text-xs">{v.location || "-"}</td>
                                        <td className="py-3 px-3 text-xs">{v.city || "-"}</td>
                                        <td className="py-3 px-3 text-xs">{v.state || "-"}</td>
                                        <td className="py-3 px-3 text-xs">{v.country || "-"}</td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </>
                        )}
                      </TabsContent>
                    </Tabs>
                  )}

                  {!selectedBrandId && !isLoadingBrands && (
                    <div className="text-center py-12 text-gray-400">
                      <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Select a brand from the dropdown to manage billing and view reports</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
