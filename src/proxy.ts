import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

// Next.js 16: convención `proxy` (reemplaza a `middleware`).
// Refresca la sesión y protege las rutas bajo /app.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { pathname } = request.nextUrl;
  // Comparación por segmento (no por prefijo de string): startsWith("/app")
  // también casaría "/apple-icon" y mandaría el ícono PWA al login.
  const isProtected = ["/app", "/portal", "/admin"].some(
    (base) => pathname === base || pathname.startsWith(`${base}/`),
  );
  const isAuthRoute = pathname === "/login";

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value),
            );
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user && isProtected) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    if (user && isAuthRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/"; // el resolver decide /app o /portal
      return NextResponse.redirect(url);
    }
  } catch {
    // Si Supabase falla en una ruta protegida, fallamos seguro hacia /login
    // (en vez de dejar pasar). El layout de /app es la segunda capa.
    if (isProtected) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
