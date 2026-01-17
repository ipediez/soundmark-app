"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BETA_LIMITS } from "@/lib/beta-limits";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingLimit, setCheckingLimit] = useState(true);
  const [canSignup, setCanSignup] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkUserLimit = async () => {
      try {
        const res = await fetch("/api/beta/check-user-limit");
        const data = await res.json();
        setCanSignup(data.canSignup);
      } catch {
        // If check fails, allow signup attempt
        setCanSignup(true);
      } finally {
        setCheckingLimit(false);
      }
    };
    checkUserLimit();
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Double-check user limit before signup
    try {
      const res = await fetch("/api/beta/check-user-limit");
      const data = await res.json();
      if (!data.canSignup) {
        setError(`Beta is full! Maximum ${BETA_LIMITS.MAX_USERS} users allowed.`);
        setCanSignup(false);
        setLoading(false);
        return;
      }
    } catch {
      // Continue with signup if check fails
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  if (checkingLimit) {
    return (
      <Card className="border-border">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Create account</CardTitle>
          <CardDescription>Checking availability...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!canSignup) {
    return (
      <Card className="border-border">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Beta is Full</CardTitle>
          <CardDescription>
            The beta is currently limited to {BETA_LIMITS.MAX_USERS} users and all spots are taken.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Create account</CardTitle>
        <CardDescription>
          Enter your email to create your account
          <span className="block text-xs mt-1 text-primary">Beta: Limited to {BETA_LIMITS.MAX_USERS} users</span>
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSignup}>
        <CardContent className="space-y-4">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
