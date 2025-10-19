// 搜索页面脚本
document.addEventListener('DOMContentLoaded', function() {
    loadCategories();
    loadAllEvents();
    setupSearchForm();
});

// 加载活动类别
async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        if (!response.ok) throw new Error('Failed to get categories');
        
        const categories = await response.json();
        const categorySelect = document.getElementById('categoryFilter');
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });
    } catch (error) {
        console.error('Failed to load categories:', error);
    }
}

// 加载所有活动
async function loadAllEvents() {
    await searchEvents({});
}

// 设置搜索表单
function setupSearchForm() {
    const searchForm = document.getElementById('searchForm');
    searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(searchForm);
        const searchParams = {};
        
        for (let [key, value] of formData.entries()) {
            if (value.trim()) {
                searchParams[key] = value.trim();
            }
        }
        
        searchEvents(searchParams);
    });
}

// 搜索活动
async function searchEvents(params) {
    const resultsGrid = document.getElementById('resultsGrid');
    const resultsCount = document.getElementById('resultsCount');
    const noResults = document.getElementById('noResults');
    
    try {
        // Show loading state
        resultsGrid.innerHTML = '<div class="loading-results">Searching for events...</div>';
        noResults.style.display = 'none';
        
        // Build query parameters
        const queryString = new URLSearchParams(params).toString();
        const url = `/api/events/search${queryString ? '?' + queryString : ''}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Search request failed');
        
        const events = await response.json();
        
        // Update result count
        resultsCount.textContent = `Found ${events.length} events`;
        
        if (events.length === 0) {
            resultsGrid.innerHTML = '';
            noResults.style.display = 'block';
            return;
        }
        
        // Show search results
        resultsGrid.innerHTML = events.map(event => createResultCard(event)).join('');
        noResults.style.display = 'none';
        
    } catch (error) {
        console.error('Failed to search events:', error);
        resultsGrid.innerHTML = `
            <div class="error-message">
                An error occurred while searching for events, please try again later
            </div>
        `;
        resultsCount.textContent = '';
    }
}

// 创建搜索结果卡片
function createResultCard(event) {
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Use actual status from database
    const statusText = getStatusText(event.status);
    const statusClass = getStatusClass(event.status);
    
    // Set different icons based on event category
    const categoryIcons = {
        'Environmental protection': '🌱',
        'education': '📚',
        'care': '❤️',
        'raise funds': '💰',
        'poverty relief': '🤝',
        'medical treatment': '🏥'
    };
    
    const icon = categoryIcons[event.category] || '🎯';
    
    return `
        <div class="result-card" onclick="viewEventDetail(${event.id})">
            <div class="result-image">
                ${event.image_url ? 
                    `<img src="${event.image_url}" alt="${event.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px; position: absolute; top: 0; left: 0;">` : 
                    icon
                }
                <div class="result-status ${statusClass}">${statusText}</div>
            </div>
            <div class="result-content">
                <h3 class="result-title">${event.name}</h3>
                <div class="result-meta">
                    <span>📅 ${formattedDate}</span>
                    <span>⏰ ${event.time || 'All day'}</span>
                    <span>📍 ${event.location}</span>
                    <span>👥 ${event.current_participants || 0}/${event.max_participants || 'Unlimited'}</span>
                </div>
                <p class="result-description">${event.description || 'No detailed description available'}</p>
                <div class="result-footer">
                    <span class="result-category">${event.category}</span>
                    ${event.organizer ? `<span class="result-organizer">Organizer: ${event.organizer}</span>` : ''}
                </div>
            </div>
        </div>
    `;
}

// 查看活动详情
function viewEventDetail(eventId) {
    window.location.href = `/event/${eventId}`;
}

// 清除筛选条件
function clearFilters() {
    const form = document.getElementById('searchForm');
    form.reset();
    loadAllEvents();
}

// 实时搜索（可选功能）
function setupLiveSearch() {
    const inputs = document.querySelectorAll('.form-input');
    let searchTimeout;
    
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const form = document.getElementById('searchForm');
                const formData = new FormData(form);
                const searchParams = {};
                
                for (let [key, value] of formData.entries()) {
                    if (value.trim()) {
                        searchParams[key] = value.trim();
                    }
                }
                
                searchEvents(searchParams);
            }, 500); // 500ms延迟
        });
    });
}

// Get status text
function getStatusText(status) {
    const statusMap = {
        'upcoming': 'Upcoming',
        'ongoing': 'Ongoing',
        'completed': 'Completed',
        'cancelled': 'Cancelled'
    };
    return statusMap[status] || 'Unknown Status';
}

// Get status style class
function getStatusClass(status) {
    const statusClassMap = {
        'upcoming': 'upcoming',
        'ongoing': 'ongoing',
        'completed': 'past',
        'cancelled': 'cancelled'
    };
    return statusClassMap[status] || 'unknown';
}
