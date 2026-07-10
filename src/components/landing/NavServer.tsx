import { getNavAuth } from "@/lib/auth/get-nav-auth";
import { Nav } from "@/components/landing/Nav";

export async function NavServer() {
  const { isLoggedIn, canEnterAxonDash, unreadNotificationCount, portalUsername } =
    await getNavAuth();

  return (
    <Nav
      isLoggedIn={isLoggedIn}
      canEnterAxonDash={canEnterAxonDash}
      unreadNotificationCount={unreadNotificationCount}
      portalUsername={portalUsername}
    />
  );
}
