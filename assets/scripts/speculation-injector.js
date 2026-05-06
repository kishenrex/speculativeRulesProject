document.addEventListener("DOMContentLoaded", () => {
    const hintMatch = document.cookie.match(new RegExp('(^| )behavior_hint=([^;]+)'));
    const behaviorHint = hintMatch ? hintMatch[2] : 'unknown';

    let linksToTarget = [];

    switch (behaviorHint) {
        case 'erratic': return; 
        case 'reader': linksToTarget = ['/about.html', '/experience.html']; break;
        case 'recruiter': linksToTarget = ['/resume.html', '/projects.html']; break;
        default: linksToTarget = ['/target-page.html'];
    }

    if (linksToTarget.length > 0) {
        // 1. Inject Speculation Rules (Handles the Rendering layer)
        const specRule = {
            "prerender": linksToTarget.map(link => ({
                "source": "document",
                "where": {"href_matches": link},
                "eagerness": "eager"
            }))
        };
        const scriptTag = document.createElement('script');
        scriptTag.type = 'speculationrules';
        scriptTag.textContent = JSON.stringify(specRule);
        document.head.appendChild(scriptTag);

        // 2. NEW: Tell the Service Worker to fetch the raw files (Handles the Network layer)
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                action: 'aggressive_cache',
                urls: linksToTarget
            });
        }
    }
});