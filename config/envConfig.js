const _envVars = {
    port: process.env.PORT || 5001,
    backendURI: process.env.BACKEND_APP_URI,
    nodeEnv: process.env.NODE_ENV,
    dbUrl: process.env.DB_URI,
    dbName: process.env.DB_NAME,
    jwtSecret: process.env.JWT_SECRET,
    cookieExpire: process.env.COOKIE_EXPIRE || 30,
    frontendURL: process.env.FRONTEND_URL,
    adminFrontendURL: process.env.ADMIN_FRONTEND_URL,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleSecret: process.env.GOOGLE_CLIENT_SECRET
}
// getEnvConfig is a function that returns the value of an environment variable
const getEnvConfig = {
    get(key){   
        const value = _envVars[key]
        if(!value){
            console.error(`Missing environment variable ${key}`)
            process.exit(1)
        }
        return value
    }
}

export default getEnvConfig;
