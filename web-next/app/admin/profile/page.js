"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  PenIcon as UserPen,
  Save,
  X,
  Calendar,
  ChevronDown,
  ChevronUp,
  User,
  Users,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { useUser } from "../../context/UserContext"
import { Navbar } from "../../components/NavBar"
import { Sidebar } from "../../components/Sidebar"
import Notifications from "../../components/ui/NotificationDesktop"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "../../config/firebaseConfig"

// Modal Component
function Modal({ isOpen, onClose, type, message }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const isSuccess = type === "success"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Content */}
        <div className="p-8 text-center">
          {/* Icon */}
          <div
            className={`
            mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4
            ${isSuccess ? "bg-green-100" : "bg-red-100"}
          `}
          >
            {isSuccess ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : (
              <XCircle className="w-8 h-8 text-red-600" />
            )}
          </div>

          {/* Title */}
          <h3
            className={`
            text-xl font-semibold mb-2
            ${isSuccess ? "text-green-800" : "text-red-800"}
          `}
          >
            {isSuccess ? "Success!" : "Error"}
          </h3>

          {/* Message */}
          <p className="text-gray-600 mb-6 leading-relaxed">{message}</p>

          {/* Action button */}
          <button
            onClick={onClose}
            className={`
              px-6 py-3 rounded-xl font-medium transition-all duration-200
              transform hover:scale-105 active:scale-95
              ${
                isSuccess
                  ? "bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-green-200"
                  : "bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-red-200"
              }
            `}
          >
            {isSuccess ? "Great!" : "Try Again"}
          </button>
        </div>
      </div>
    </div>
  )
}

// Modern Gender Field Component
function ModernGenderField({ label, name, value, onChange, editable }) {
  const [isOpen, setIsOpen] = useState(false)

  const genderOptions = [
    {
      value: "Male",
      icon: User,
      gradient: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
      borderColor: "border-blue-200",
    },
    {
      value: "Female",
      icon: User,
      gradient: "from-pink-500 to-pink-600",
      bgColor: "bg-pink-50",
      textColor: "text-pink-700",
      borderColor: "border-pink-200",
    },
    {
      value: "Non-binary",
      icon: Users,
      gradient: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-700",
      borderColor: "border-purple-200",
    },
    {
      value: "Prefer not to say",
      icon: Users,
      gradient: "from-gray-500 to-gray-600",
      bgColor: "bg-gray-50",
      textColor: "text-gray-700",
      borderColor: "border-gray-200",
    },
  ]

  const selectedOption = genderOptions.find((option) => option.value === value)

  const handleSelect = (selectedValue) => {
    onChange({ target: { name, value: selectedValue } })
    setIsOpen(false)
  }

  return (
    <div className="col-span-4 md:col-span-2 p-4 rounded-lg border flex flex-col gap-3">
      <label className="text-sm text-gray-500">{label}</label>

      {editable ? (
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`
              w-full px-4 py-3 rounded-xl border-2 transition-all duration-200
              flex items-center justify-between
              ${
                selectedOption
                  ? `${selectedOption.bgColor} ${selectedOption.borderColor} ${selectedOption.textColor}`
                  : "bg-gray-50 border-gray-200 text-gray-500"
              }
              hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300
            `}
          >
            <div className="flex items-center gap-3">
              {selectedOption && (
                <div className={`p-2 rounded-lg bg-gradient-to-r ${selectedOption.gradient}`}>
                  <selectedOption.icon className="w-4 h-4 text-white" />
                </div>
              )}
              <span className="font-medium">{value || "Select gender"}</span>
            </div>
            <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
          </button>

          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-100 rounded-xl shadow-xl z-20 overflow-hidden">
              {genderOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`
                    w-full px-4 py-3 flex items-center gap-3 transition-all duration-150
                    hover:${option.bgColor} hover:${option.textColor}
                    ${value === option.value ? `${option.bgColor} ${option.textColor}` : "text-gray-700"}
                    first:rounded-t-xl last:rounded-b-xl
                  `}
                >
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${option.gradient}`}>
                    <option.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-medium">{option.value}</span>
                  {value === option.value && <div className="ml-auto w-2 h-2 rounded-full bg-current"></div>}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3">
          {selectedOption && (
            <div className={`p-2 rounded-lg bg-gradient-to-r ${selectedOption.gradient}`}>
              <selectedOption.icon className="w-4 h-4 text-white" />
            </div>
          )}
          <p className="text-base text-gray-700 font-medium">{value || "Not provided"}</p>
        </div>
      )}
    </div>
  )
}

// Creative Birthday Field Component
function CreativeBirthdayField({ label, name, value, onChange, editable }) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState({
    day: "",
    month: "",
    year: "",
  })

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const days = Array.from({ length: 31 }, (_, i) => i + 1)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i)

  useEffect(() => {
    if (value) {
      const date = new Date(value)
      setSelectedDate({
        day: date.getDate().toString(),
        month: (date.getMonth() + 1).toString(),
        year: date.getFullYear().toString(),
      })
    }
  }, [value])

  const handleDateChange = (type, newValue) => {
    const newDate = { ...selectedDate, [type]: newValue }
    setSelectedDate(newDate)

    if (newDate.day && newDate.month && newDate.year) {
      const formattedDate = `${newDate.year}-${newDate.month.padStart(2, "0")}-${newDate.day.padStart(2, "0")}`
      onChange({ target: { name, value: formattedDate } })
    }
  }

  const formatDisplayDate = (dateString) => {
    if (!dateString) return "Not provided"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="col-span-4 md:col-span-2 p-4 rounded-lg border flex flex-col gap-3">
      <label className="text-sm text-gray-500">{label}</label>

      {editable ? (
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full px-3 py-2 border rounded-lg bg-white flex items-center justify-between hover:border-blue-300 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className={value ? "text-gray-900" : "text-gray-500"}>
                {value ? formatDisplayDate(value) : "Select your birthday"}
              </span>
            </div>
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-10 p-4">
              <div className="grid grid-cols-3 gap-3">
                {/* Month */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Month</label>
                  <select
                    value={selectedDate.month}
                    onChange={(e) => handleDateChange("month", e.target.value)}
                    className="w-full px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-blue-300 outline-none"
                  >
                    <option value="">Month</option>
                    {months.map((month, index) => (
                      <option key={month} value={index + 1}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Day */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Day</label>
                  <select
                    value={selectedDate.day}
                    onChange={(e) => handleDateChange("day", e.target.value)}
                    className="w-full px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-blue-300 outline-none"
                  >
                    <option value="">Day</option>
                    {days.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Year */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Year</label>
                  <select
                    value={selectedDate.year}
                    onChange={(e) => handleDateChange("year", e.target.value)}
                    className="w-full px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-blue-300 outline-none"
                  >
                    <option value="">Year</option>
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end mt-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <p className="text-base text-gray-700">{formatDisplayDate(value)}</p>
        </div>
      )}
    </div>
  )
}

// Editable Field Component
function EditableField({ label, name, value, onChange, editable = false, type = "text" }) {
  const isAddress = name === "address"

  return (
    <div className="col-span-4 md:col-span-2 p-4 rounded-lg border flex flex-col gap-1">
      <label htmlFor={name} className="text-sm text-gray-500">
        {label}
      </label>

      {editable ? (
        isAddress ? (
          <textarea
            rows={3}
            name={name}
            id={name}
            value={value}
            onChange={onChange}
            className="border rounded px-3 py-2 text-base outline-none focus:ring-2 ring-blue-300 resize-none transition-all"
            placeholder="e.g. Poblacion 4, Victoria, Oriental Mindoro"
          />
        ) : (
          <input
            type={type}
            name={name}
            id={name}
            value={value}
            onChange={onChange}
            className="border rounded px-3 py-2 text-base outline-none focus:ring-2 ring-blue-300 transition-all"
          />
        )
      ) : (
        <p className="text-base text-gray-700">{value || "Not provided"}</p>
      )}
    </div>
  )
}

// Main Profile Page Component
export default function ProfilePage() {
  const { user, userData, loading } = useUser()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [showSkeleton, setShowSkeleton] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({
    fullname: "",
    phone: "",
    address: "",
    gender: "",
    birthday: "",
  })

  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState("success")
  const [modalMessage, setModalMessage] = useState("")

  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSkeleton(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  const skeleton = loading || !userData || showSkeleton

  useEffect(() => {
    if (userData) {
      setFormData({
        fullname: userData.fullname || "",
        phone: userData.phone || "",
        address: userData.address || "",
        gender: userData.gender || "",
        birthday: userData.birthday || "",
      })
    }
  }, [userData])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    if (!user?.uid) return

    try {
      const ref = doc(db, "users", user.uid)
      await updateDoc(ref, formData)
      setModalType("success")
      setModalMessage("Profile updated successfully!")
      setShowModal(true)
      setEditMode(false)
    } catch (err) {
      console.error("Error updating profile:", err)
      setModalType("error")
      setModalMessage("Failed to save changes. Please try again.")
      setShowModal(true)
    }
  }

  const handleCancel = () => {
    if (userData) {
      setFormData({
        fullname: userData.fullname || "",
        phone: userData.phone || "",
        address: userData.address || "",
        gender: userData.gender || "",
        birthday: userData.birthday || "",
      })
    }
    setEditMode(false)
  }

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

            <div
              className="w-full flex gap-6 transition-opacity duration-500 ease-in-out"
              style={{ opacity: skeleton ? 0.5 : 1 }}
            >
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
                        <h1 className="font-semibold text-2xl">{formData.fullname}</h1>
                        <span className="text-gray-500 text-sm">{userData?.email}</span>
                      </div>

                      <div className="flex items-center justify-center gap-2">
                        {editMode ? (
                          <>
                            <button
                              onClick={handleSave}
                              className="px-4 py-2 bg-green-500 text-white rounded-lg flex items-center gap-2 hover:bg-green-600 transition-colors"
                            >
                              <Save className="w-4 h-4" />
                              Save
                            </button>
                            <button
                              onClick={handleCancel}
                              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg flex items-center gap-2 hover:bg-gray-400 transition-colors"
                            >
                              <X className="w-4 h-4" />
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setEditMode(true)}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center gap-2 hover:bg-blue-600 transition-colors"
                          >
                            <UserPen className="w-5 h-5" />
                            Edit Profile
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profile Info */}
                <div className="flex flex-col p-6 rounded-2xl shadow bg-white border gap-10">
                  <div className="flex flex-col gap-4">
                    <h3 className="text-xl font-medium">Profile Information</h3>
                    <div className="grid grid-cols-4 gap-4">
                      <EditableField
                        label="Fullname"
                        name="fullname"
                        value={formData.fullname}
                        onChange={handleChange}
                        editable={editMode}
                      />
                      <ModernGenderField
                        label="Gender"
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        editable={editMode}
                      />
                      <CreativeBirthdayField
                        label="Birthday"
                        name="birthday"
                        value={formData.birthday}
                        onChange={handleChange}
                        editable={editMode}
                      />
                      <EditableField
                        label="Phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        editable={editMode}
                      />
                      <div className="col-span-4">
                        <EditableField
                          label="Address"
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          editable={editMode}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Notifications />
            </div>
          </div>
        </div>
      </main>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} type={modalType} message={modalMessage} />
    </div>
  )
}
