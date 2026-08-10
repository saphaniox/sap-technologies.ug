import React, { useCallback, useEffect, useState } from "react";
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "../utils/animations";
import "../styles/Testimonials.css";

const testimonials = [
  {
    name: "Joshua Wangoola",
    company: "Digital Enterprises, Kampala",
    rating: 5,
    text: "SAPTech Uganda built our business management system from scratch. The quality exceeded our expectations and their support team is always available. I really love them and i highly recommend everyone to work with them.",
    avatar: "JW",
    image: "/images/testimonial-jk.jpg"
  },
  {
    name: "Ritah Nakibuule",
    company: "Best Fashion House, Entebbe",
    rating: 5,
    text: "The website they designed for us is stunning and professional. Our online sales increased by over 60% within the first two months. Outstanding work!",
    avatar: "RN",
    image: "/images/testimonial-gn.jpg"
  },
  {
    name: "Dan Ochieng",
    company: "Ochieng Tech Solutions, kumi",
    rating: 5,
    text: "Their electrical engineering team delivered our industrial automation project on time and within budget. Technical expertise at its finest.",
    avatar: "DO",
    image: "/images/testimonial-do..jpg"
  },
  {
    name: "Faridah Nantongo",
    company: "Nantongo Retail Group, Kampala",
    rating: 5,
    text: "From branding to software development, SAPTech Uganda handled everything seamlessly. They truly understand what all businesses need.",
    avatar: "FN",
    image: "/images/testimonial-fn.jpg"
  }
];

const StarRating = ({ count }) => (
  <div className="star-rating" aria-label={`${count} out of 5 stars`}>
    {Array.from({ length: 5 }).map((_, i) => (
      <span key={i} className={i < count ? "star filled" : "star"}>★</span>
    ))}
  </div>
);

const Testimonials = () => {
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isAutoPaused, setIsAutoPaused] = useState(false);

  const pauseAutoSlide = useCallback(() => {
    setIsAutoPaused(true);
  }, []);

  const prev = useCallback((pause = true) => {
    if (pause) pauseAutoSlide();
    setDirection(-1);
    setActive((a) => (a === 0 ? testimonials.length - 1 : a - 1));
  }, [pauseAutoSlide]);

  const next = useCallback((pause = true) => {
    if (pause) pauseAutoSlide();
    setDirection(1);
    setActive((a) => (a === testimonials.length - 1 ? 0 : a + 1));
  }, [pauseAutoSlide]);

  const goTo = useCallback((index) => {
    pauseAutoSlide();
    setDirection(index >= active ? 1 : -1);
    setActive(index);
  }, [active, pauseAutoSlide]);

  useEffect(() => {
    if (isAutoPaused) return undefined;

    const interval = window.setInterval(() => {
      next(false);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [isAutoPaused, next]);

  const t = testimonials[active];

  return (
    <section id="testimonials" className="testimonials">
      <div className="container">
        <motion.h2
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          What Our Clients Say
        </motion.h2>
        <motion.p
          className="testimonials-subtitle"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          Real feedback from businesses we&apos;ve empowered across Uganda and beyond.
        </motion.p>

        <motion.div
          className="testimonials-carousel"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          onPointerDown={pauseAutoSlide}
          onFocusCapture={pauseAutoSlide}
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={active}
              className="testimonial-card"
              custom={direction}
              variants={fadeInUp}
              initial={{ opacity: 0, x: direction > 0 ? 90 : -90 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction > 0 ? -90 : 90 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            >
              <div className="testimonial-quote">&ldquo;</div>
              <p className="testimonial-text">{t.text}</p>
              <StarRating count={t.rating} />
              <div className="testimonial-author">
                <div className="testimonial-avatar">
                  {t.image ? (
                    <img src={t.image} alt={t.name} className="avatar-image" />
                  ) : (
                    t.avatar
                  )}
                </div>
                <div className="testimonial-meta">
                  <strong>{t.name}</strong>
                  <span>{t.company}</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="testimonials-nav">
            <button className="nav-btn" onClick={() => prev()} aria-label="Previous testimonial">&#8592;</button>
            <div className="testimonials-dots">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  className={`dot${i === active ? " active" : ""}`}
                  onClick={() => goTo(i)}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>
            <button className="nav-btn" onClick={() => next()} aria-label="Next testimonial">&#8594;</button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;
