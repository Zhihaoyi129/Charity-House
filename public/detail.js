// Event details page script
document.addEventListener('DOMContentLoaded', function() {
    const eventId = getEventIdFromUrl();
    if (eventId) {
        loadEventDetail(eventId);
    } else {
        showError('Invalid event ID');
    }

    setupNavigation();
    setupRegistrationForm();
});

// Get event ID from URL
function getEventIdFromUrl() {
    const pathParts = window.location.pathname.split('/');
    return pathParts[pathParts.length - 1];
}

// Load event details
async function loadEventDetail(eventId) {
    const container = document.getElementById('detailContainer');
    
    try {
        const response = await fetch(`/api/events/${eventId}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Event does not exist');
            }
            throw new Error('Failed to load event details');
        }
        
        const event = await response.json();
        renderEventDetail(event);
        
    } catch (error) {
        console.error('Failed to load event details:', error);
        showError(error.message);
    }
}

// Render event details
function renderEventDetail(event) {
    const container = document.getElementById('detailContainer');
    
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });
    
    // Use actual status from database
    const statusText = getStatusText(event.status);
    
    // Set different icons based on event category
    const categoryIcons = {
        'environmental protection': '🌱',
        'education': '📚',
        'care': '❤️',
        'raise funds': '💰',
        'poverty relief': '🤝',
        'medical treatment': '🏥'
    };
    
    const icon = categoryIcons[event.category] || '🎯';
    
    container.innerHTML = `
        <!-- 返回按钮区域 -->
        <section class="back-section">
            <div class="container">
                <a href="/search" class="back-button">
                    ← Back to Search
                </a>
            </div>
        </section>

        <!-- 活动头部区域 - 类似主页hero-section -->
        <section class="detail-hero">
            <div class="hero-content">
                ${event.image_url ? 
                    `<div class="detail-image-container" style="margin-bottom: 1rem;">
                        <img src="${event.image_url}" alt="${event.name}" style="max-width: 300px; max-height: 200px; object-fit: cover; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                    </div>` : 
                    `<span class="detail-icon">${icon}</span>`
                }
                <h1>${event.name}</h1>
                <p>${event.description || 'Participate together in this meaningful charity event'}</p>
                <span class="detail-status">${statusText}</span>
            </div>
        </section>

        <!-- 活动详情内容区域 - 类似主页organization-info -->
        <section class="detail-info-section">
            <div class="container">
                <div class="detail-content">
                    <div class="detail-nav">
                        <button class="detail-nav-item active" onclick="showSection('basic')">Basic Info</button>
                        <button class="detail-nav-item" onclick="showSection('description')">Description</button>
                        <button class="detail-nav-item" onclick="showSection('tickets')">Ticket List</button>
                        <button class="detail-nav-item" onclick="showSection('registration')">Registration</button>
                    </div>
            
            <div class="detail-section active" id="basic">
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-icon">📅</div>
                        <div class="info-content">
                            <h4>Event Date</h4>
                            <p>${formattedDate}</p>
                        </div>
                    </div>
                    
                    <div class="info-item">
                        <div class="info-icon">⏰</div>
                        <div class="info-content">
                            <h4>Event Time</h4>
                            <p>${event.time || 'all day long'}</p>
                        </div>
                    </div>
                    
                    <div class="info-item">
                        <div class="info-icon">📍</div>
                        <div class="info-content">
                            <h4>Event Location</h4>
                            <p>${event.location}</p>
                        </div>
                    </div>
                    
                    <div class="info-item">
                        <div class="info-icon">🏷️</div>
                        <div class="info-content">
                            <h4>Event Category</h4>
                            <p>${event.category}</p>
                        </div>
                    </div>
                    
                    ${event.organizer ? `
                    <div class="info-item">
                        <div class="info-icon">👥</div>
                        <div class="info-content">
                            <h4>Organizer</h4>
                            <p>${event.organizer}</p>
                        </div>
                    </div>
                    ` : ''}
                    
                    ${event.contact_info ? `
                    <div class="info-item">
                        <div class="info-icon">📞</div>
                        <div class="info-content">
                            <h4>Contact Information</h4>
                            <p>${event.contact_info}</p>
                        </div>
                    </div>
                    ` : ''}
                    
                    ${event.registration_fee !== undefined ? `
                    <div class="info-item">
                        <div class="info-icon">💰</div>
                        <div class="info-content">
                            <h4>Participation Fee</h4>
                            <p>${event.registration_fee > 0 ? '¥' + event.registration_fee : 'Free'}</p>
                        </div>
                    </div>
                    ` : ''}
                    
                    <div class="info-item">
                        <div class="info-icon">👫</div>
                        <div class="info-content">
                            <h4>Participants</h4>
                            <p>${event.current_participants || 0}/${event.max_participants || 'unlimited'}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="detail-section" id="description">
                <div class="description-content">
                    ${event.description ? `
                        <p>${event.description}</p>
                        <br>
                        <h3>Event Goals & Progress</h3>
                        <p>Through this ${event.category} event, we hope to:</p>
                        <ul>
                            <li>Provide practical support for those in need</li>
                            <li>Raise social awareness of ${event.category} issues</li>
                            <li>Promote community unity and spread positive energy</li>
                            <li>Provide meaningful volunteer service experience for participants</li>
                        </ul>
                        
                        <h3>Ways to Participate</h3>
                        <p>You can participate in our activities in the following ways:</p>
                        <ul>
                            <li>Participate directly in on-site activities</li>
                            <li>Provide material or financial support</li>
                            <li>Help promote and publicize the event</li>
                            <li>Share your professional skills</li>
                        </ul>
                    ` : `
                        <p>This is a charity event about ${event.category} that will be held in ${event.location}.</p>
                        <p>We sincerely invite your participation to contribute to society together.</p>
                        
                        <h3>Event Significance</h3>
                        <p>Every charity event is a reflection of social warmth. Through your participation, we can:</p>
                        <ul>
                            <li>Help more people in need of care</li>
                            <li>Spread positive social energy</li>
                            <li>Build a more harmonious community environment</li>
                            <li>Foster a social atmosphere of mutual help and friendship</li>
                        </ul>
                    `}
                </div>
            </div>
            
            <div class="detail-section" id="tickets">
                <h3 style="margin-bottom: 1.5rem; color: #007bff;">🎫 Ticket List</h3>
                <div id="ticketListContainer">
                    <div class="loading">Loading ticket information...</div>
                </div>
            </div>
            
            <div class="detail-section" id="registration">
                <div class="registration-section">
                    <h3>Join this meaningful activity</h3>
                    <p>Your participation contributes to society, let's spread love together!</p>
                    
                    <div class="registration-info">
                        <div class="registration-stat">
                            <span class="stat-number">${event.current_participants || 0}</span>
                            <span class="stat-label">Registered</span>
                        </div>
                        <div class="registration-stat">
                            <span class="stat-number">${event.max_participants || '∞'}</span>
                            <span class="stat-label">Capacity Limit</span>
                        </div>
                        <div class="registration-stat">
                            <span class="stat-number">${event.registration_fee > 0 ? '¥' + event.registration_fee : 'Free'}</span>
                            <span class="stat-label">Participation Fee</span>
                        </div>
                    </div>
                    
                    <button class="registration-button" onclick="goToRegisterPage(${event.id})" ${event.status !== 'upcoming' ? 'disabled' : ''}>
                        ${event.status === 'upcoming' ? '🎯 Register Now' : getStatusText(event.status)}
                    </button>
                    </div>
                </div>
            </div>
        </section>
    `;
}

//Display the specified detail area
function showSection(sectionId) {
    // Hide all areas
    document.querySelectorAll('.detail-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove the active state of all navigation items
    document.querySelectorAll('.detail-nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Display the specified area
    document.getElementById(sectionId).classList.add('active');
    
    // Activate the corresponding navigation item - by locating the button that contains the corresponding text
    const navItems = document.querySelectorAll('.detail-nav-item');
    const sectionNames = {
        'basic': 'Basic Info',
        'description': 'Description',
        'tickets': 'Ticket List',
        'registration': 'Registration'
    };
    
    navItems.forEach(item => {
        if (item.textContent.trim() === sectionNames[sectionId]) {
            item.classList.add('active');
        }
    });
    
    // If you switch to the "Ticket List" tab, the ticket information will be loaded.
    if (sectionId === 'tickets') {
        const eventId = getEventIdFromUrl();
        if (eventId) {
            loadTicketList(eventId);
        }
    }
}

//Set up navigation function
function setupNavigation() {
    // This function is called when the page loads and is used to set up event listeners for navigation-related operations.
}

// Set up the registration form
function setupRegistrationForm() {
    // Wait until the DOM is fully loaded before setting the event listener.
    setTimeout(() => {
        const registrationForm = document.getElementById('registrationForm');
        if (registrationForm) {
            registrationForm.addEventListener('submit', handleRegistrationSubmit);
        }
    }, 100);
}

//Display the "Function Under Construction" prompt
function showUnderConstruction() {
    //Display the error prompt modal box, with the content being "This function is under construction."
    document.getElementById('errorMessage').textContent = 'This feature is currently under construction. Please stay tuned!';
    document.getElementById('errorModal').style.display = 'block';
}

//Display the registration form
function showRegistrationForm(eventId) {
    // Store the current activity ID for use in form submission
    window.currentEventId = eventId;

    // Reset the form
    const form = document.getElementById('registrationForm');
    if (form) {
        form.reset();
    }

    // Display the registration form modal box
    document.getElementById('registrationFormModal').style.display = 'block';
}

// Process the submission of the registration form
async function handleRegistrationSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    const name = formData.get('name');
    const phone = formData.get('phone');
    const agreeTerms = formData.get('agreeTerms');

    if (!name || !phone || !agreeTerms) {
        alert('Please fill in all the required fields and agree to the relevant terms.');
        return;
    }

    const registrationData = {
        name: name,
        phone: phone,
        email: formData.get('email') || '',
        age: formData.get('age') || '',
        experience: formData.get('experience') || '',
        motivation: formData.get('motivation') || '',
        allowContact: formData.get('allowContact') === 'on'
    };

    try {
        // Submit registration information
        await registerForEvent(window.currentEventId, registrationData);

        // Close the registration form
        closeModal();

    } catch (error) {
        console.error('fail to register:', error);
        alert('Registration failed. Please try again later.');
    }
}

// Register to participate in the activity
async function registerForEvent(eventId, registrationData = {}) {
    try {
        const response = await fetch(`/api/events/${eventId}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(registrationData)
        });

        if (!response.ok) {
            throw new Error('fail to register');
        }

        const result = await response.json();
        showRegistrationSuccess();

        // Reload the activity details to update the number of participants
        setTimeout(() => {
            loadEventDetail(eventId);
        }, 2000);

    } catch (error) {
        console.error('注册失败:', error);
        showRegistrationError();
        throw error; 
    }
}

// Display the registration success modal box
function showRegistrationSuccess() {
    document.getElementById('registrationModal').style.display = 'block';
}

// Display the registration error modal box
function showRegistrationError() {
    document.getElementById('errorMessage').textContent = 'Registration failed. Please try again later or contact customer service.';
    document.getElementById('errorModal').style.display = 'block';
}

// Close the modal window
function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

//Display error message
function showError(message) {
    const container = document.getElementById('detailContainer');
    container.innerHTML = `
        <div class="error-detail">
            <h2>😔 Some problems have arisen.</h2>
            <p>${message}</p>
            <p>Please check if the activity link is correct, or return to the homepage to view other activities.</p>
            <a href="/" class="btn btn-primary">Return to the home page</a>
            <a href="/search" class="btn btn-outline">Browse all activities</a>
        </div>
    `;
}

window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
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

// Load ticket list
async function loadTicketList(eventId) {
    const container = document.getElementById('ticketListContainer');
    
    try {
        const response = await fetch(`/api/events/${eventId}/registrations`);
        
        if (!response.ok) {
            throw new Error('Failed to load ticket list');
        }
        
        const registrations = await response.json();
        renderTicketList(registrations);
        
    } catch (error) {
        console.error('Failed to load ticket list:', error);
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #666;">
                <p>Failed to load ticket list</p>
            </div>
        `;
    }
}

// Render ticket list
function renderTicketList(registrations) {
    const container = document.getElementById('ticketListContainer');
    
    if (!registrations || registrations.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">📋</div>
                <p style="font-size: 1.1rem; color: #666;">No ticket records yet</p>
                <p style="font-size: 0.9rem; color: #999; margin-top: 0.5rem;">Be the first to register!</p>
            </div>
        `;
        return;
    }
    
    // Calculate total tickets
    const totalTickets = registrations.reduce((sum, reg) => sum + (reg.ticket_quantity || 0), 0);
    
    let html = `
        <div style="margin-bottom: 2rem; padding: 1.5rem; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 10px;">
            <div style="display: flex; justify-content: space-around; flex-wrap: wrap; gap: 1rem;">
                <div style="text-align: center;">
                    <div style="font-size: 2rem; font-weight: bold; color: #007bff;">${registrations.length}</div>
                    <div style="font-size: 0.9rem; color: #666;">Participants</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 2rem; font-weight: bold; color: #28a745;">${totalTickets}</div>
                    <div style="font-size: 0.9rem; color: #666;">Total Tickets</div>
                </div>
            </div>
        </div>
        
        <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <thead>
                    <tr style="background: linear-gradient(135deg, #007bff 0%, #28a745 100%); color: white;">
                        <th style="padding: 1rem; text-align: left; font-weight: 600;">#</th>
                        <th style="padding: 1rem; text-align: left; font-weight: 600;">Participant</th>
                        <th style="padding: 1rem; text-align: left; font-weight: 600;">Contact</th>
                        <th style="padding: 1rem; text-align: center; font-weight: 600;">Tickets</th>
                        <th style="padding: 1rem; text-align: left; font-weight: 600;">Registration Time</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    registrations.forEach((reg, index) => {
        const registrationDate = new Date(reg.registration_date);
        const formattedDate = registrationDate.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Mask middle 4 digits of phone number
        const maskedPhone = reg.participant_phone 
            ? reg.participant_phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
            : 'Not provided';
        
        const rowStyle = index % 2 === 0 ? 'background-color: #f8f9fa;' : 'background-color: white;';
        
        html += `
            <tr style="${rowStyle} transition: background-color 0.3s;">
                <td style="padding: 1rem; border-bottom: 1px solid #e9ecef;">${index + 1}</td>
                <td style="padding: 1rem; border-bottom: 1px solid #e9ecef; font-weight: 500;">${reg.participant_name}</td>
                <td style="padding: 1rem; border-bottom: 1px solid #e9ecef; color: #666;">${maskedPhone}</td>
                <td style="padding: 1rem; border-bottom: 1px solid #e9ecef; text-align: center;">
                    <span style="background-color: #007bff; color: white; padding: 0.3rem 0.8rem; border-radius: 15px; font-weight: 600;">
                        ${reg.ticket_quantity || 1}
                    </span>
                </td>
                <td style="padding: 1rem; border-bottom: 1px solid #e9ecef; color: #666; font-size: 0.9rem;">${formattedDate}</td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = html;
}

// Go to registration page
function goToRegisterPage(eventId) {
    window.location.href = `/register?eventId=${eventId}`;
}
