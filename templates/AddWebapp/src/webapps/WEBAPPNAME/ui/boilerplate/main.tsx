import {StrictMode} from "react"
import {BrowserRouter} from "react-router-dom"
import {createRoot} from "react-dom/client"
import {Webapp} from "../app/Webapp"
import {ViewEnvContext} from "../app/useViewEnv"
import "./index.css"
import App from "../app/App"

const webapp = new Webapp({})

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename={webapp.pageContext.routerBase}>
      <ViewEnvContext.Provider value={webapp.viewEnv}>
        <App />
      </ViewEnvContext.Provider>
    </BrowserRouter>
  </StrictMode>
)
