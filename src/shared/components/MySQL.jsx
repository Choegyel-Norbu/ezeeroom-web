import React from "react";
import { SiMysql } from "react-icons/si";

export default function MySQLCard() {
  return (
    <div className="flex items-center justify-center  w-fit">
      <div className="relative w-70 h-80 perspective-1000">
        <div className="group w-full h-full relative preserve-3d transition-transform duration-700 hover:rotate-y-180">
          {/* Front Side */}
          <div className="absolute inset-0 w-full h-full backface-hidden rounded-xl shadow-xl border border-gray-200 flex flex-col items-center justify-center">
            <div className="mb-6">
              {/* MySQL Icon */}
              <SiMysql className="text-6xl text-blue-600 mb-2" />
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-3 text-center">
              MySQL
            </h2>

            <div className="text-center space-y-2 text-gray-600">
              <p className="text-sm font-medium">Relational Database</p>

              <div className="flex flex-wrap justify-center gap-2 mt-4">
                <span className="px-3 py-1 text-blue-700 rounded-full text-xs font-medium">
                  ACID Compliant
                </span>
                <span className="px-3 py-1 text-blue-700 rounded-full text-xs font-medium">
                  SQL
                </span>
                <span className="px-3 py-1 text-blue-700 rounded-full text-xs font-medium">
                  Scalable
                </span>
              </div>
            </div>

            <div className="mt-6 text-xs text-gray-400 flex items-center">
              <span>Hover to see code →</span>
            </div>
          </div>

          {/* Back Side */}
          <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-gray-900 rounded-xl shadow-xl border border-gray-700 p-4 overflow-hidden">
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">MySQL</h3>
                <div className="flex space-x-1">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
              </div>

              <div className="flex-1 bg-gray-800 rounded-lg p-4 overflow-auto">
                <pre className="text-xs text-gray-300 leading-relaxed">
                  <code>{`-- Create a database
CREATE DATABASE ecommerce;

-- Create users table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create products table with foreign key
CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  user_id INT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Insert sample data
INSERT INTO users (username, email)
VALUES ('john_doe', 'john@example.com');

-- Query with JOIN
SELECT p.name, p.price, u.username
FROM products p
JOIN users u ON p.user_id = u.id
WHERE p.price > 50.00;

-- Create stored procedure
DELIMITER //
CREATE PROCEDURE GetExpensiveProducts(IN minPrice DECIMAL(10,2))
BEGIN
  SELECT * FROM products WHERE price > minPrice;
END //
DELIMITER ;`}</code>
                </pre>
              </div>

              <div className="mt-3 text-xs text-gray-400 text-center">
                SQL Schema and Query Examples
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        .group:hover .hover\\:rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
}
