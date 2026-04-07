if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch(error => {
                console.error('Service Worker registration failed:', error);
            });
    });
}

let deferredPrompt;
const installBtn = document.getElementById('installBtn');

if (installBtn && window.matchMedia('(display-mode: standalone)').matches) {
    installBtn.style.display = 'none';
}

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installBtn && !window.matchMedia('(display-mode: standalone)').matches) {
        installBtn.style.display = 'inline-block';
    }

    console.log("'beforeinstallprompt' event was fired.");
});

if (installBtn) {
    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) {
            console.warn('Install prompt was not yet available.');
            return;
        }
        
        deferredPrompt.prompt();

        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User responded to the install prompt with ${outcome}`);

    });
}

