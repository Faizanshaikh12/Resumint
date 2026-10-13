import { Form, Link } from "react-router";
import { requireUser, type AuthUser } from "~/auth/helpers.server";
import { Button } from "~/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "~/components/ui/card";
import { FileText, LogOut, User } from "lucide-react";

export function meta() {
  return [
    { title: "Dashboard | Resumint" },
    { name: "description", content: "Your Resumint workspace dashboard." },
  ];
}

export async function loader({ request }: { request: Request }) {
  const user = await requireUser(request);
  return { user };
}

export default function DashboardPage({
  loaderData,
}: {
  loaderData: { user: AuthUser };
}) {
  const { user } = loaderData;

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Hello, {user.name}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome to your Resumint workspace ({user.email}).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Form method="post" action="/logout">
            <Button variant="outline" size="sm" type="submit" className="gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </Form>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle>Profile Details</CardTitle>
            </div>
            <CardDescription>Your verified account credentials</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="font-medium text-foreground">Name: </span>
              <span className="text-muted-foreground">{user.name}</span>
            </div>
            <div>
              <span className="font-medium text-foreground">Email: </span>
              <span className="text-muted-foreground">{user.email}</span>
            </div>
            <div>
              <span className="font-medium text-foreground">User ID: </span>
              <span className="font-mono text-xs text-muted-foreground">{user.id}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle>Resume Builder (Phase 4)</CardTitle>
            </div>
            <CardDescription>Full resume management & editor coming next</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-muted-foreground">
              Authentication is fully wired and active. Resume creation, editing, and storage
              will be connected in Phase 4.
            </p>
            <Link to="/">
              <Button size="sm" variant="secondary">
                Return to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
