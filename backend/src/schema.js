// MySQL 8 schema. All DATETIME columns hold UTC.
export const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS workers (
    id VARCHAR(16) PRIMARY KEY,
    role VARCHAR(64) NOT NULL,
    ward VARCHAR(32) NOT NULL,
    ward_name VARCHAR(64) NOT NULL,
    shift_start TIME NOT NULL,
    shift_end TIME NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS routes (
    id VARCHAR(16) PRIMARY KEY,
    worker_id VARCHAR(16) NOT NULL,
    distance_km DECIMAL(5,1) NOT NULL,
    est_minutes INT NOT NULL,
    center_lat DECIMAL(9,6) NOT NULL,
    center_lng DECIMAL(9,6) NOT NULL,
    zoom TINYINT NOT NULL DEFAULT 16,
    started_at DATETIME NULL,
    ended_at DATETIME NULL,
    FOREIGN KEY (worker_id) REFERENCES workers(id)
  )`,
  `CREATE TABLE IF NOT EXISTS collection_points (
    id INT AUTO_INCREMENT PRIMARY KEY,
    route_id VARCHAR(16) NOT NULL,
    seq TINYINT NOT NULL,
    code VARCHAR(8) NOT NULL UNIQUE,
    name VARCHAR(96) NOT NULL,
    area VARCHAR(96) NOT NULL,
    lat DECIMAL(9,6) NOT NULL,
    lng DECIMAL(9,6) NOT NULL,
    distance_km DECIMAL(4,1) NOT NULL,
    fill_pct TINYINT NOT NULL,
    level ENUM('LOW','MEDIUM','HIGH','OVERFLOW') NOT NULL,
    category ENUM('MIXED','ORGANIC','PLASTIC','DRY') NOT NULL,
    priority ENUM('normal','high') NOT NULL DEFAULT 'normal',
    status ENUM('pending','done') NOT NULL DEFAULT 'pending',
    FOREIGN KEY (route_id) REFERENCES routes(id)
  )`,
  `CREATE TABLE IF NOT EXISTS assessments (
    id CHAR(36) PRIMARY KEY,
    point_id INT NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    level ENUM('LOW','MEDIUM','HIGH','OVERFLOW') NOT NULL,
    category ENUM('MIXED','ORGANIC','PLASTIC','DRY') NOT NULL,
    priority ENUM('LOW','NORMAL','URGENT') NOT NULL,
    action VARCHAR(96) NOT NULL,
    source VARCHAR(16) NOT NULL,
    lat DECIMAL(9,6) NULL,
    lng DECIMAL(9,6) NULL,
    accuracy_m INT NULL,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (point_id) REFERENCES collection_points(id)
  )`,
  // Report numbers are WS-<id>, so ids continue from the sample data.
  `CREATE TABLE IF NOT EXISTS reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    worker_id VARCHAR(16) NOT NULL,
    point_id INT NOT NULL,
    assessment_id CHAR(36) NULL UNIQUE,
    level ENUM('LOW','MEDIUM','HIGH','OVERFLOW') NOT NULL,
    category ENUM('MIXED','ORGANIC','PLASTIC','DRY') NOT NULL,
    priority ENUM('LOW','NORMAL','URGENT') NOT NULL,
    status ENUM('Submitted','Collected') NOT NULL,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (worker_id) REFERENCES workers(id),
    FOREIGN KEY (point_id) REFERENCES collection_points(id),
    FOREIGN KEY (assessment_id) REFERENCES assessments(id)
  ) AUTO_INCREMENT = 2481`,
];
