import { Input } from "../ui/input";
import { Label } from "../ui/label";

export function AuthForm({
  action,
  children,
  defaultEmail = "",
  isSignUp = false,
}: {
  action: any;
  children: React.ReactNode;
  defaultEmail?: string;
  isSignUp?: boolean;
}) {
  return (
    <form action={action} className="flex flex-col gap-4 px-4 sm:px-16">
      <div className="flex flex-col gap-2">
        {isSignUp && (
          <>
            <Label
              htmlFor="accessPassword"
              className="text-zinc-600 font-normal dark:text-zinc-400"
            >
              Access Password
            </Label>
            <Input
              id="accessPassword"
              name="accessPassword"
              className="bg-muted text-md md:text-sm border-none"
              type="password"
              placeholder="Enter access password"
              required
            />
          </>
        )}

        <Label
          htmlFor="email"
          className="text-zinc-600 font-normal dark:text-zinc-400"
        >
          Email Address
        </Label>

        <Input
          id="email"
          name="email"
          className="bg-muted text-md md:text-sm border-none"
          type="email"
          placeholder="user@acme.com"
          autoComplete="email"
          required
          defaultValue={defaultEmail}
        />

        <Label
          htmlFor="password"
          className="text-zinc-600 font-normal dark:text-zinc-400"
        >
          Password
        </Label>

        <Input
          id="password"
          name="password"
          className="bg-muted text-md md:text-sm border-none"
          type="password"
          required
        />
      </div>

      {children}
    </form>
  );
}
