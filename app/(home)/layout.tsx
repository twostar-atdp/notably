
export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex bg-palette-background flex-col items-center justify-start w-full">
      {children}
    </main>
  );
}