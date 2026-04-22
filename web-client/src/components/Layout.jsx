import Navbar from "./Navbar"

export default function Layout({ children, wide = false }) {
  return (
    <div className="layout-wrapper">
      <Navbar />
      <main className={wide ? "container--wide" : "container"}>
        {children}
      </main>
    </div>
  )
}
