import { describe, it, expect } from "vitest"
import manifest from "./manifest"

describe("src/app/manifest - Web App Manifest PWA", () => {
  it("fournit une configuration PWA complète pour installation smartphone", () => {
    const config = manifest()

    expect(config.name).toContain("Bailo")
    expect(config.short_name).toBe("Bailo")
    expect(config.display).toBe("standalone")
    expect(config.start_url).toBe("/tableau-de-bord")
    expect(config.theme_color).toBe("#1F5C45")
    expect(config.background_color).toBe("#0E1412")
    expect(config.icons).toBeDefined()
    expect(config.icons!.length).toBeGreaterThanOrEqual(2)

    // Vérifier la présence de l'icône maskable
    const maskable = config.icons!.find((i) => i.purpose === "maskable")
    expect(maskable).toBeDefined()
  })
})
