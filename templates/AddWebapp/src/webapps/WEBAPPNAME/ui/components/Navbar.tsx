import {Link} from "react-router-dom"
import SampleApp from "../assets/SampleApp.png"

export const Navbar = () => {
  return (
    <>
      <img src={SampleApp} />
      <nav className="bg-white shadow px-6 py-4 flex gap-4">
        <Link to="/" className="hover:underline">
          Home
        </Link>
        <Link to="/about" className="hover:underline">
          About
        </Link>
        <Link to="/dashboard/stats" className="hover:underline">
          Dashboard
        </Link>
        <Link to="/sampleResources" className="hover:underline">
          Sample Resources
        </Link>
      </nav>
    </>
  )
}
