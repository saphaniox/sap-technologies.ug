import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { fadeInUp, staggerContainer } from "../utils/animations";
import "../styles/NotFound.css";

const NotFound = () => {
  return (
    <section className="not-found">
      <motion.div
        className="not-found-container"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="not-found-code" variants={fadeInUp}>
          404
        </motion.div>

        <motion.h1 variants={fadeInUp}>Page Not Found</motion.h1>

        <motion.p variants={fadeInUp}>
          Oops! The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </motion.p>

        <motion.div variants={fadeInUp}>
          <Link to="/" className="not-found-btn">
            ← Back to Home
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default NotFound;
