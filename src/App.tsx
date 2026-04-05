import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { MapView } from './components/MapView'
import { Toast } from './components/Toast'
import { HelpModal } from './components/HelpModal'
import { Dashboard } from './components/Dashboard'

export default function App() {
  return (
    <div className="h-screen grid grid-rows-[52px_1fr] grid-cols-[360px_1fr] overflow-hidden">
      <Header />
      <Sidebar />
      <MapView />
      <Toast />
      <HelpModal />
      <Dashboard />
    </div>
  )
}
