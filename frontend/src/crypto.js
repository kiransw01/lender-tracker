// Lightweight client-side password hashing using the Web Crypto API (SHA-256 with
// a random per-user salt). This is NOT bank-grade security — anyone with direct
// Firestore access could still brute-force weak passwords — but it's meaningfully
// better than storing plaintext, and matches the trust model of this app (a
// personal tracker, not a banking app).

function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function generateSalt() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return bufferToHex(bytes);
}

export async function hashPassword(password, salt) {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return bufferToHex(digest);
}
