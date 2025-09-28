import { doc, updateDoc, getDoc, arrayRemove } from "firebase/firestore";
import { db } from "../config/firebaseConfig";

// Unlink (remove) a machine from a user
export async function unlinkMachineFromUser(machineId, userId) {
  // Remove user from machine's linkedUsers
  const machineRef = doc(db, "machines", machineId);
  const machineSnap = await getDoc(machineRef);
  if (!machineSnap.exists()) throw new Error("Machine not found");
  const data = machineSnap.data();
  const linkedUsers = { ...data.linkedUsers };
  delete linkedUsers[userId];
  await updateDoc(machineRef, { linkedUsers });

  // Remove machine from user's linkedMachines
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, { linkedMachines: arrayRemove(machineId) });

  // Optionally, mark the link as revoked in machine_users
  const linkRef = doc(db, "machine_users", `${machineId}_${userId}`);
  try {
    await updateDoc(linkRef, {
      status: "revoked",
      revokedAt: new Date().toISOString(),
    });
  } catch (e) {
    // If the doc doesn't exist, ignore
  }
}

// Modify (edit) a machine's details
export async function modifyMachine(machineId, updates) {
  const machineRef = doc(db, "machines", machineId);
  await updateDoc(machineRef, updates);
} 