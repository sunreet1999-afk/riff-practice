import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { DrillScreen } from './screens/DrillScreen'
import { HomeScreen } from './screens/HomeScreen'
import { JudgeScreen } from './screens/JudgeScreen'
import { PromptScreen } from './screens/PromptScreen'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/prompt" element={<PromptScreen />} />
        <Route path="/drill/:id" element={<DrillScreen />} />
        <Route path="/judge/:id" element={<JudgeScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
