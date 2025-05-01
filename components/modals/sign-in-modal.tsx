"use client";

import {
  Dispatch,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from "react";

import { Icons } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { siteConfig } from "@/config/site";
import { useSupabase } from "@/components/supabase-provider";
import { UserAuthForm } from "@/components/forms/user-auth-form";

function SignInModal({
  showSignInModal,
  setShowSignInModal,
}: {
  showSignInModal: boolean;
  setShowSignInModal: Dispatch<SetStateAction<boolean>>;
}) {
  const handleSuccess = () => {
    setShowSignInModal(false);  // Close modal after successful authentication
  };

  return (
    <Modal 
      showModal={showSignInModal} 
      setShowModal={setShowSignInModal}
      title="Sign In"
    >
      <div className="w-full">
        <div className="flex flex-col items-center justify-center space-y-3 border-b bg-background px-4 py-6 pt-8 text-center md:px-16">
          <a href={siteConfig.url}>
            <Icons.logo className="size-10" />
          </a>
          <h3 className="font-urban text-2xl font-bold">Sign In</h3>
          <p className="text-sm text-gray-500">
            Use your email and password to sign in to your account
          </p>
        </div>

        <div className="flex flex-col space-y-4 bg-secondary/50 px-4 py-8 md:px-16">
          <UserAuthForm className="w-full" onSuccess={handleSuccess} />
        </div>
      </div>
    </Modal>
  );
}

export function useSignInModal() {
  const [showSignInModal, setShowSignInModal] = useState(false);

  const SignInModalCallback = useCallback(() => {
    return (
      <SignInModal
        showSignInModal={showSignInModal}
        setShowSignInModal={setShowSignInModal}
      />
    );
  }, [showSignInModal, setShowSignInModal]);

  return useMemo(
    () => ({
      setShowSignInModal,
      SignInModal: SignInModalCallback,
    }),
    [setShowSignInModal, SignInModalCallback],
  );
}
