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
import { UserAuthForm } from "@/components/forms/user-auth-form";

function SignUpModal({
  showSignUpModal,
  setShowSignUpModal,
}: {
  showSignUpModal: boolean;
  setShowSignUpModal: Dispatch<SetStateAction<boolean>>;
}) {
  const handleSuccess = () => {
    setShowSignUpModal(false);  // Close modal after successful authentication
  };

  return (
    <Modal 
      showModal={showSignUpModal} 
      setShowModal={setShowSignUpModal}
      title="Sign Up"
    >
      <div className="w-full">
        <div className="flex flex-col items-center justify-center space-y-3 border-b bg-background px-4 py-6 pt-8 text-center md:px-16">
          <a href={siteConfig.url}>
            <Icons.logo className="size-10" />
          </a>
          <h3 className="font-urban text-2xl font-bold">Sign Up</h3>
          <p className="text-sm text-gray-500">
            Create an account with your email and password
          </p>
        </div>

        <div className="flex flex-col space-y-4 bg-secondary/50 px-4 py-8 md:px-16">
          <UserAuthForm type="register" className="w-full" onSuccess={handleSuccess} />
        </div>
      </div>
    </Modal>
  );
}

export function useSignUpModal() {
  const [showSignUpModal, setShowSignUpModal] = useState(false);

  const SignUpModalCallback = useCallback(() => {
    return (
      <SignUpModal
        showSignUpModal={showSignUpModal}
        setShowSignUpModal={setShowSignUpModal}
      />
    );
  }, [showSignUpModal, setShowSignUpModal]);

  return useMemo(
    () => ({
      setShowSignUpModal,
      SignUpModal: SignUpModalCallback,
    }),
    [setShowSignUpModal, SignUpModalCallback],
  );
} 