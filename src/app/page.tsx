"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn, signUp, signInWithGoogle } from "@/lib/grove/db"

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58Z" />
    </svg>
  )
}

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()


  // Temporarily add to any client component, e.g. your auth page
  console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)

  const handleGoogle = async () => {
    setIsGoogleLoading(true)
    setError(null)
    try {
      await signInWithGoogle()
      // Supabase redirects the browser — no need to push manually
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed")
      setIsGoogleLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (mode === "login") {
        await signIn(email, password)
        router.push("/dashboard")
      } else {
        await signUp(email, password)
        setMessage("Check your email to confirm your account.")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Grove</h1>
          <p className="text-base-content/60 mt-1 text-sm">Career intelligence, capacity-first</p>
        </div>

        <div className="card bg-base-200 border border-base-300">
          <div className="card-body gap-4">
            <div className="tabs tabs-boxed bg-base-300">
              <button
                className={`tab flex-1 ${mode === "login" ? "tab-active" : ""}`}
                onClick={() => setMode("login")}
              >
                Sign in
              </button>
              <button
                className={`tab flex-1 ${mode === "signup" ? "tab-active" : ""}`}
                onClick={() => setMode("signup")}
              >
                Sign up
              </button>
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={isGoogleLoading}
              className="btn btn-outline w-full gap-2"
            >
              {isGoogleLoading ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <GoogleIcon />
              )}
              Continue with Google
            </button>

            <div className="divider text-xs opacity-40 my-0">or</div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="form-control">
                <label className="label label-text text-xs opacity-70">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input input-bordered w-full"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="form-control">
                <label className="label label-text text-xs opacity-70">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input input-bordered w-full"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <div className="alert alert-error text-sm py-2">
                  <span>{error}</span>
                </div>
              )}

              {message && (
                <div className="alert alert-success text-sm py-2">
                  <span>{message}</span>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary w-full mt-1"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : mode === "login" ? "Sign in" : "Create account"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
