import { getProviders } from "next-auth/react"
import SignInForm from "./SignInForm"

export default async function SignIn() {
  const providers = await getProviders()

  return (
    <div className="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 px-4 py-8 shadow sm:rounded-lg sm:px-10">
          {providers && <SignInForm providers={providers} />}
        </div>
      </div>
    </div>
  )
} 