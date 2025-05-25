-- Creación de la base de datos
CREATE DATABASE IF NOT EXISTS ccpp;
USE ccpp;

-- Tabla de Usuarios (User)
CREATE TABLE User (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    document VARCHAR(100) UNIQUE NOT NULL,
    gender ENUM('F', 'M', 'O') NOT NULL, -- F: Female, M: Male, O: Other
    birthday DATE,
    lastRecord DATE
);

-- Tabla de Administradores (Admin)
CREATE TABLE Admin (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(320) UNIQUE NOT NULL,
    password VARCHAR(256) NOT NULL,
    role ENUM('M', 'A') NOT NULL, -- M: Master, A: Admin
    accessCode INT NOT NULL
);

-- Tabla de Módulos (Module)
CREATE TABLE Module (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(256) UNIQUE NOT NULL
);

-- Tabla de Registros (Record)
CREATE TABLE Record (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    date DATE NOT NULL,
    module_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE,
    FOREIGN KEY (module_id) REFERENCES Module(id) ON DELETE CASCADE,
    INDEX (user_id),
    INDEX (module_id)
);
