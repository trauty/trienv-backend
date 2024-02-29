import mysql from "mysql2/promise"

export const conn = mysql.createPool({
    host: "localhost",
    port: 3310,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: "trienv",
    waitForConnections: true,
    connectionLimit: 20,
    maxIdle: 20,
    idleTimeout: 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
});