"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Shield, Users, Trophy, Eye, EyeOff, LogOut, Download } from "lucide-react"
import { getScoreColor } from "@/lib/quiz-utils"

const ADMIN_CREDENTIALS = {
  username: process.env.NEXT_PUBLIC_ADMIN_USERNAME || "admin",
  password: process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "cyber123",
}

interface QuizResult {
  _id: string
  name: string
  rollNo: string
  mobileNo: string
  email: string
  score: number
  totalQuestions: number
  percentage: number
  completedAt: string
  isEligibleForReward: boolean
  rewardGiven: boolean
}

interface AdminData {
  users: QuizResult[]
  statistics: {
    totalUsers: number
    eligibleForRewards: number
    averageScore: number
    rewardsGiven: number
  }
}

export default function AdminPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loginData, setLoginData] = useState({ username: "", password: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState("")
  const [adminData, setAdminData] = useState<AdminData | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [authToken, setAuthToken] = useState("")

  // Check if already authenticated
  useEffect(() => {
    const authStatus = sessionStorage.getItem("adminAuth")
    const token = sessionStorage.getItem("adminToken")
    if (authStatus === "true" && token) {
      setIsAuthenticated(true)
      setAuthToken(token)
      loadAdminData(token)
    }
  }, [])

  const loadAdminData = async (token: string) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch admin data")
      }

      const data = await response.json()
      setAdminData(data.data)
    } catch (error) {
      console.error("Error loading admin data:", error)
      // If API fails, logout user
      handleLogout()
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError("")

    if (loginData.username === ADMIN_CREDENTIALS.username && loginData.password === ADMIN_CREDENTIALS.password) {
      const token = btoa(`${loginData.username}:${loginData.password}`) // Simple token
      setIsAuthenticated(true)
      setAuthToken(token)
      sessionStorage.setItem("adminAuth", "true")
      sessionStorage.setItem("adminToken", token)
      loadAdminData(token)
    } else {
      setLoginError("Invalid username or password")
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setAuthToken("")
    setAdminData(null)
    sessionStorage.removeItem("adminAuth")
    sessionStorage.removeItem("adminToken")
    setLoginData({ username: "", password: "" })
  }

  const handleRewardToggle = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch("/api/admin/reward", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          userId,
          rewardGiven: !currentStatus,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update reward status")
      }

      // Reload data to reflect changes
      await loadAdminData(authToken)
    } catch (error) {
      console.error("Error updating reward status:", error)
    }
  }

  const exportData = () => {
    if (!adminData) return

    const dataStr = JSON.stringify(adminData.users, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)
    const exportFileDefaultName = `quiz-results-${new Date().toISOString().split("T")[0]}.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  const filteredUsers =
    adminData?.users.filter(
      (user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.rollNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()),
    ) || []

  // Login Form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4 shadow-lg border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-500 rounded-full">
                <Shield className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-xl">Admin Login</CardTitle>
            <CardDescription>Enter your credentials to access the dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={loginData.username}
                  onChange={(e) => setLoginData((prev) => ({ ...prev, username: e.target.value }))}
                  className="h-11"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={loginData.password}
                    onChange={(e) => setLoginData((prev) => ({ ...prev, password: e.target.value }))}
                    className="h-11 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {loginError && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700">{loginError}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full h-11 bg-blue-600 hover:bg-blue-700">
                Login
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button variant="ghost" onClick={() => router.push("/")} className="text-blue-600 hover:text-blue-700">
                Back to Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Loading state
  if (isLoading || !adminData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-blue-600">User Management & Results</p>
              </div>
            </div>
            <Button onClick={handleLogout} variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-xl font-bold text-gray-900">{adminData.statistics.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Trophy className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Eligible for Rewards</p>
                  <p className="text-xl font-bold text-gray-900">{adminData.statistics.eligibleForRewards}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Rewards Given</p>
                  <p className="text-xl font-bold text-gray-900">{adminData.statistics.rewardsGiven}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Trophy className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Average Score</p>
                  <p className="text-xl font-bold text-gray-900">{adminData.statistics.averageScore}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search by name, roll number, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10"
            />
          </div>
          <Button
            onClick={exportData}
            variant="outline"
            className="border-blue-200 text-blue-700 hover:bg-blue-50 bg-transparent"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>

        {/* Users Table */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">User Management</CardTitle>
            <CardDescription>Manage quiz participants and rewards</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Roll No</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Reward</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.rollNo}</TableCell>
                        <TableCell>{user.mobileNo}</TableCell>
                        <TableCell className="max-w-48 truncate">{user.email}</TableCell>
                        <TableCell>
                          <span className={`font-semibold ${getScoreColor(user.percentage)}`}>
                            {user.score}/{user.totalQuestions} ({user.percentage}%)
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                            {new Date(user.completedAt).toLocaleDateString()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.isEligibleForReward ? (
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`reward-${user._id}`}
                                checked={user.rewardGiven}
                                onCheckedChange={() => handleRewardToggle(user._id, user.rewardGiven)}
                              />
                              <Label htmlFor={`reward-${user._id}`} className="text-sm cursor-pointer">
                                {user.rewardGiven ? "Given" : "Pending"}
                              </Label>
                            </div>
                          ) : (
                            <span className="text-gray-400">Not Eligible</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
