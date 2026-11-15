import { Link } from 'react-router-dom'

const columns = [
  {
    title: 'Platform',
    links: [
      { to: '/about', label: 'About Us' },
      { to: '/how-it-works', label: 'How It Works' },
      { to: '/explore', label: 'Explore Stories' },
      { to: '/groups', label: 'Community Groups' },
    ],
  },
  {
    title: 'Safety',
    links: [
      { to: '/safety', label: 'Safety & Crisis Support' },
      { to: '/guidelines', label: 'Community Guidelines' },
      { to: '/resources', label: 'Support Resources' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { to: '/privacy', label: 'Privacy Policy' },
      { to: '/data-retention', label: 'Data Retention' },
      { to: '/account-deletion', label: 'Account Deletion' },
      { to: '/cookies', label: 'Cookie Policy' },
      { to: '/terms', label: 'Terms and Conditions' },
      { to: '/contact', label: 'Contact Us' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-surface-muted bg-surface/60">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2 text-lg font-bold text-primary-700">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary-500 text-sm text-white">
                RY
              </span>
              Restart Yourself
            </Link>
            <p className="mt-3 max-w-xs text-sm text-text-secondary">
              Your Story Matters. Your Journey Isn't Over.
            </p>
          </div>
          {columns.map((column) => (
            <div key={column.title}>
              <h4 className="text-sm font-semibold text-text-primary">{column.title}</h4>
              <ul className="mt-3 flex flex-col gap-2">
                {column.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-text-secondary hover:text-text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 border-t border-surface-muted pt-6 text-xs text-text-muted">
          <p>
            Restart Yourself is a peer support community. It is not a crisis service, emergency
            response provider, or substitute for professional mental healthcare. If you are in
            immediate danger, please contact your local emergency services.
          </p>
          <p className="mt-2">© {new Date().getFullYear()} Restart Yourself. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
