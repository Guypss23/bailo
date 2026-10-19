"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function MarketingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/85 backdrop-blur-md transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground font-semibold flex items-center justify-center text-sm shadow-xs transition-transform group-hover:scale-105">
            B
          </div>
          <span className="font-semibold text-lg text-foreground tracking-tight">
            Bailo
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <a
            href="#fonctionnalites"
            className="hover:text-foreground transition-colors"
          >
            Fonctionnalités
          </a>
          <a
            href="#comment-ca-marche"
            className="hover:text-foreground transition-colors"
          >
            Comment ça marche
          </a>
          <a
            href="#tarifs"
            className="hover:text-foreground transition-colors"
          >
            Tarifs
          </a>
          <a
            href="#faq"
            className="hover:text-foreground transition-colors"
          >
            FAQ
          </a>
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/connexion">Se connecter</Link>
          </Button>
          <Button size="sm" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="/inscription">Commencer gratuitement</Link>
          </Button>
        </div>

        {/* Mobile Hamburger Button with Required Fouf Animation */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="w-10 h-10 relative focus:outline-none -mr-2 text-current md:hidden"
          aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={mobileMenuOpen}
        >
          <div className="block w-6 absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <span
              className={`block absolute h-0.5 w-6 bg-current transform transition duration-300 ease-in-out ${
                mobileMenuOpen ? "rotate-45" : "-translate-y-2"
              }`}
            />
            <span
              className={`block absolute h-0.5 w-6 bg-current transform transition duration-300 ease-in-out ${
                mobileMenuOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block absolute h-0.5 w-6 bg-current transform transition duration-300 ease-in-out ${
                mobileMenuOpen ? "-rotate-45" : "translate-y-2"
              }`}
            />
          </div>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-background/95 backdrop-blur-md px-6 py-6 animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col gap-4 text-base font-medium">
            <a
              href="#fonctionnalites"
              onClick={() => setMobileMenuOpen(false)}
              className="text-foreground/90 hover:text-primary transition-colors py-1"
            >
              Fonctionnalités
            </a>
            <a
              href="#comment-ca-marche"
              onClick={() => setMobileMenuOpen(false)}
              className="text-foreground/90 hover:text-primary transition-colors py-1"
            >
              Comment ça marche
            </a>
            <a
              href="#tarifs"
              onClick={() => setMobileMenuOpen(false)}
              className="text-foreground/90 hover:text-primary transition-colors py-1"
            >
              Tarifs
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="text-foreground/90 hover:text-primary transition-colors py-1"
            >
              FAQ
            </a>
            <div className="pt-4 border-t border-border flex flex-col gap-3">
              <Button variant="outline" className="w-full justify-center" asChild>
                <Link href="/connexion">Se connecter</Link>
              </Button>
              <Button className="w-full justify-center bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
                <Link href="/inscription">Commencer gratuitement</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
