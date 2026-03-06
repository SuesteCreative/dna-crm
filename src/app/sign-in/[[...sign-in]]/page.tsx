import { SignIn } from "@clerk/nextjs";
import Image from "next/image";

export default function Page() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 gap-8">
            <Image src="/SVG/logo-color.svg" alt="DNA" width={200} height={80} priority />
            <SignIn />
        </div>
    );
}
