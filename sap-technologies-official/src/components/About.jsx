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
                  Empowering Africa Through Innovation & Excellence
                </p>
                <p className="mvv-description">
                  We are dedicated to transforming businesses and communities across Uganda and Africa through 
                  cutting-edge technology solutions. Our mission encompasses delivering world-class web design, 
                  strategic branding, advanced electrical engineering, and bespoke software development that 
                  converts visionary ideas into tangible realities.
                </p>
                <p className="mvv-description">
                  By fostering innovation, maintaining unwavering quality standards, and building lasting 
                  partnerships, we create sustainable value that propels our clients toward unprecedented growth 
                  and competitive advantage in the digital economy.
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
                  Africa's Premier Technology Innovation Partner
                </p>
                <p className="mvv-description">
                  We aspire to be the foremost technology partner across Africa, distinguished by our unwavering commitment to innovation, creative excellence, and technical mastery. Our vision extends beyond mere service delivery - we seek to fundamentally transform how businesses operate in the digital era.
                </p>
                <p className="mvv-description">
                  We envision an inclusive technological landscape where every enterprise - from ambitious startups to established industry leaders - has seamless access to sophisticated, cutting-edge solutions that empower them to compete on the global stage, drive meaningful impact, and flourish in an increasingly interconnected world.
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
                  Principles That Define Our Excellence
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
                      <p>Continuously pushing technological boundaries, embracing transformative ideas, and pioneering solutions that redefine industry standards.</p>
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
                      <p>Maintaining uncompromising quality standards, meticulous attention to detail, and an unwavering commitment to delivering exceptional results.</p>
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
                      <p>Operating with absolute honesty, transparency, and ethical accountability in every interaction and decision we make.</p>
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
                      <p>Creating meaningful, sustainable solutions that drive positive change, empower communities, and contribute to Africa's digital transformation.</p>
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
                      <p>Fostering strategic partnerships, embracing diverse perspectives, and leveraging collective expertise to achieve extraordinary outcomes.</p>
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
                      <h4>Customer-Centricity</h4>
                      <p>Placing client success at the heart of everything we do, understanding unique needs, and delivering tailored solutions that exceed expectations.</p>
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

