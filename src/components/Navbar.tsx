"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Results", href: "/results" },
  ];

  return (
    <nav className="w-full  text-black shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo / Title */}
          <Link href="/" className="text-2xl font-extrabold text-black">
            Thunder Crawler
          </Link>

          {/* Navigation Links */}
          <div className="flex space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  pathname === item.href
                    ? "bg-white text-blue-700 shadow"
                    : "text-blue hover:bg-blue/20"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}