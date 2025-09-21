// Data supplied to the page by the server through the
// window.__PAGE_CONFIG__ variable
export type PageContext = {
  routesEndpoint: string
  routerBase: string
}

declare global {
  interface Window {
    __PAGE_CONTEXT__: PageContext
  }
}

export function getPageContext(): PageContext {
  const ret = window.__PAGE_CONTEXT__
  if (ret != null) {
    return ret
  } else {
    return {
      // FIXME - implement these
      routesEndpoint: "/",
      routerBase: "/",
    }
  }
}
