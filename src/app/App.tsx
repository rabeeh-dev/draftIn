import { Providers } from './providers'
import { AppLayout } from '@/components/layout/AppLayout'
import { Editor } from '@/features/editor/components/Editor'

export default function App() {
  return (
    <Providers>
      <AppLayout>
        <Editor />
      </AppLayout>
    </Providers>
  )
}
