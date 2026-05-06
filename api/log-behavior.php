<?php

// Read the packed array payload
$rawData = file_get_contents('php://input');
$telemetryArray = json_decode($rawData, true);

if ($telemetryArray && is_array($telemetryArray)) {
    // 1. Unpack the sequential array
    $sessionId = $telemetryArray[0] ?? 'unknown_session';
    $clicks = (int)($telemetryArray[1] ?? 0);
    $scrollDistance = (int)($telemetryArray[2] ?? 0);
    $mouseDistance = (float)($telemetryArray[3] ?? 0);
    $maxMouseSpeed = (float)($telemetryArray[4] ?? 0);
    $directionChanges = (int)($telemetryArray[5] ?? 0);
    $timeOnPageSeconds = (int)($telemetryArray[6] ?? 0); // Your new variable
    
    // 2. Parse the path from the referrer header instead of the payload
    $referer = $_SERVER['HTTP_REFERER'] ?? '/';
    $pagePath = parse_url($referer, PHP_URL_PATH) ?? '/'; 

    // 3. Insert using the updated variables
    $insertStmt = $pdo->prepare("INSERT INTO user_behavior_logs 
        (session_id, page_path, clicks, scroll_distance, time_on_page, mouse_distance, max_mouse_speed, direction_changes) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    
    // Execute with $timeOnPageSeconds and $pagePath
    $insertStmt->execute([
        $sessionId, 
        $pagePath, 
        $clicks, 
        $scrollDistance, 
        $timeOnPageSeconds, 
        $mouseDistance, 
        $maxMouseSpeed, 
        $directionChanges
    ]);

    // 4. Aggregate the rolling 3-minute window
    $aggStmt = $pdo->prepare("
        SELECT 
            SUM(clicks) as total_clicks, 
            SUM(scroll_distance) as total_scroll,
            SUM(direction_changes) as total_jitter,
            MAX(max_mouse_speed) as peak_speed
        FROM user_behavior_logs 
        WHERE session_id = ? 
        AND created_at >= NOW() - INTERVAL 3 MINUTE
    ");
    $aggStmt->execute([$sessionId]);
    $history = $aggStmt->fetch();

    $totalClicks = (int)$history['total_clicks'];
    $totalScroll = (int)$history['total_scroll'];
    $totalJitter = (int)$history['total_jitter'];
    $peakSpeed = (float)$history['peak_speed'];
    
    $calculatedPersona = "standard"; 

    // --- Advanced Scoring Logic ---
    if ($totalJitter > 30 || $peakSpeed > 5.0 || ($totalClicks > 15 && $totalScroll < 1500)) {
        $calculatedPersona = "erratic";
    } elseif ($totalScroll > 1600 && $totalJitter < 10 && $peakSpeed < 2.5) {
        $calculatedPersona = "reader";
    } elseif (in_array($pagePath, ['/resume.html', '/projects.html'])) {
        $calculatedPersona = "recruiter";
    }

    setcookie("behavior_hint", $calculatedPersona, time() + 3600, "/");
}

http_response_code(200);
?>