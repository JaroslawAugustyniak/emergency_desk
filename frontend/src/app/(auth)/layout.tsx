// import LanguageSwitcher from "../components/LanguageSwitcher";
import LanguageSwitcher from "@/app/components/ui/LanguageSwitcher";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow relative">
        <div className="absolute top-4 right-4">
          {/* <LanguageSwitcher /> */}
        </div>
        {children}
      </div>
    </div>
  );
}
