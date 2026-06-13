module.exports = {
    JWT_SECRET: process.env.JWT_SECRET || 'rahasia_ateric_2024',
    ACCESS_TOKEN_EXPIRES: '15m',          
    REFRESH_TOKEN_EXPIRES: 7 * 24 * 60 * 60, 
};