// Custom error class
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

// Error handling middleware
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error
    console.error(err);

    // Mongoose bad ObjectId
    if (err.name === "CastError") {
        const message = "Resource not found";
        error = new AppError(message, 404);
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const value = Object.values(err.keyValue)[0];
        const message = `Duplicate field value: ${value}. Please use another value!`;
        error = new AppError(message, 400);
    }

    // Mongoose validation error
    if (err.name === "ValidationError") {
        const errors = Object.values(err.errors).map(val => val.message);
        const message = `Invalid input data. ${errors.join(". ")}`;
        error = new AppError(message, 400);
    }

    res.status(error.statusCode || 500).json({
        status: error.status || "error",
        message: error.message || "Internal server error",
        ...(process.env.NODE_ENV === "development" && { stack: err.stack })
    });
};

// 404 handler
const notFoundHandler = (req, res) => {
    res.status(404).json({
        status: "error",
        message: `Route ${req.originalUrl} not found`
    });
};

module.exports = {
    AppError,
    errorHandler,
    notFoundHandler
};
