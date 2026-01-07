import { createContext, useContext, useEffect, useState } from "react"

import { RootStore, RootStoreModel } from "../RootStore"
import { setupRootStore } from "./setupRootStore"

/**
 * Create a context we can use to
 * - Initialize the store
 * - Share the store
 */
const RootStoreContext = createContext<RootStore | undefined>(undefined)

/**
 * The provider our app will wrap.
 */
export const RootStoreProvider = ({ children }: { children: React.ReactNode }) => {
  const [rootStore, setRootStore] = useState<RootStore | undefined>(undefined)

  useEffect(() => {
    ;(async () => {
      const store = RootStoreModel.create({})
      await setupRootStore(store)
      setRootStore(store)
    })()
  }, [])

  if (!rootStore) return null

  return <RootStoreContext.Provider value={rootStore}>{children}</RootStoreContext.Provider>
}

/**
 * A hook that screens can use to gain access to our stores, with
 * `const { someStore, someOtherStore } = useStores()`
 * or less likely:
 * `const rootStore = useStores()`
 */
export const useStores = () => {
  const context = useContext(RootStoreContext)

  if (context === undefined) {
    throw new Error("useStores must be used within a RootStoreProvider")
  }

  return context
}
