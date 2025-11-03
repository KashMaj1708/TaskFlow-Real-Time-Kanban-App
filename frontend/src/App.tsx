import { Outlet } from 'react-router-dom'

function App() {
  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100">
      {/* We will add a Header/Navbar component here later */}
      <main>
        <Outlet />
      </main>
    </div>
  )
}

export default App