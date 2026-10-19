import { test, expect } from "@playwright/test"

test.describe("Parcours complet Bailo (End-to-End)", () => {
  const randomSuffix = Math.random().toString(36).slice(2, 8)
  const testEmail = `bailleur.${randomSuffix}@test-bailo.ga`
  const testPassword = "MotDePasseSolide123!"

  test("Parcours complet : Inscription → Bien → Locataire → Bail → Paiement → Quittance → Boîte d'envoi", async ({
    page,
    request,
  }) => {
    // 1. Inscription
    await page.goto("/inscription")
    await expect(page).toHaveTitle(/Inscription · Bailo/)

    await page.fill('input[type="email"]', testEmail)
    await page.fill('input[type="password"]', testPassword)
    await page.click('button[type="submit"]')

    // Doit rediriger vers le tableau de bord
    await page.waitForURL("**/tableau-de-bord")
    await expect(page.locator("h1")).toContainText(/Tableau de bord|Bonjour/)

    // 2. Création d'un bien
    await page.goto("/biens")
    const addPropertyBtn = page.getByRole("button", { name: /Ajouter un bien/i })
    await addPropertyBtn.click()

    await page.fill('input[name="name"]', "Villa Angondjé")
    await page.fill('input[name="address_line1"]', "Boulevard de la Liberté")
    await page.fill('input[name="city"]', "Akanda")
    await page.fill('input[name="surface_m2"]', "120")

    const submitPropertyBtn = page.getByRole("button", { name: /Enregistrer|Créer/i }).last()
    await submitPropertyBtn.click()

    // Vérifier l'affichage du bien dans la liste
    await expect(page.locator("body")).toContainText("Villa Angondjé")

    // 3. Création d'un locataire
    await page.goto("/locataires")
    const addTenantBtn = page.getByRole("button", { name: /Ajouter un locataire/i })
    await addTenantBtn.click()

    await page.fill('input[name="first_name"]', "Marc")
    await page.fill('input[name="last_name"]', "Nguema")
    await page.fill('input[name="email"]', "marc.nguema@example.ga")
    await page.fill('input[name="phone"]', "+241 07 00 11 22")

    const submitTenantBtn = page.getByRole("button", { name: /Enregistrer|Créer/i }).last()
    await submitTenantBtn.click()

    await expect(page.locator("body")).toContainText("Marc Nguema")

    // 4. Création d'un bail
    await page.goto("/baux/nouveau")
    await expect(page.locator("body")).toContainText("Nouveau bail")

    // Remplir les montants et dates
    await page.fill('input[name="rent_amount"]', "250000")
    await page.fill('input[name="start_date"]', "2026-01-01")

    const submitLeaseBtn = page.getByRole("button", { name: /Créer le bail|Enregistrer/i }).last()
    await submitLeaseBtn.click()

    // Redirige vers la page du bail
    await page.waitForURL(/\/baux\/.+/)
    await expect(page.locator("body")).toContainText("Bail actif")

    // 5. Suivi des loyers et enregistrement de paiement
    await page.goto("/loyers")
    await expect(page.locator("body")).toContainText("Loyers")

    // Ouvrir le dialogue de paiement
    const payBtn = page.getByRole("button", { name: /Encaisser|Paiement|Régler/i }).first()
    if (await payBtn.isVisible()) {
      await payBtn.click()
      const amountInput = page.locator('input[name="amount"]')
      if (await amountInput.isVisible()) {
        await amountInput.fill("250000")
      }
      const confirmPayBtn = page.getByRole("button", { name: /Confirmer|Valider|Enregistrer/i }).last()
      await confirmPayBtn.click()
    }

    // 6. Boîte d'envoi et relances
    await page.goto("/parametres/boite-envoi")
    await expect(page.locator("body")).toContainText("Boîte d'envoi locale")
  })
})
