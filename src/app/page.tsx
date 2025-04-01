import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center p-6 text-center">
      <div className="max-w-2xl">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
          Play Chess Online
        </h1>
        <p className="mb-8 text-lg leading-8 text-gray-600 dark:text-gray-300">
          Join millions of players worldwide in the ultimate chess experience. Play, learn, and connect with chess enthusiasts from around the globe.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link
            href="/play"
            className="rounded-md bg-indigo-600 px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Play Now
          </Link>
          <Link
            href="/learn"
            className="rounded-md bg-white px-6 py-3 text-lg font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-white dark:ring-gray-700 dark:hover:bg-gray-700"
          >
            Learn Chess
          </Link>
        </div>
        
        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: 'Live Games',
              description: 'Play real-time chess with players worldwide',
              icon: '♟️',
            },
            {
              title: 'Training',
              description: 'Improve your skills with puzzles and lessons',
              icon: '🎯',
            },
            {
              title: 'Analysis',
              description: 'Review your games with powerful tools',
              icon: '📊',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700"
            >
              <div className="mb-4 text-4xl">{feature.icon}</div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {feature.title}
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
