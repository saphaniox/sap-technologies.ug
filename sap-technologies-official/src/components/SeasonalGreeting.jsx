import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "../styles/SeasonalGreeting.css";

const getLaunchDate = () => {
  const now = new Date();
  const thisMonthLaunch = new Date(now.getFullYear(), now.getMonth(), 25, 10, 0, 0);
  // If the 25th of this month has already passed, target next month's 25th
  if (now > thisMonthLaunch) {
    return new Date(now.getFullYear(), now.getMonth() + 1, 25, 10, 0, 0);
  }
  return thisMonthLaunch;
};

const formatLaunchLabel = (date) => {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[date.getMonth()]} ${date.getDate()}, 10:00 AM (EAT)`;
};

const getTimeLeft = (targetDate) => {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isLaunched: true };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / (60 * 60 * 24));
  const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, isLaunched: false };
};

const SeasonalGreeting = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [launchDate] = useState(getLaunchDate);
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(getLaunchDate()));
  const launchLabel = formatLaunchLabel(launchDate);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft(launchDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [launchDate]);

  useEffect(() => {
    const autoDismissTimer = setTimeout(() => {
      setIsVisible(false);
    }, 30000);

    return () => clearTimeout(autoDismissTimer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
  };

  const pad = (value) => String(value).padStart(2, "0");

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="seasonal-greeting-wrapper"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="seasonal-greeting">
            {/* Close Button */}
            <button
              className="seasonal-close-btn"
              onClick={handleClose}
              aria-label="Close greeting"
            >
              ×
            </button>

            {/* Main Content */}
            <div className="seasonal-content">
              {/* Decorative Elements */}
              <div className="seasonal-decorations">
                <>
                  <span className="decoration">🚀</span>
                  <span className="decoration">⏳</span>
                  <span className="decoration">✨</span>
                </>
              </div>

              {/* Greeting Text */}
              <motion.div
                className="seasonal-text"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                }}
              >
                <h2 className="seasonal-title">A Big Launch Is Coming</h2>
                <p className="seasonal-subtitle">{launchLabel}</p>
              </motion.div>

              <div className="countdown-grid" role="status" aria-live="polite">
                <div className="countdown-item">
                  <span className="countdown-value">{pad(timeLeft.days)}</span>
                  <span className="countdown-label">Days</span>
                </div>
                <div className="countdown-item">
                  <span className="countdown-value">{pad(timeLeft.hours)}</span>
                  <span className="countdown-label">Hours</span>
                </div>
                <div className="countdown-item">
                  <span className="countdown-value">{pad(timeLeft.minutes)}</span>
                  <span className="countdown-label">Minutes</span>
                </div>
                <div className="countdown-item">
                  <span className="countdown-value">{pad(timeLeft.seconds)}</span>
                  <span className="countdown-label">Seconds</span>
                </div>
              </div>

              {/* Message */}
              <motion.p
                className="seasonal-message"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 1 }}
              >
                {timeLeft.isLaunched
                  ? "The wait is over. Our new system is now live. Explore what we have built for you."
                  : "Something powerful is about to drop. We are preparing a brand new system to transform how you work and grow. Stay tuned and be among the first to discover it."}
              </motion.p>

              {/* Decorative Bottom */}
              <div className="seasonal-decorations bottom">
                <>
                  <span className="decoration">🔒</span>
                  <span className="decoration">⚡</span>
                  <span className="decoration">🎯</span>
                </>
              </div>

              {/* From SAPTech Uganda */}
              <motion.div
                className="seasonal-from"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.8 }}
              >
                <p>- From all of us at <strong>SAPTech Uganda</strong></p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SeasonalGreeting;

