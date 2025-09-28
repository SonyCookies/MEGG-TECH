"use client"

import { Navbar } from "../../components/NavBar"
import { Header } from "../../components/Header"
import { useState, useEffect, useRef } from "react"
import { Monitor, MonitorIcon as MonitorCog, Loader2, AlertCircle, Plus, ChevronLeft, ChevronsLeft, ChevronRight, ChevronsRight, ChevronDown, TriangleAlert, X, Trash } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { db } from "../../config/firebaseConfig"
import { doc, onSnapshot, getDoc } from "firebase/firestore"
import QRCodeScanner from "../../components/QRCodeScanner"
import { Html5Qrcode } from "html5-qrcode"
import { unlinkMachineFromUser, modifyMachine } from "../../utils/machine-link"

export default function MachinesPage() {
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const [machines, setMachines] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [selectedMachine, setSelectedMachine] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editValues, setEditValues] = useState({ name: "", location: "" })
  const [showAddMachineModal, setShowAddMachineModal] = useState(false)
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false)
  const [machineToDelete, setMachineToDelete] = useState(null)
  const [enteredMachineName, setEnteredMachineName] = useState("")

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(6)
  const [showRowsDropdown, setShowRowsDropdown] = useState(false)
  const rowsDropdownRef = useRef(null)

  // Add state for operation feedback
  const [operationError, setOperationError] = useState("")
  const [operationLoading, setOperationLoading] = useState(false)

  const router = useRouter()

  const handleManageMachines = () => {
    router.push("/admin/settings?component=AddMachines")
  }

  // Get current user from Firebase
  useEffect(() => {
    const auth = getAuth()
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("Current user:", user.uid)
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
        })
      } else {
        console.log("No user signed in")
        setCurrentUser(null)
      }
    })

    return () => unsubscribe()
  }, [])

  // Fetch linked machines when user is available
  useEffect(() => {
    let unsubscribeUser = null;
    let machineUnsubscribes = [];

    const fetchLinkedMachines = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const userRef = doc(db, "users", currentUser.uid);
        unsubscribeUser = onSnapshot(
          userRef,
          (userDoc) => {
            if (!userDoc.exists()) {
              setMachines([]);
              setLoading(false);
              return;
            }

            const userData = userDoc.data();
            const linkedMachineIds = userData.linkedMachines || [];

            // Clean up previous machine listeners
            machineUnsubscribes.forEach((unsub) => unsub());
            machineUnsubscribes = [];

            if (linkedMachineIds.length === 0) {
              setMachines([]);
              setLoading(false);
              return;
            }

            // Set up real-time listeners for each machine
            let machinesArr = [];
            linkedMachineIds.forEach((machineId) => {
              const machineRef = doc(db, "machines", machineId);
              const unsubscribe = onSnapshot(machineRef, (machineSnap) => {
                if (machineSnap.exists()) {
                  const data = machineSnap.data();
                  const machineObj = {
                    id: machineId,
                    name: data.name || `Machine-${machineId.substring(0, 4)}`,
                    added: formatDate(data.linkedUsers?.[currentUser.uid]?.linkedAt || new Date()),
                    image: data.imageUrl || "/default.png",
                    location: data.location,
                    model: data.model,
                    linkedAt: data.linkedUsers?.[currentUser.uid]?.linkedAt,
                  };
                  machinesArr = [
                    ...machinesArr.filter((m) => m.id !== machineId),
                    machineObj,
                  ];
                  setMachines([...machinesArr]);
                } else {
                  // Remove from machinesArr if deleted
                  machinesArr = machinesArr.filter((m) => m.id !== machineId);
                  setMachines([...machinesArr]);
                }
                setLoading(false);
              });
              machineUnsubscribes.push(unsubscribe);
            });
          },
          (error) => {
            console.error("Error fetching user data:", error);
            setError("Failed to load your linked machines");
            setLoading(false);
          }
        );
      } catch (err) {
        console.error("Error setting up machine listeners:", err);
        setError("Failed to load your linked machines");
        setLoading(false);
      }
    };

    fetchLinkedMachines();

    return () => {
      if (unsubscribeUser) {
        unsubscribeUser();
      }
      machineUnsubscribes.forEach((unsub) => unsub());
    };
  }, [currentUser]);

  const formatDate = (dateString) => {
    try {
      if (typeof dateString === "object" && dateString.toDate) {
        return dateString.toDate().toLocaleDateString()
      }
      if (typeof dateString === "object" && dateString.seconds) {
        return new Date(dateString.seconds * 1000).toLocaleDateString()
      }
      return new Date(dateString).toLocaleDateString()
    } catch (e) {
      console.error("Error formatting date:", e)
      return "Unknown date"
    }
  }

  const handleMachineSelect = (machineId) => {
    if (selectedMachine === machineId) {
      setSelectedMachine(null)
    } else {
      setSelectedMachine(machineId)
    }
  }

  const handleDeleteClick = (machine) => {
    setMachineToDelete(machine)
    setEnteredMachineName("")
    setShowConfirmDeleteModal(true)
  }

  // Pagination functions
  const totalPages = Math.ceil(machines.length / rowsPerPage)
  const goToFirstPage = () => setCurrentPage(1)
  const goToPreviousPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1))
  const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  const goToLastPage = () => setCurrentPage(totalPages)

  const totalMachines = machines.length
  const overviewData = selectedMachine ? machines.find((machine) => machine.id === selectedMachine) : null

  const startCameraScan = () => {
    setScanMode('camera');
    setIsScanning(true);
    setTimeout(() => {
      const html5QrCode = new Html5Qrcode("qr-reader");
      window.html5QrCodeInstance = html5QrCode;
      html5QrCode
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 350, height: 350 } },
          (decodedText) => {
            handleQRCodeScanned(decodedText);
            html5QrCode.stop();
            setIsScanning(false);
          }
        )
        .catch(() => {
          setScanError("Error accessing camera. Please try again.");
          setIsScanning(false);
        });
    }, 100);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanMode('upload');
    setIsScanning(true);
    try {
      const html5QrCode = new Html5Qrcode("qr-reader-hidden");
      window.html5QrCodeInstance = html5QrCode;
      const decodedText = await html5QrCode.scanFile(file, false);
      html5QrCode.clear();
      handleQRCodeScanned(decodedText);
      setIsScanning(false);
    } catch (error) {
      setScanError("Could not read QR code from image. Please try another image or use the camera scanner.");
      setIsScanning(false);
    }
  };

  useEffect(() => {
    return () => {
      if (window.html5QrCodeInstance) {
        window.html5QrCodeInstance.stop().catch(() => {});
        window.html5QrCodeInstance = null;
      }
    };
  }, []);

  // Remove (unlink) machine handler
  const handleRemoveMachine = async () => {
    if (!machineToDelete || !currentUser) return;
    setOperationLoading(true);
    setOperationError("");
    try {
      await unlinkMachineFromUser(machineToDelete.id, currentUser.uid);
      setShowConfirmDeleteModal(false);
      setEnteredMachineName("");
      setSelectedMachine(null);
      // Optionally, refresh machines list by refetching or let onSnapshot update
    } catch (err) {
      setOperationError("Failed to remove machine: " + (err.message || err));
    } finally {
      setOperationLoading(false);
    }
  };

  // Modify (edit) machine handler
  const handleSaveEdit = async () => {
    if (!selectedMachine) return;
    setOperationLoading(true);
    setOperationError("");
    try {
      await modifyMachine(selectedMachine, {
        name: editValues.name,
        location: editValues.location,
      });
      setIsEditing(false);
      // Optionally, refresh machines list by refetching or let onSnapshot update
    } catch (err) {
      setOperationError("Failed to modify machine: " + (err.message || err));
    } finally {
      setOperationLoading(false);
    }
  };

  return (
    <div className="min-h-screen container mx-auto text-[#1F2421] relative">
      {/* Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`fixed z-50 inset-y-0 left-0 w-80 bg-white transform shadow-lg transition-transform duration-300 ease-in-out lg:hidden ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Navbar />
      </div>

      {/* MAIN */}
      <div className="flex gap-6 p-4 md:p-6">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Navbar />
        </div>

        <div className="flex flex-1 flex-col gap-6 w-full">
          {/* Header */}
          <Header setSidebarOpen={setSidebarOpen} />

          {/* Main container */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col-reverse xl:flex-row gap-6 items-start">
                <div className="flex flex-col gap-6 w-full">
                  {/* total machines */}
                  <div className="relative bg-white rounded-2xl border border-gray-300 p-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="flex flex-col sm:flex-row sm:flex-1 items-center gap-4">
                      <div className="absolute sm:static top-4 left-4 flex items-center justify-center rounded-full bg-blue-100 p-4">
                        <Monitor className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
                      </div>
                      <div className="flex flex-col text-center sm:text-start gap-1">
                        <span className="text-gray-500">Total Machines</span>
                        <span className="text-4xl font-bold text-blue-500">
                          {totalMachines}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => setShowAddMachineModal(true)}
                        className="bg-gray-100 transition-colors hover:bg-blue-500 hover:text-white cursor-pointer duration-150 px-4 py-2 rounded-full flex items-center gap-2"
                      >
                        <Plus className="w-5 h-5" />
                        Add machine
                      </button>
                    </div>
                  </div>

                  {/* machines data */}
                  <div className="bg-white rounded-2xl border border-gray-300 p-6 flex flex-col gap-8">
                    <div className="flex flex-col gap-4">
                      <h3 className="font-medium">
                        {selectedMachine ? (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">
                              <span className="text-xl font-semibold text-black">
                                {overviewData?.name}
                              </span>
                            </span>
                            <button
                              onClick={() => setSelectedMachine(null)}
                              className="text-sm text-blue-500 hover:text-blue-600 cursor-pointer"
                            >
                              (Clear Selection)
                            </button>
                          </div>
                        ) : (
                          <span className="text-xl font-medium">
                            List of Machines
                          </span>
                        )}
                      </h3>

                      {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                          <p className="text-gray-500">Loading your machines...</p>
                        </div>
                      ) : error ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                          <p className="text-red-500 font-medium">{error}</p>
                          <p className="text-gray-500 mt-2">Please try refreshing the page.</p>
                        </div>
                      ) : machines.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <Monitor className="w-12 h-12 text-gray-300 mb-4" />
                          <p className="text-gray-700 font-medium">No machines linked</p>
                          <p className="text-gray-500 mt-2">You don't have any machines linked to your account yet.</p>
                          <button
                            type="button"
                            onClick={handleManageMachines}
                            className="mt-4 px-4 py-2 rounded-lg bg-blue-500 transition-colors duration-150 text-white hover:bg-blue-600 flex items-center gap-2"
                          >
                            <MonitorCog className="w-4 h-4" />
                            <span>Add Machines</span>
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          {machines.map((machine) => (
                            <div
                              key={machine.id}
                              className={`col-span-2 md:col-span-1 rounded-lg border ${
                                selectedMachine === machine.id
                                  ? "border-2 border-blue-500"
                                  : "border-gray-300 hover:bg-gray-50"
                              } flex gap-4 items-center px-4 py-4 transition-colors duration-150 cursor-pointer`}
                              onClick={() => handleMachineSelect(machine.id)}
                            >
                              <div className="relative rounded-full w-16 h-16 border border-blue-500 overflow-hidden">
                                <Image
                                  src={machine.image || "/default.png"}
                                  alt={`${machine.name} Logo`}
                                  fill
                                  className="object-cover"
                                  priority
                                />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-lg font-bold">{machine.name}</span>
                                <span className="text-gray-500 text-sm">
                                  Linked: {machine.added}
                                </span>
                                {machine.location && (
                                  <span className="text-gray-500 text-sm">Location: {machine.location}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* pagination */}
                    {machines.length > 0 && (
                      <div className="flex flex-col-reverse gap-4 items-center justify-center md:flex-row md:justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={goToFirstPage}
                            disabled={currentPage === 1}
                            className={`p-2 rounded-lg border ${
                              currentPage === 1
                                ? "text-gray-300 cursor-not-allowed"
                                : "text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            <ChevronsLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={goToPreviousPage}
                            disabled={currentPage === 1}
                            className={`p-2 rounded-lg border ${
                              currentPage === 1
                                ? "text-gray-300 cursor-not-allowed"
                                : "text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>

                          <div className="text-sm border rounded-lg px-4 py-2 bg-blue-50 text-blue-600">
                            {currentPage}
                          </div>

                          <button
                            onClick={goToNextPage}
                            disabled={currentPage === totalPages}
                            className={`p-2 rounded-lg border ${
                              currentPage === totalPages
                                ? "text-gray-300 cursor-not-allowed"
                                : "text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <button
                            onClick={goToLastPage}
                            disabled={currentPage === totalPages}
                            className={`p-2 rounded-lg border ${
                              currentPage === totalPages
                                ? "text-gray-300 cursor-not-allowed"
                                : "text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            <ChevronsRight className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="relative" ref={rowsDropdownRef}>
                          <button
                            onClick={() => setShowRowsDropdown(!showRowsDropdown)}
                            className="text-sm border rounded-lg px-4 py-2 flex items-center gap-2 hover:bg-gray-50"
                          >
                            {rowsPerPage} per page
                            <ChevronDown
                              className={`w-4 h-4 transition-transform duration-200 ${
                                showRowsDropdown ? "rotate-180" : ""
                              }`}
                            />
                          </button>

                          {showRowsDropdown && (
                            <div className="absolute bottom-full mb-2 border bg-white shadow rounded-lg overflow-hidden z-40">
                              {[6, 9, 12, 15].map((value) => (
                                <button
                                  key={value}
                                  onClick={() => {
                                    setRowsPerPage(value)
                                    setShowRowsDropdown(false)
                                    setCurrentPage(1)
                                  }}
                                  className={`px-4 py-2 text-sm w-full text-left hover:bg-gray-50 ${
                                    rowsPerPage === value
                                      ? "bg-blue-50 text-blue-600"
                                      : ""
                                  }`}
                                >
                                  {value}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* select machine to edit */}
                <div className="bg-white rounded-2xl border border-gray-300 p-6 flex flex-col gap-6 w-full xl:max-w-sm">
                  {selectedMachine && overviewData ? (
                    <div className="flex flex-col gap-6">
                      <div className="flex flex-col gap-4 items-center justify-center">
                        <div className="bg-gray-100 rounded-full p-4">
                          <Monitor className="w-10 h-10 mx-auto text-gray-500" />
                        </div>
                        <div className="flex flex-col text-center">
                          {isEditing ? (
                            <input
                              type="text"
                              className="text-center text-xl font-bold rounded-lg border border-gray-300 px-4 py-2 outline-none transition-colors duration-150 focus:border-blue-500"
                              value={editValues.name}
                              onChange={(e) =>
                                setEditValues((prev) => ({
                                  ...prev,
                                  name: e.target.value,
                                }))
                              }
                            />
                          ) : (
                            <span className="text-center text-xl font-bold">
                              {overviewData.name}
                            </span>
                          )}
                          <span className="text-gray-500 text-sm">
                            {overviewData.added}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col">
                          <span className="text-gray-500">Location:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              className="px-4 py-2 rounded-lg border border-gray-300 outline-none transition-colors duration-150 focus:border-blue-500"
                              value={editValues.location}
                              onChange={(e) =>
                                setEditValues((prev) => ({
                                  ...prev,
                                  location: e.target.value,
                                }))
                              }
                            />
                          ) : (
                            <span>{overviewData.location || "No location set"}</span>
                          )}
                        </div>
                      </div>

                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 text-black transition-colors duration-150 w-full cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveEdit}
                            className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors duration-150 w-full cursor-pointer"
                            disabled={operationLoading}
                          >
                            {operationLoading ? "Saving..." : "Save changes"}
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setShowConfirmDeleteModal(true)
                              setMachineToDelete(overviewData)
                            }}
                            className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors duration-150 w-full cursor-pointer"
                          >
                            Remove
                          </button>
                          <button
                            onClick={() => {
                              setIsEditing(true)
                              setEditValues({
                                name: overviewData.name,
                                location: overviewData.location || "",
                              })
                            }}
                            className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors duration-150 w-full cursor-pointer"
                          >
                            Modify
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center flex-col gap-4 justify-center py-6">
                      <div className="bg-gray-100 rounded-full p-4">
                        <Monitor className="w-10 h-10 mx-auto text-gray-500 animate-pulse" />
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <h3 className="text-lg font-medium">
                          Select a machine to review
                        </h3>
                        <p className="text-gray-500 text-sm">
                          Click on any machine to view its details
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced Add Machine Modal */}
              {showAddMachineModal && (
                <div className="fixed inset-0 min-h-screen flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity duration-200 opacity-100 z-50">
                  <div className="bg-white p-6 rounded-2xl w-full max-w-2xl relative flex flex-col gap-6 transform transition-all duration-200 scale-100 opacity-100 max-h-[90vh] overflow-y-auto">
                    <button
                      onClick={() => setShowAddMachineModal(false)}
                      className="p-2 absolute top-3 right-3 active:bg-gray-100 rounded-lg cursor-pointer transition-colors hover:bg-gray-100"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="flex items-center p-2 rounded-full bg-blue-500">
                        <Monitor className="w-7 h-7 text-white" />
                      </div>
                      <span className="text-2xl font-bold text-center">
                        Add new machine
                      </span>
                      <p className="text-gray-500 text-center">
                        Scan or upload a QR code to link a machine to your account
                      </p>
                    </div>

                    <QRCodeScanner 
                      onQRCodeScanned={(machineData, result) => {
                        // Machine was successfully linked
                        setTimeout(() => {
                          setShowAddMachineModal(false)
                        }, 2000)
                      }}
                      onClose={() => setShowAddMachineModal(false)}
                      currentUser={currentUser}
                    />
                  </div>
                </div>
              )}

              {/* delete modal */}
              {showConfirmDeleteModal && machineToDelete && (
                <div className="fixed inset-0 min-h-screen flex items-center justify-center p-4 bg-black/10 backdrop-blur-xs transition-opacity duration-200 z-50">
                  <div className="bg-white p-6 rounded-2xl w-full max-w-md relative flex flex-col gap-6 transform transition-all duration-200">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="flex items-center p-2 rounded-full bg-red-500">
                        <Trash className="w-7 h-7 text-white" />
                      </div>
                      <span className="text-2xl font-bold text-center text-red-600">
                        Confirm Deletion
                      </span>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label htmlFor="" className="text-gray-500">
                        Please type <strong>{machineToDelete.name}</strong> to
                        confirm deletion.
                      </label>

                      <input
                        type="text"
                        value={enteredMachineName}
                        onChange={(e) => setEnteredMachineName(e.target.value)}
                        placeholder={`Enter ${machineToDelete.name}`}
                        className="px-4 py-2 border border-gray-300 rounded-lg outline-none transition-colors duration-150 focus:border-red-500"
                      />
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => setShowConfirmDeleteModal(false)}
                        className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleRemoveMachine}
                        className={`px-4 py-2 rounded-lg text-white transition-colors w-full ${
                          operationLoading || enteredMachineName.trim() !== machineToDelete.name
                            ? "bg-red-300 cursor-not-allowed"
                            : "bg-red-500 hover:bg-red-600 cursor-pointer"
                        }`}
                        disabled={operationLoading || enteredMachineName.trim() !== machineToDelete.name}
                      >
                        {operationLoading ? "Removing..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}