const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const emailService = require('../services/emailService');
const jwt = require('jsonwebtoken');

const getAuthCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000
});

const saveSessionWithTimeout = (req, timeoutMs = 2500) => (
    new Promise((resolve) => {
        if (!req.session?.save) {
            return resolve(false);
        }

        let settled = false;
        const timer = setTimeout(() => {
            if (!settled) {
                settled = true;
                console.warn(`Session save timed out after ${timeoutMs}ms; continuing with JWT auth.`);
                resolve(false);
            }
        }, timeoutMs);

        req.session.save((err) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);

            if (err) {
                console.error('Session save error; continuing with JWT auth:', err);
                return resolve(false);
            }

            resolve(true);
        });
    })
);

const signAccessToken = (user) => jwt.sign(
    {
        userId: user._id.toString(),
        type: 'access'
    },
    process.env.JWT_SECRET || 'fallback-secret-key-change-in-production',
    {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        issuer: 'sap-technologies',
        audience: 'sap-technologies-api'
    }
);

class AuthController {
    async register(req, res, next) {
        try {
            const { name, email, password, phone } = req.body;
            const cleanPhone = typeof phone === 'string' ? phone.trim() : "";
            
            if (!name || !email || !password) {
                return next(new AppError('Name, email, and password are required', 400));
            }
            
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return next(new AppError('Email already registered', 400));
            }
            
            const hashedPassword = await bcrypt.hash(password, 12);
            const user = new User({
                name,
                email,
                password: hashedPassword,
                phone: cleanPhone,
                lastLogin: new Date(),
                loginCount: 1
            });
            await user.save();
            
            // Track registration activity
            try {
                await user.addActivity('Account created');
            } catch (activityError) {
                console.error('Failed to log activity:', activityError);
            }
            
            const notificationPromises = [];
            
            if (emailService.isConfigured) {
                notificationPromises.push(
                    emailService.sendUserSignupNotification({ 
                        name, 
                        email, 
                        id: user._id 
                    })
                    .catch(error => console.error("User signup notification failed:", error))
                );
                
                // Send alert to admin about new user
                notificationPromises.push(
                    emailService.sendAdminUserSignupAlert({ 
                        name, 
                        email, 
                        id: user._id 
                    })
                    .catch(error => console.error("Admin signup alert failed:", error))
                );
            }
            
            // Execute notifications in background
            Promise.all(notificationPromises);
            
            req.session.userId = user._id;
            req.session.userName = user.name;

            const sessionSaved = await saveSessionWithTimeout(req);
            if (sessionSaved) {
                console.log('Session saved successfully after signup.');
            }

            const accessToken = signAccessToken(user);
            res.cookie('accessToken', accessToken, getAuthCookieOptions());

            // Send success response with user profile info and auth token
            res.status(201).json({
                status: 'success',
                message: 'User registered and logged in successfully',
                data: {
                    user: user.profile,
                    name: user.name,
                    sessionId: req.session.id,
                    accessToken
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Handle user login
    async login(req, res, next) {
        try {
            // Get login credentials from request
            const { email, password } = req.body;
            
            // Make sure both email and password were provided
            if (!email || !password) {
                return next(new AppError('Email and password are required', 400));
            }
            
            // Find user by email (only active users can login)
            const user = await User.findOne({ email, isActive: true });
            if (!user) {
                return next(new AppError('Invalid credentials', 401));
            }
            
            // Verify the password matches what we have stored
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return next(new AppError('Invalid credentials', 401));
            }
            
            // Update user's login tracking info
            user.lastLogin = new Date();
            user.loginCount = (user.loginCount || 0) + 1;
            
            // Create user session - this is what keeps them logged in
            req.session.userId = user._id;
            req.session.userName = user.name;
            
            console.log('Setting session for user:', {
                userId: user._id,
                userName: user.name,
                sessionId: req.session.id,
                email: user.email
            });
            
            // Persist the legacy session when possible, but don't let the
            // Mongo session store block login because JWT auth is the source
            // of truth for cross-site admin requests.
            const sessionSaved = await saveSessionWithTimeout(req);
            if (sessionSaved) {
                console.log('Session saved successfully.');
            }
            
            // Save the updated user info to database
            await user.save();
            
            // Record this login in their activity log
            // Again, we don't want login to fail just because activity logging fails
            try {
                await user.addActivity('Logged in');
            } catch (activityError) {
                console.error('Failed to log login activity:', activityError);
            }
            
            const accessToken = signAccessToken(user);
            res.cookie('accessToken', accessToken, getAuthCookieOptions());

            // Send success response with user info. The token is included as a
            // fallback for browsers that restrict third-party session cookies.
            res.status(200).json({
                status: 'success',
                message: 'Login successful',
                data: { 
                    user: user.profile, 
                    name: user.name,
                    sessionId: req.session.id,
                    accessToken
                }
            });
            
            console.log('Login response sent. Cookie:', res.getHeader('Set-Cookie'));
        } catch (error) {
            next(error);
        }
    }

    // Handle user logout
    async logout(req, res, next) {
        try {
            // If user has an active session, log their logout activity
            if (req.session?.userId) {
                const user = await User.findById(req.session.userId);
                if (user) {
                    await user.addActivity('Logged out');
                }
            }
            
            const sendLogoutResponse = () => {
                const cookieOptions = getAuthCookieOptions();
                delete cookieOptions.maxAge;
                res.clearCookie('sap.sid', cookieOptions);
                res.clearCookie('accessToken', cookieOptions);

                res.status(200).json({
                    status: 'success',
                    message: 'Logged out successfully'
                });
            };

            if (!req.session?.destroy) {
                return sendLogoutResponse();
            }

            req.session.destroy((err) => {
                if (err) {
                    return next(new AppError('Could not log out, please try again', 500));
                }

                sendLogoutResponse();
            });
        } catch (error) {
            next(error);
        }
    }

    // Get current logged-in user's info
    async getCurrentUser(req, res, next) {
        try {
            // authMiddleware attaches req.user for JWT and session auth.
            const user = req.user || await User.findById(req.session?.userId);
            if (!user) {
                return next(new AppError('User not found', 404));
            }
            
            // Return user profile information
            res.status(200).json({
                status: 'success',
                data: { user: user.profile }
            });
        } catch (error) {
            next(error);
        }
    }

    // Check if user is authenticated (used by frontend to verify login status)
    async checkAuth(req, res, next) {
        try {
            // No session = not logged in
            const userId = req.userId || req.session?.userId;
            if (!userId) {
                return res.status(401).json({
                    status: 'fail',
                    message: 'Not authenticated'
                });
            }
            
            // Check if user still exists and is active
            const user = req.user || await User.findById(userId);
            if (!user || !user.isActive) {
                return res.status(401).json({
                    status: 'fail',
                    message: 'User not found or inactive'
                });
            }
            
            // All good - user is authenticated
            res.status(200).json({
                status: 'success',
                data: { user: user.profile }
            });
        } catch (error) {
            next(error);
        }
    }
}

// Export a single instance of the controller
// This way all routes use the same controller instance
module.exports = new AuthController();
