import { loadTodos, updateTodoOffline, initDB, addTodoOffline } from "./database";
import { addTodoToFirestore, fetchTodosFromFirestore } from "./firestore";
import { requestNotificationPermissionAsync, scheduleNotification } from "./notifications";

export async function syncLocalToFirestore(uid) {
  if (!uid) throw new Error("syncLocalToFirestore: uid required");
  await initDB();
  const local = await loadTodos();
  const unsynced = local.filter((t) => !t.synced || t.synced === 0);
  const results = [];
  for (const t of unsynced) {
    try {
      const remoteId = await addTodoToFirestore(uid, { title: t.title, createdAt: t.createdAt });
      // mark as synced locally and store remoteId
      await updateTodoOffline(t.id, { synced: 1, remoteId });
      results.push({ id: t.id, status: "synced", remoteId });
    } catch (e) {
      results.push({ id: t.id, status: "error", error: e.message });
    }
  }
  return results;
}

export async function syncFirestoreToLocal(uid) {
  if (!uid) throw new Error("syncFirestoreToLocal: uid required");
  await initDB();
  const remote = await fetchTodosFromFirestore(uid);
  const local = await loadTodos();
  const results = [];
  for (const r of remote) {
    const exists = local.find((l) => l.remoteId === r.id);
    if (!exists) {
      // insert locally and mark as synced
      const createdAt = r.createdAt?.seconds ? r.createdAt.seconds * 1000 : Date.now();
      const inserted = await addTodoOffline({ title: r.title, completed: r.completed ? 1 : 0, createdAt, synced: 1, remoteId: r.id });
      // if remote has reminderAt, schedule local notification
      if (r.reminderAt) {
        const reminderTs = r.reminderAt.seconds ? r.reminderAt.seconds * 1000 : Number(r.reminderAt);
        try {
          const ok = await requestNotificationPermissionAsync();
          if (ok) {
            const notificationId = await scheduleNotification(r.title, "Rappel tâche", reminderTs);
            // store notificationId locally
            await updateTodoOffline(inserted.id, { notificationId });
          }
        } catch (e) {
          console.warn("schedule on import error", e.message);
        }
      }
      results.push({ remoteId: r.id, localId: inserted.id, status: "inserted" });
    } else {
      results.push({ remoteId: r.id, localId: exists.id, status: "exists" });
    }
  }
  return results;
}

export default {
  syncLocalToFirestore,
  syncFirestoreToLocal,
};
