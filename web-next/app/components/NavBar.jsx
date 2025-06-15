"use client";

import { useState, useEffect, useRef } from "react";
import { Menu, User, LogOut, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "../config/firebaseConfig"; // still used for signOut
import NotificationMobile from "./ui/NotificationMobile";
import { useUser } from "../context/UserContext"; // 👈 context import

export function Navbar({ mobileSidebarOpen, toggleMobileSidebar }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const profileRef = useRef(null);
  const pathname = usePathname();
  const router = useRouter();

  const { userData, user, loading } = useUser(); // 👈 use global user state

  const toggleProfileMenu = () => {
    setProfileOpen((prev) => !prev);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getPageTitle = () => {
    switch (pathname) {
      case "/":
      case "/admin/overview":
        return "Overview";
      case "/admin/settings":
        return "Settings";
      case "/admin/profile":
        return "Profile";
      case "/admin/inventory":
        return "Inventory";
      case "/admin/machines":
        return "Machines";
      case "/admin/notifications":
        return "Notifications";
      case "/admin/history":
        return "History";
      default:
        return "Overview";
    }
  };

  // Show nothing or a minimal loading bar while context is initializing
  if (loading) return null;

  return (
    <nav className="sticky top-4 z-40 bg-red500">
      <div className="relative container mx-auto">
        {/* navbar container */}
        <div className="bg-white border p-4 rounded-2xl shadow flex items-center justify-between">
          {/* left */}
          <div className="flex items-center gap-2 w-full">
            <button
              onClick={toggleMobileSidebar}
              className="p-2 hover:bg-gray-300/20 rounded-lg flex lg:hidden"
            >
              {mobileSidebarOpen ? <X /> : <Menu />}
            </button>

            <h1 className="hidden md:flex font-semibold text-xl lg:text-2xl xl:ps-2 ">
              {getPageTitle()}
            </h1>
          </div>

          {/* center logo */}
          <div className="flex items-center justify-center w-full">
            <div className="relative rounded-full w-10 h-10 overflow-hidden">
              <Image
                src="/logo.png"
                alt="Megg Logo"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>

          {/* right */}
          <div className="flex items-center gap-2 justify-end w-full">
            <NotificationMobile
              notificationOpen={notificationOpen}
              setNotificationOpen={setNotificationOpen}
            />

            {/* profile */}
            <button
              onClick={toggleProfileMenu}
              className="flex items-center gap-2"
            >
              <div className="hidden xl:flex flex-col text-end">
                <h3 className="font-medium">
                  {userData?.username || "Name here"}
                </h3>
                <span className="text-gray-500 text-sm">
                  {userData?.email || "name@example.com"}
                </span>
              </div>

              <div className="relative rounded-full w-10 h-10 overflow-hidden">
                <Image
                  src={userData?.profileImageUrl || "/default.png"}
                  alt="Profile picture"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </button>
          </div>
        </div>

        {/* profile dropdown */}
        {profileOpen && (
          <div
            ref={profileRef}
            className="absolute bg-white rounded-2xl shadow right-0 top-full mt-4 w-72 overflow-hidden border"
          >
            <div className="flex flex-col gap-4 p-4">
              <div className="flex items-center gap-2">
                <div className="relative rounded-full w-10 h-10 overflow-hidden">
                  <Image
                    src={userData?.profileImageUrl || "/default.png"}
                    alt="Profile picture"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                <div className="flex flex-col">
                  <h3 className="font-medium">
                    {userData?.username || "Name here"}
                  </h3>
                  <span className="text-gray-500 text-sm">
                    {userData?.email || "name@example.com"}
                  </span>
                </div>
              </div>

              <hr />

              {/* dropdown links */}
              <div className="flex flex-col">
                <Link
                  href="/admin/profile"
                  className="flex items-center gap-2 px-4 py-3 hover:bg-gray-300/20 rounded-lg"
                >
                  <User className="w-5 h-5" />
                  My profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-4 py-3 hover:bg-gray-300/20 text-red-600 w-full rounded-lg"
                >
                  <LogOut className="w-5 h-5" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
