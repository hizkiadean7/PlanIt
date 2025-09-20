"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import googleAuthService from "../services/googleAuth"
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const GoogleSignInButton = ({ mode = "signin", className = "", rememberMe, disabled }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true)
      setError("")
      const user = await googleAuthService.signIn()

      if (mode === "signup") {
        try {
          const registerResponse = await fetch(`${API_URL}/api/register`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              username: user.name,
              email: user.email,
              googleId: user.id,
              imageUrl: user.imageUrl,
              rememberMe: rememberMe,
            }),
          })

          const registerData = await registerResponse.json()

          if (registerResponse.ok) {
            const updatedUser = {
              ...user,
              id: registerData.userId,
              userId: registerData.userId,
            }
            localStorage.setItem("user", JSON.stringify(updatedUser))
            navigate("/app", { replace: true })
          } else {
            // If registration fails (e.g., user already exists), try to login
            console.log("Registration failed, attempting login...")

            const loginResponse = await fetch(`${API_URL}/api/login`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email: user.email,
                googleId: user.id,
                imageUrl: user.imageUrl,
                rememberMe: rememberMe,
              }),
            })

            const loginData = await loginResponse.json()

            if (loginResponse.ok) {
              const updatedUser = {
                ...user,
                id: loginData.user.userId,
                userId: loginData.user.userId,
              }
              localStorage.setItem("user", JSON.stringify(updatedUser))
              navigate("/app", { replace: true })
            } else {
              console.error("Both registration and login failed:", loginData.message)
              setError("Failed to create or access account. Please try again.")
            }
          }
        } catch (dbError) {
          console.error("Database operation error:", dbError)
          setError("Failed to save account information. Please try again.")
        }
      } else {
        // For sign in, try to login with Google ID
        try {
          const loginResponse = await fetch(`${API_URL}/api/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: user.email,
              googleId: user.id,
              imageUrl: user.imageUrl,
              rememberMe: rememberMe,
            }),
          })

          const loginData = await loginResponse.json()

          if (loginResponse.ok) {
            const updatedUser = {
              ...user,
              id: loginData.user.userId,
              userId: loginData.user.userId,
            }
            localStorage.setItem("user", JSON.stringify(updatedUser))
            navigate("/app", { replace: true })
          } else {
            console.error("Login failed:", loginData.message)
            setError("Account not found. Please sign up first.")
          }
        } catch (loginError) {
          console.error("Login error:", loginError)
          setError("Failed to sign in. Please try again.")
        }
      }
    } catch (error) {
      console.error("Google sign-in failed:", error)
      setError("Google sign-in failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={className}>
      <button
        onClick={handleGoogleSignIn}
        disabled={isLoading || disabled}
        className="w-full flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700 mr-2"></div>
            {mode === "signup" ? "Creating account..." : "Signing in..."}
          </div>
        ) : (
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {mode === "signup" ? "Sign up with Google" : "Sign in with Google"}
          </div>
        )}
      </button>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}

export default GoogleSignInButton
