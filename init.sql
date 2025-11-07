-- Database initialization script

CREATE TABLE IF NOT EXISTS scrape_tasks (
    id UUID PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    total_items INTEGER DEFAULT 0,
    challenge_required BOOLEAN DEFAULT FALSE,
    challenge_type VARCHAR(50),
    rate_limited BOOLEAN DEFAULT FALSE,
    rate_limit_reset_at TIMESTAMP,
    error_message TEXT,
    export_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scrape_results (
    id UUID PRIMARY KEY,
    task_id UUID REFERENCES scrape_tasks(id) ON DELETE CASCADE,
    post_id VARCHAR(255) NOT NULL,
    post_url TEXT NOT NULL,
    caption TEXT,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_scrape_tasks_status ON scrape_tasks(status);
CREATE INDEX idx_scrape_tasks_username ON scrape_tasks(username);
CREATE INDEX idx_scrape_results_task_id ON scrape_results(task_id);
