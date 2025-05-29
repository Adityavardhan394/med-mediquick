// DOM Elements
const loginForm = document.getElementById('loginForm');
const nameInput = document.getElementById('nameInput');
const phoneInput = document.getElementById('phoneInput');
const otpContainer = document.getElementById('otpContainer');
const otpInputs = document.querySelectorAll('.otp-digit');
const resendButton = document.getElementById('resendOTP');
const errorMessage = document.getElementById('errorMessage');
const loadingOverlay = document.getElementById('loadingOverlay');
const createAccountLink = document.getElementById('createAccount');

// Handle create account navigation with smooth transition
createAccountLink.addEventListener('click', (e) => {
  e.preventDefault();
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.3s ease';
  
  setTimeout(() => {
    window.location.href = createAccountLink.href;
  }, 300);
});

// Function to show error message
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.add('show');
  setTimeout(() => {
    errorMessage.classList.remove('show');
  }, 3000);
}

// Function to show/hide loading overlay
function showLoading() {
  loadingOverlay.style.display = 'flex';
}

function hideLoading() {
  loadingOverlay.style.display = 'none';
}

// Handle form submission
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  const phoneNumber = phoneInput.value;

  if (name.length < 2) {
    showError('Please enter a valid name');
    return;
  }

  if (phoneNumber.length !== 10) {
    showError('Please enter a valid 10-digit phone number');
    return;
  }

  showLoading();
  try {
    // Store user details temporarily
    sessionStorage.setItem('tempUserName', name);
    sessionStorage.setItem('tempUserPhone', phoneNumber);
    
    // Show OTP input container
    otpContainer.style.display = 'block';
    loginForm.style.display = 'none';
    
    // Focus first OTP input
    otpInputs[0].focus();
  } catch (error) {
    showError('Failed to send OTP. Please try again.');
  } finally {
    hideLoading();
  }
});

// Handle OTP input
otpInputs.forEach((input, index) => {
  input.addEventListener('input', (e) => {
    if (e.target.value.length === 1) {
      if (index < otpInputs.length - 1) {
        otpInputs[index + 1].focus();
      } else {
        // Last digit entered, verify OTP
        const otp = Array.from(otpInputs).map(input => input.value).join('');
        verifyOTP(otp);
      }
    }
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && !e.target.value && index > 0) {
      otpInputs[index - 1].focus();
    }
  });
});

// Function to verify OTP
async function verifyOTP(otp) {
  showLoading();
  try {
    const name = sessionStorage.getItem('tempUserName');
    const phone = sessionStorage.getItem('tempUserPhone');
    
    // Create user session
    const session = {
      userType: 'phone',
      name: name,
      phone: phone,
      loginTime: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      sessionId: Math.random().toString(36).substr(2, 9)
    };
    
    localStorage.setItem('userSession', JSON.stringify(session));
    localStorage.setItem('registeredPhone', phone);
    
    // Show success message and redirect
    showSuccessAndRedirect('Welcome ' + name + '! Login successful!');
  } catch (error) {
    showError('Invalid OTP. Please try again.');
    otpInputs.forEach(input => input.value = '');
    otpInputs[0].focus();
  } finally {
    hideLoading();
  }
}

// Handle guest login
async function handleGuestLogin() {
  showLoading();
  
  try {
    const guestId = 'guest_' + Math.random().toString(36).substr(2, 9);
    const timestamp = new Date().toISOString();
    
    // Create guest session
    const session = {
      userType: 'guest',
      name: 'Guest User',
      guestId: guestId,
      loginTime: timestamp,
      lastActivity: timestamp,
      sessionId: Math.random().toString(36).substr(2, 9)
    };

    localStorage.clear();
    localStorage.setItem('guestSession', JSON.stringify(session));
    
    showSuccessAndRedirect('Welcome Guest! Logging in...');
  } catch (error) {
    console.error('Guest login failed:', error);
    showError('Failed to login as guest. Please try again.');
  } finally {
    hideLoading();
  }
}

// Handle social logins
async function handleGoogleSignIn() {
  showLoading();
  try {
    const timestamp = new Date().toISOString();
    const session = {
      userType: 'google',
      name: 'Google User',
      email: 'user@gmail.com',
      loginTime: timestamp,
      lastActivity: timestamp,
      sessionId: Math.random().toString(36).substr(2, 9)
    };
    
    localStorage.setItem('userSession', JSON.stringify(session));
    showSuccessAndRedirect('Google login successful!');
  } catch (error) {
    console.error('Google login failed:', error);
    showError('Google login failed. Please try again.');
  } finally {
    hideLoading();
  }
}

async function handleAppleSignIn() {
  showLoading();
  try {
    const timestamp = new Date().toISOString();
    const session = {
      userType: 'apple',
      name: 'Apple User',
      email: 'user@icloud.com',
      loginTime: timestamp,
      lastActivity: timestamp,
      sessionId: Math.random().toString(36).substr(2, 9)
    };
    
    localStorage.setItem('userSession', JSON.stringify(session));
    showSuccessAndRedirect('Apple login successful!');
  } catch (error) {
    console.error('Apple login failed:', error);
    showError('Apple login failed. Please try again.');
  } finally {
    hideLoading();
  }
}

// Helper function to show success message and redirect
function showSuccessAndRedirect(message) {
  const successMessage = document.createElement('div');
  successMessage.className = 'success-message show';
  successMessage.innerHTML = `
    <i class="material-icons">check_circle</i>
    ${message}
  `;
  document.querySelector('.login-card').appendChild(successMessage);
  
  setTimeout(() => {
    window.location.href = 'dashboard.html';
  }, 1500);
}

// Check for existing session on load
window.addEventListener('load', () => {
  const userSession = localStorage.getItem('userSession');
  const guestSession = localStorage.getItem('guestSession');
  
  if (userSession || guestSession) {
    try {
      const session = userSession ? JSON.parse(userSession) : JSON.parse(guestSession);
      const loginTime = new Date(session.loginTime);
      const now = new Date();
      const hoursSinceLogin = (now - loginTime) / (1000 * 60 * 60);
      
      if (hoursSinceLogin < 24) {
        window.location.href = 'dashboard.html';
        return;
      } else {
        localStorage.clear();
      }
    } catch (error) {
      console.error('Session validation error:', error);
      localStorage.clear();
    }
  }

  // Check for remembered phone
  const registeredPhone = localStorage.getItem('registeredPhone');
  if (registeredPhone) {
    document.getElementById('phoneInput').value = registeredPhone;
  }
}); 