/**
 * Portfolio Component
 * 
 * Displays our featured projects and showcases what we have built for clients.
 * Shows default projects immediately and loads additional projects from the API.
 */
import React, { useState, useEffect } from "react";
import Background3D from "./Background3D";
import apiService from "../services/api";
import "../styles/Portfolio.css";

const Portfolio = () => {
  // Manage projects loaded from the database API
  const [apiProjects, setApiProjects] = useState([]);
  
  // Track loading state while fetching projects from the server
  const [loading, setLoading] = useState(true);
  
  // Store any errors that occur during project fetching
  const [error, setError] = useState(null);

  /**
   * Default Portfolio Projects
   * 
   * These projects are always shown to visitors, ensuring the page
   * has content even if the API is slow or unavailable. This provides
   * a better user experience and showcases our core capabilities.
   */
  const defaultPortfolioItems = [
    {
      title: "E-Commerce Platform",
      image: "/images/ecommerce-platform.jpg",
      description: "Full-featured online store with shopping cart, payments, and admin dashboard.",
      techStack: ["React", "Node.js", "Express", "MongoDB"]
    },
    {
      title: "Business Website", 
      image: "/images/business-platform.jpg",
      description: "Responsive company site with blog, contact forms, and SEO optimization.",
      techStack: ["HTML", "CSS", "JavaScript", "Node.js"]
    },
    {
      title: "Graphics & Branding",
      image: "/images/GRAPHICS-DESIGN.jpg", 
      description: "Custom logo and brand identity design for startups and businesses.",
      techStack: ["Photoshop", "Illustrator","capcut", "Figma"]
    },
    {
      title: "IoT Dashboard",
      image: "/images/iot2.jpg",
      description: "Real-time monitoring and control dashboard for smart devices and sensors.",
      techStack: ["React", "Node.js", "Socket.io","MongoDB"]
    },
    {
      title: "School Management System",
      image: "/images/school-management.jpg",
      description: "Comprehensive platform for managing students, staff, classes, and results.",
      techStack: ["React", "Node.js", "MongoDB", "Express"]
    },
    {
      title: "Mobile Banking App",
      image: "/images/mobile-app.jpg",
      description: "Secure mobile app for digital banking and transfers.",
      techStack: ["React Native", "Node.js", "MongoDB"]
    },
    {
      title: "Portfolio Website",
      image: "/images/portfolio-app.jpg", 
      description: "Modern and responsive portfolio website showcasing projects and skills.",
      techStack: ["React", "CSS3", "JavaScript"]
    },
    {
      title: "Chat Application",
      image: "/images/chat-app.jpg",
      description: "Real-time chat app with group messaging, file sharing, and notifications.",
      techStack: ["React", "Node.js", "Socket.io","MongoDB"]
    },
    {
      title: "Restaurant Ordering System",
      image: "/images/restaurant-ordering.jpg",
      description: "Touch-friendly web app for digital menus, table reservations, and order management.",
      techStack: ["Vue.js", "Node.js", "MongoDB", "SQL"]
    },
    {
      title: "Learning Management System",
      image: "/images/LMS.jpg",
      description: "Platform for online courses, quizzes, and student progress tracking.",
      techStack: ["React", "Node.js", "MongoDB", "Express"]
    },
    {
      title: "Inventory Management",
      image: "/images/inventory-management.jpg",
      description: "Smart inventory tracking system with automated alerts and reporting features.",
      techStack: ["React", "Node.js", "MySQL", "Express"]
    },
    {
      title: "Event Booking Platform",
      image: "/images/event-booking.jpg",
      description: "Complete event management platform with booking, payments, and attendee management.",
      techStack: ["React", "Node.js", "MongoDB", "Stripe"]
    }
  ];

  // Load additional projects from the API when component mounts
  useEffect(() => {
    fetchProjects();
  }, []);

  /**
   * Fetch Projects from API
   * 
   * Loads additional projects created through the admin dashboard.
   * If the API call fails, we show an error but still display default projects.
   */
  const fetchProjects = async () => {
    try {
      // Start loading and clear any previous errors
      setLoading(true);
      setError(null);
      
      // Request projects from the backend API
      const response = await apiService.getPublicProjects();
      
      // Check if we got valid project data
      if (response.success && response.data.projects.length > 0) {
        // Transform API data into consistent format
        const transformedProjects = response.data.projects.map(project => ({
          title: project.title,
          image: project.image || "/images/portfolio-app.jpg", // Fallback image
          description: project.description,
          techStack: Array.isArray(project.techStack) ? project.techStack : []
        }));
        
        setApiProjects(transformedProjects);
      } else {
        // No projects found, set empty array
        setApiProjects([]);
      }
    } catch (error) {
      // Log error for debugging and show user-friendly message
      console.error("Error fetching projects:", error);
      setError("Failed to load custom projects");
      setApiProjects([]);
    } finally {
      // Always stop loading, whether successful or not
      setLoading(false);
    }
  };

  return (
    <section id="portfolio" className="portfolio">
      <Background3D className="portfolio-3d-background" />
      <div className="container">
        <h2>Our Featured Projects</h2>
        <div className="portfolio-intro">
          <p className="intro-main">
            We are highly motivated and detail-oriented full-stack developers specializing in designing, 
            developing, and deploying scalable web applications and software solutions. Based in Kampala, Uganda, 
            our passionate team is committed to delivering high-quality code that meets the highest standards 
            of performance and excellence.
          </p>
          
          <div className="tech-stacks">
            <div className="tech-category">
              <h4>Frontend Technologies</h4>
              <p>HTML5, CSS3, JavaScript, React, Angular, Vue.js, Svelte</p>
            </div>
            
            <div className="tech-category">
              <h4>Backend Technologies</h4>
              <p>Node.js, Python, Ruby on Rails, Java, PHP, C#</p>
            </div>
            
            <div className="tech-category">
              <h4>Databases & Tools</h4>
              <p>MySQL, MongoDB, PostgreSQL, SQL Server, Git, GitHub</p>
            </div>
          </div>
          
          <p className="intro-experience">
            Our portfolio includes e-commerce platforms, business websites, custom software applications, 
            and innovative IoT solutions. We stay current with the latest trends and technologies, 
            ensuring we deliver exceptional results that help our clients achieve their goals.
          </p>
          
          <p className="intro-cta">
            Explore our featured projects below to see what we can create for you.
          </p>
        </div>

        {/* Show loading spinner while fetching additional projects */}
        {loading && (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading additional projects...</p>
          </div>
        )}

        {/* Display error message if project fetching fails */}
        {error && (
          <div className="error-state">
            <p>⚠️ {error}</p>
          </div>
        )}

        {/* Main Portfolio Gallery - Always visible default projects */}
        <div className="portfolio-gallery">
          {defaultPortfolioItems.map((item, index) => (
            <div 
              key={index} 
              className="portfolio-card" 
              data-aos="fade-up" 
              data-aos-delay={index * 200}
            >
              {/* Project Image with gradient overlay */}
              <div className="portfolio-image">
                <img src={item.image} alt={item.title} />
                <div className="image-overlay"></div>
              </div>
              
              {/* Project Details - Always visible */}
              <div className="portfolio-content">
                <h3 className="project-title">{item.title}</h3>
                
                <p className="project-description">{item.description}</p>
                
                {/* Technology Stack Section */}
                <div className="tech-stack-section">
                  <h4 className="tech-stack-label">Technologies:</h4>
                  <div className="tech-stack">
                    {item.techStack.map((tech, techIndex) => (
                      <span key={techIndex} className="tech-tag">{tech}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Projects from API - Only shown if available */}
        {!loading && apiProjects.length > 0 && (
          <>
            <h3 className="custom-projects-title">Additional Projects</h3>
            <div className="portfolio-gallery custom-projects">
              {apiProjects.map((item, index) => (
                <div 
                  key={index} 
                  className="portfolio-card" 
                  data-aos="fade-up" 
                  data-aos-delay={index * 200}
                >
                  {/* Project Image */}
                  <div className="portfolio-image">
                    <img src={item.image} alt={item.title} />
                    <div className="image-overlay"></div>
                  </div>
                  
                  {/* Project Information */}
                  <div className="portfolio-content">
                    <h3 className="project-title">{item.title}</h3>
                    
                    <p className="project-description">{item.description}</p>
                    
                    {/* Technologies Used */}
                    <div className="tech-stack-section">
                      <h4 className="tech-stack-label">Technologies:</h4>
                      <div className="tech-stack">
                        {item.techStack.map((tech, techIndex) => (
                          <span key={techIndex} className="tech-tag">{tech}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default Portfolio;