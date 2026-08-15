/**
 * About Component
 * 
 * Showcases our company story, mission, team members, and key statistics.
 * Uses Framer Motion for smooth animations and engaging user experience.
 */
import React from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { fadeInUp, fadeInLeft, fadeInRight, staggerContainer, scaleHover } from "../utils/animations";
import "../styles/About.css";

const About = () => {
  // Team member profiles with skills and bios
  const teamMembers = [
    {
      name: "Saphan Muganza",
      role: "Founder, CEO & Full-Stack Engineer",
      image: "/images/me.jpg",
      bio: "Full-stack engineer and entrepreneur with a passion for innovative technology solutions that transform African businesses.",
      skills: ["Leadership", "Strategy", "Electrical", "Automation", "Full-Stack Engineering"]
    },
    {
      name: "Samuel Nkunda",
      role: "UI/UX & Frontend Developer",
      image: "/images/me2.jpg",
      bio: "Skilled developer specializing in modern web technologies and mobile applications with a focus on exceptional user experiences.",
      skills: ["React", "Node.js", "Mobile Apps", "Electrical"]
    },
    {
      name: "Roberto Delgado",
      role: "Creative Designer",
      image: "/images/me3.jpg",
      bio: "Creative professional focused on delivering exceptional user experiences and visual design that elevates brand identities.",
      skills: ["UI/UX", "Graphics", "Branding"]
    }
  ];

  // Company statistics to showcase our achievements and capabilities
  const stats = [
    { number: "80+", label: "Projects Completed" },
    { number: "100%", label: "Client Satisfaction" },
    { number: "4+", label: "Years Experience" },
    { number: "24/7", label: "Support Available" }
  ];

  return (
    <section id="about" className="about">
      <div className="container">
        <motion.h2
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          About Us
        </motion.h2>
        
        <motion.div 
          className="about-content"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.div 
            className="about-text"
            variants={fadeInLeft}
          >
            <h3><strong>Empowering Uganda, Inspiring Africa By </strong>Transforming your imaginations to real life</h3>
            <p>
                At SAPTech Uganda, we believe technology is the catalyst for progress and transformation. Founded in the heart of Kampala, we are more than just a tech company - we are visionaries, innovators and partners in your success. Our multidisciplinary team blends creativity, engineering excellence and deep industry expertise to deliver world-class solutions in web design, branding, electrical engineering, electronic circuits and custom software.
            </p>
                        <p>
              Our team of experienced professionals combines creativity with technical 
              expertise to create solutions that not only meet but exceed our clients&apos; 
              expectations. We believe in the power of technology to transform businesses 
              and improve lives.
            </p>
            <p>
                We are driven by a passion to empower businesses, entrepreneurs and communities across Uganda and beyond. Every project is an opportunity to inspire, to solve real-world challenges and to elevate our clients to new heights. With a relentless commitment to quality, integrity and innovation, SAPTech Uganda is shaping the digital future of Africa - one idea, one solution, one success story at a time.
            </p>
            <p>
              <em>lets build the future together.</em>
            </p>

          </motion.div>

          <motion.div 
            className="about-stats"
            variants={fadeInRight}
          >
            <motion.div 
              className="stats-grid"
              variants={staggerContainer}
            >
              {stats.map((stat, index) => (
                <motion.div 
                  key={index}
                  className="stat-item"
                  variants={scaleHover}
                  whileHover="hover"
                >
                  <div className="stat-number">{stat.number}</div>
                  <div className="stat-label">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Mission, Vision & Core Values Section */}
        <motion.div 
          className="mission-vision-section"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.div className="mvv-grid" variants={staggerContainer}>
            {/* Mission */}
            <motion.div 
              className="mvv-card mission-card"
              variants={fadeInUp}
              whileHover={{ 
                y: -10,
                boxShadow: "0 30px 60px rgba(102, 126, 234, 0.25)",
                transition: { duration: 0.3 }
              }}
            >
              <div className="mvv-header">
                <div className="mvv-icon-wrapper mission-icon">
                  <span className="mvv-icon">{"\uD83C\uDFAF"}</span>
                </div>
                <h3>Our Mission</h3>
              </div>
              <div className="mvv-content">
                <p className="mvv-lead">
                  Building technology that solves real problems
                </p>
                <p className="mvv-description">
                  Our mission is to help businesses, entrepreneurs, and communities use technology with confidence.
                  We design and build websites, software, brands, electronics, and engineering systems that are easy
                  to use, reliable in the field, and aligned with the client&apos;s real goals.
                </p>
                <p className="mvv-description">
                  We measure success by what changes after delivery: smoother operations, stronger customer trust,
                  better visibility, safer systems, and ideas that finally move from imagination into daily use.
                </p>
              </div>
            </motion.div>

            {/* Vision */}
            <motion.div 
              className="mvv-card vision-card"
              variants={fadeInUp}
              whileHover={{ 
                y: -10,
                boxShadow: "0 30px 60px rgba(16, 185, 129, 0.25)",
                transition: { duration: 0.3 }
              }}
            >
              <div className="mvv-header">
                <div className="mvv-icon-wrapper vision-icon">
                  <span className="mvv-icon">{"\uD83D\uDD2D"}</span>
                </div>
                <h3>Our Vision</h3>
              </div>
              <div className="mvv-content">
                <p className="mvv-lead">
                  A trusted African technology partner for the future
                </p>
                <p className="mvv-description">
                  Our vision is to become one of Africa&apos;s most trusted technology partners: a team known not only for technical skill, but for honesty, care, and solutions that continue working long after launch day.
                </p>
                <p className="mvv-description">
                  We imagine a future where startups, schools, shops, growing companies, and established organizations
                  can access professional technology without feeling locked out by complexity. Good technology should
                  help people compete, create, and serve better.
                </p>
              </div>
            </motion.div>

            {/* Core Values */}
            <motion.div 
              className="mvv-card values-card"
              variants={fadeInUp}
              whileHover={{ 
                y: -10,
                boxShadow: "0 30px 60px rgba(245, 158, 11, 0.25)",
                transition: { duration: 0.3 }
              }}
            >
              <div className="mvv-header">
                <div className="mvv-icon-wrapper values-icon">
                  <span className="mvv-icon">{"\u2B50"}</span>
                </div>
                <h3>Core Values</h3>
              </div>
              <div className="mvv-content">
                <p className="mvv-lead">
                  The standards we bring to every relationship
                </p>
                <div className="core-values-list">
                  <motion.div 
                    className="value-item"
                    whileHover={{ x: 8, transition: { duration: 0.2 } }}
                  >
                    <div className="value-icon-circle innovation-circle">
                      <span className="value-emoji">{"\uD83D\uDCA1"}</span>
                    </div>
                    <div className="value-content">
                      <h4>Innovation</h4>
                      <p>We stay curious and practical, choosing ideas that genuinely improve the way people work, connect, and solve problems.</p>
                    </div>
                  </motion.div>
                  <motion.div 
                    className="value-item"
                    whileHover={{ x: 8, transition: { duration: 0.2 } }}
                  >
                    <div className="value-icon-circle excellence-circle">
                      <span className="value-emoji">{"\uD83C\uDFC6"}</span>
                    </div>
                    <div className="value-content">
                      <h4>Excellence</h4>
                      <p>We care about the details: clean design, stable systems, clear communication, and work we can proudly stand behind.</p>
                    </div>
                  </motion.div>
                  <motion.div 
                    className="value-item"
                    whileHover={{ x: 8, transition: { duration: 0.2 } }}
                  >
                    <div className="value-icon-circle integrity-circle">
                      <span className="value-emoji">{"\uD83E\uDD1D"}</span>
                    </div>
                    <div className="value-content">
                      <h4>Integrity</h4>
                      <p>We tell the truth, protect client trust, and make decisions that are fair, transparent, and responsible.</p>
                    </div>
                  </motion.div>
                  <motion.div 
                    className="value-item"
                    whileHover={{ x: 8, transition: { duration: 0.2 } }}
                  >
                    <div className="value-icon-circle impact-circle">
                      <span className="value-emoji">{"\uD83C\uDF0D"}</span>
                    </div>
                    <div className="value-content">
                      <h4>Impact</h4>
                      <p>We build for outcomes that matter: stronger businesses, safer processes, better access, and lasting value for communities.</p>
                    </div>
                  </motion.div>
                  <motion.div 
                    className="value-item"
                    whileHover={{ x: 8, transition: { duration: 0.2 } }}
                  >
                    <div className="value-icon-circle collaboration-circle">
                      <span className="value-emoji">{"\uD83D\uDC65"}</span>
                    </div>
                    <div className="value-content">
                      <h4>Collaboration</h4>
                      <p>We work with clients, not around them. The best solutions come from listening, sharing ideas, and building together.</p>
                    </div>
                  </motion.div>
                  <motion.div 
                    className="value-item"
                    whileHover={{ x: 8, transition: { duration: 0.2 } }}
                  >
                    <div className="value-icon-circle customer-circle">
                      <span className="value-emoji">{"\uD83C\uDFAF"}</span>
                    </div>
                    <div className="value-content">
                      <h4>Client Care</h4>
                      <p>We treat every client&apos;s project with attention and respect, because good service should feel human from start to finish.</p>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Team Section - Showcasing our talented team members */}
        <motion.div 
          className="team-section"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.h3 variants={fadeInUp}>Meet Our Team</motion.h3>
          
          <motion.div 
            className="team-grid"
            variants={staggerContainer}
          >
            {/* Map through team members and display their cards */}
            {teamMembers.map((member, index) => (
              <motion.div 
                key={index}
                className="team-member"
                variants={fadeInUp}
                whileHover={{ 
                  y: -10,
                  boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
                  transition: { duration: 0.3 }
                }}
              >
                {/* Team member profile image with hover effect */}
                <div className="member-image">
                  <motion.img 
                    src={member.image} 
                    alt={member.name}
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                
                {/* Team member details and information */}
                <div className="member-info">
                  <h4>{member.name}</h4>
                  <p className="member-role">{member.role}</p>
                  
                  {/* Professional bio section */}
                  <div className="member-bio">
                    <p>{member.bio}</p>
                  </div>
                  
                  {/* Skills label */}
                  <div className="member-skills-label">
                    <span className="skills-title">Skills:</span>
                  </div>
                  
                  {/* Display member skills as tags */}
                  <motion.div 
                    className="member-skills"
                    initial={{ opacity: 1 }}
                  >
                    {member.skills.map((skill, skillIndex) => (
                      <motion.span 
                        key={skillIndex}
                        className="skill-tag"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.2 }}
                      >
                        {skill}
                      </motion.span>
                    ))}
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default About;

