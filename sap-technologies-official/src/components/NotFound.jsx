import React from "react";
import { motion as Motion } from "framer-motion";
import { Link } from "react-router-dom";
import { fadeInUp, staggerContainer } from "../utils/animations";
import "../styles/NotFound.css";

const NotFound = () => {
  return (
    <section className="not-found">
      <Motion.div
        className="not-found-container"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <Motion.div className="not-found-code" variants={fadeInUp}>
          404
        </Motion.div>

        <Motion.h1 variants={fadeInUp}>Page Not Found</Motion.h1>

        <Motion.p variants={fadeInUp}>
          Oops! The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </Motion.p>

        <Motion.div variants={fadeInUp}>
          <Link to="/" className="not-found-btn">
            ← Back to Home
          </Link>
        </Motion.div>
      </Motion.div>
    </section>
  );
};

export default NotFound;
