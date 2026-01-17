import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { BETA_LIMITS } from "@/lib/beta-limits";

// Use service role to count all users (bypass RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { count, error } = await supabaseAdmin
      .from("music_library")
      .select("user_id", { count: "exact", head: true });

    if (error) {
      // If table doesn't exist or other error, try auth.users
      const { data: users, error: authError } = await supabaseAdmin.auth.admin.listUsers();

      if (authError) {
        console.error("Error checking user count:", authError);
        return NextResponse.json({ error: "Failed to check user limit" }, { status: 500 });
      }

      const userCount = users?.users?.length || 0;
      return NextResponse.json({
        canSignup: userCount < BETA_LIMITS.MAX_USERS,
        currentCount: userCount,
        maxUsers: BETA_LIMITS.MAX_USERS,
      });
    }

    // Get unique user count from music_library
    const { data: uniqueUsers } = await supabaseAdmin
      .from("music_library")
      .select("user_id")
      .limit(1000);

    const uniqueUserIds = new Set(uniqueUsers?.map(u => u.user_id) || []);
    const userCount = uniqueUserIds.size;

    // Also check auth users directly
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    const authUserCount = authUsers?.users?.length || 0;

    const totalUsers = Math.max(userCount, authUserCount);

    return NextResponse.json({
      canSignup: totalUsers < BETA_LIMITS.MAX_USERS,
      currentCount: totalUsers,
      maxUsers: BETA_LIMITS.MAX_USERS,
    });
  } catch (error) {
    console.error("Error checking user limit:", error);
    return NextResponse.json({ error: "Failed to check user limit" }, { status: 500 });
  }
}
