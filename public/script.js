// 主页脚本
document.addEventListener('DOMContentLoaded', function() {
    loadUpcomingEvents();
});

// 加载即将举行的活动
async function loadUpcomingEvents() {
    const eventsGrid = document.getElementById('eventsGrid');
    
    try {
        // Show loading animation
        eventsGrid.innerHTML = '<div class="loading">Loading event information...</div>';
        
        const response = await fetch('/api/events/upcoming');
        
        if (!response.ok) {
            throw new Error('网络请求失败');
        }
        
        const events = await response.json();
        
        if (events.length === 0) {
            eventsGrid.innerHTML = '<div class="no-events">No upcoming events at the moment</div>';
            return;
        }
        
        // 生成活动卡片HTML
        eventsGrid.innerHTML = events.map(event => createEventCard(event)).join('');
        
    } catch (error) {
        console.error('Failed to load events:', error);
        eventsGrid.innerHTML = '<div class="error">Failed to load event information, please try again later</div>';
    }
}

// 创建活动卡片HTML
function createEventCard(event) {
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Set different icons based on event category
    const categoryIcons = {
        '环保': '🌱',
        '教育': '📚',
        '关爱': '❤️',
        '筹款': '💰',
        '扶贫': '🤝',
        '医疗': '🏥'
    };
    
    const icon = categoryIcons[event.category] || '🎯';
    
    return `
        <div class="event-card" onclick="viewEventDetail(${event.id})">
            <div class="event-image">
                ${event.image_url ? 
                    `<img src="${event.image_url}" alt="${event.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">` : 
                    icon
                }
            </div>
            <div class="event-content">
                <h3 class="event-title">${event.name}</h3>
                <div class="event-meta">
                    <span>📅 ${formattedDate}</span>
                    <span>⏰ ${event.time || 'All day'}</span>
                    <span>📍 ${event.location}</span>
                </div>
                <p class="event-description">${event.description || 'No detailed description available'}</p>
                <span class="event-category">${event.category}</span>
                ${event.organizer ? `<p><strong>Organizer:</strong> ${event.organizer}</p>` : ''}
            </div>
        </div>
    `;
}

// 查看活动详情
function viewEventDetail(eventId) {
    window.location.href = `/event/${eventId}`;
}

// 平滑滚动到指定元素
function scrollToElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth'
        });
    }
}

// 处理导航链接点击事件
document.addEventListener('click', function(e) {
    if (e.target.matches('a[href^="#"]')) {
        e.preventDefault();
        const targetId = e.target.getAttribute('href').substring(1);
        scrollToElement(targetId);
    }
});
