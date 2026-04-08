import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { MapView } from './components/MapView'
import { RightPanel } from './components/RightPanel'
import { Toast } from './components/Toast'
import { HelpModal } from './components/HelpModal'
import { Dashboard } from './components/Dashboard'
import { FieldDetailPanel } from './components/FieldDetailPanel'
import { CalendarPanel } from './components/CalendarPanel'
import { ActivityForm } from './components/ActivityForm'

export default function App() {
  return (
    <div className="h-screen grid grid-rows-[52px_1fr] grid-cols-[320px_1fr_280px] overflow-hidden">
      <Header />
      <Sidebar />
      <MapView />
      <RightPanel />
      <Toast />
      <HelpModal />
      <Dashboard />
      <FieldDetailPanel />
      <CalendarPanel />
      <ActivityForm />
    </div>
  )
}
