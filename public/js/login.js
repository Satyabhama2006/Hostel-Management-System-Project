document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = document.getElementById("loginMessage");

  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      username: document.getElementById("username").value,
      password: document.getElementById("password").value
    })
  });

  const data = await response.json();

  if (response.ok) {
    window.location.href = "/dashboard";
  } else {
    message.textContent = data.message || "Login failed";
  }
});
