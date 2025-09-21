import {Outlet} from "react-router-dom"
import {Navbar} from "../components/Navbar"

export const Layout = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="p-6">
        <Outlet />
      </div>
    </div>
  )
}
