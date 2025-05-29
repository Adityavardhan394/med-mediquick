USE MediQuick;
GO

-- Drop existing foreign key constraints first
DECLARE @sql NVARCHAR(MAX) = N'';
SELECT @sql += N'
    ALTER TABLE ' + QUOTENAME(OBJECT_SCHEMA_NAME(parent_object_id))
    + '.' + QUOTENAME(OBJECT_NAME(parent_object_id)) + 
    ' DROP CONSTRAINT ' + QUOTENAME(name) + ';'
FROM sys.foreign_keys;
EXEC sp_executesql @sql;
GO

-- Drop existing tables if they exist
IF OBJECT_ID('care_plan_memberships', 'U') IS NOT NULL DROP TABLE care_plan_memberships;
IF OBJECT_ID('pill_reminders', 'U') IS NOT NULL DROP TABLE pill_reminders;
IF OBJECT_ID('reviews', 'U') IS NOT NULL DROP TABLE reviews;
IF OBJECT_ID('subscriptions', 'U') IS NOT NULL DROP TABLE subscriptions;
IF OBJECT_ID('cart', 'U') IS NOT NULL DROP TABLE cart;
IF OBJECT_ID('order_items', 'U') IS NOT NULL DROP TABLE order_items;
IF OBJECT_ID('orders', 'U') IS NOT NULL DROP TABLE orders;
IF OBJECT_ID('prescriptions', 'U') IS NOT NULL DROP TABLE prescriptions;
IF OBJECT_ID('medicines', 'U') IS NOT NULL DROP TABLE medicines;
IF OBJECT_ID('categories', 'U') IS NOT NULL DROP TABLE categories;
IF OBJECT_ID('addresses', 'U') IS NOT NULL DROP TABLE addresses;
IF OBJECT_ID('users', 'U') IS NOT NULL DROP TABLE users;
GO

-- Users table
CREATE TABLE users (
    user_id INT IDENTITY(1,1) PRIMARY KEY,
    phone_number VARCHAR(15) NOT NULL UNIQUE,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);

-- Addresses table
CREATE TABLE addresses (
    address_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT,
    address_type VARCHAR(20), -- 'home', 'office', etc.
    street_address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    is_default BIT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Categories table
CREATE TABLE categories (
    category_id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url TEXT
);

-- Medicines table
CREATE TABLE medicines (
    medicine_id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    generic_name VARCHAR(200),
    description TEXT,
    category_id INT,
    manufacturer VARCHAR(100),
    price DECIMAL(10,2) NOT NULL,
    stock_quantity INT DEFAULT 0,
    requires_prescription BIT DEFAULT 0,
    image_url TEXT,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
);

-- Orders table
CREATE TABLE orders (
    order_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT,
    address_id INT,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'pending', 'processing', 'shipped', 'delivered', 'cancelled'
    payment_status VARCHAR(20) NOT NULL, -- 'pending', 'paid', 'failed'
    payment_method VARCHAR(50),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (address_id) REFERENCES addresses(address_id)
);

-- Order Items table
CREATE TABLE order_items (
    order_item_id INT IDENTITY(1,1) PRIMARY KEY,
    order_id INT,
    medicine_id INT,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (medicine_id) REFERENCES medicines(medicine_id)
);

-- Prescriptions table
CREATE TABLE prescriptions (
    prescription_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT,
    doctor_name VARCHAR(100),
    issue_date DATE NOT NULL,
    expiry_date DATE,
    image_url TEXT,
    status VARCHAR(20) NOT NULL, -- 'pending', 'approved', 'rejected'
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Cart table
CREATE TABLE cart (
    cart_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT,
    medicine_id INT,
    quantity INT NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (medicine_id) REFERENCES medicines(medicine_id)
);

-- Subscriptions table
CREATE TABLE subscriptions (
    subscription_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT,
    medicine_id INT,
    frequency VARCHAR(20) NOT NULL, -- 'weekly', 'monthly', 'quarterly'
    quantity INT NOT NULL,
    address_id INT,
    status VARCHAR(20) NOT NULL, -- 'active', 'paused', 'cancelled'
    next_delivery_date DATE,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (medicine_id) REFERENCES medicines(medicine_id),
    FOREIGN KEY (address_id) REFERENCES addresses(address_id)
);

-- Reviews table
CREATE TABLE reviews (
    review_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT,
    medicine_id INT,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (medicine_id) REFERENCES medicines(medicine_id)
);

-- Pill Reminders table
CREATE TABLE pill_reminders (
    reminder_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT,
    medicine_id INT,
    reminder_time TIME NOT NULL,
    frequency VARCHAR(50) NOT NULL, -- 'daily', 'weekly', specific days
    dosage VARCHAR(50),
    is_active BIT DEFAULT 1,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (medicine_id) REFERENCES medicines(medicine_id)
);

-- Care Plan Memberships table
CREATE TABLE care_plan_memberships (
    membership_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT,
    plan_type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'active', 'expired', 'cancelled'
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_medicines_category ON medicines(category_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_cart_user ON cart(user_id);
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_pill_reminders_user ON pill_reminders(user_id); 