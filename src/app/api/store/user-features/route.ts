import { NextRequest, NextResponse } from "next/server";
import { createServerAuthClient } from "@/lib/supabase/server-auth";
import {
  addPriceWatch,
  addToWishlist,
  clearSearchHistory,
  deleteSearchHistoryItem,
  listPriceWatches,
  listSearchHistory,
  listWishlist,
  recordSearchHistory,
  removeFromWishlist,
  removePriceWatch,
} from "@/lib/store/user-features";

export async function GET(req: NextRequest) {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const type = req.nextUrl.searchParams.get("type") ?? "history";

  if (type === "wishlist") {
    return NextResponse.json({ items: await listWishlist(user.id) });
  }
  if (type === "price-watches") {
    return NextResponse.json({ items: await listPriceWatches(user.id) });
  }

  return NextResponse.json({ items: await listSearchHistory(user.id) });
}

export async function POST(req: NextRequest) {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    action?: string;
    productSlug?: string;
    productName?: string;
    catalogId?: string;
    imageUrl?: string;
    retailPriceCents?: number;
    variantId?: string;
  };

  const action = body.action;
  if (!action || !body.productSlug || !body.productName) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const item = {
    catalogId: body.catalogId ?? null,
    productSlug: body.productSlug,
    productName: body.productName,
    imageUrl: body.imageUrl ?? null,
    retailPriceCents: body.retailPriceCents ?? null,
    variantId: body.variantId ?? null,
  };

  if (action === "history") {
    await recordSearchHistory(user.id, item);
    return NextResponse.json({ ok: true });
  }

  if (action === "wishlist") {
    const wishlistItem = await addToWishlist(user.id, item);
    return NextResponse.json({ item: wishlistItem });
  }

  if (action === "price-watch") {
    if (body.retailPriceCents == null) {
      return NextResponse.json({ error: "retailPriceCents required" }, { status: 400 });
    }
    const watch = await addPriceWatch(user.id, {
      ...item,
      retailPriceCents: body.retailPriceCents,
    });
    return NextResponse.json({ item: watch });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const type = req.nextUrl.searchParams.get("type");
  const id = req.nextUrl.searchParams.get("id");

  if (type === "history" && id === "all") {
    await clearSearchHistory(user.id);
    return NextResponse.json({ ok: true });
  }

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  if (type === "history") {
    await deleteSearchHistoryItem(user.id, id);
    return NextResponse.json({ ok: true });
  }
  if (type === "wishlist") {
    await removeFromWishlist(user.id, id);
    return NextResponse.json({ ok: true });
  }
  if (type === "price-watches") {
    await removePriceWatch(user.id, id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown type" }, { status: 400 });
}
