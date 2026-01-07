import { IStateTreeNode, SnapshotIn } from "mobx-state-tree"

/**
 * A helper to create an action that sets a property on the model.
 * This is useful for simple setters that don't need any side effects.
 *
 * @example
 * .actions(withSetPropAction)
 *
 * // later in your component
 * store.setProp("name", "New Name")
 */
export const withSetPropAction = () => ({
  setProp<T extends IStateTreeNode, K extends keyof SnapshotIn<T>>(
    this: T,
    prop: K,
    value: SnapshotIn<T>[K],
  ) {
    const self = this as any
    self[prop] = value
  },
})
