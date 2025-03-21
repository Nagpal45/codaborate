import { SignUp } from "@clerk/nextjs"

export default function Page() {
  return (
     <div className="h-screen w-full flex justify-center items-center bg-[#eaeaea]">
        <SignUp/>
     </div>
  )
}
