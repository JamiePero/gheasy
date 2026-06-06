import Page from '../components/Page.jsx'
import Button from '../components/Button.jsx'
import { HomeIcon } from '../components/icons.jsx'

export default function NotFound() {
  return (
    <Page className="wrap-tight grid min-h-[70vh] place-items-center text-center">
      <div>
        <p className="font-display text-7xl font-bold text-gradient">404</p>
        <h1 className="mt-4 text-2xl font-bold">Page not found</h1>
        <p className="mt-2 text-muted">That page took a data break. Let’s get you back home.</p>
        <Button to="/" className="mt-8" icon={<HomeIcon className="h-5 w-5" />}>
          Back home
        </Button>
      </div>
    </Page>
  )
}
