import { createContext, useEffect, useState } from "react"; 
import { onAuthStateChanged, signOut } from "firebase/auth"; 
import { auth } from "../services/firebase"; 
 
export const AuthContext = createContext(); 
 
export function AuthProvider({ children }) { 
 const [user, setUser] = useState(null); 
 const [loading, setLoading] = useState(true); 
 
 useEffect(() => { 
   const unsubscribe = onAuthStateChanged(auth, (u) => { 
     setUser(u); 
     setLoading(false); 
   }); 
 
   return unsubscribe; 
 }, []); 
 
 const logout = () => signOut(auth); 
 
 return ( 
   <AuthContext.Provider value={{ user, loading, logout }}> 
     {children} 
   </AuthContext.Provider> 
 ); 
}