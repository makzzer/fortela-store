"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAuth } from "../context/AutContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const { login } = useAuth()

  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<null | { text: string; type: "error" | "success" }>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      await login(identifier, password)
      setMessage({ text: "Inicio de sesión exitoso ✅", type: "success" })

      setTimeout(() => {
        // ✅ redirección completa para que el middleware detecte la cookie
        window.location.href = "/admin"
      }, 1000)
    } catch (error: any) {
      setMessage({
        text: error.message === "No autorizado para esta aplicación."
          ? "No estás autorizado para acceder a esta aplicación."
          : "Usuario o contraseña incorrectos.",
        type: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-lg border rounded-xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Iniciar sesión</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Correo o nombre de usuario"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />

            <div className="relative">
              <Input
                placeholder="Contraseña"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Cargando..." : "Entrar"}
            </Button>

            {message && (
              <div
                className={`text-sm mt-2 text-center ${
                  message.type === "error" ? "text-red-500" : "text-green-600"
                }`}
              >
                {message.text}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
