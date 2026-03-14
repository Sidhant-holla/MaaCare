const API_URL = "http://127.0.0.1:8000";

// Already logged in → go straight to dashboard
if (localStorage.getItem("token")) {
  window.location.href = "index.html";
}

function showSplash(callback) {
  const splash = document.getElementById("splash");
  splash.classList.add("active");
  setTimeout(() => {
    splash.classList.add("fade-out");
    setTimeout(callback, 500);
  }, 1000);
}

function showTab(tab) {
  const isLogin = tab === "login";
  document.getElementById("loginTab").style.display = isLogin ? "block" : "none";
  document.getElementById("signupTab").style.display = isLogin ? "none" : "block";
  document.getElementById("loginTabBtn").classList.toggle("active", isLogin);
  document.getElementById("signupTabBtn").classList.toggle("active", !isLogin);
  document.getElementById("loginError").textContent = "";
  document.getElementById("signupError").textContent = "";
}

async function login() {
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value;
  const errorEl = document.getElementById("loginError");

  if (!username || !password) { errorEl.textContent = "Please fill all fields"; return; }

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) { errorEl.textContent = data.detail || "Login failed"; return; }
    localStorage.setItem("token", data.token);
    localStorage.setItem("username", data.username);
    showSplash(() => { window.location.href = "index.html"; });
  } catch {
    errorEl.textContent = "Backend not running";
  }
}

async function signup() {
  const username = document.getElementById("signupUsername").value.trim();
  const password = document.getElementById("signupPassword").value;
  const confirm = document.getElementById("signupConfirm").value;
  const errorEl = document.getElementById("signupError");

  if (!username || !password || !confirm) { errorEl.textContent = "Please fill all fields"; return; }
  if (password !== confirm) { errorEl.textContent = "Passwords don't match"; return; }
  if (password.length < 6) { errorEl.textContent = "Password must be at least 6 characters"; return; }

  try {
    const res = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) { errorEl.textContent = data.detail || "Sign up failed"; return; }
    localStorage.setItem("token", data.token);
    localStorage.setItem("username", data.username);
    showSplash(() => { window.location.href = "index.html"; });
  } catch {
    errorEl.textContent = "Backend not running";
  }
}
