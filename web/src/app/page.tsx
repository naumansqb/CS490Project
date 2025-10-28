'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import LandingPage from '@/components/landingPage'

export default function Home() {
    const router = useRouter()
    const { user, loading } = useAuth()
    const [shouldShowLanding, setShouldShowLanding] = useState(false)

    useEffect(() => {
        if (loading) return

        if (user) {
            router.push(`/profile/${user.uid}`)
        } else {
            setShouldShowLanding(true)
        }
    }, [user, loading, router])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        )
    }

    if (!shouldShowLanding) {
        return null
    }

    return <LandingPage />
}