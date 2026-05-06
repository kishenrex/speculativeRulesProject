# Speculative Rules API: Predictive Performance & Behavioral Analytics

## Project Overview
The **Speculative Rules API Project** aims to improve web performance by moving beyond static prefetching to a dynamic, intent-based model. By leveraging the modern [Speculation Rules API](https://developer.mozilla.org/en-US/docs/Web/API/Speculation_Rules_API), this project builds an intelligent layer that predicts which pages a user is likely to visit next based on real-time behavioral signals.

The core objective is to reduce page load times to near-zero by preloading pages before the user even clicks a link, while also managing resource overhead to ensure that data is not wasted on unlikely transitions.

---

## Technical Architecture

The project operates on a loop between the client interface and a behavioral analytics engine:

1.  **Signal Collection:** A client-side JavaScript script monitors user interactions (mouse movement, scroll velocity, click patterns).
2.  **Behavioral Scoring:** Users are categorized based on their "interaction intensity." 
    * **The "Rage-Clicking" User:** High-frequency clicks and erratic mouse movement suggest frustration and so this kind of user likely won't benefit much from preloading due to the constant page changes.
    * **The "Calm" User:** Measured scrolling and deliberate movements suggest a reading state where prefetching will be more useful, as the user will likely hover links they are interested in, which is a strong signal that preloading the page would make sense.
3.  **Link Hinting:** The backend analytics engine processes these signals and sends "Link Hints" back to the frontend.
4.  **Speculation Injection:** The frontend JS dynamically generates and injects a `<script type="speculationrules">` block into the document head, instructing the browser to prefetch or prerender the hinted URLs.

---

## Weekly Progress Report

### Week 1: Project Foundations & Speculation Rules Integration
* Defined the core project scope and research into the **Speculation Rules API** syntax.
* Established a baseline implementation where static rules were manually added to a test environment to measure performance gains.
* Set up the initial backend infrastructure to receive basic telemetry from the frontend.

### Week 2: Behavioral Signal Processing
* Developed the "Behavioral Score" algorithm. This calculates a real-time score based on:
    * **Mouse Movement:** Tracking X/Y coordinates to detect intent.
    * **Scroll Speed:** Identifying if a user is skimming or reading.
    * **Rapid Clicks:** Differentiating between standard navigation and "rage-clicking."
* **Outcome:** Successfully differentiated between "Rage" vs. "Calm" users to toggle prefetch triggers.


### Week 3: Feedback Loop & Dynamic Injection
* Implemented the **Link Hinting** mechanism.
* Developed the frontend logic that listens for backend hints and dynamically updates the DOM with speculation rules.
* Optimized the JS script to ensure that adding rules does not block the main thread or negatively impact the current page's performance.

### Week 4: Efficiency & Idle Optimization
* **Idle Watcher Implementation:** Replaced the heavy 10-second regular polling interval with an "Idle Watcher." 
    * The system now remains dormant until activity is detected.
    * Any mouse movement or interaction cancels the idle state, ensuring analytics are only gathered during active sessions.
* **Advanced Metrics:** Added **Mouse Acceleration** analysis to the behavioral score to better predict the trajectory of a cursor toward specific UI elements (buttons/links).
* **Payload Reduction:** Minimized the telemetry script size to reduce the initial load impact.
* Integrated the **Service Workers API** to manage background tasks.
* **Background Fetch:** Leveraged Service Workers to handle prefetching logic even if the main thread is busy.
* Implemented "Aggressive Preload" strategies for high-confidence scores, where the Service Worker forces a cache update for high-priority assets before the Speculation Rules API even kicks in.

---

## Future Roadmap
* **Device-Aware Preloading:** Adjusting prefetch aggression based on the user's current battery life and connection type (e.g., 4G vs. Wi-Fi).
* **A/B Testing Framework:** Building a dashboard to compare the conversion rates and load times of "Speculative" sessions vs. "Standard" sessions.
* **Payload Buffering:** Buffer the payload to local storage first before sending, so that if user closes tab or goes offline, the data can still be sent later. 
* **Send data immediately after idle ends:** After waking from idle, send telemetry with how long it was idle for, then go back to regular polling. Shows behavior and long tab use etc.
