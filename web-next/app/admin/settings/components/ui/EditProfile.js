"use client"

import { useState, useEffect, useRef } from "react"
import { Upload, Trash2, Save, X, Check } from "lucide-react"
import Image from "next/image"
import { db, auth, storage } from "../../../../config/firebaseConfig"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { onAuthStateChanged } from "firebase/auth"
import { trackProfileChanges } from "../../../../lib/notifications/ProfileChangeTracker.js"

export default function EditProfile() {
  const [profileImage, setProfileImage] = useState("/default.png")
  const [globalMessage, setGlobalMessage] = useState("")
  const [userData, setUserData] = useState({
    fullname: "",
    birthday: "",
    age: "",
    gender: "",
    email: "",
    phone: "",
    address: "",
    profileImageUrl: "",
  })
  const [loading, setLoading] = useState(true)
  const [originalUserData, setOriginalUserData] = useState({})

  // Cropping states
  const [showCropModal, setShowCropModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [imageSrc, setImageSrc] = useState("")
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const cropContainerRef = useRef(null)
  const cropImageRef = useRef(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const startTime = Date.now()

      if (user) {
        try {
          const docRef = doc(db, "users", user.uid)
          const docSnap = await getDoc(docRef)

          if (docSnap.exists()) {
            const data = docSnap.data()

            let age = ""
            if (data.birthday) {
              const birthDate = new Date(data.birthday)
              const today = new Date()
              age = today.getFullYear() - birthDate.getFullYear()
              const m = today.getMonth() - birthDate.getMonth()
              if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--
              }
            }

            const userDataObj = {
              fullname: data.fullname || "",
              birthday: data.birthday || "",
              age: age.toString(),
              gender: data.gender || "",
              email: data.email || "",
              phone: data.phone || "",
              address: data.address || "",
              profileImageUrl: data.profileImageUrl || "",
            }

            setUserData(userDataObj)
            setOriginalUserData(userDataObj)
            setProfileImage(data.profileImageUrl || "/default.png")
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
          setGlobalMessage("Error loading profile data")
        }
      }

      const elapsed = Date.now() - startTime
      const remaining = 500 - elapsed
      if (remaining > 0) {
        setTimeout(() => setLoading(false), remaining)
      } else {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target

    const updatedData = {
      ...userData,
      [name]: value,
    }

    if (name === "birthday") {
      const birthDate = new Date(value)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const m = today.getMonth() - birthDate.getMonth()
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      updatedData.age = age.toString()
    }

    setUserData(updatedData)
  }

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Check file size (5MB limit)
    const fileSize = file.size / 1024 / 1024
    if (fileSize > 5) {
      setGlobalMessage("Image size must not exceed 5MB")
      return
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      setGlobalMessage("Please select a valid image file")
      return
    }

    setSelectedFile(file)

    // Create image URL for cropping
    const reader = new FileReader()
    reader.onload = () => {
      setImageSrc(reader.result)
      setShowCropModal(true)
      // Reset crop position
      setCropPosition({ x: 0, y: 0 })
    }
    reader.readAsDataURL(file)
  }

  // Handle crop area dragging
  const handleCropMouseDown = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)

    const cropArea = e.currentTarget
    const rect = cropArea.getBoundingClientRect()
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  const handleMouseMove = (e) => {
    if (!isDragging || !cropContainerRef.current) return

    const containerRect = cropContainerRef.current.getBoundingClientRect()
    const newX = e.clientX - containerRect.left - dragStart.x
    const newY = e.clientY - containerRect.top - dragStart.y

    // Constrain within bounds (200x200 is crop size)
    const maxX = containerRect.width - 200
    const maxY = containerRect.height - 200
    const constrainedX = Math.max(0, Math.min(newX, maxX))
    const constrainedY = Math.max(0, Math.min(newY, maxY))

    setCropPosition({ x: constrainedX, y: constrainedY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Add global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging, dragStart])

  const getCroppedImage = () => {
    return new Promise((resolve, reject) => {
      const imgEl = cropImageRef.current;
      const container = cropContainerRef.current;
      if (!imgEl || !container) return reject("Refs not ready");

      // 1) natural vs displayed size
      const { naturalWidth, naturalHeight } = imgEl;
      const displayedWidth  = imgEl.clientWidth;
      const displayedHeight = imgEl.clientHeight;

      // 2) how the image is offset inside the container
      const containerW = container.clientWidth;
      const containerH = container.clientHeight;
      const offsetX = (containerW - displayedWidth) / 2;
      const offsetY = (containerH - displayedHeight) / 2;

      // 3) scale factors
      const scaleX = naturalWidth  / displayedWidth;
      const scaleY = naturalHeight / displayedHeight;

      // 4) crop-box in natural px
      const cropX = (cropPosition.x - offsetX) * scaleX;
      const cropY = (cropPosition.y - offsetY) * scaleY;
      const cropW = 200 * scaleX;  // your overlay is 200×200
      const cropH = 200 * scaleY;

      // clamp to image bounds
      const sx = Math.max(0, Math.min(cropX, naturalWidth  - cropW));
      const sy = Math.max(0, Math.min(cropY, naturalHeight - cropH));

      // 5) draw
      const canvas = document.createElement("canvas");
      canvas.width  = 200;
      canvas.height = 200;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(
        imgEl,
        sx, sy, cropW, cropH,      // source rect
        0, 0, 200, 200             // dest rect
      );

      canvas.toBlob(blob => {
        if (!blob) return reject("Canvas toBlob failed");
        resolve(blob);
      }, "image/jpeg", 0.9);
    });
  }


  const handleCropComplete = async () => {
    try {
      const croppedBlob = await getCroppedImage()
      if (!croppedBlob) {
        setGlobalMessage("Error processing image")
        return
      }

      await uploadCroppedImage(croppedBlob)
      setShowCropModal(false)
      setImageSrc("")
      setSelectedFile(null)
    } catch (error) {
      console.error("Error cropping image:", error)
      setGlobalMessage("Error processing image")
    }
  }

  const uploadCroppedImage = async (croppedImageBlob) => {
    try {
      const user = auth.currentUser
      if (!user) {
        setGlobalMessage("Please log in to upload an image")
        return
      }

      const oldData = { ...userData }

      const storageRef = ref(storage, `profile-images/${user.uid}`)
      await uploadBytes(storageRef, croppedImageBlob)
      const downloadURL = await getDownloadURL(storageRef)

      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, {
        profileImageUrl: downloadURL,
      })

      setProfileImage(downloadURL)
      setUserData((prev) => ({
        ...prev,
        profileImageUrl: downloadURL,
      }))

      const newData = { ...userData, profileImageUrl: downloadURL }
      await trackProfileChanges(user.uid, oldData, newData)

      setGlobalMessage("Profile image updated successfully!")
    } catch (error) {
      console.error("Error uploading image:", error)
      setGlobalMessage("Error uploading image")
    }

    setTimeout(() => {
      setGlobalMessage("")
    }, 3000)
  }

  const handleImageRemove = async () => {
    try {
      const user = auth.currentUser
      if (!user) {
        setGlobalMessage("Please log in to remove the image")
        return
      }

      const oldData = { ...userData }

      if (userData.profileImageUrl) {
        const storageRef = ref(storage, `profile-images/${user.uid}`)
        await deleteObject(storageRef)
      }

      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, {
        profileImageUrl: "",
      })

      setProfileImage("/default.png")
      setUserData((prev) => ({
        ...prev,
        profileImageUrl: "",
      }))

      const newData = { ...userData, profileImageUrl: "" }
      await trackProfileChanges(user.uid, oldData, newData)

      setGlobalMessage("Profile image removed successfully!")
    } catch (error) {
      console.error("Error removing image:", error)
      setGlobalMessage("Error removing image")
    }

    setTimeout(() => {
      setGlobalMessage("")
    }, 3000)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      const user = auth.currentUser
      if (!user) {
        setGlobalMessage("Please log in to save changes")
        return
      }

      const oldData = { ...originalUserData }

      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, userData)

      await trackProfileChanges(user.uid, oldData, userData)

      setOriginalUserData({ ...userData })

      setGlobalMessage("Profile updated successfully!")
    } catch (error) {
      console.error("Error updating profile:", error)
      setGlobalMessage("Error updating profile")
    }

    setTimeout(() => {
      setGlobalMessage("")
    }, 3000)
  }

  if (loading) {
    return (
      <div className="border-l flex flex-1 flex-col gap-10 lg:gap-8 p-8 bg-white border xl:bg-none rounded-2xl xl:rounded-none shadow xl:shadow-none w-full animate-pulse">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <div className="w-40 h-6 bg-gray-300 rounded" />
            <div className="w-72 h-4 bg-gray-200 rounded" />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-8">
            <div className="w-28 h-28 rounded-full bg-gray-300" />
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <div className="w-40 h-10 bg-gray-300 rounded" />
              <div className="w-40 h-10 bg-gray-200 rounded" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="w-40 h-6 bg-gray-300 rounded" />
          <div className="flex flex-col xl:flex-row gap-8">
            <div className="w-full text-sm text-gray-400">
              <div className="h-4 bg-gray-200 w-3/4 mb-2 rounded" />
              <div className="h-4 bg-gray-200 w-1/2 rounded" />
            </div>

            <div className="w-full grid grid-cols-3 gap-4">
              <div className="col-span-3 h-10 bg-gray-200 rounded" />
              <div className="col-span-2 h-10 bg-gray-200 rounded" />
              <div className="col-span-1 h-10 bg-gray-200 rounded" />
              <div className="col-span-3 h-10 bg-gray-200 rounded" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="w-40 h-6 bg-gray-300 rounded" />
          <div className="flex flex-col xl:flex-row gap-8">
            <div className="w-full text-sm text-gray-400">
              <div className="h-4 bg-gray-200 w-3/4 mb-2 rounded" />
              <div className="h-4 bg-gray-200 w-1/2 rounded" />
            </div>

            <div className="w-full grid grid-cols-3 gap-4">
              <div className="col-span-3 h-10 bg-gray-200 rounded" />
              <div className="col-span-3 h-10 bg-gray-200 rounded" />
              <div className="col-span-3 h-10 bg-gray-200 rounded" />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <div className="w-32 h-10 bg-gray-300 rounded" />
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Crop Modal */}
      {showCropModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Crop Image</h3>
              <button
                onClick={() => {
                  setShowCropModal(false)
                  setImageSrc("")
                  setSelectedFile(null)
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <div
                ref={cropContainerRef}
                className="relative w-full h-96 overflow-hidden rounded-lg bg-black flex items-center justify-center"
                style={{ userSelect: "none" }}
              >
                <img
                  ref={cropImageRef}
                  src={imageSrc || "/placeholder.svg"}
                  alt="Crop preview"
                  className="max-w-full max-h-full object-contain"
                  draggable={false}
                />

                {/* Crop overlay */}
                  <div
                    className="absolute cursor-move rounded-full overflow-hidden"
                    style={{
                      left: cropPosition.x,
                      top: cropPosition.y,
                      width: 300,
                      height: 300,
                      boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
                      border: "2px solid white",
                    }}
                    onMouseDown={handleCropMouseDown}
                  >
                  <div className="w-full h-full border border-dashed border-white/50" />
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded pointer-events-none">
                    Drag to move
                  </div>
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-500 mb-4">
              Drag the white square to position your crop area. The selected area will be used as your profile picture.
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowCropModal(false)
                  setImageSrc("")
                  setSelectedFile(null)
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors duration-150"
              >
                Cancel
              </button>
              <button
                onClick={handleCropComplete}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-150 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Apply Crop
              </button>
            </div>
          </div>
        </div>
      )}

      <form className="border-l flex flex-1 flex-col gap-10 lg:gap-8 p-8 bg-white border s xl:bg-none rounded-2xl xl:rounded-none shadow xl:shadow-none w-full">
        {globalMessage && (
          <div
            className={`border-l-4 rounded-lg px-4 py-2 w-full  ${
              globalMessage.includes("successful")
                ? "bg-green-100 border-green-500 text-green-500"
                : "bg-red-100 border-red-500 text-red-500"
            }`}
          >
            {globalMessage}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-xl font-medium">Profile Picture</h3>
            <span className="text-gray-500 text-sm">
              <span className="font-semibold">Note:</span> Image must not exceed 5MB. You can crop the image after
              selection.
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-8">
            <div className="relative rounded-full w-36 h-36 border border-blue-500 overflow-hidden">
              <Image
                src={profileImage === "/default.png" ? "/default.png" : profileImage}
                alt="Profile"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <label className="cursor-pointer flex items-center gap-4 px-4 py-2 rounded-lg bg-blue-500 text-white transition-colors duration-150 hover:bg-blue-600">
                <Upload className="w-5 h-5" /> Upload Image
                <input type="file" className="hidden" accept="image/*" onChange={handleFileSelect} />
              </label>
              <button
                type="button"
                onClick={handleImageRemove}
                className="flex items-center gap-4 px-4 py-2 rounded-lg border text-red-600 hover:bg-gray-300/20 transition-colors duration-150"
              >
                <Trash2 className="w-5 h-5" /> Remove Image
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <h3 className="text-xl font-medium">Basic information</h3>

          <div className="flex flex-col xl:flex-row gap- xl:gap-8">
            <div className="w-full text-gray-500 text-sm mb-4 xl:mb-0">
              Basic details used for identification, verification, and communication.
            </div>

            <div className="w-full grid grid-cols-3 gap-4">
              <div className="col-span-3 flex flex-col gap-1 justify-center">
                <label htmlFor="fullname">Fullname</label>
                <input
                  type="text"
                  name="fullname"
                  id="fullname"
                  value={userData.fullname}
                  onChange={handleInputChange}
                  className="border rounded-lg px-4 py-2 outline-none focus:border-blue-500 transition-colors duration-150"
                  placeholder="Enter your fullname"
                />
              </div>
              <div className="col-span-2 flex flex-col gap-1 justify-center">
                <label htmlFor="birthday">Birthday</label>
                <input
                  type="date"
                  name="birthday"
                  id="birthday"
                  value={userData.birthday}
                  onChange={handleInputChange}
                  className="border rounded-lg px-4 py-2 outline-none focus:border-blue-500 transition-colors duration-150"
                />
              </div>
              <div className="col-span-1 flex flex-col gap-1 justify-center">
                <label htmlFor="age">Age</label>
                <input
                  type="text"
                  name="age"
                  id="age"
                  value={userData.age}
                  readOnly
                  className="border bg-gray-100 text-gray-700 rounded-lg px-4 py-2 outline-none"
                  placeholder="Auto-calculated"
                />
              </div>
              <div className="col-span-3 flex flex-col gap-1 justify-center">
                <label htmlFor="gender">Gender</label>
                <select
                  name="gender"
                  id="gender"
                  value={userData.gender}
                  onChange={handleInputChange}
                  className="border rounded-lg px-4 py-2 outline-none focus:border-blue-500 transition-colors duration-150"
                >
                  <option value="">Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <h3 className="text-xl font-medium">Contact details</h3>

          <div className="flex flex-col xl:flex-row gap- xl:gap-8">
            <div className="w-full text-gray-500 text-sm mb-4 xl:mb-0">
              Essential information for communication and correspondence.
            </div>

            <div className="w-full grid grid-cols-3 gap-4">
              <div className="col-span-3 flex flex-col gap-1 justify-center">
                <label htmlFor="email">Email address</label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={userData.email}
                  onChange={handleInputChange}
                  className="border rounded-lg px-4 py-2 outline-none focus:border-blue-500 transition-colors duration-150"
                  placeholder="Enter your email"
                />
              </div>
              <div className="col-span-3 flex flex-col gap-1 justify-center">
                <label htmlFor="phone">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  value={userData.phone}
                  onChange={handleInputChange}
                  className="border rounded-lg px-4 py-2 outline-none focus:border-blue-500 transition-colors duration-150"
                  placeholder="Enter your phone number"
                />
              </div>
              <div className="col-span-3 flex flex-col gap-1 justify-center">
                <label htmlFor="address">Residential Address</label>
                <input
                  type="text"
                  name="address"
                  id="address"
                  value={userData.address}
                  onChange={handleInputChange}
                  className="border rounded-lg px-4 py-2 outline-none focus:border-blue-500 transition-colors duration-150"
                  placeholder="Enter your address"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-4 py-2 rounded-lg bg-blue-500 transition-colors duration-150 hover:bg-blue-600 text-white flex items-center gap-4"
          >
            <Save className="w-5 h-5" />
            Save changes
          </button>
        </div>
      </form>
    </>
  )
}
