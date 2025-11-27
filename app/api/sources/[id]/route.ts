import { supabaseAdmin } from "@/lib/supabase";
import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

// PATCH update RSS source (toggle active or edit)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { error } = await supabaseAdmin
      .from("rss_sources")
      // @ts-expect-error Update type requires all fields but we only update specific fields
      .update(body)
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating RSS source:", error);
    return NextResponse.json(
      { error: "Failed to update RSS source" },
      { status: 500 }
    );
  }
}

// DELETE RSS source (admin only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure we have an email to check admin status
    if (!user.email) {
      return NextResponse.json(
        { error: "User email not available" },
        { status: 400 }
      );
    }

    // Check if user is admin
    // `types/supabase.ts` may not include every DB function; cast the client
    // to a minimal shape (using `unknown`) to avoid `any` while keeping lint happy.
    const adminClient = supabaseAdmin as unknown as {
      rpc: (
        fn: string,
        args?: unknown
      ) => Promise<{ data: unknown; error: unknown }>;
    };

    const { data: isAdminResult } = await adminClient.rpc("is_admin", {
      user_email: user.email,
    });

    if (!isAdminResult) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const { error } = await supabaseAdmin
      .from("rss_sources")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting RSS source:", error);
    return NextResponse.json(
      { error: "Failed to delete RSS source" },
      { status: 500 }
    );
  }
}
