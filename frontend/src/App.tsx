import { Outlet } from 'react-router-dom'
import { useAuthListener } from './hooks/useAuthListener'

function App() {
  // Subscribe to Firebase auth state for the whole app.
  useAuthListener()

  return (
    <div className="min-h-screen">
      <main>
        <Outlet />
      </main>
    </div>
  )
}

export default App
