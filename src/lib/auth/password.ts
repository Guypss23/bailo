import crypto from "node:crypto"

const KEY_LENGTH = 64

/**
 * Hashes a plaintext password using node:crypto scrypt with a random 16-byte salt.
 * Formats output as "salt:derivedKeyHex".
 */
export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex")

    crypto.scrypt(password, salt, KEY_LENGTH, (err, derivedKey) => {
      if (err) return reject(err)
      resolve(`${salt}:${derivedKey.toString("hex")}`)
    })
  })
}

/**
 * Verifies a password against a stored "salt:derivedKeyHex" hash using timingSafeEqual.
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  return new Promise((resolve) => {
    const [salt, expectedKeyHex] = storedHash.split(":")
    if (!salt || !expectedKeyHex) {
      return resolve(false)
    }

    crypto.scrypt(password, salt, KEY_LENGTH, (err, derivedKey) => {
      if (err) return resolve(false)

      const expectedKeyBuffer = Buffer.from(expectedKeyHex, "hex")
      if (expectedKeyBuffer.length !== derivedKey.length) {
        return resolve(false)
      }

      try {
        const matches = crypto.timingSafeEqual(expectedKeyBuffer, derivedKey)
        resolve(matches)
      } catch {
        resolve(false)
      }
    })
  })
}
