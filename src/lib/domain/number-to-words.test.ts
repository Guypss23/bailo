import { describe, it, expect } from "vitest"
import {
  integerToFrenchWords,
  amountToFrenchWords,
} from "./number-to-words"

describe("src/lib/domain/number-to-words - Nombres et montants en toutes lettres", () => {
  describe("integerToFrenchWords", () => {
    it("converts 0 to 'zéro'", () => {
      expect(integerToFrenchWords(0)).toBe("zéro")
    })

    it("converts 1 to 'un'", () => {
      expect(integerToFrenchWords(1)).toBe("un")
    })

    it("converts 21 to 'vingt et un'", () => {
      expect(integerToFrenchWords(21)).toBe("vingt et un")
    })

    it("converts 71 to 'soixante et onze'", () => {
      expect(integerToFrenchWords(71)).toBe("soixante et onze")
    })

    it("converts 80 to 'quatre-vingts' (with s)", () => {
      expect(integerToFrenchWords(80)).toBe("quatre-vingts")
    })

    it("converts 81 to 'quatre-vingt-un' (without s and without et)", () => {
      expect(integerToFrenchWords(81)).toBe("quatre-vingt-un")
    })

    it("converts 100 to 'cent'", () => {
      expect(integerToFrenchWords(100)).toBe("cent")
    })

    it("converts 200 to 'deux cents' (with s)", () => {
      expect(integerToFrenchWords(200)).toBe("deux cents")
    })

    it("converts 201 to 'deux cent un' (without s when followed)", () => {
      expect(integerToFrenchWords(201)).toBe("deux cent un")
    })

    it("converts 870 to 'huit cent soixante-dix'", () => {
      expect(integerToFrenchWords(870)).toBe("huit cent soixante-dix")
    })

    it("converts 1000 to 'mille' (not un mille)", () => {
      expect(integerToFrenchWords(1000)).toBe("mille")
    })

    it("converts 1150 to 'mille cent cinquante'", () => {
      expect(integerToFrenchWords(1150)).toBe("mille cent cinquante")
    })
  })

  describe("amountToFrenchWords (avec devise et centimes)", () => {
    it("handles 0", () => {
      expect(amountToFrenchWords(0, "EUR")).toBe("zéro euro")
    })

    it("handles 1", () => {
      expect(amountToFrenchWords(1, "EUR")).toBe("un euro")
    })

    it("handles 21", () => {
      expect(amountToFrenchWords(21, "EUR")).toBe("vingt et un euros")
    })

    it("handles 71", () => {
      expect(amountToFrenchWords(71, "EUR")).toBe("soixante et onze euros")
    })

    it("handles 80", () => {
      expect(amountToFrenchWords(80, "EUR")).toBe("quatre-vingts euros")
    })

    it("handles 81", () => {
      expect(amountToFrenchWords(81, "EUR")).toBe("quatre-vingt-un euros")
    })

    it("handles 100", () => {
      expect(amountToFrenchWords(100, "EUR")).toBe("cent euros")
    })

    it("handles 200", () => {
      expect(amountToFrenchWords(200, "EUR")).toBe("deux cents euros")
    })

    it("handles 870", () => {
      expect(amountToFrenchWords(870, "EUR")).toBe("huit cent soixante-dix euros")
    })

    it("handles 1 000", () => {
      expect(amountToFrenchWords(1000, "EUR")).toBe("mille euros")
    })

    it("handles 1 150,50", () => {
      expect(amountToFrenchWords(1150.5, "EUR")).toBe(
        "mille cent cinquante euros et cinquante centimes"
      )
    })

    it("supports XAF / Francs CFA", () => {
      expect(amountToFrenchWords(350000, "XAF")).toBe(
        "trois cent cinquante mille francs CFA"
      )
    })
  })
})
