import { onSnapshot, applySnapshot } from "mobx-state-tree"

import { load, save } from "../../utils/storage"
import { RootStore } from "../RootStore"

const ROOT_STATE_STORAGE_KEY = "root-v1"

/**
 * Setup the environment that all the models will be sharing.
 *
 * The environment includes other functions that will be picked from some
 * of the models that get created later. This is how we loosely couple things
 * like events between models.
 */
export async function setupRootStore(rootStore: RootStore) {
  let restoredState: any

  try {
    // load the last known state from AsyncStorage
    restoredState = (await load(ROOT_STATE_STORAGE_KEY)) || {}
    applySnapshot(rootStore, restoredState)
  } catch {
    // if there's any problems loading, then let's at least fallback to an empty state
    // instead of crashing.
  }

  // track changes & save to storage
  onSnapshot(rootStore, (snapshot) => save(ROOT_STATE_STORAGE_KEY, snapshot))

  return rootStore
}
