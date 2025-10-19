// Weather Widget JavaScript

// Australian cities coordinates
const australianCities = {
    'Sydney': { lat: -33.8688, lon: 151.2093, name: 'Sydney, NSW' },
    'Melbourne': { lat: -37.8136, lon: 144.9631, name: 'Melbourne, VIC' },
    'Brisbane': { lat: -27.4698, lon: 153.0251, name: 'Brisbane, QLD' },
    'Perth': { lat: -31.9505, lon: 115.8605, name: 'Perth, WA' },
    'Adelaide': { lat: -34.9285, lon: 138.6007, name: 'Adelaide, SA' },
    'Canberra': { lat: -35.2809, lon: 149.1300, name: 'Canberra, ACT' },
    'Hobart': { lat: -42.8821, lon: 147.3272, name: 'Hobart, TAS' },
    'Darwin': { lat: -12.4634, lon: 130.8456, name: 'Darwin, NT' }
};

// Weather code descriptions
const weatherDescriptions = {
    0: { description: 'Clear sky', icon: '☀️' },
    1: { description: 'Mainly clear', icon: '🌤️' },
    2: { description: 'Partly cloudy', icon: '⛅' },
    3: { description: 'Overcast', icon: '☁️' },
    45: { description: 'Foggy', icon: '🌫️' },
    48: { description: 'Foggy', icon: '🌫️' },
    51: { description: 'Light drizzle', icon: '🌦️' },
    53: { description: 'Moderate drizzle', icon: '🌦️' },
    55: { description: 'Dense drizzle', icon: '🌦️' },
    61: { description: 'Slight rain', icon: '🌧️' },
    63: { description: 'Moderate rain', icon: '🌧️' },
    65: { description: 'Heavy rain', icon: '🌧️' },
    71: { description: 'Slight snow', icon: '❄️' },
    73: { description: 'Moderate snow', icon: '❄️' },
    75: { description: 'Heavy snow', icon: '❄️' },
    77: { description: 'Snow grains', icon: '❄️' },
    80: { description: 'Slight rain showers', icon: '🌦️' },
    81: { description: 'Moderate rain showers', icon: '🌦️' },
    82: { description: 'Violent rain showers', icon: '🌧️' },
    85: { description: 'Slight snow showers', icon: '🌨️' },
    86: { description: 'Heavy snow showers', icon: '🌨️' },
    95: { description: 'Thunderstorm', icon: '⛈️' },
    96: { description: 'Thunderstorm with hail', icon: '⛈️' },
    99: { description: 'Thunderstorm with hail', icon: '⛈️' }
};

// Initialize weather widget
function initWeatherWidget() {
    const defaultCity = 'Sydney';
    loadWeather(defaultCity);
    
    // Setup city selector
    const selector = document.getElementById('citySelector');
    if (selector) {
        selector.addEventListener('change', (e) => {
            loadWeather(e.target.value);
        });
    }
}

// Load weather data
async function loadWeather(cityKey) {
    const container = document.getElementById('weatherWidget');
    if (!container) {
        console.error('Weather widget container not found');
        return;
    }
    
    const city = australianCities[cityKey];
    if (!city) {
        console.error('City not found:', cityKey);
        return;
    }
    
    // Show loading state
    container.innerHTML = '<div class="weather-loading">Loading weather data...</div>';
    
    try {
        const url = `/api/weather?lat=${city.lat}&lon=${city.lon}`;
        console.log('Fetching weather from:', url);
        
        const response = await fetch(url);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('API error:', errorData);
            throw new Error(errorData.error || 'Failed to fetch weather data');
        }
        
        const data = await response.json();
        console.log('Weather data received:', data);
        
        if (!data.current) {
            throw new Error('Invalid weather data format');
        }
        
        renderWeather(data, city);
        
    } catch (error) {
        console.error('Failed to load weather:', error);
        container.innerHTML = `
            <div class="weather-error">
                <p>⚠️ Unable to load weather data</p>
                <p style="font-size: 0.9rem; margin-top: 0.5rem;">${error.message}</p>
                <p style="font-size: 0.8rem; margin-top: 0.5rem; opacity: 0.8;">Please check console for details</p>
            </div>
        `;
    }
}

// Render weather data
function renderWeather(data, city) {
    const container = document.getElementById('weatherWidget');
    if (!container || !data.current) return;
    
    const current = data.current;
    const weatherCode = current.weather_code || 0;
    const weatherInfo = weatherDescriptions[weatherCode] || weatherDescriptions[0];
    
    const html = `
        <div class="weather-header">
            <div class="weather-location">
                <span style="font-size: 1.5rem;">📍</span>
                <h3>${city.name}</h3>
            </div>
            <select class="location-selector" id="citySelector">
                ${Object.keys(australianCities).map(key => 
                    `<option value="${key}" ${city.name === australianCities[key].name ? 'selected' : ''}>
                        ${australianCities[key].name}
                    </option>`
                ).join('')}
            </select>
        </div>
        
        <div class="weather-main">
            <div class="weather-temp-display">
                <div class="weather-icon">${weatherInfo.icon}</div>
                <div>
                    <div class="weather-temp">${Math.round(current.temperature_2m)}°C</div>
                    <div class="weather-description">${weatherInfo.description}</div>
                </div>
            </div>
        </div>
        
        <div class="weather-details">
            <div class="weather-detail-item">
                <div class="weather-detail-icon">🌡️</div>
                <div class="weather-detail-content">
                    <span class="weather-detail-label">Feels like</span>
                    <span class="weather-detail-value">${Math.round(current.apparent_temperature)}°C</span>
                </div>
            </div>
            
            <div class="weather-detail-item">
                <div class="weather-detail-icon">💧</div>
                <div class="weather-detail-content">
                    <span class="weather-detail-label">Humidity</span>
                    <span class="weather-detail-value">${current.relative_humidity_2m}%</span>
                </div>
            </div>
            
            <div class="weather-detail-item">
                <div class="weather-detail-icon">💨</div>
                <div class="weather-detail-content">
                    <span class="weather-detail-label">Wind Speed</span>
                    <span class="weather-detail-value">${Math.round(current.wind_speed_10m)} km/h</span>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    
    // Re-attach event listener for city selector
    const selector = document.getElementById('citySelector');
    if (selector) {
        selector.addEventListener('change', (e) => {
            loadWeather(e.target.value);
        });
    }
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWeatherWidget);
} else {
    initWeatherWidget();
}

