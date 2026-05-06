const telemetryData = {
    sessionId: getOrCreateSessionId(),
    clicks: 0,
    scrollDistance: 0,
    timeOnPage: 0,
    // New Advanced Metrics
    mouseDistance: 0,
    maxMouseSpeed: 0,
    directionChanges: 0,
    pagePath: window.location.pathname
};

let lastScrollY = window.scrollY;

// --- Idle Watcher Logic ---
let idleTimer;
let activityThrottler;
const IDLE_THRESHOLD = 4000;

function resetIdleWatcher() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
        sendTelemetry();
    }, IDLE_THRESHOLD);
}

function handleActivity() {
    if (!activityThrottler) {
        resetIdleWatcher();
        activityThrottler = setTimeout(() => {
            activityThrottler = null;
        }, 250); 
    }
}

// --- NEW: Advanced Mouse Tracking ---
let lastMouseX = null;
let lastMouseY = null;
let lastMouseTime = null;
let lastDx = 0;
let lastDy = 0;
let mouseSampleThrottler = false;

document.addEventListener('mousemove', (e) => {
    handleActivity(); // Keep the idle watcher alive

    // Throttle the heavy math to run every 50ms (20fps) to save CPU
    if (mouseSampleThrottler) return;
    mouseSampleThrottler = true;
    setTimeout(() => { mouseSampleThrottler = false; }, 50);

    const currentTime = performance.now();

    if (lastMouseX !== null) {
        const dx = e.clientX - lastMouseX;
        const dy = e.clientY - lastMouseY;
        const dt = currentTime - lastMouseTime;

        if (dt > 0) {
            // 1. Calculate Distance
            const distance = Math.sqrt(dx * dx + dy * dy);
            telemetryData.mouseDistance += distance;

            // 2. Calculate Speed (pixels per millisecond)
            const speed = distance / dt;
            if (speed > telemetryData.maxMouseSpeed) {
                telemetryData.maxMouseSpeed = speed;
            }

            // 3. Calculate "Jitter" (Sudden directional changes)
            // If the X or Y direction completely flips, it's a erratic movement
            if ((dx * lastDx < 0) || (dy * lastDy < 0)) {
                telemetryData.directionChanges++;
            }
        }
        
        lastDx = dx;
        lastDy = dy;
    }

    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    lastMouseTime = currentTime;
}, { passive: true });

// Track clicks
document.addEventListener('click', () => { 
    telemetryData.clicks++; 
    handleActivity();
});

// Track scroll distance
document.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;
    telemetryData.scrollDistance += Math.abs(currentScrollY - lastScrollY);
    lastScrollY = currentScrollY;
    handleActivity();
}, { passive: true });

document.addEventListener('touchstart', handleActivity, { passive: true });
document.addEventListener('keydown', handleActivity, { passive: true });

// Send data via Beacon
function sendTelemetry() {
    // Abort if literally nothing happened
    if (telemetryData.clicks === 0 && telemetryData.scrollDistance === 0 && telemetryData.mouseDistance === 0) {
        return; 
    }

    // Pack into a strict array format: [ID, Clicks, Scroll, MouseDist, MaxSpeed, Jitter, timeOnPage as rounded seconds]
    const packedPayload = [
        telemetryData.sessionId,
        telemetryData.clicks,
        Math.round(telemetryData.scrollDistance),
        Math.round(telemetryData.mouseDistance),
        parseFloat(telemetryData.maxMouseSpeed.toFixed(1)),
        telemetryData.directionChanges,
        Math.round(performance.now() / 1000)
    ];
    
    const blob = new Blob([JSON.stringify(packedPayload)], { type: 'application/json' });
    navigator.sendBeacon('/api/log-behavior.php', blob);
    
    // Reset counters
    telemetryData.clicks = 0;
    telemetryData.scrollDistance = 0;
    telemetryData.mouseDistance = 0;
    telemetryData.maxMouseSpeed = 0;
    telemetryData.directionChanges = 0;
}

resetIdleWatcher();

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        sendTelemetry();
        clearTimeout(idleTimer);
    } else {
        resetIdleWatcher();
    }
});

function getOrCreateSessionId() {
    let sid = localStorage.getItem('session_id');
    if (!sid) {
        sid = crypto.randomUUID();
        localStorage.setItem('session_id', sid);
    }
    return sid;
}