import { Outlet } from 'react-router-dom'

function App() {
  return (
    <div className="min-h-screen">
      {/* We will add a Header/Navbar component here later */}
      <main>
        <Outlet />
      </main>
    </div>
  )
}

export default App