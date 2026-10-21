import { Metadata } from "next"
import { requireUser } from "@/lib/auth"
import { listProperties, listPayments, listRentDues } from "@/lib/data"
import { listExpenses } from "@/lib/data/expenses"
import { ExpensesView } from "./expenses-view"

export const metadata: Metadata = {
  title: "Dépenses & Travaux | Bailo",
  description: "Suivez vos dépenses et calculez votre bénéfice net réel.",
}

export default async function ExpensesPage() {
  const { user, profile } = await requireUser()

  const [expenses, payments, properties, rentDues] = await Promise.all([
    listExpenses(user.id),
    listPayments(user.id),
    listProperties(user.id),
    listRentDues(user.id),
  ])

  return (
    <ExpensesView
      initialExpenses={expenses}
      initialPayments={payments}
      properties={properties}
      rentDues={rentDues}
      currency={profile.currency || "XAF"}
    />
  )
}
