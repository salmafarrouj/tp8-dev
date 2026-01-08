import { create } from "zustand"; 
import { db } from "../services/database"; 
import { 
 fetchTodosFromFirestore, 
 addTodoToFirestore, 
} from "../services/firestore"; 
 
export const useTodoStore = create((set, get) => ({ 
   todos: [], 
 
 loadTodos: async (uid) => { 
   //charger Firestore 
   const remoteTodos = await fetchTodosFromFirestore(uid); 
 
   //injecter SQLite 
   db.transaction(tx => { 
     tx.executeSql("DELETE FROM todos"); 
     remoteTodos.forEach(t => 
       tx.executeSql("INSERT INTO todos (title) VALUES (?)", [t.title]) 
     ); 
   }); 
 
   //charger SQLite vers Zustand 
   db.transaction(tx => { 
     tx.executeSql("SELECT * FROM todos", [], (_, res) => { 
       set({ todos: res.rows._array }); 
     }); 
   }); 
 }, 
 
 addTodo: async (uid, title) => { 
   // SQLite 
   db.transaction(tx => { 
     tx.executeSql("INSERT INTO todos (title) VALUES (?)", [title]); 
   }); 
 
   // Firestore 
   await addTodoToFirestore(uid, { title }); 
 
   // Refresh 
   get().loadTodos(uid); 
 }, 
}));
