"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Calendar, User, Users, Pen } from "lucide-react"
import { useUser } from "../../context/UserContext"
import { Navbar } from "../../components/NavBar"
import { Sidebar } from "../../components/Sidebar"
import Notifications from "../../components/ui/NotificationDesktop"

function GenderDisplay({ value }) {
  const genderOptions = {
    Male: { icon: User, color: "bg-blue-100", text: "text-blue-700" },
    Female: { icon: User, color: "bg-pink-100", text: "text-pink-700" },
    "Non-binary": { icon: Users, color: "bg-purple-100", text: "text-purple-700" },
    "Prefer not to say": { icon: Users, color: "bg-gray-100", text: "text-gray-700" },
  }

  const option = genderOptions[value] || genderOptions["Prefer not to say"]

  return (
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-full ${option.color}`}>
        <option.icon className={`w-4 h-4 ${option.text}`} />
      </div>
      <p className={`text-base font-medium ${option.text}`}>{value || "Not provided"}</p>
    </div>
  )
}

function BirthdayDisplay({ value }) {
  const formatDate = (dateStr) => {
    if (!dateStr) return "Not provided"
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="flex items-center gap-2">
      <Calendar className="w-4 h-4 text-gray-500" />
      <p className="text-base text-gray-700">{formatDate(value)}</p>
    </div>
  )
}

function ReadOnlyField({ label, value, isMultiline = false }) {
  return (
    <div className={`col-span-4 md:col-span-2 p-4 rounded-lg border`}>
      <label className="block text-sm text-gray-500 mb-1">{label}</label>
      <p className={`text-base text-gray-700 ${isMultiline ? "whitespace-pre-line" : ""}`}>
        {value || "Not provided"}
      </p>
    </div>
  )
}

export default function ProfilePage() {
  const { userData, loading } = useUser()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [showSkeleton, setShowSkeleton] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => setShowSkeleton(false), 500)
    return () => clearTimeout(timer)
  }, [])

  const skeleton = loading || !userData || showSkeleton

  return (
    <div className="min-h-screen flex flex-col gap-6 bg-gray-300/10 p-4 lg:p-6">
      <Navbar
        sidebarOpen={sidebarOpen}
        mobileSidebarOpen={mobileSidebarOpen}
        toggleSidebar={() => setSidebarOpen((prev) => !prev)}
        toggleMobileSidebar={() => setMobileSidebarOpen((prev) => !prev)}
      />

      <main>
        <div className="container mx-auto">
          <div className="flex gap-6">
            <Sidebar
              sidebarOpen={sidebarOpen}
              mobileSidebarOpen={mobileSidebarOpen}
              toggleMobileSidebar={() => setMobileSidebarOpen((prev) => !prev)}
            />

            <div className="w-full flex gap-6 transition-opacity duration-500 ease-in-out" style={{ opacity: skeleton ? 0.5 : 1 }}>
              <div className="flex flex-1 flex-col gap-6">
                {/* Profile Header */}
                <div className="flex flex-col md:flex-row gap-6 items-center p-6 rounded-2xl shadow bg-white border">
                  <div className="flex flex-col md:flex-row items-center gap-4 lg:gap-6 flex-1">
                    <div className="relative rounded-full w-28 h-28 border border-blue-500 overflow-hidden bg-gray-200">
                      {skeleton ? (
                        <div className="w-full h-full animate-pulse bg-gray-300" />
                      ) : (
                        <Image
                          src={userData?.profileImageUrl || "/default.png"}
                          alt="Profile"
                          fill
                          className="object-cover"
                          priority
                        />
                      )}
                    </div>

                    <div className="flex flex-col md:flex-row lg:flex-col xl:flex-row gap-6 lg:gap-4 xl:gap-6 items-center lg:items-start xl:items-center justify-between flex-1">
                      <div className="flex flex-col gap-1 text-center md:text-start">
                        <h1 className="font-semibold text-2xl">{userData?.fullname || "Unnamed"}</h1>
                        <span className="text-gray-500 text-sm">{userData?.email}</span>
                      </div>

                      <div className="flex justify-center">
                        <button
                          onClick={() => router.push("/admin/settings?component=EditProfile")}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center gap-2 hover:bg-blue-600 transition-colors"
                        >
                          <Pen className="w-4 h-4" />
                          Edit Profile
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info Cards */}
                <div className="flex flex-col p-6 rounded-2xl shadow bg-white border gap-10">
                  <div className="flex flex-col gap-4">
                    <h3 className="text-xl font-medium">Profile Information</h3>
                    <div className="grid grid-cols-4 gap-4">
                      <ReadOnlyField label="Fullname" value={userData?.fullname} />
                      <div className="col-span-4 md:col-span-2 p-4 rounded-lg border">
                        <label className="text-sm text-gray-500 mb-1 block">Gender</label>
                        <GenderDisplay value={userData?.gender} />
                      </div>
                      <div className="col-span-4 md:col-span-2 p-4 rounded-lg border">
                        <label className="text-sm text-gray-500 mb-1 block">Birthday</label>
                        <BirthdayDisplay value={userData?.birthday} />
                      </div>
                      <ReadOnlyField label="Phone" value={userData?.phone} />
                      <ReadOnlyField label="Address" value={userData?.address} isMultiline />
                    </div>
                  </div>
                </div>
              </div>

              <Notifications />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
