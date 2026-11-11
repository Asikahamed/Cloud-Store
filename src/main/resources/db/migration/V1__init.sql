-- Flyway Migration Script: V1__init.sql
-- Description: Create products table and populate sample records

CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    price NUMERIC(10, 2) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

-- Seed generic sample data for demonstration
INSERT INTO products (name, description, price, stock_quantity, created_at, updated_at)
VALUES
    ('DevOps Toolkit', 'Standard developer utility set', 29.99, 100, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Cloud Starter Kit', 'Starter package for cloud computing workloads', 49.99, 50, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Insulated Coffee Tumbler', 'Stainless steel drinkware for workspace use', 18.50, 75, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
