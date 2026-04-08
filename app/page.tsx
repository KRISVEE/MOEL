"use client"

import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase"

export default function Home() {
  const [reels, setReels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)
  const [viewCount, setViewCount] = useState(0)

  const feedRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    fetchReels()
  }, [])

  // 🎲 Fisher-Yates
  const shuffleArray = (array: any[]) => {
    const newArray = [...array]
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
    }
    return newArray
  }

  // 🔥 Smart shuffle (TikTok feel)
  const smartShuffle = () => {
    const current = reels[activeIndex]
    const rest = reels.filter((_, i) => i !== activeIndex)

    const shuffledRest = shuffleArray(rest)

    const newReels = [current, ...shuffledRest]
    setReels(newReels)
  }

  const fetchReels = async () => {
    const { data } = await supabase.from("reels").select("*")
    if (data) setReels(shuffleArray(data))
    setLoading(false)
  }

  // 🔄 Auto refresh (smooth, no jump)
  useEffect(() => {
    if (viewCount !== 0 && viewCount % 5 === 0) {
      smartShuffle()
    }
  }, [viewCount])

  if (loading) {
    return (
      <div className="bg-black text-white h-screen flex items-center justify-center">
        Loading...
      </div>
    )
  }

  if (reels.length === 0) {
    return (
      <div className="bg-black text-white h-screen flex items-center justify-center">
        No reels found
      </div>
    )
  }

  return (
    <div className="bg-black text-white h-screen w-screen overflow-y-scroll snap-y snap-mandatory">

      {/* 📺 FEED */}
      <div
        ref={feedRef}
        onScroll={(e) => {
          const scrollTop = e.currentTarget.scrollTop
          const height = window.innerHeight
          const index = Math.round(scrollTop / height)

          if (index !== activeIndex) {
            setActiveIndex(index)
            setViewCount((prev) => prev + 1)
          }
        }}
      >
        {reels.map((reel, index) => {
          const reelId = reel.url.match(/reel\/([^/?]+)/)?.[1]
          if (!reelId) return null

          return (
            <div
              key={reel.id}
              className="h-screen w-screen flex items-center justify-center snap-start relative bg-black"
            >
              {activeIndex === index && (
                <iframe
                  key={activeIndex}
                  src={`https://www.instagram.com/reel/${reelId}/embed/captioned`}
                  className="w-full h-full border-0"
                  allow="autoplay; encrypted-media"
                />
              )}
            </div>
          )
        })}
      </div>

      {/* 🎛️ ICON CONTROLS */}
      <div className="absolute top-4 right-4 flex flex-col gap-3 z-50">

        {/* 🔀 Shuffle */}
        <button
          onClick={smartShuffle}
          className="w-10 h-10 flex items-center justify-center bg-white/10 backdrop-blur-md text-white rounded-full text-lg"
        >
          🔀
        </button>

        {/* 🗑 Delete */}
        <button
          onClick={async () => {
            if (!confirm("Delete this reel?")) return

            const current = reels[activeIndex]
            if (!current) return

            await supabase.from("reels").delete().eq("id", current.id)

            fetchReels()
          }}
          className="w-10 h-10 flex items-center justify-center bg-white/10 backdrop-blur-md text-white rounded-full text-lg"
        >
          🗑
        </button>

      </div>
    </div>
  )
}
