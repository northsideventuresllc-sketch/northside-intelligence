import { getNavAuth } from "@/lib/auth/get-nav-auth";
import { Nav } from "@/components/landing/Nav";

export async function NavServer() {
  const { isLoggedIn, isMasterAccount } = await getNavAuth();

  return <Nav isLoggedIn={isLoggedIn} isMasterAccount={isMasterAccount} />;
}
