const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const db = require('./event_db');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, 'public', 'img');
        // Ensure that the table of contents exists.
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Generate a unique file name: timestamp + random number + original extension name
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 2 * 1024 * 1024 // Limit the file size to 2MB.
    },
    fileFilter: function (req, file, cb) {
        // Only image files are allowed.
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed to be uploaded.'));
        }
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

function normalizeTimeString(timeString) {
    if (!timeString) return null;
    return timeString.replace(/：/g, ':');
}

// API routing

// Image upload interface
app.post('/api/upload/image', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file has been uploaded.' });
        }
        
        // The relative path of the returned image
        const imagePath = `/img/${req.file.filename}`;
        res.json({ 
            message: 'Image upload successful',
            imagePath: imagePath 
        });
    } catch (error) {
        console.error('Image upload failed:', error);
        res.status(500).json({ error: 'Image upload failed' });
    }
});

// Get all activities (used on the homepage)
app.get('/api/events', (req, res) => {
    const query = `
        SELECT * FROM events 
        WHERE status = 'upcoming' OR status = 'ongoing'
        ORDER BY date ASC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Query activity failed:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        res.json(results);
    });
});

// Get information on the upcoming events (highlighted on the homepage)
app.get('/api/events/upcoming', (req, res) => {
    const query = `
        SELECT * FROM events 
        WHERE date >= CURDATE() AND status = 'upcoming'
        ORDER BY date ASC 
        LIMIT 6
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('The query for the upcoming event failed:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        res.json(results);
    });
});

// Search activity (used on the search page)
app.get('/api/events/search', (req, res) => {
    const { date, location, category } = req.query;
    let query = 'SELECT * FROM events WHERE 1=1';
    let params = [];
    
    if (date) {
        query += ' AND date = ?';
        params.push(date);
    }
    
    if (location) {
        query += ' AND location LIKE ?';
        params.push(`%${location}%`);
    }
    
    if (category) {
        query += ' AND category = ?';
        params.push(category);
    }
    
    query += ' ORDER BY date ASC';
    
    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Search activity failed:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        res.json(results);
    });
});

// Obtain details of a single activity
app.get('/api/events/:id', (req, res) => {
    const eventId = req.params.id;
    const query = 'SELECT * FROM events WHERE id = ?';
    
    db.query(query, [eventId], (err, results) => {
        if (err) {
            console.error('Failed to retrieve details of the activity:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        
        if (results.length === 0) {
            res.status(404).json({ error: 'The activity does not exist.' });
            return;
        }
        
        res.json(results[0]);
    });
});

// Get weather information for Australian cities
app.get('/api/weather', (req, res) => {
    // Default to Sydney, Australia coordinates
    const latitude = req.query.lat || '-33.8688';
    const longitude = req.query.lon || '151.2093';
    
    const params = new URLSearchParams({
        latitude: latitude,
        longitude: longitude,
        current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m',
        timezone: 'auto'
    });
    
    const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
    
    console.log('Fetching weather from:', url);
    
    https.get(url, (apiRes) => {
        let data = '';
        
        apiRes.on('data', (chunk) => {
            data += chunk;
        });
        
        apiRes.on('end', () => {
            try {
                const weatherData = JSON.parse(data);
                console.log('Weather data received:', weatherData);
                res.json(weatherData);
            } catch (error) {
                console.error('Failed to parse weather data:', error);
                console.error('Raw data:', data);
                res.status(500).json({ error: 'Failed to parse weather data' });
            }
        });
    }).on('error', (error) => {
        console.error('Weather API request failed:', error);
        res.status(500).json({ error: 'Failed to fetch weather data', details: error.message });
    });
});

// Get event registration list (sorted by registration date descending)
app.get('/api/events/:id/registrations', (req, res) => {
    const eventId = req.params.id;
    const query = `
        SELECT 
            id,
            participant_name,
            participant_phone,
            participant_email,
            ticket_quantity,
            registration_date
        FROM event_registrations 
        WHERE event_id = ? 
        ORDER BY registration_date DESC
    `;
    
    db.query(query, [eventId], (err, results) => {
        if (err) {
            console.error('Failed to query registration list:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        
        res.json(results);
    });
});

// Obtain the list of activity categories
app.get('/api/categories', (req, res) => {
    const query = 'SELECT DISTINCT category FROM events ORDER BY category';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Query for activity category failed:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        
        const categories = results.map(row => row.category);
        res.json(categories);
    });
});

// Activity Registration (Complete Implementation)
app.post('/api/events/:id/register', (req, res) => {
    const eventId = req.params.id;
    const {
        name,
        phone,
        email = '',
        age = '',
        experience = '',
        motivation = '',
        allowContact = false,
        ticketQuantity = 1
    } = req.body;

    console.log('Registration request received:', { eventId, name, phone, ticketQuantity });

    // Verify mandatory fields
    if (!name || !phone) {
        console.log('Missing required fields:', { name, phone });
        res.status(400).json({ error: 'Name and phone number are mandatory fields.' });
        return;
    }

    // Verify the vote count
    const quantity = parseInt(ticketQuantity);
    if (isNaN(quantity) || quantity < 1 || quantity > 10) {
        console.log('Invalid ticket quantity:', quantity);
        res.status(400).json({ error: 'The number of votes must be between 1 and 10.' });
        return;
    }

    // First, check whether the activity exists and if there are available places.
    const checkEventQuery = 'SELECT max_participants, current_participants, status FROM events WHERE id = ?';

    db.query(checkEventQuery, [eventId], (err, eventResults) => {
        if (err) {
            console.error('Failed to query activity information:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }

        if (eventResults.length === 0) {
            console.log('Event not found:', eventId);
            res.status(404).json({ error: 'The activity does not exist.' });
            return;
        }

        const event = eventResults[0];

        // Check the activity status
        if (event.status !== 'upcoming') {
            res.status(400).json({ error: 'The activity is currently unavailable for registration.' });
            return;
        }
       
       //Check if there are sufficient quotas (if a maximum number of participants has been set)
       if (event.max_participants) {
            const availableSlots = event.max_participants - (event.current_participants || 0);
            if (availableSlots < quantity) {
                res.status(400).json({ error: `There are insufficient places available. Only a few remain ${availableSlots}  spot ` });
                return;
            }
        }

        // Check if registration has been completed (based on the phone number)
        const checkRegistrationQuery = 'SELECT id FROM event_registrations WHERE event_id = ? AND participant_phone = ?';

        db.query(checkRegistrationQuery, [eventId, phone], (err, registrationResults) => {
            if (err) {
                console.error('Failed to check registration status:', err);
                res.status(500).json({ error: 'Internal server error' });
                return;
            }

            if (registrationResults.length > 0) {
                res.status(400).json({ error: 'You have already registered for this event.' });
                return;
            }

            // Start transaction: Insert registration record and update participation count
            db.getConnection((err, connection) => {
                if (err) {
                    console.error('Failed to obtain database connection:', err);
                    res.status(500).json({ error: 'Registration failed' });
                    return;
                }

                connection.beginTransaction((err) => {
                    if (err) {
                        connection.release();
                        console.error('Transaction initiation failed:', err);
                        res.status(500).json({ error: 'Registration failed' });
                        return;
                    }

                    const insertRegistrationQuery = `
                        INSERT INTO event_registrations
                        (event_id, participant_name, participant_phone, participant_email,
                         participant_age, volunteer_experience, motivation, allow_contact, ticket_quantity)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `;

                    connection.query(insertRegistrationQuery, [
                        eventId, name, phone, email, age, experience, motivation, allowContact, quantity
                    ], (err, insertResults) => {
                        if (err) {
                            return connection.rollback(() => {
                                connection.release();
                                console.error('Failed to insert registration record:', err);
                                res.status(500).json({ error: 'Registration failed' });
                            });
                        }

                        const updateParticipantsQuery = 'UPDATE events SET current_participants = current_participants + ? WHERE id = ?';

                        connection.query(updateParticipantsQuery, [quantity, eventId], (err, updateResults) => {
                            if (err) {
                                return connection.rollback(() => {
                                    connection.release();
                                    console.error('Failed to update the number of participants:', err);
                                    res.status(500).json({ error: 'Registration failed' });
                                });
                            }

                            // Submit the transaction
                            connection.commit((err) => {
                                if (err) {
                                    return connection.rollback(() => {
                                        connection.release();
                                        console.error('Transaction submission failed:', err);
                                        res.status(500).json({ error: 'Registration failed' });
                                    });
                                }

                                connection.release();
                                console.log('Registration successful:', { registrationId: insertResults.insertId, eventId, name });

                                res.json({
                                    message: 'Registration successful!！',
                                    registrationId: insertResults.insertId,
                                    ticketQuantity: quantity
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

// Administrator API Routes

//Obtain statistical data
app.get('/api/admin/statistics', (req, res) => {
    const queries = [
        'SELECT COUNT(*) as totalEvents FROM events',
        'SELECT COUNT(*) as upcomingEvents FROM events WHERE date >= CURDATE() AND status = "upcoming"',
        'SELECT COALESCE(SUM(current_participants), 0) as totalParticipants FROM events',
        'SELECT COUNT(*) as completedEvents FROM events WHERE status = "completed"'
    ];
    
    Promise.all(queries.map(query => new Promise((resolve, reject) => {
        db.query(query, (err, results) => {
            if (err) reject(err);
            else resolve(results[0]);
        });
    }))).then(results => {
        const statistics = {
            totalEvents: results[0].totalEvents,
            upcomingEvents: results[1].upcomingEvents,
            totalParticipants: results[2].totalParticipants,
            completedEvents: results[3].completedEvents
        };
        res.json(statistics);
    }).catch(err => {
        console.error('Failed to obtain statistical data:', err);
        res.status(500).json({ error: 'Internal server error' });
    });
});

// Get all activities (admin view)
app.get('/api/admin/events', (req, res) => {
    const query = 'SELECT * FROM events ORDER BY date DESC';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Query activity failed:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        res.json(results);
    });
});

// Create a new activity
app.post('/api/admin/events', (req, res) => {
    const {
        name,
        category,
        date,
        time,
        location,
        organizer,
        max_participants,
        registration_fee,
        contact_info,
        status,
        description,
        image_url
    } = req.body;

    // Verify mandatory fields
    if (!name || !category || !date || !location) {
        res.status(400).json({ error: 'The activity name, category, date and location are mandatory fields.' });
        return;
    }

    // Standardized time string
    const normalizedTime = normalizeTimeString(time);

    const query = `
        INSERT INTO events 
        (name, category, date, time, location, organizer, max_participants, 
         registration_fee, contact_info, status, description, image_url, current_participants)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `;

    db.query(query, [
        name, category, date, normalizedTime, location, organizer || null,
        max_participants || null, registration_fee || 0, contact_info || null,
        status || 'upcoming', description || null, image_url || null
    ], (err, results) => {
        if (err) {
            console.error('The activity creation failed:', err);
            res.status(500).json({ error: 'The activity creation failed: ' + err.message });
            return;
        }
        res.json({ message: 'The activity has been successfully created.', id: results.insertId });
    });
});

// Update activity
app.put('/api/admin/events/:id', (req, res) => {
    const eventId = req.params.id;
    const {
        name,
        category,
        date,
        time,
        location,
        organizer,
        max_participants,
        registration_fee,
        contact_info,
        status,
        description,
        image_url
    } = req.body;

    // Verify mandatory fields
    if (!name || !category || !date || !location) {
        res.status(400).json({ error: 'The activity name, category, date and location are mandatory fields.' });
        return;
    }

    const normalizedTime = normalizeTimeString(time);

    const query = `
        UPDATE events SET 
        name = ?, category = ?, date = ?, time = ?, location = ?, 
        organizer = ?, max_participants = ?, registration_fee = ?, 
        contact_info = ?, status = ?, description = ?, image_url = ?
        WHERE id = ?
    `;

    db.query(query, [
        name, category, date, normalizedTime, location, organizer || null,
        max_participants || null, registration_fee || 0, contact_info || null,
        status || 'upcoming', description || null, image_url || null, eventId
    ], (err, results) => {
        if (err) {
            console.error('Update activity failed:', err);
            res.status(500).json({ error: 'Update activity failed: ' + err.message });
            return;
        }
        
        if (results.affectedRows === 0) {
            res.status(404).json({ error: 'The activity does not exist.' });
            return;
        }
        
        res.json({ message: 'Activity update successful' });
    });
});

// Delete Activity - Fix Version
app.delete('/api/admin/events/:id', (req, res) => {
    const eventId = req.params.id;
    
    db.getConnection((err, connection) => {
        if (err) {
            console.error('Failed to obtain database connection:', err);
            res.status(500).json({ error: 'Deletion of the activity failed' });
            return;
        }

        connection.beginTransaction((err) => {
            if (err) {
                connection.release();
                console.error('Transaction initiation failed:', err);
                res.status(500).json({ error: 'Deletion of the activity failed' });
                return;
            }

            // First, delete the relevant registration records.
            const deleteRegistrationsQuery = 'DELETE FROM event_registrations WHERE event_id = ?';
            
            connection.query(deleteRegistrationsQuery, [eventId], (err, results) => {
                if (err) {
                    return connection.rollback(() => {
                        connection.release();
                        console.error('Failed to delete registration record:', err);
                        res.status(500).json({ error: 'Deletion of the activity failed: ' + err.message });
                    });
                }

                // Then delete the activity
                const deleteEventQuery = 'DELETE FROM events WHERE id = ?';
                
                connection.query(deleteEventQuery, [eventId], (err, results) => {
                    if (err) {
                        return connection.rollback(() => {
                            connection.release();
                            console.error('Deletion of the activity failed:', err);
                            res.status(500).json({ error: 'Deletion of the activity failed: ' + err.message });
                        });
                    }

                    if (results.affectedRows === 0) {
                        return connection.rollback(() => {
                            connection.release();
                            res.status(404).json({ error: 'The activity does not exist.' });
                        });
                    }

                    // Submit the transaction
                    connection.commit((err) => {
                        if (err) {
                            return connection.rollback(() => {
                                connection.release();
                                console.error('Transaction submission failed:', err);
                                res.status(500).json({ error: 'Deletion of the activity failed: ' + err.message });
                            });
                        }

                        connection.release();
                        res.json({ message: 'Activity deletion successful' });
                    });
                });
            });
        });
    });
});

// Provide static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/search', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'search.html'));
});

app.get('/event/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'detail.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});