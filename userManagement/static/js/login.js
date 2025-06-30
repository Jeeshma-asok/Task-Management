document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const usernameError = document.getElementById('usernameError');
  const passwordError = document.getElementById('passwordError');
  const serverError = document.getElementById('serverError');
  const loginButton = document.querySelector('.login-button');
  const buttonText = loginButton.querySelector('.button-text');
  const spinner = loginButton.querySelector('.spinner-border');

  // Function to show/hide error messages
  function displayError(element, message, isValid) {
      if (isValid) {
          element.textContent = '';
          element.classList.remove('active');
          element.previousElementSibling.querySelector('input').classList.remove('is-invalid');
          element.previousElementSibling.querySelector('input').classList.add('is-valid');
      } else {
          element.textContent = message;
          element.classList.add('active');
          element.previousElementSibling.querySelector('input').classList.add('is-invalid');
          element.previousElementSibling.querySelector('input').classList.remove('is-valid');
      }
  }

  // Validation functions
  function validateUsername() {
      const username = usernameInput.value.trim();
      if (username.length < 3 || username.length > 30) {
          displayError(usernameError, 'Username must be 3-30 characters long.', false);
          return false;
      }
      displayError(usernameError, '', true);
      return true;
  }

  function validatePassword() {
      const password = passwordInput.value.trim();
      if (password.length < 6) {
          displayError(passwordError, 'Password must be at least 6 characters.', false);
          return false;
      }
      displayError(passwordError, '', true);
      return true;
  }

  // Event listeners for real-time validation feedback
  usernameInput.addEventListener('input', validateUsername);
  passwordInput.addEventListener('input', validatePassword);

  loginForm.addEventListener('submit', function(event) {
      // Clear previous server errors
      serverError.innerHTML = '';

      // Perform client-side validation
      const isUsernameValid = validateUsername();
      const isPasswordValid = validatePassword();

      if (!isUsernameValid || !isPasswordValid) {
          event.preventDefault(); // Prevent form submission if validation fails
      } else {
          // Show loading spinner on button and disable it
          buttonText.style.display = 'none';
          spinner.style.display = 'inline-block';
          loginButton.disabled = true;
      }
  });

  // Handle server-side errors if they exist on page load
  const initialServerErrorText = serverError.querySelector('.error-text');
  if (initialServerErrorText) {
      serverError.style.display = 'block'; // Ensure server error container is visible
      initialServerErrorText.style.opacity = '1';
      initialServerErrorText.style.transform = 'translateY(0)';
  } else {
      serverError.style.display = 'none'; // Hide if no errors initially
  }


  // Re-enable button if form submission failed (e.g., due to network error or validation on server side)
  // This is useful if the user navigates back or if there's a non-JS way to trigger error
  if (loginForm.getAttribute('data-submission-failed') === 'true') {
      buttonText.style.display = 'inline';
      spinner.style.display = 'none';
      loginButton.disabled = false;
  }
});

// Password visibility toggle (placed outside DOMContentLoaded if it's a global function)
function togglePasswordVisibility() {
  const passwordField = document.getElementById('password');
  const toggleIcon = document.querySelector('.toggle-password i');
  if (passwordField.type === 'password') {
      passwordField.type = 'text';
      toggleIcon.classList.remove('fa-eye');
      toggleIcon.classList.add('fa-eye-slash');
  } else {
      passwordField.type = 'password';
      toggleIcon.classList.remove('fa-eye-slash');
      toggleIcon.classList.add('fa-eye');
  }
}

let x = {
    name: "hi",
    address: {
        pin:"123"
    }
}

y=JSON.parse(JSON.stringify(x))

y.name = "jlo"
y.address.pin="456"
console.log(y,"ggggggggggggggggg", x)