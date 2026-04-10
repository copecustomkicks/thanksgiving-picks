export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full bg-stone-100 text-stone-900">{children}</div>
  );
}
