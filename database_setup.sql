-- 删除并重新创建慈善活动数据库
DROP DATABASE IF EXISTS charityevents_db;
CREATE DATABASE charityevents_db;
USE charityevents_db;

-- 创建活动表
CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    time TIME,
    location VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    organizer VARCHAR(255),
    contact_info VARCHAR(255),
    image_url LONGTEXT,
    registration_fee DECIMAL(10,2) DEFAULT 0.00,
    max_participants INT,
    current_participants INT DEFAULT 0,
    status ENUM('upcoming', 'ongoing', 'completed', 'cancelled') DEFAULT 'upcoming',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 创建活动注册表
CREATE TABLE IF NOT EXISTS event_registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    participant_name VARCHAR(100) NOT NULL,
    participant_phone VARCHAR(20) NOT NULL,
    participant_email VARCHAR(255),
    participant_age VARCHAR(20),
    volunteer_experience VARCHAR(50),
    motivation TEXT,
    allow_contact BOOLEAN DEFAULT FALSE,
    ticket_quantity INT DEFAULT 1,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- 插入示例数据
INSERT INTO events (name, description, date, time, location, category, organizer, contact_info, registration_fee, max_participants) VALUES
('Community Cleanup', 'Help clean up the community and beautify the environment', '2024-10-15', '09:00:00', 'Downtown Park', '环保', 'Green Earth Organization', 'contact@greenearth.org', 0.00, 50),
('Children Book Donation', 'Donate books and learning supplies to children in impoverished areas', '2024-10-20', '14:00:00', 'City Library', '教育', 'Light of Hope Foundation', 'info@hopelight.org', 0.00, 100),
('Elderly Care Activity', 'Accompany elderly people and provide life assistance', '2024-10-25', '10:00:00', 'Sunset Red Nursing Home', '关爱', 'Caring Volunteers Association', 'volunteer@care.org', 0.00, 30),
('Charity Bazaar', 'Raise funds through charity sales to help those in need', '2024-11-01', '10:00:00', 'Citizens Square', '筹款', 'Charity Union', 'charity@union.org', 0.00, 200),
('Tree Planting Activity', 'Plant trees in suburban areas to improve the ecological environment', '2024-11-05', '08:00:00', 'Suburban Mountain Area', '环保', 'Green Earth Organization', 'contact@greenearth.org', 0.00, 80),
('Poverty Relief Support', 'Provide daily necessities and financial assistance to poor families', '2024-11-10', '13:00:00', 'Community Service Center', '扶贫', 'Warm Home', 'warm@home.org', 0.00, 40),
('Free Medical Clinic', 'Provide free medical examinations for community residents', '2024-11-15', '09:00:00', 'Community Health Station', '医疗', 'Health Guardian', 'health@guardian.org', 0.00, 60),
('Disability Care Support', 'Provide life assistance and psychological support for disabled people', '2024-11-20', '15:00:00', 'Disability Service Center', '关爱', 'Sunshine Disability Support Association', 'sunshine@disabled.org', 0.00, 25);