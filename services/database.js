import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabase("todos.db");

export const initDB = () =>
	new Promise((resolve, reject) => {
		db.transaction(
			(tx) => {
				tx.executeSql(
					`CREATE TABLE IF NOT EXISTS todos (
						id INTEGER PRIMARY KEY AUTOINCREMENT,
						title TEXT NOT NULL,
						completed INTEGER DEFAULT 0,
						createdAt INTEGER,
						synced INTEGER DEFAULT 0,
						remoteId TEXT,
						reminderAt INTEGER,
						notificationId TEXT
					);`,
					[]
				);
			},
			(err) => reject(err),
			() => resolve()
		);
	});

export const addTodoOffline = (todo) =>
	new Promise((resolve, reject) => {
		const {
			title,
			completed = 0,
			createdAt = Date.now(),
			synced = 0,
			remoteId = null,
			reminderAt = null,
			notificationId = null,
		} = typeof todo === "string" ? { title: todo } : todo;
		db.transaction(
			(tx) => {
				tx.executeSql(
					  "INSERT INTO todos (title, completed, createdAt, synced, remoteId, reminderAt, notificationId) VALUES (?, ?, ?, ?, ?, ?, ?);",
					  [title, completed ? 1 : 0, createdAt, synced, remoteId, reminderAt, notificationId],
					  (_, result) => resolve({ id: result.insertId, title, completed, createdAt, synced, remoteId, reminderAt, notificationId }),
					(_, err) => {
						reject(err);
						return false;
					}
				);
			},
			(err) => reject(err)
		);
	});

export const updateTodoOffline = (id, fields) =>
	new Promise((resolve, reject) => {
		const sets = [];
		const args = [];
		if (fields.title !== undefined) {
			sets.push("title = ?");
			args.push(fields.title);
		}
		if (fields.completed !== undefined) {
			sets.push("completed = ?");
			args.push(fields.completed ? 1 : 0);
		}
		if (fields.synced !== undefined) {
			sets.push("synced = ?");
			args.push(fields.synced ? 1 : 0);
		}
		if (fields.remoteId !== undefined) {
			sets.push("remoteId = ?");
			args.push(fields.remoteId);
		}
		if (fields.reminderAt !== undefined) {
			sets.push("reminderAt = ?");
			args.push(fields.reminderAt);
		}
		if (fields.notificationId !== undefined) {
			sets.push("notificationId = ?");
			args.push(fields.notificationId);
		}
		if (sets.length === 0) return resolve();
		args.push(id);

		db.transaction(
			(tx) => {
				tx.executeSql(
					`UPDATE todos SET ${sets.join(", ")} WHERE id = ?;`,
					args,
					() => resolve(),
					(_, err) => {
						reject(err);
						return false;
					}
				);
			},
			(err) => reject(err)
		);
	});

export const deleteTodoOffline = (id) =>
	new Promise((resolve, reject) => {
		db.transaction(
			(tx) => {
				tx.executeSql(
					"DELETE FROM todos WHERE id = ?;",
					[id],
					() => resolve(),
					(_, err) => {
						reject(err);
						return false;
					}
				);
			},
			(err) => reject(err)
		);
	});

export const loadTodos = () =>
	new Promise((resolve, reject) => {
		db.transaction(
			(tx) => {
				tx.executeSql(
					"SELECT * FROM todos ORDER BY createdAt DESC;",
					[],
					(_, { rows }) => resolve(rows._array),
					(_, err) => {
						reject(err);
						return false;
					}
				);
			},
			(err) => reject(err)
		);
	});