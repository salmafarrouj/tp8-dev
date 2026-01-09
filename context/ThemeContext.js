import React, { createContext, useEffect, useState } from "react"; 
import AsyncStorage from "@react-native-async-storage/async-storage"; 
 
export const ThemeContext = createContext(); 
 
const themes = { 
 light: { 
   background: "#ffffff", 
   text: "#111111", 
   card: "#f2f2f2", 
   primary: "#2f80ed", 
 }, 
 dark: { 
   background: "#121212", 
   text: "#ffffff", 
   card: "#1e1e1e", 
   primary: "#2f80ed", 
 }, 
}; 
 
const STORAGE_KEY = "APP_THEME"; 
 
export function ThemeProvider({ children }) { 
 const [mode, setMode] = useState("light"); 
 const [ready, setReady] = useState(false); 
 
 // Charger le thème au démarrage 
 useEffect(() => { 
   const loadTheme = async () => { 
     const storedTheme = await AsyncStorage.getItem(STORAGE_KEY); 
     if (storedTheme) { 
       setMode(storedTheme); 
     } 
     setReady(true); 
   }; 
 
   loadTheme(); 
 }, []); 
 
 // Changer + sauvegarder le thème 
 const toggleTheme = async () => { 
   const newMode = mode === "light" ? "dark" : "light"; 
   setMode(newMode); 
   await AsyncStorage.setItem(STORAGE_KEY, newMode); 
 }; 
 
 // Empêche un flash blanc/noir au lancement 
 if (!ready) return null; 
 
 return ( 
   <ThemeContext.Provider 
     value={{ 
       mode, 
       theme: themes[mode], 
       toggleTheme, 
     }} 
   > 
     {children} 
   </ThemeContext.Provider> 
 ); 
} 