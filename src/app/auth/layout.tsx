export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Auth pages don't need the AppLayout - return children directly
  return <>{children}</>
}


