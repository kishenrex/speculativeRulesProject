document.addEventListener("DOMContentLoaded", () => {
    // --- UI Elements ---
    const perfBtn = document.getElementById('performance-picker-btn');
    const perfDialog = document.getElementById('performance-dialog');
    const toggle = document.getElementById('prerender-toggle');
    const statusText = document.getElementById('prerender-status-text');

    // 1. Open Dialog Logic
    if (perfBtn && perfDialog) {
        perfBtn.addEventListener('click', () => perfDialog.showModal());
    }

    // 2. Load User's Preference (Default to ON)
    let isPrerenderEnabled = localStorage.getItem('prerender_enabled') !== 'false';
    
    if (toggle) {
        toggle.checked = isPrerenderEnabled;
        updateStatusText(isPrerenderEnabled);

        // Listen for user toggling the setting
        toggle.addEventListener('change', (e) => {
            isPrerenderEnabled = e.target.checked;
            localStorage.setItem('prerender_enabled', isPrerenderEnabled);
            updateStatusText(isPrerenderEnabled);
            applySpeculationRules(); // Re-run the injection logic instantly
        });
    }

    function updateStatusText(enabled) {
        if (statusText) {
            statusText.innerText = enabled ? "Enabled" : "Disabled";
            statusText.style.color = enabled ? "#28a745" : "#6c757d";
        }
    }

    // --- Core Injection Logic ---
    function applySpeculationRules() {
        // Step A: Always wipe existing rules clean first to prevent duplicates
        document.querySelectorAll('script[type="speculationrules"]').forEach(el => el.remove());

        // Step B: Abort if the user manually disabled the feature
        if (!isPrerenderEnabled) {
            console.log("Speculative Rules: Disabled by User.");
            return;
        }

        // Step C: Read the hint provided by the backend via Cookie
        const hintMatch = document.cookie.match(new RegExp('(^| )behavior_hint=([^;]+)'));
        const behaviorHint = hintMatch ? hintMatch[2] : 'unknown';

        console.log(`Backend hint detected: ${behaviorHint}`);

        let linksToPrerender = [];
        const eagernessLevel = "eager";

        switch (behaviorHint) {
            case 'erratic':
                // Only abort if they are erratic AND they haven't explicitly opened 
                // the settings menu to test the feature. 
                // For the portfolio demo, we will force a fallback to the target page.
                console.log("Erratic user detected. Overriding for portfolio demo purposes.");
                linksToPrerender = ['/target-page.html'];
                break;
            case 'reader':
                linksToPrerender = ['/about.html', '/experience.html'];
                break;
            case 'recruiter':
                linksToPrerender = ['/resume.html', '/projects.html'];
                break;
            default:
                linksToPrerender = ['/target-page.html'];
        }

        // Step D: Inject the rules
        if (linksToPrerender.length > 0) {
            const specRule = {
                "prerender": linksToPrerender.map(link => ({
                    "source": "document",
                    "where": {"href_matches": link},
                    "eagerness": eagernessLevel
                }))
            };

            const scriptTag = document.createElement('script');
            scriptTag.type = 'speculationrules';
            scriptTag.textContent = JSON.stringify(specRule);
            document.head.appendChild(scriptTag);
            
            console.log("Speculation rules actively injected for:", linksToPrerender);
        }
    }

    // 3. Run the logic initially on page load
    applySpeculationRules();
});