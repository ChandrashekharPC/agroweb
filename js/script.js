document.addEventListener('DOMContentLoaded', function() {
    // Page sections
    const homepage = document.getElementById('homepage');
    const loginPage = document.getElementById('login-page');
    const weatherDashboardPage = document.getElementById('weather-dashboard-page');
    const blynkDashboardPage = document.getElementById('blynk-dashboard-page');

    // Buttons and links
    const loginButtons = document.querySelectorAll('.login-btn');
    const backToHomeBtn = document.getElementById('back-to-home-btn');
    const backToHomeFromDashButtons = document.querySelectorAll('.back-to-home-from-dash');
    const logoutButton = document.getElementById('logout-button');
    const blynkLogoutButton = document.getElementById('blynk-logout-button');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Forms and dynamic content
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');
    const mainHeaderAvatar = document.getElementById('main-header-avatar');
    const avatarButton = document.getElementById('avatar-button');
    const logoutDropdown = document.getElementById('logout-dropdown');
    const headerLogoutBtn = document.getElementById('header-logout-btn');
    const dashboardContent = document.getElementById('dashboard-content');
    const dashboardLoader = document.getElementById('dashboard-loader');
    
    // --- MOCK USER DATA ---
    const users = {
        admin: { pass: 'admin123', name: 'Admin User' },
        user: { pass: 'user123', name: 'Clayton Walter' }
    };
    let loggedInUser = null;

    // --- UI & NAVIGATION LOGIC ---
    function showPage(pageId) {
        homepage.classList.add('hidden');
        loginPage.classList.add('hidden');
        weatherDashboardPage.classList.add('hidden');
        blynkDashboardPage.classList.add('hidden');
        document.getElementById(pageId).classList.remove('hidden');
    }

    function updateUI() {
        const headerLoginBtn = document.querySelector('header .login-btn');
        const heroLoginBtn = document.querySelector('.hero-section .login-btn');

        if (loggedInUser) {
            // --- Logged-in state ---
            headerLoginBtn.classList.add('hidden');
            mainHeaderAvatar.classList.remove('hidden');
            mainHeaderAvatar.style.display = 'block'; // Use block for the relative container
            const avatarImg = mainHeaderAvatar.querySelector('img');
            const initial = loggedInUser.username === 'admin' ? 'A' : 'U';
            avatarImg.src = `https://placehold.co/40x40/34D399/FFFFFF?text=${initial}`;
            heroLoginBtn.textContent = 'View Dashboard';
        } else {
            // --- Logged-out state ---
            headerLoginBtn.classList.remove('hidden');
            mainHeaderAvatar.classList.add('hidden');
            logoutDropdown.classList.add('hidden'); // Ensure dropdown is hidden on logout
            heroLoginBtn.textContent = 'Login to Dashboard';
        }
    }

    // --- EVENT LISTENERS ---
    loginButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (loggedInUser) {
                showPage('blynk-dashboard-page');
                loadBlynkDashboard();
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

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.dataset.target;
            if (target === 'homepage') {
                showPage('homepage');
            } else if (loggedInUser) {
                showPage(target);
                if (target === 'weather-dashboard-page') loadWeatherDashboard();
                if (target === 'blynk-dashboard-page') loadBlynkDashboard();
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

    function handleLogout() {
        loggedInUser = null;
        updateUI();
        showPage('homepage');
    }

    logoutButton.addEventListener('click', handleLogout);
    blynkLogoutButton.addEventListener('click', handleLogout);
    headerLogoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleLogout();
    });
    
    avatarButton.addEventListener('click', () => {
        logoutDropdown.classList.toggle('hidden');
    });

    // Close dropdown if clicked outside
    window.addEventListener('click', function(e) {
        if (!mainHeaderAvatar.contains(e.target)) {
            logoutDropdown.classList.add('hidden');
        }
    });


    // --- WEATHER DASHBOARD LOGIC ---
    function loadWeatherDashboard() {
         // Geolocation options with a timeout
        const geoOptions = {
            timeout: 8000 // 8 seconds
        };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                fetchAndBuildDashboard(latitude, longitude);
            },
            (error) => {
                // Log a more specific error message and use a fallback
                console.error("Geolocation error:", error.message);
                document.getElementById('loader-message').textContent = 'Could not get location. Loading default forecast...';
                fetchAndBuildDashboard(13.03, 74.88); // Default to Tenkamijar, IN
            },
            geoOptions
        );
    }

    async function fetchAndBuildDashboard(lat, lon) {
         const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&timezone=auto`;
        try {
            const response = await fetch(apiUrl);
            const weatherData = await response.json();
            
            const geoUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
            const geoResponse = await fetch(geoUrl);
            const geoData = await geoResponse.json();
            const locationName = `${geoData.address.city || geoData.address.town || 'Unknown'}, ${geoData.address.country}`;
            
            buildDashboardHTML(locationName);
            const processedData = processWeatherData(weatherData);
            populateWeekForecast(processedData);
            updateDashboardUI(processedData[0]);
            document.querySelector(`.day-forecast-card[data-index='0']`).classList.add('active');

            dashboardLoader.classList.add('hidden');
            dashboardContent.classList.remove('hidden');

        } catch (error) {
            console.error("Failed to fetch data:", error);
            document.getElementById('loader-message').textContent = 'Failed to load weather data.';
        }
    }
    function processWeatherData(data) {
         return data.daily.time.map((date, i) => {
            return {
                date: new Date(date),
                temp: Math.round(data.daily.temperature_2m_max[i]),
                code: data.daily.weather_code[i],
                wind: data.current.wind_speed_10m,
                uv: data.daily.uv_index_max[i],
                humidity: data.current.relative_humidity_2m,
                feels_like: Math.round(data.current.apparent_temperature),
                sunrise: new Date(data.daily.sunrise[i]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                sunset: new Date(data.daily.sunset[i]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
        });
    }
    function buildDashboardHTML(locationName) {
        dashboardContent.innerHTML = `
            <div class="lg:col-span-1 space-y-8">
                <div class="card p-6">
                    <p class="text-gray-400">${locationName}</p>
                    <h2 class="text-lg font-semibold text-white">${loggedInUser.name}</h2>
                    <div class="flex items-center my-4">
                        <div id="weather-icon" class="w-24 h-24 mr-4"></div>
                        <div>
                            <p class="text-6xl font-bold text-white"><span id="weather-temp">--</span>°C</p>
                            <p class="text-lg text-gray-300" id="weather-condition">--</p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="lg:col-span-2 space-y-8">
                <div id="week-forecast-container" class="grid grid-cols-4 md:grid-cols-7 gap-4"></div>
                <div>
                    <h3 class="font-semibold text-white text-xl mb-4">Today's overview</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         <div class="card p-6"><h4 class="text-gray-400 mb-2">Wind Status</h4><p class="text-3xl font-bold text-white mb-4"><span id="wind-status-value">--</span> km/h</p></div>
                         <div class="card p-6"><h4 class="text-gray-400 mb-2">UV Index</h4><p class="text-3xl font-bold text-white" id="uv-index-value">--</p></div>
                         <div class="card p-6"><h4 class="text-gray-400 mb-2">Sunrise & Sunset</h4><p id="sunrise-time">--:--</p><p id="sunset-time">--:--</p></div>
                         <div class="card p-6"><h4 class="text-gray-400 mb-2">Humidity</h4><p class="text-3xl font-bold text-white mb-4"><span id="humidity-value">--</span>%</p></div>
                         <div class="card p-6"><h4 class="text-gray-400 mb-2">Feels like</h4><p class="text-3xl font-bold text-white mb-4"><span id="feels-like-value">--</span>°</p></div>
                    </div>
                </div>
            </div>`;
    }
    function updateDashboardUI(data) {
        const weatherInfo = getWeatherDescription(data.code);
        document.getElementById('weather-icon').innerHTML = weatherInfo.icon;
        document.getElementById('weather-temp').textContent = data.temp;
        document.getElementById('weather-condition').textContent = weatherInfo.text;
        document.getElementById('wind-status-value').textContent = data.wind.toFixed(1);
        document.getElementById('uv-index-value').textContent = data.uv.toFixed(1);
        document.getElementById('sunrise-time').textContent = `Sunrise: ${data.sunrise}`;
        document.getElementById('sunset-time').textContent = `Sunset: ${data.sunset}`;
        document.getElementById('humidity-value').textContent = data.humidity;
        document.getElementById('feels-like-value').textContent = data.feels_like;
        
        const now = new Date(data.date);
        document.getElementById('dashboard-date').textContent = now.toLocaleString('default', { month: 'long', year: 'numeric' });
        document.getElementById('dashboard-day-date').textContent = now.toLocaleString('default', { weekday: 'long', month: 'long', day: 'numeric' });
    }
    function populateWeekForecast(weeklyData) {
        const container = document.getElementById('week-forecast-container');
        container.innerHTML = '';
        weeklyData.forEach((data, index) => {
            const card = document.createElement('div');
            card.className = 'day-forecast-card p-4 text-center';
            card.dataset.index = index;
            card.innerHTML = `
                <p class="font-semibold text-gray-400">${data.date.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                <div class="w-12 h-12 mx-auto my-2">${getWeatherDescription(data.code).icon}</div>
                <p class="font-bold text-white text-xl">${data.temp}°</p>`;
            container.appendChild(card);
        });
        
        container.addEventListener('click', function(e) {
            const card = e.target.closest('.day-forecast-card');
            if (!card) return;
            document.querySelectorAll('.day-forecast-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            updateDashboardUI(weeklyData[parseInt(card.dataset.index)]);
        });
    }
    const weatherIcons = {
        'Sunny': `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="#FFC700" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
        'Partly Cloudy': `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="#A0AEC0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path><path d="M22 10a5 5 0 0 0-5-5h-1.26a8 8 0 0 0-14.48 4.5A5.5 5.5 0 0 0 6.5 20H18"></path></svg>`,
        'Cloudy': `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="#A0AEC0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg>`,
        'Rain': `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="#63B3ED" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="16" y1="13" x2="16" y2="21"></line><line x1="8" y1="13" x2="8" y2="21"></line><line x1="12" y1="15" x2="12" y2="23"></line><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"></path></svg>`,
    };
    function getWeatherDescription(code) {
        const descriptions = {
            0: { icon: weatherIcons['Sunny'], text: 'Clear sky' }, 1: { icon: weatherIcons['Partly Cloudy'], text: 'Mainly clear' },
            2: { icon: weatherIcons['Partly Cloudy'], text: 'Partly cloudy' }, 3: { icon: weatherIcons['Cloudy'], text: 'Overcast' },
            61: { icon: weatherIcons['Rain'], text: 'Slight rain' }, 80: { icon: weatherIcons['Rain'], text: 'Rain showers' }
        };
        return descriptions[code] || { icon: weatherIcons['Cloudy'], text: 'Cloudy' };
    }


    // --- BLYNK DASHBOARD LOGIC ---
    let blynkInitialized = false;
    function loadBlynkDashboard() {
        if (blynkInitialized) return;
        
        const BLYNK_AUTH_TOKEN = "YOUR_BLYNK_AUTH_TOKEN"; 
        const BLYNK_SERVER_HOST = "blynk.cloud"; 

        const switches = [
            { label: 'Motor Switch', pin: 'V1', offText: 'OFF', onText: 'ON' },
            { label: 'Light Switch', pin: 'V2', offText: 'OFF', onText: 'ON' },
            { label: 'Fire Kill Switch', pin: 'V3', offText: 'OFF', onText: 'ON' },
            { label: 'Alarm Switch', pin: 'V4', offText: 'OFF', onText: 'ON' },
        ];
        const statuses = [
            { label: 'Motor ON', pin: 'V5' }, { label: 'Motor OFF', pin: 'V6' },
            { label: 'Voltage Alert', pin: 'V7' }, { label: 'Light', pin: 'V8' },
            { label: 'Gas', pin: 'V9' }, { label: 'Speaker Status', pin: 'V10' },
            { label: 'Rain LED', pin: 'V11' }, { label: 'Motion', pin: 'V12' },
        ];
        const gauges = [
            { label: 'Shallow Moisture', pin: 'V13', min: 1, max: 4095, unit: '' },
            { label: 'Deeper Moisture', pin: 'V14', min: 1, max: 4095, unit: '' },
            { label: 'Mid Moisture', pin: 'V15', min: 1, max: 4095, unit: '' },
            { label: 'Gas Level', pin: 'V16', min: 0, max: 100, unit: '%' },
            { label: 'Voltage', pin: 'V17', min: 0, max: 44, unit: 'V' },
            { label: 'Water level', pin: 'V18', min: 0, max: 100, unit: '%' },
            { label: 'Temperature', pin: 'V19', min: 0, max: 150, unit: '°C' },
            { label: 'Humidity', pin: 'V20', min: 0, max: 100, unit: '%' },
        ];

        const switchContainer = document.getElementById('switch-container');
        const statusContainer = document.getElementById('status-container');
        const gaugeContainer = document.getElementById('gauge-container');
        
        // Clear containers before generating
        switchContainer.innerHTML = '';
        statusContainer.innerHTML = '';
        gaugeContainer.innerHTML = '';

        switches.forEach(s => {
            const card = document.createElement('div');
            card.className = 'blynk-card flex-row justify-between';
            card.innerHTML = `<div class="flex items-center"><span class="font-bold text-lg">${s.label}</span></div><div class="flex items-center space-x-3"><label class="toggle-switch"><input type="checkbox" id="switch-${s.pin}" data-pin="${s.pin}"><span class="slider"></span></label><span id="switch-text-${s.pin}" class="font-bold text-lg w-12 text-right">${s.offText}</span></div>`;
            switchContainer.appendChild(card);
        });
        statuses.forEach(s => {
            const card = document.createElement('div');
            card.className = 'blynk-card';
            card.innerHTML = `<span class="font-semibold">${s.label}</span><div id="status-${s.pin}" class="status-dot mt-2"></div>`;
            statusContainer.appendChild(card);
        });
        gauges.forEach(g => {
            const card = document.createElement('div');
            card.className = 'blynk-card';
            const radius = 60;
            const circumference = 2 * Math.PI * radius;
            card.innerHTML = `<div class="gauge-container"><svg class="gauge-svg" viewBox="0 0 150 150"><circle class="gauge-bg" cx="75" cy="75" r="${radius}"></circle><circle id="gauge-fill-${g.pin}" class="gauge-fill" cx="75" cy="75" r="${radius}" stroke-dasharray="${circumference}" stroke-dashoffset="${circumference}"></circle></svg><div id="gauge-text-${g.pin}" class="gauge-text">--</div><div class="gauge-min-max"><span>${g.min}</span><span>${g.max}</span></div></div><div class="gauge-label">${g.label}</div>`;
            gaugeContainer.appendChild(card);
        });
        
        blynkInitialized = true;
        console.log("Blynk Dashboard Initialized.");
        // Add event listeners and data fetching logic for Blynk here...
    }
    
    // Mobile menu toggle
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    mobileMenuButton.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });
});
