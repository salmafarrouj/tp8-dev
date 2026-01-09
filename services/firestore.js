import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
  getDoc,
} from "firebase/firestore";

export async function fetchTodosFromFirestore(uid) {
  if (!uid) throw new Error("fetchTodosFromFirestore: uid required");
  const q = query(collection(db, "users", uid, "todos"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addTodoToFirestore(uid, todo) {
  if (!uid) throw new Error("addTodoToFirestore: uid required");
  const ref = await addDoc(collection(db, "users", uid, "todos"), {
    title: todo.title,
    completed: todo.completed ?? false,
    createdAt: serverTimestamp(),
    reminderAt: todo.reminderAt ?? null,
  });
  return ref.id;
}

export async function updateTodoInFirestore(uid, id, fields) {
  if (!uid || !id) throw new Error("updateTodoInFirestore: uid and id required");
  await updateDoc(doc(db, "users", uid, "todos", id), {
    ...fields,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTodoFromFirestore(uid, id) {
  if (!uid || !id) throw new Error("deleteTodoFromFirestore: uid and id required");
  await deleteDoc(doc(db, "users", uid, "todos", id));
}

export async function getTodoFromFirestore(uid, id) {
  if (!uid || !id) throw new Error("getTodoFromFirestore: uid and id required");
  const d = await getDoc(doc(db, "users", uid, "todos", id));
  if (!d.exists()) return null;
  return { id: d.id, ...d.data() };
}