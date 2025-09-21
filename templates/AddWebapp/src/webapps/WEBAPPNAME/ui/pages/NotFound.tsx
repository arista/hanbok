import {Link} from "react-router-dom"

export const NotFound = () => {
  return (
    <div className="text-center mt-20">
      <h1 className="text-5xl font-bold text-red-500">404</h1>
      <p className="mt-4 text-lg">Page not found.</p>
      <Link to="/" className="text-blue-500 underline mt-6 inline-block">
        Back to Home
      </Link>
    </div>
  )
}
