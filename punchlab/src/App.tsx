import { BrowserRouter, HashRouter, MemoryRouter, Navigate, Route, Routes } from 'react-router-dom'
import { DrillScreen } from './screens/DrillScreen'
import { HomeScreen } from './screens/HomeScreen'
import { JournalScreen } from './screens/JournalScreen'
import { JudgeScreen } from './screens/JudgeScreen'
import { PromptScreen } from './screens/PromptScreen'
import { SessionDetailScreen } from './screens/SessionDetailScreen'
import { SessionsScreen } from './screens/SessionsScreen'

/**
 * memory: embedded previews (sandboxed iframe) that can't use URL paths.
 * hash:   static hosts without SPA fallback (GitHub Pages), so reloading any screen works.
 * browser (default): dev server and hosts that serve index.html for every path.
 */
const ROUTERS = { memory: MemoryRouter, hash: HashRouter, browser: BrowserRouter } as const
const Router = ROUTERS[import.meta.env.VITE_ROUTER ?? 'browser']

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/prompt" element={<PromptScreen />} />
        <Route path="/drill/:id" element={<DrillScreen />} />
        <Route path="/judge/:id" element={<JudgeScreen />} />
        <Route path="/sessions" element={<SessionsScreen />} />
        <Route path="/sessions/:id" element={<SessionDetailScreen />} />
        <Route path="/journal" element={<JournalScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}
