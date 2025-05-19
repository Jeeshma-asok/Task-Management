const form = document.getElementById("loginForm");
const usernameInput = form.username;
const passwordInput = form.password;
const usernameError = document.getElementById("usernameError");
const passwordError = document.getElementById("passwordError");
const serverError = document.getElementById("serverError");

function validateUsername() {
  const value = usernameInput.value.trim();
  const valid = /^[a-zA-Z0-9_]{3,30}$/.test(value);
  if (!valid) {
    usernameInput.classList.add("invalid");
    usernameError.style.display = "block";
  } else {
    usernameInput.classList.remove("invalid");
    usernameError.style.display = "none";
  }
  return valid;
}

function validatePassword() {
  const value = passwordInput.value;
  const valid = value.length >= 6;
  if (!valid) {
    passwordInput.classList.add("invalid");
    passwordError.style.display = "block";
  } else {
    passwordInput.classList.remove("invalid");
    passwordError.style.display = "none";
  }
  return valid;
}

usernameInput.addEventListener("input", validateUsername);
passwordInput.addEventListener("input", validatePassword);

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  serverError.style.display = "none";

  const isUsernameValid = validateUsername();
  const isPasswordValid = validatePassword();

  if (!isUsernameValid || !isPasswordValid) {
    return; // don't submit if invalid
  }

  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  const nextUrl = form.next.value; // Get the 'next' value from the hidden input

  try {
    const response = await fetch("/api/token/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      let errorText = "Login failed. Please check your credentials.";
      try {
        const data = await response.json();
        if (data.detail) errorText = data.detail;
      } catch {
        // ignore parsing error
      }
      throw new Error(errorText);
    }

    const data = await response.json();

    localStorage.setItem("access_token", data.access);
    localStorage.setItem("refresh_token", data.refresh);
    // Redirect to the 'next' URL if it exists, otherwise to the dashboard
    if (nextUrl) {
      window.location.href = nextUrl;
    } else {
      window.location.href = "/dashboard/";
    }
  } catch (error) {
    serverError.textContent = error.message;
    serverError.style.display = "block";
  }
});