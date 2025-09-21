import {Outlet, Link} from "react-router-dom"

export const DashboardLayout = () => {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Dashboard</h2>
      <nav className="mb-4">
        <Link to="stats" className="underline">
          Stats
        </Link>
      </nav>
      <Outlet />
    </div>
  )
}
