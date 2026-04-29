import Nav from './components/Nav'
import Hero from './sections/Hero'
import PastWork from './sections/PastWork'
import VibeCode from './sections/VibeCode'
import PersonalCaseStudies from './sections/PersonalCaseStudies'
import Hackathons from './sections/Hackathons'
import TechnicalProjects from './sections/TechnicalProjects'
import Experience from './sections/Experience'
import Education from './sections/Education'
import MoreAboutMe from './sections/MoreAboutMe'
import Contact from './sections/Contact'
import Footer from './components/Footer'

export default function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <hr className="divider" />
        <PastWork />
        <hr className="divider" />
        <VibeCode />
        <hr className="divider" />
        <PersonalCaseStudies />
        <hr className="divider" />
        <Hackathons />
        <hr className="divider" />
        <TechnicalProjects />
        <hr className="divider" />
        <Experience />
        <hr className="divider" />
        <Education />
        <hr className="divider" />
        <MoreAboutMe />
        <hr className="divider" />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
