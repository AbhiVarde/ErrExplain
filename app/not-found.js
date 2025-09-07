import NotFoundClient from "@/components/common/NotFoundClient";

export const metadata = {
  title: "Page Not Found",
  description: "The page you're looking for doesn't exist.",
  robots: "noindex, nofollow",
};

export default function NotFound() {
  return <NotFoundClient />;
}
