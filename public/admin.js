// Administrator backend script
let currentEvents = [];
let editingEventId = null;
let deleteEventId = null;

document.addEventListener('DOMContentLoaded', function() {
    loadDashboardData();
    setupEventForm();
});

// Load dashboard data
async function loadDashboardData() {
    try {
        await Promise.all([
            loadStatistics(),
            loadEvents()
        ]);
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
        showError('Failed to load data, please refresh and try again');
    }
}

// Load statistical data
async function loadStatistics() {
    try {
        const response = await fetch('/api/admin/statistics');
        if (!response.ok) {
            throw new Error('Failed to get statistics');
        }
        
        const stats = await response.json();
        updateStatistics(stats);
    } catch (error) {
        console.error('Failed to load statistics:', error);
        // Show default values
        updateStatistics({
            totalEvents: 0,
            upcomingEvents: 0,
            totalParticipants: 0,
            completedEvents: 0
        });
    }
}

// Updated statistics show
function updateStatistics(stats) {
    document.getElementById('totalEvents').textContent = stats.totalEvents || 0;
    document.getElementById('upcomingEvents').textContent = stats.upcomingEvents || 0;
    document.getElementById('totalParticipants').textContent = stats.totalParticipants || 0;
    document.getElementById('completedEvents').textContent = stats.completedEvents || 0;
}

// Load the list of activities
async function loadEvents() {
    const container = document.getElementById('eventsContainer');
    
    try {
        const response = await fetch('/api/admin/events');
        if (!response.ok) {
            throw new Error('Failed to get event list');
        }
        
        currentEvents = await response.json();
        renderEventsTable(currentEvents);
    } catch (error) {
        console.error('Failed to load event list:', error);
        container.innerHTML = `
            <div class="loading">
                <p style="color: #dc3545;">❌ Failed to load event list</p>
                <button class="btn-primary" onclick="loadEvents()" style="margin-top: 1rem;">Retry</button>
            </div>
        `;
    }
}

// Render the activity table
function renderEventsTable(events) {
    const container = document.getElementById('eventsContainer');
    
    if (events.length === 0) {
        container.innerHTML = `
            <div class="loading">
                <p>📝 No event data available</p>
                <button class="btn-primary" onclick="showAddEventModal()" style="margin-top: 1rem;">Add First Event</button>
            </div>
        `;
        return;
    }

    const tableHTML = `
        <table class="events-table">
            <thead>
                <tr>
                    <th>Event Name</th>
                    <th>Image</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Participants</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${events.map(event => `
                    <tr>
                        <td><strong>${event.name}</strong></td>
                        <td>
                            ${event.image_url ? 
                                `<img src="${event.image_url}" alt="活动图片" style="width: 50px; height: 40px; object-fit: cover; border-radius: 4px;">` : 
                                '<span style="color: #999; font-size: 0.9rem;">No Image</span>'
                            }
                        </td>
                        <td>${event.category}</td>
                        <td>${formatDate(event.date)}</td>
                        <td>${event.location}</td>
                        <td><span class="status-badge status-${event.status}">${getStatusText(event.status)}</span></td>
                        <td>${event.current_participants || 0}/${event.max_participants || 'Unlimited'}</td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn-edit" onclick="editEvent(${event.id})">Edit</button>
                                <button class="btn-delete" onclick="showDeleteConfirm(${event.id})">Delete</button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = tableHTML;
}

// Format the date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
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
    return statusMap[status] || status;
}

// Show add event modal
function showAddEventModal() {
    editingEventId = null;
    document.getElementById('modalTitle').textContent = 'Add New Event';
    document.getElementById('eventForm').reset();
    document.getElementById('eventId').value = '';
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('eventDate').value = today;
    document.getElementById('eventStatus').value = 'upcoming';
    
    // Clear image preview
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('previewImg').src = '';
    
    document.getElementById('eventModal').style.display = 'block';
}

// Edit event
function editEvent(eventId) {
    const event = currentEvents.find(e => e.id === eventId);
    if (!event) {
        showError('Cannot find event to edit');
        return;
    }
    
    editingEventId = eventId;
    document.getElementById('modalTitle').textContent = 'Edit Event';
    
    // Fill form data
    document.getElementById('eventId').value = event.id;
    document.getElementById('eventName').value = event.name || '';
    document.getElementById('eventCategory').value = event.category || '';
    document.getElementById('eventDate').value = event.date ? event.date.split('T')[0] : '';
    document.getElementById('eventTime').value = event.time || '';
    document.getElementById('eventLocation').value = event.location || '';
    document.getElementById('eventOrganizer').value = event.organizer || '';
    document.getElementById('maxParticipants').value = event.max_participants || '';
    document.getElementById('registrationFee').value = event.registration_fee || '';
    document.getElementById('contactInfo').value = event.contact_info || '';
    document.getElementById('eventStatus').value = event.status || 'upcoming';
    document.getElementById('eventDescription').value = event.description || '';
    
    // Handle existing image display
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    if (event.image_url) {
        previewImg.src = event.image_url;
        imagePreview.style.display = 'block';
    } else {
        imagePreview.style.display = 'none';
    }
    
    // Clear file input (avoid showing old file names)
    document.getElementById('eventImage').value = '';
    
    document.getElementById('eventModal').style.display = 'block';
}

// Display the deletion confirmation dialog box
function showDeleteConfirm(eventId) {
    deleteEventId = eventId;
    const event = currentEvents.find(e => e.id === eventId);
    const eventName = event ? event.name : 'this event';
    
    document.getElementById('deleteModal').style.display = 'block';
    
    // Update confirmation message
    const modalBody = document.querySelector('#deleteModal .modal-body');
    modalBody.innerHTML = `
        <p>Are you sure you want to delete the event "<strong>${eventName}</strong>"?</p>
        <p class="warning-text">This operation cannot be undone and all registration data for this event will be deleted.</p>
        <div class="form-actions">
            <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
            <button type="button" class="btn-delete" onclick="confirmDelete()">Delete Event</button>
        </div>
    `;
}

// Confirm delete
async function confirmDelete() {
    if (!deleteEventId) return;
    
    try {
        const response = await fetch(`/api/admin/events/${deleteEventId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete event');
        }
        
        showSuccess('Event deleted successfully');
        closeModal();
        await loadDashboardData(); // Reload data
    } catch (error) {
        console.error('Failed to delete event:', error);
        showError('Failed to delete event: ' + error.message);
    }
}

// Set up form events
function setupEventForm() {
    const form = document.getElementById('eventForm');
    form.addEventListener('submit', handleFormSubmit);
}

// Handle form submission
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    
    const timeValue = formData.get('time');
    if (timeValue && !isValidTimeFormat(timeValue)) {
        showError('Please enter time in HH:MM:SS format (e.g., 09:00:00)');
        return;
    }
    
    // Check if there's an image file
    const imageFile = formData.get('image');
    let imageUrl = null;
    
    if (imageFile && imageFile.size > 0) {
        // Upload image to server
        try {
            imageUrl = await uploadImage(imageFile);
        } catch (error) {
            console.error('Image upload failed:', error);
            showError('Image upload failed, please try again');
            return;
        }
    } else if (editingEventId) {
        // Keep original image in edit mode
        const currentEvent = currentEvents.find(e => e.id === editingEventId);
        imageUrl = currentEvent?.image_url || null;
    }
    
    const eventData = {
        name: formData.get('name'),
        category: formData.get('category'),
        date: formData.get('date'),
        time: formData.get('time'),
        location: formData.get('location'),
        organizer: formData.get('organizer'),
        max_participants: formData.get('max_participants') ? parseInt(formData.get('max_participants')) : null,
        registration_fee: formData.get('registration_fee') ? parseFloat(formData.get('registration_fee')) : 0,
        contact_info: formData.get('contact_info'),
        status: formData.get('status') || 'upcoming',
        description: formData.get('description'),
        image_url: imageUrl
    };
    
    try {
        const url = editingEventId ? `/api/admin/events/${editingEventId}` : '/api/admin/events';
        const method = editingEventId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || (editingEventId ? 'Failed to update event' : 'Failed to create event'));
        }
        
        showSuccess(editingEventId ? 'Event updated successfully' : 'Event created successfully');
        closeModal();
        await loadDashboardData(); // Reload data
    } catch (error) {
        console.error('Failed to save event:', error);
        showError(error.message);
    }
}

function isValidTimeFormat(timeString) {
    if (!timeString) return true; // 空值允许
    
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
    return timeRegex.test(timeString);
}

// Close modal
function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
    editingEventId = null;
    deleteEventId = null;
}

// Logout
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // Actual logout logic can be added here
        window.location.href = '/';
    }
}

// Show success message
function showSuccess(message) {
    // Simple success notification, can be optimized to better UI components later
    alert('✅ ' + message);
}

// Show error message
function showError(message) {
    // Simple error notification, can be optimized to better UI components later
    alert('❌ ' + message);
}

// Click outside modal to close
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            closeModal();
        }
    });
}

// Keyboard event handling
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeModal();
    }
});

// Image preview functionality
function previewImage(event) {
    const file = event.target.files[0];
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    
    if (file) {
        // Check file size
        if (file.size > 2 * 1024 * 1024) {
            showError('Image file size cannot exceed 2MB, please select a smaller image');
            event.target.value = ''; // Clear file selection
            imagePreview.style.display = 'none';
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImg.src = e.target.result;
            imagePreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        imagePreview.style.display = 'none';
    }
}

// Remove image
function removeImage() {
    const imageInput = document.getElementById('eventImage');
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    
    imageInput.value = '';
    previewImg.src = '';
    imagePreview.style.display = 'none';
}

// Upload image file to server
async function uploadImage(file) {
    // Check file size (limit to 2MB)
    if (file.size > 2 * 1024 * 1024) {
        throw new Error('Image file size cannot exceed 2MB');
    }
    
    const formData = new FormData();
    formData.append('image', file);
    
    try {
        const response = await fetch('/api/upload/image', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Image upload failed');
        }
        
        const result = await response.json();
        return result.imagePath;
    } catch (error) {
        console.error('Failed to upload image:', error);
        throw error;
    }
}