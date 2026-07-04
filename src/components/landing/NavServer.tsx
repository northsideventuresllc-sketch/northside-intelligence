import { getNavAuth } from "@/lib/auth/get-nav-auth";
import { Nav } from "@/components/landing/Nav";

export async function NavServer() {
  const { isLoggedIn, isMasterAccount, unreadNotificationCount, portalUsername } =
    await getNavAuth();

  return (
    <Nav
      isLoggedIn={isLoggedIn}
      isMasterAccount={isMasterAccount}
      unreadNotificationCount={unreadNotificationCount}
      portalUsername={portalUsername}
    />
  );
}
