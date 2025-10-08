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
      name: "SAPHAN M PETRS",
      role: "Founder, CEO & full-stack Engineer",
      image: "/images/me.jpg",
      bio: "Full-stack engineer and entrepreneur with a passion for innovative technology solutions.",
      skills: ["Leadership", "Strategy","Electrical", "Automation", "Full-Stack Engineering"]
    },
    {
      name: "SANE NB CODER",
      role: "UI, UX & Frontend Developer",
      image: "/images/me2.jpg", 
      bio: "Skilled developer specializing in modern web technologies and mobile applications.",
      skills: ["React", "Node.js", "Mobile Apps","Electrical"]
    },
    {
      name: "ROBERTO DL",
      role: "Creative Designer",
      image: "/images/me3.jpg",
      bio: "Creative professional focused on delivering exceptional user experiences and visual design.",
      skills: ["UI/UX", "Graphics", "Branding"]
    }
  ];

  // Company statistics to showcase our achievements and capabilities
  const stats = [
    { number: "50+", label: "Projects Completed", icon: "📊" },
    { number: "100%", label: "Client Satisfaction", icon: "⭐" },
    { number: "3+", label: "Years Experience", icon: "🚀" },
    { number: "24/7", label: "Support Available", icon: "💬" }
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
                At SAP-Technologies, we believe technology is the catalyst for progress and transformation. Founded in the heart of Kampala, we are more than just a tech company—we are visionaries, innovators and partners in your success. Our multidisciplinary team blends creativity, engineering excellence and deep industry expertise to deliver world-class solutions in web design, branding, electrical engineering, electronic circuits and custom software.
            </p>
                        <p>
              Our team of experienced professionals combines creativity with technical 
              expertise to create solutions that not only meet but exceed our clients&apos; 
              expectations. We believe in the power of technology to transform businesses 
              and improve lives.
            </p>
            <p>
                We are driven by a passion to empower businesses, entrepreneurs and communities across Uganda and beyond. Every project is an opportunity to inspire, to solve real-world challenges and to elevate our clients to new heights. With a relentless commitment to quality, integrity and innovation, SAP Technologies is shaping the digital future of Africa—one idea, one solution, one success story at a time.
            </p>
            <p>
                <em>Let’s build the future together.</em>
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
                  <div className="stat-icon">{stat.icon}</div>
                  <div className="stat-number">{stat.number}</div>
                  <div className="stat-label">{stat.label}</div>
                </motion.div>
              ))}
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
