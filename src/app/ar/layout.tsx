/**
 * AR layout: completely isolated from the normal website.
 *
 * No Navbar. No Footer. No normal page structure.
 * The AR experience must own the entire viewport.
 */
export default function ARLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
