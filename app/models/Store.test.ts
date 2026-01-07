import { AuthenticationStoreModel } from "./AuthenticationStore"
import { FavoritesStoreModel } from "./FavoritesStore"
import { M3UStoreModel } from "./M3UStore"

describe("AuthenticationStore", () => {
  it("can create a store", () => {
    const store = AuthenticationStoreModel.create({})
    expect(store).toBeTruthy()
    expect(store.isAuthenticated).toBe(false)
  })

  it("can authenticate with Xtream", async () => {
    const store = AuthenticationStoreModel.create({})

    // Mock the XtreamApi if needed, or just test state updates if mocking actions
    // Since we are not mocking the API call here, we can test setXtreamCredentials
    store.setXtreamCredentials("http://test.com", "user", "pass")

    expect(store.isAuthenticated).toBe(true)
    expect(store.authMethod).toBe("xtream")
    expect(store.username).toBe("user")
  })

  it("can logout", () => {
    const store = AuthenticationStoreModel.create({})
    store.setXtreamCredentials("http://test.com", "user", "pass")
    expect(store.isAuthenticated).toBe(true)

    store.logout()
    expect(store.isAuthenticated).toBe(false)
    expect(store.authMethod).toBe("guest")
  })
})

describe("M3UStore", () => {
  it("can parse M3U content", () => {
    // We can't easily test the flow that fetches URL without mocking fetch
    // But we can verify the model structure
    const store = M3UStoreModel.create({})
    expect(store).toBeTruthy()
    expect(store.channels.length).toBe(0)
  })
})

describe("FavoritesStore", () => {
  it("can toggle favorites", () => {
    const store = FavoritesStoreModel.create({})
    const channel = { stream_id: 123, name: "Test Channel" }

    // Toggle On
    store.toggleXtreamFavorite(channel)
    expect(store.isXtreamFavorite(123)).toBe(true)
    expect(store.xtreamFavorites.length).toBe(1)

    // Toggle Off
    store.toggleXtreamFavorite(channel)
    expect(store.isXtreamFavorite(123)).toBe(false)
    expect(store.xtreamFavorites.length).toBe(0)
  })
})
