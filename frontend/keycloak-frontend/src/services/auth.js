export async function loginWithEmail(email, password) {
  const res = await fetch("http://localhost:3000/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error("Invalid credentials");
  }

  return res.json();
}

export function loginWithGoogle() {
  window.location.href = "http://localhost:3000/auth/google";

}
