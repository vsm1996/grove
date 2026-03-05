"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { CapacityProvider } from "@/lib/capacity"
import { CapacityControls } from "@/components/capacity-controls"
import { supabase } from "@/lib/grove/db"
import type { Session } from "@supabase/supabase-js"
import "./globals.css"

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        if (!session && pathname !== "/") {
          router.push("/")
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router, pathname])

  useEffect(() => {
    if (!loading && !session && pathname !== "/") {
      router.push("/")
    }
  }, [loading, session, pathname, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    )
  }

  return <>{children}</>
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <CapacityProvider>
          <AuthGuard>
            {children}
          </AuthGuard>
          <CapacityControls />
        </CapacityProvider>
      </body>
    </html>
  )
}
