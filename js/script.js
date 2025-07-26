document.addEventListener('DOMContentLoaded', function() {
    // Page sections
    const homepage = document.getElementById('homepage');
    const loginPage = document.getElementById('login-page');
    const weatherDashboardPage = document.getElementById('weather-dashboard-page');
    const blynkDashboardPage = document.getElementById('blynk-dashboard-page');
    const sensorReadingsPage = document.getElementById('sensor-readings-page');
    const sensorDetailPage = document.getElementById('sensor-detail-page');

    // Buttons and links
    const loginButtons = document.querySelectorAll('.login-btn');
    const backToHomeBtn = document.getElementById('back-to-home-btn');
    const backToHomeFromDashButtons = document.querySelectorAll('.back-to-home-from-dash');
    const backToSensorsBtn = document.getElementById('back-to-sensors-btn');
    const logoutButtons = document.querySelectorAll('#logout-button, #blynk-logout-button, #sensors-logout-button, #header-logout-btn');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Forms and dynamic content
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');
    const mainHeaderAvatar = document.getElementById('main-header-avatar');
    const avatarButton = document.getElementById('avatar-button');
    const logoutDropdown = document.getElementById('logout-dropdown');
    const dashboardContent = document.getElementById('dashboard-content');
    const dashboardLoader = document.getElementById('dashboard-loader');
    const sensorDetailTitle = document.getElementById('sensor-detail-title');
    
    // --- MOCK USER DATA ---
    const users = {
        admin: { pass: 'admin123', name: 'Admin User' },
        user: { pass: 'user123', name: 'Clayton Walter' }
    };
    let loggedInUser = null;

    // --- UI & NAVIGATION LOGIC ---
    function showPage(pageId) {
        [homepage, loginPage, weatherDashboardPage, blynkDashboardPage, sensorReadingsPage, sensorDetailPage].forEach(p => p.classList.add('hidden'));
        document.getElementById(pageId).classList.remove('hidden');
    }

    function updateUI() {
        const headerLoginBtn = document.querySelector('header .login-btn');
        const heroLoginBtn = document.querySelector('.hero-section .login-btn');

        if (loggedInUser) {
            headerLoginBtn.classList.add('hidden');
            mainHeaderAvatar.classList.remove('hidden');
            mainHeaderAvatar.style.display = 'block';
            const avatarImg = mainHeaderAvatar.querySelector('img');
            const initial = loggedInUser.username === 'admin' ? 'A' : 'U';
            avatarImg.src = `https://placehold.co/40x40/34D399/FFFFFF?text=${initial}`;
            heroLoginBtn.textContent = 'View Controls';
        } else {
            headerLoginBtn.classList.remove('hidden');
            mainHeaderAvatar.classList.add('hidden');
            logoutDropdown.classList.add('hidden');
            heroLoginBtn.textContent = 'Login to Dashboard';
        }
    }

    // --- EVENT LISTENERS ---
    loginButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (loggedInUser) {
                showPage('blynk-dashboard-page');
                loadControlsDashboard();
            } else {
                showPage('login-page');
            }
        });
    });

    backToHomeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showPage('homepage');
    });
    
    backToHomeFromDashButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            showPage('homepage');
        });
    });
    
    backToSensorsBtn.addEventListener('click', () => {
        showPage('sensor-readings-page');
    });

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.dataset.target;
            if (target === 'homepage') {
                showPage('homepage');
            } else if (loggedInUser) {
                showPage(target);
                if (target === 'weather-dashboard-page') loadWeatherDashboard();
                if (target === 'blynk-dashboard-page') loadControlsDashboard();
                if (target === 'sensor-readings-page') loadSensorsDashboard();
            } else {
                showPage('login-page');
            }
        });
    });

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = loginForm.username.value.toLowerCase();
        const password = loginForm.password.value;

        if (users[username] && users[username].pass === password) {
            loggedInUser = { username, ...users[username] };
            errorMessage.classList.add('hidden');
            updateUI();
            showPage('homepage');
        } else {
            errorMessage.textContent = 'Invalid username or password.';
            errorMessage.classList.remove('hidden');
        }
    });

    function handleLogout(e) {
        e.preventDefault();
        loggedInUser = null;
        if(blynkInterval) clearInterval(blynkInterval);
        blynkInitialized = false;
        updateUI();
        showPage('homepage');
    }

    logoutButtons.forEach(btn => btn.addEventListener('click', handleLogout));
    
    avatarButton.addEventListener('click', () => {
        logoutDropdown.classList.toggle('hidden');
    });

    window.addEventListener('click', function(e) {
        if (!mainHeaderAvatar.contains(e.target)) {
            logoutDropdown.classList.add('hidden');
        }
    });

    // --- BLYNK DASHBOARD LOGIC ---
    let blynkInitialized = false;
    let blynkInterval;
    **const BLYNK_AUTH_TOKEN = "JVN2yzq5VvZgS9fagsPbZus6s4FFzjAg";**
    const BLYNK_SERVER_HOST = "blynk.cloud"; 

    const blynkConfig = {
        switches: [
            { label: 'Motor Switch', pin: 'V1', offText: 'OFF', onText: 'ON' },
            { label: 'Light Switch', pin: 'V2', offText: 'OFF', onText: 'ON' },
            { label: 'Fire Kill Switch', pin: 'V3', offText: 'OFF', onText: 'ON' },
            { label: 'Alarm Switch', pin: 'V4', offText: 'OFF', onText: 'ON' },
        ],
        statuses: [
            { label: 'Motor ON', pin: 'V5' }, { label: 'Motor OFF', pin: 'V6' },
            { label: 'Voltage Alert', pin: 'V7' }, { label: 'Light', pin: 'V8' },
            { label: 'Gas', pin: 'V9' }, { label: 'Speaker Status', pin: 'V10' },
            { label: 'Rain LED', pin: 'V11' }, { label: 'Motion', pin: 'V12' },
        ],
        gauges: [
            { label: 'Shallow Moisture', pin: 'V13', min: 1, max: 4095, unit: 'ADC' },
            { label: 'Deeper Moisture', pin: 'V14', min: 1, max: 4095, unit: 'ADC' },
            { label: 'Mid Moisture', pin: 'V15', min: 1, max: 4095, unit: 'ADC' },
            { label: 'Gas Level', pin: 'V16', min: 0, max: 100, unit: '%' },
            { label: 'Voltage', pin: 'V17', min: 0, max: 44, unit: 'V' },
            { label: 'Water level', pin: 'V18', min: 0, max: 100, unit: '%' },
            { label: 'Temperature', pin: 'V19', min: 0, max: 150, unit: '°C' },
            { label: 'Humidity', pin: 'V20', min: 0, max: 100, unit: '%' },
        ]
    };

    function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
        const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
        return {
            x: centerX + (radius * Math.cos(angleInRadians)),
            y: centerY + (radius * Math.sin(angleInRadians))
        };
    }

    function describeArc(x, y, radius, startAngle, endAngle) {
        const start = polarToCartesian(x, y, radius, endAngle);
        const end = polarToCartesian(x, y, radius, startAngle);
        const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
        return ["M", start.x, start.y, "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(" ");
    }

    function updateBlynkGauge(pin, value, min, max) {
        const needle = document.getElementById(`needle-${pin}`);
        const valueText = document.getElementById(`gauge-value-text-${pin}`);
        if (!needle || !valueText) return;

        const clampedValue = Math.max(min, Math.min(max, value));
        const percentage = (max - min) > 0 ? (clampedValue - min) / (max - min) : 0;
        const angle = -120 + (percentage * 240); // Range from -120 to +120 degrees

        needle.setAttribute('transform', `rotate(${angle} 100 100)`);
        valueText.textContent = clampedValue.toFixed(1);
    }

    async function refreshBlynkData() {
        if (BLYNK_AUTH_TOKEN === "YOUR_BLYNK_AUTH_TOKEN") {
            console.warn("Blynk Auth Token not set. Using random data for demo.");
            return;
        }
        const allPins = [...blynkConfig.switches, ...blynkConfig.statuses, ...blynkConfig.gauges].map(d => d.pin);
        const pinParams = allPins.map(pin => `${pin}`).join('&');
        
        try {
            const url = `https://${BLYNK_SERVER_HOST}/external/api/get?token=${BLYNK_AUTH_TOKEN}&${pinParams}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Blynk API error: ${response.statusText}`);
            const data = await response.json();

            blynkConfig.switches.forEach(s => {
                const val = data[s.pin];
                const checkbox = document.getElementById(`switch-${s.pin}`);
                const text = document.getElementById(`switch-text-${s.pin}`);
                if (checkbox && text) {
                    checkbox.checked = val == 1;
                    text.textContent = val == 1 ? s.onText : s.offText;
                }
            });
            blynkConfig.statuses.forEach(s => {
                const dot = document.getElementById(`status-${s.pin}`);
                if (dot) dot.classList.toggle('active', data[s.pin] == 1);
            });
            blynkConfig.gauges.forEach(g => {
                updateBlynkGauge(g.pin, data[g.pin], g.min, g.max);
            });

        } catch (error) {
            console.error("Failed to fetch from Blynk:", error);
            if(blynkInterval) clearInterval(blynkInterval);
        }
    }

    async function updateBlynkPin(pin, value) {
        if (BLYNK_AUTH_TOKEN === "YOUR_BLYNK_AUTH_TOKEN") return;
         try {
            const url = `https://${BLYNK_SERVER_HOST}/external/api/update?token=${BLYNK_AUTH_TOKEN}&${pin}=${value}`;
            await fetch(url);
        } catch (error) {
            console.error(`Failed to update Blynk pin ${pin}:`, error);
        }
    }
    
    function initBlynkIfNeeded() {
        if (blynkInitialized) return;
        if (blynkInterval) clearInterval(blynkInterval);
        blynkInterval = setInterval(refreshBlynkData, 5000);
        refreshBlynkData();
        blynkInitialized = true;
    }

    function loadControlsDashboard() {
        const switchContainer = document.getElementById('switch-container');
        const statusContainer = document.getElementById('status-container');
        if (switchContainer.innerHTML !== '') return; // Already built

        blynkConfig.switches.forEach(s => {
            const card = document.createElement('div');
            card.className = 'blynk-card flex-row justify-between';
            card.innerHTML = `<div class="flex items-center"><span class="font-bold text-lg">${s.label}</span></div><div class="flex items-center space-x-3"><label class="toggle-switch"><input type="checkbox" id="switch-${s.pin}" data-pin="${s.pin}"><span class="slider"></span></label><span id="switch-text-${s.pin}" class="font-bold text-lg w-12 text-right">${s.offText}</span></div>`;
            switchContainer.appendChild(card);
        });
        blynkConfig.statuses.forEach(s => {
            const card = document.createElement('div');
            card.className = 'blynk-card';
            card.innerHTML = `<span class="font-semibold">${s.label}</span><div id="status-${s.pin}" class="status-dot mt-2"></div>`;
            statusContainer.appendChild(card);
        });
        
        switchContainer.addEventListener('change', (event) => {
            if (event.target.type === 'checkbox') {
                const pin = event.target.dataset.pin;
                const value = event.target.checked ? 1 : 0;
                updateBlynkPin(pin, value);
            }
        });
        initBlynkIfNeeded();
    }

    function loadSensorsDashboard() {
        const gaugeContainer = document.getElementById('gauge-container');
        if (gaugeContainer.innerHTML !== '') return; // Already built

        blynkConfig.gauges.forEach(g => {
            const card = document.createElement('div');
            card.className = 'light-card gauge-card items-center justify-center p-4 rounded-lg';
            card.dataset.pin = g.pin;
            card.dataset.label = g.label;
            card.innerHTML = `
                <div class="relative w-full" style="padding-top: 100%;">
                    <svg viewBox="0 0 200 200" class="absolute top-0 left-0 w-full h-full">
                        <defs>
                            <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style="stop-color:#3b82f6" />
                                <stop offset="100%" style="stop-color:#60a5fa" />
                            </linearGradient>
                        </defs>
                        <path d="${describeArc(100, 100, 80, -120, 120)}" stroke="#e5e7eb" stroke-width="12" fill="none"></path>
                        <path d="${describeArc(100, 100, 80, -120, 60)}" stroke="url(#blueGradient)" stroke-width="12" fill="none"></path>
                        <path d="${describeArc(100, 100, 90, 60, 80)}" stroke="#22c55e" stroke-width="6" fill="none"></path>
                        
                        <text x="50" y="170" text-anchor="middle" fill="#4b5563" font-size="18">${g.min}</text>
                        <text x="150" y="170" text-anchor="middle" fill="#4b5563" font-size="18">${g.max}</text>
                        
                        <text id="gauge-value-text-${g.pin}" x="100" y="120" text-anchor="middle" fill="#1f2937" font-size="40" font-weight="bold">--</text>
                        <text x="100" y="145" text-anchor="middle" fill="#6b7280" font-size="16">${g.unit}</text>
                        
                        <g id="needle-${g.pin}" transform="rotate(-120 100 100)">
                            <path d="M 100 25 L 95 100 L 105 100 Z" fill="#4b5563" />
                            <circle cx="100" cy="100" r="8" fill="#4b5563" />
                        </g>
                    </svg>
                </div>
                <span class="font-semibold mt-2 text-center text-gray-800">${g.label}</span>`;
            gaugeContainer.appendChild(card);
        });

        gaugeContainer.addEventListener('click', (event) => {
            const card = event.target.closest('.gauge-card');
            if (card) {
                const { pin, label } = card.dataset;
                showSensorDetailPage(pin, label);
            }
        });
        initBlynkIfNeeded();
    }
    
    // --- Sensor Detail Page Logic ---
    let sensorChart = null;
    function showSensorDetailPage(pin, label) {
        sensorDetailTitle.textContent = `${label} Timeline`;
        showPage('sensor-detail-page');

        const labels = [];
        const data = [];
        for (let i = 10; i >= 0; i--) {
            const time = new Date(Date.now() - i * 5 * 60 * 1000);
            labels.push(time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            data.push(Math.random() * 100);
        }

        const ctx = document.getElementById('sensor-chart').getContext('2d');
        if (sensorChart) {
            sensorChart.destroy();
        }
        sensorChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: label,
                    data: data,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true, ticks: { color: 'white' } },
                    x: { ticks: { color: 'white' } }
                },
                plugins: { legend: { labels: { color: 'white' } } }
            }
        });
    }

    // --- Weather Dashboard Functions (placeholders) ---
    function loadWeatherDashboard(){}
    
    // Mobile menu toggle
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    mobileMenuButton.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });
});
