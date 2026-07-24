// Biometric unlock via WebAuthn's platform authenticator (Face ID / Touch ID /
// Android fingerprint / Windows Hello), used purely as a LOCAL convenience gate.
//
// Important honesty note: there's no backend server here to verify WebAuthn
// signatures, so this is not "real" FIDO2 authentication in the strict sense.
// What it does provide: the browser will only resolve navigator.credentials.get()
// successfully if the OS's biometric/platform check actually passes. We treat a
// successful resolution as proof the device owner passed the OS biometric check,
// then unlock the app locally for the remembered account. This is the same trust
// model many password managers use for "unlock with Face ID" after your master
// password has already been set up once.

function randomChallenge() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytes;
}

export function isBiometricSupported() {
  return Boolean(window.PublicKeyCredential && navigator.credentials);
}

export async function registerBiometricCredential(username) {
  const publicKey = {
    challenge: randomChallenge(),
    rp: { name: 'Lender Tracker' },
    user: {
      id: new TextEncoder().encode(username),
      name: username,
      displayName: username,
    },
    pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'required',
    },
    timeout: 60000,
    attestation: 'none',
  };

  const credential = await navigator.credentials.create({ publicKey });
  if (!credential) throw new Error('Biometric setup was cancelled');
  // Store the credential ID (base64) so we can request the same credential later.
  const idBytes = new Uint8Array(credential.rawId);
  const idBase64 = btoa(String.fromCharCode(...idBytes));
  return idBase64;
}

export async function verifyBiometricCredential(credentialIdBase64) {
  const idBytes = Uint8Array.from(atob(credentialIdBase64), (c) => c.charCodeAt(0));
  const publicKey = {
    challenge: randomChallenge(),
    allowCredentials: [{ id: idBytes, type: 'public-key' }],
    userVerification: 'required',
    timeout: 60000,
  };
  const assertion = await navigator.credentials.get({ publicKey });
  if (!assertion) throw new Error('Biometric verification failed');
  return true;
}
