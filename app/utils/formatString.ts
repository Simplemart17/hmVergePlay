export const capitalizeFirstLetter = (txt: string | undefined) => {
  if (!txt) return ""
  return txt.charAt(0).toUpperCase() + txt.slice(1)
}
