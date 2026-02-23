CREATE DATABASE IF NOT EXISTS `agentpassvault_dev`;
CREATE DATABASE IF NOT EXISTS `agentpassvault_test`;

-- Create user for application and tests
CREATE USER IF NOT EXISTS 'user'@'%' IDENTIFIED BY 'password';

-- Grant privileges
GRANT ALL PRIVILEGES ON `agentpassvault_dev`.* TO 'user'@'%';
GRANT ALL PRIVILEGES ON `agentpassvault_test`.* TO 'user'@'%';

FLUSH PRIVILEGES;
