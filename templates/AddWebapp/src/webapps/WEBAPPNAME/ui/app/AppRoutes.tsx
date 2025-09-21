import * as R from "react"
import {ErrorBoundary, FallbackProps} from "react-error-boundary"
import {Routes, Route, BrowserRouter} from "react-router-dom"
import {Layout} from "../layouts/Layout"
import {DashboardLayout} from "../layouts/DashboardLayout"
import {NotFound} from "../pages/NotFound"
import {ErrorPage} from "../pages/ErrorPage"
import {About} from "../pages/About"
import {SampleResources} from "../pages/SampleResources"
import {DashboardStats} from "../pages/DashboardStats"

export const AppRoutes = () => {
  return (
    <>
      <ErrorBoundary
        FallbackComponent={AppErrorFallback}
        onReset={(/*details*/) => {}}
      >
        <Routes>
          <Route path="/" element={<Layout />} errorElement={<ErrorPage />}>
            <Route path="/about" element={<About />} />
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route path="stats" element={<DashboardStats />} />
            </Route>
            <Route path="/sampleResources" element={<SampleResources />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </ErrorBoundary>
    </>
  )
}

const AppErrorFallback: R.FC<FallbackProps> = ({
  error /*, resetErrorBoundary*/,
}) => {
  // Call resetErrorBoundary() to reset the error boundary and retry the render.
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre style={{color: "red"}}>{error.message}</pre>
    </div>
  )
}
