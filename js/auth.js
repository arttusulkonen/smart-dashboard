import firebase from '../firebase-init.js';

function initAuth() {
    var emailInput = document.getElementById('auth-email');
    var passwordInput = document.getElementById('auth-password');
    var loginBtn = document.getElementById('login-btn');
    var registerBtn = document.getElementById('register-btn');
    var authMessage = document.getElementById('auth-message');

    function showMessage(text, isError) {
        if (!authMessage) return;
        authMessage.innerText = text;
        authMessage.style.display = 'block';
        authMessage.style.color = isError ? '#ff453a' : '#32d74b';
    }

    if (!firebase.apps.length) {
        showMessage('Firebase is not configured. Check .env variables.', true);
        return;
    }

    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            window.location.href = 'index.html';
        }
    });

    if (loginBtn) {
        loginBtn.onclick = function() {
            if (!emailInput || !passwordInput) return;
            firebase.auth().signInWithEmailAndPassword(emailInput.value.trim(), passwordInput.value)
                .catch(function(error) {
                    showMessage(error.message, true);
                });
        };
    }

    if (registerBtn) {
        registerBtn.onclick = function() {
            if (!emailInput || !passwordInput) return;
            firebase.auth().createUserWithEmailAndPassword(emailInput.value.trim(), passwordInput.value)
                .catch(function(error) {
                    showMessage(error.message, true);
                });
        };
    }
}

window.onload = initAuth;