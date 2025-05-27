"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

interface User {
  id: number
  username: string
  email: string
  app: string
  jwt: string
}

interface AuthContextType {
  user: User | null
  login: (identifier: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem("auth")
    if (stored) setUser(JSON.parse(stored))
  }, [])

  const login = async (identifier: string, password: string) => {
    const res = await fetch("https://vps-4937880-x.dattaweb.com/api/auth/local", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    })

    const data = await res.json()

    if (!res.ok) throw new Error(data?.error?.message || "Login fallido")

    const loggedUser: User = {
      id: data.user.id,
      username: data.user.username,
      email: data.user.email,
      app: data.user.app,
      jwt: data.jwt,
    }

    if (loggedUser.app !== "fortela") {
      throw new Error("No autorizado para esta aplicación.")
    }

    // ✅ Guardar en localStorage y cookie para el middleware
    localStorage.setItem("auth", JSON.stringify(loggedUser))
    document.cookie = `auth=${data.jwt}; path=/; max-age=86400` // 1 día
    setUser(loggedUser)
  }

  const logout = () => {
    localStorage.removeItem("auth")
    document.cookie = "auth=; path=/; max-age=0" // 🔥 borra la cookie
    setUser(null)
    window.location.href = "/login"
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider")
  return context
}
