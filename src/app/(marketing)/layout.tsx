import * as React from "react"
import { MarketingNav } from "@/components/marketing/marketing-nav"
import { MarketingFooter } from "@/components/marketing/marketing-footer"

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20 selection:text-primary">
      <MarketingNav />
      <main className="flex-1 flex flex-col">{children}</main>
      <MarketingFooter />
    </div>
  )
}
