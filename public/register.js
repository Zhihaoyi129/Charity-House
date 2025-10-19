// Registration page script
let currentEvent = null;
let ticketPrice = 0;

document.addEventListener('DOMContentLoaded', function() {
    const eventId = getEventIdFromUrl();
    if (eventId) {
        loadEventInfo(eventId);
    } else {
        showError('Invalid event ID');
        setTimeout(() => {
            window.location.href = '/search';
        }, 2000);
    }

    setupQuantityControls();
    setupRegistrationForm();
});

// Get event ID from URL
function getEventIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('eventId');
}

// Load event information
async function loadEventInfo(eventId) {
    const container = document.getElementById('eventInfoCard');
    
    try {
        const response = await fetch(`/api/events/${eventId}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Event does not exist');
            }
            throw new Error('Failed to load event information');
        }
        
        const event = await response.json();
        currentEvent = event;
        ticketPrice = event.registration_fee || 0;
        
        renderEventInfo(event);
        updateTicketSummary();
        
    } catch (error) {
        console.error('Failed to load event information:', error);
        showError(error.message);
        setTimeout(() => {
            window.location.href = '/search';
        }, 2000);
    }
}

// Render event information
function renderEventInfo(event) {
    const container = document.getElementById('eventInfoCard');
    
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });
    
    // Set different icons based on event category
    const categoryIcons = {
        'Environmental': '🌱',
        'Education': '📚',
        'Care': '❤️',
        'Fundraising': '💰',
        'Poverty Relief': '🤝',
        'Medical': '🏥',
    };
    
    const icon = categoryIcons[event.category] || '🎯';
    
    container.innerHTML = `
        <div class="event-header">
            <div class="event-icon">${icon}</div>
            <div class="event-title-section">
                <h2>${event.name}</h2>
                <span class="event-category">${event.category}</span>
            </div>
        </div>
        
        <div class="event-details-grid">
            <div class="event-detail-item">
                <div class="detail-icon">📅</div>
                <div class="detail-content">
                    <h4>Event Date</h4>
                    <p>${formattedDate}</p>
                </div>
            </div>
            
            <div class="event-detail-item">
                <div class="detail-icon">⏰</div>
                <div class="detail-content">
                    <h4>Event Time</h4>
                    <p>${event.time || 'All day'}</p>
                </div>
            </div>
            
            <div class="event-detail-item">
                <div class="detail-icon">📍</div>
                <div class="detail-content">
                    <h4>Event Location</h4>
                    <p>${event.location}</p>
                </div>
            </div>
            
            <div class="event-detail-item">
                <div class="detail-icon">💰</div>
                <div class="detail-content">
                    <h4>Ticket Price</h4>
                    <p>${event.registration_fee > 0 ? '$' + event.registration_fee.toFixed(2) : 'Free'}</p>
                </div>
            </div>
            
            <div class="event-detail-item">
                <div class="detail-icon">👥</div>
                <div class="detail-content">
                    <h4>Registered/Capacity</h4>
                    <p>${event.current_participants || 0}/${event.max_participants || 'Unlimited'}</p>
                </div>
            </div>
        </div>
    `;
}

// Setup quantity control buttons
function setupQuantityControls() {
    const decreaseBtn = document.getElementById('decreaseBtn');
    const increaseBtn = document.getElementById('increaseBtn');
    const quantityInput = document.getElementById('ticketQuantity');
    
    decreaseBtn.addEventListener('click', function() {
        let currentValue = parseInt(quantityInput.value);
        if (currentValue > 1) {
            quantityInput.value = currentValue - 1;
            updateTicketSummary();
        }
    });
    
    increaseBtn.addEventListener('click', function() {
        let currentValue = parseInt(quantityInput.value);
        const maxQuantity = parseInt(quantityInput.max);
        if (currentValue < maxQuantity) {
            quantityInput.value = currentValue + 1;
            updateTicketSummary();
        }
    });
    
    // Listen for manual input
    quantityInput.addEventListener('change', function() {
        let value = parseInt(this.value);
        const min = parseInt(this.min);
        const max = parseInt(this.max);
        
        if (isNaN(value) || value < min) {
            this.value = min;
        } else if (value > max) {
            this.value = max;
        }
        
        updateTicketSummary();
    });
}

// Update ticket summary
function updateTicketSummary() {
    const quantity = parseInt(document.getElementById('ticketQuantity').value);
    const total = ticketPrice * quantity;
    
    document.getElementById('ticketPrice').textContent = ticketPrice > 0 ? '$' + ticketPrice.toFixed(2) : 'Free';
    document.getElementById('ticketCount').textContent = quantity;
    document.getElementById('totalPrice').textContent = ticketPrice > 0 ? '$' + total.toFixed(2) : 'Free';
}

// Setup registration form
function setupRegistrationForm() {
    const form = document.getElementById('registrationForm');
    form.addEventListener('submit', handleRegistrationSubmit);
}

// Handle registration form submission
async function handleRegistrationSubmit(event) {
    event.preventDefault();
    
    console.log('Form submission started');
    
    const form = event.target;
    const formData = new FormData(form);
    
    // Validate required fields
    const name = formData.get('name');
    const phone = formData.get('phone');
    const ticketQuantity = parseInt(formData.get('ticketQuantity'));
    const agreeTerms = formData.get('agreeTerms');
    
    console.log('Form data:', { name, phone, ticketQuantity, agreeTerms });
    
    if (!name || !phone) {
        showError('Please fill in your name and phone number.');
        return;
    }
    
    if (!agreeTerms) {
        showError('Please agree to the event terms and safety guidelines.');
        return;
    }
    
    if (!ticketQuantity || ticketQuantity < 1) {
        showError('Please select the number of votes.');
        return;
    }
    
    // Check if there are enough available slots
    if (currentEvent.max_participants) {
        const availableSlots = currentEvent.max_participants - (currentEvent.current_participants || 0);
        if (ticketQuantity > availableSlots) {
            showError(`Sorry, the quota is full. There is only ${availableSlots} remaining spot.`);
            return;
        }
    }
    
    // Build registration data
    const registrationData = {
        name: name.trim(),
        phone: phone.trim(),
        email: formData.get('email')?.trim() || '',
        age: formData.get('age') || '',
        experience: formData.get('experience') || '',
        motivation: formData.get('motivation')?.trim() || '',
        allowContact: formData.get('allowContact') === 'on',
        ticketQuantity: ticketQuantity
    };
    
    console.log('Registration data to send:', registrationData);
    
    // Disable submit button to prevent duplicate submissions
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    
    try {
        await registerForEvent(currentEvent.id, registrationData);
    } catch (error) {
        console.error('Registration failed:', error);
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit registration';
    }
}
// Register for event
async function registerForEvent(eventId, registrationData) {
    try {
        const response = await fetch(`/api/events/${eventId}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(registrationData)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Registration failed');
        }
        
        showRegistrationSuccess(registrationData);
        
    } catch (error) {
        console.error('Registration failed:', error);
        showError(error.message || 'Registration failed, please try again later');
        throw error;
    }
}

// Show registration success
function showRegistrationSuccess(registrationData) {
    const detailsHtml = `
        <div class="detail-row">
            <span class="detail-label">Event Name:</span>
            <span class="detail-value">${currentEvent.name}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Participant Name:</span>
            <span class="detail-value">${registrationData.name}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Ticket Quantity:</span>
            <span class="detail-value">${registrationData.ticketQuantity} ticket(s)</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Total Amount:</span>
            <span class="detail-value">${ticketPrice > 0 ? '$' + (ticketPrice * registrationData.ticketQuantity).toFixed(2) : 'Free'}</span>
        </div>
    `;
    
    document.getElementById('registrationDetails').innerHTML = detailsHtml;
    document.getElementById('successModal').style.display = 'block';
}

// Show error message
function showError(message) {
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('errorModal').style.display = 'block';
}

// Close modal
function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

// Redirect to event detail page
function redirectToEventDetail() {
    if (currentEvent) {
        window.location.href = `/event/${currentEvent.id}`;
    } else {
        window.location.href = '/search';
    }
}

// Redirect to home page
function redirectToHome() {
    window.location.href = '/';
}

// Go back
function goBack() {
    if (currentEvent) {
        window.location.href = `/event/${currentEvent.id}`;
    } else {
        window.history.back();
    }
}

// Click outside modal to close
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            // Do not allow closing success modal by clicking outside
            if (modal.id !== 'successModal') {
                modal.style.display = 'none';
            }
        }
    });
}
