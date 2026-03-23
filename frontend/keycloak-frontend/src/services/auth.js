export async function loginWithEmail(email, password) {
  const res = await fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  //  alert('Response status: ' + res.status); // Debugging alert for response status
  //  alert('Response body: ' + JSON.stringify(await res.json())); // Debugging alert for response body
  if (!res.ok) {
    throw new Error("Invalid credentials");
  }

  return res.json();
}

export function loginWithGoogle() {
  window.location.href = "http://localhost:5000/api/auth/google";

}
