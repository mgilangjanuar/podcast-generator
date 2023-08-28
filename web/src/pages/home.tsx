import { Link } from 'react-router-dom'

export default function Home() {
  return <div>
    <h3 className="text-2xl font-semibold">
      Podcast Generator
    </h3>
    <div className="mt-4">
      <Link to="/app" className="btn btn-primary">
        Go to App
      </Link>
    </div>
  </div>
}
