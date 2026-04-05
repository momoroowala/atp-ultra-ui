import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 text-foreground">
      <div className="relative text-center">
        <div className="pointer-events-none absolute inset-x-0 -top-16 text-[7rem] font-bold leading-none text-muted-foreground/10 sm:text-[10rem]">
          404
        </div>
        <div className="relative space-y-4">
          <h1 className="text-3xl font-bold sm:text-4xl">Page not found</h1>
          <p className="text-base text-muted-foreground">
            The page you requested doesn&apos;t exist or has moved.
          </p>
          <Button asChild>
            <Link to="/">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
