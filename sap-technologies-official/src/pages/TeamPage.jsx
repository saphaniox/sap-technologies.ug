import { Link } from "react-router-dom";
import { AdPlacement } from "../components/AdNetwork";
import "../styles/TeamPage.css";

const teamMembers = [
  {
    name: "Saphan Muganza",
    role: "Founder, CEO & Full-Stack Engineer",
    image: "/images/me.jpg",
    bio: "I enjoy turning a rough idea into something people can use. My work spans software, electrical engineering, and automation, while I lead how we plan and deliver each project.",
    focus: ["Product direction", "Full-stack engineering", "Electrical systems", "Automation"]
  },
  {
    name: "Samuel Nkunda",
    role: "UI/UX & Frontend Developer",
    image: "/images/me2.jpg",
    bio: "I focus on the part people use every day: the interface. I build web and mobile experiences that feel clear, responsive, and easy to navigate.",
    focus: ["User experience", "Frontend development", "React", "Mobile applications"]
  },
  {
    name: "Roberto Delgado",
    role: "Creative Designer",
    image: "/images/me3.jpg",
    bio: "I help businesses communicate clearly through thoughtful visual identity and digital design. I care about making each brand feel consistent and recognizably its own.",
    focus: ["UI/UX design", "Graphic design", "Brand identity"]
  }
];

const workingPrinciples = [
  {
    number: "01",
    title: "Listen before we build",
    description: "We start with the people, constraints, and everyday tasks behind the brief."
  },
  {
    number: "02",
    title: "Make the complex clear",
    description: "We explain options in plain language and shape the work around what is useful."
  },
  {
    number: "03",
    title: "Stay accountable",
    description: "We keep communication open from the first plan through delivery and support."
  }
];

const TeamPage = () => (
  <div className="team-page">
    <div className="team-page__inner">
      <section className="team-page__intro" aria-labelledby="team-page-title">
        <div className="team-page__intro-copy">
          <p className="team-page__eyebrow">The people behind Saptech</p>
          <h1 id="team-page-title">Good technology starts with understanding people.</h1>
          <p className="team-page__lead">
            We are a multidisciplinary team in Uganda bringing software, engineering,
            automation, and design together to solve practical problems.
          </p>
        </div>
        <aside className="team-page__intro-note" aria-label="Our areas of work">
          <p className="team-page__note-label">What we bring together</p>
          <ul>
            <li>Software and digital products</li>
            <li>Electrical and connected systems</li>
            <li>Design and clear communication</li>
          </ul>
        </aside>
      </section>

      <AdPlacement placement="pageTop" className="team-page__ad" />

      <section className="team-page__people" aria-labelledby="team-people-title">
        <div className="team-page__section-heading">
          <div>
            <p className="team-page__eyebrow">Meet the team</p>
            <h2 id="team-people-title">Different strengths. One shared responsibility.</h2>
          </div>
          <p>
            We each bring a different perspective, and work closely so the final
            solution feels joined up for the people who depend on it.
          </p>
        </div>

        <div className="team-page__profiles">
          {teamMembers.map((member) => (
            <article className="team-profile" key={member.name}>
              <div className="team-profile__photo">
                <img src={member.image} alt={`${member.name}, ${member.role}`} loading="lazy" />
              </div>
              <div className="team-profile__content">
                <p className="team-profile__role">{member.role}</p>
                <h3>{member.name}</h3>
                <p className="team-profile__bio">{member.bio}</p>
                <div className="team-profile__focus">
                  <p>Areas of focus</p>
                  <ul>
                    {member.focus.map((area) => <li key={area}>{area}</li>)}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="team-page__approach" aria-labelledby="team-approach-title">
        <div className="team-page__approach-heading">
          <p className="team-page__eyebrow">How we work</p>
          <h2 id="team-approach-title">Thoughtful work, without the jargon.</h2>
        </div>
        <ol className="team-page__principles">
          {workingPrinciples.map((principle) => (
            <li key={principle.number}>
              <span className="team-page__principle-number">{principle.number}</span>
              <div>
                <h3>{principle.title}</h3>
                <p>{principle.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="team-page__contact" aria-labelledby="team-contact-title">
        <div>
          <p className="team-page__eyebrow">Let&apos;s talk</p>
          <h2 id="team-contact-title">Have a challenge you are working through?</h2>
          <p>Tell us what you need to make easier. We&apos;ll help you find a practical next step.</p>
        </div>
        <Link className="team-page__contact-link" to="/contact">
          Contact our team <span aria-hidden="true">-&gt;</span>
        </Link>
      </section>
    </div>
  </div>
);

export default TeamPage;