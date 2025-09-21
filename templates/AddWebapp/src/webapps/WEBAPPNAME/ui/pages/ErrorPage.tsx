import {useRouteError, isRouteErrorResponse, Link} from "react-router-dom"

export const ErrorPage = () => {
  const error = useRouteError()
  console.error(error)

  const message = (() => {
    if (isRouteErrorResponse(error)) {
      return `${error.status} ${error.statusText}`
    } else if (error instanceof Error) {
      return error.message
    } else {
      return "An unexpected error occurred."
    }
  })()

  return (
    <div className="text-center mt-20">
      <h1 className="text-4xl font-bold text-red-500 mb-4">
        Something went wrong
      </h1>
      <p className="mb-4 text-gray-700">{message}</p>
      <Link to="/" className="text-blue-500 underline">
        Return to Home
      </Link>
    </div>
  )
}
