"use client";

import {
  Dispatch,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from "react";

import { siteConfig } from "@/config/site";
import { Button } from '@/components/alignui/actions/button';
import { Modal } from "@/components/ui/modal";
import { DialogDescription } from "@/components/ui/dialog";
import { UserAuthForm } from "@/components/forms/user-auth-form";
import { Icons } from "@/components/shared/icons";
import { useMediaQuery } from "@/hooks/use-media-query";

function SignUpModal({
  showSignUpModal,
  setShowSignUpModal,
}: {
  showSignUpModal: boolean;
  setShowSignUpModal: Dispatch<SetStateAction<boolean>>;
}) {
  const { isMobile } = useMediaQuery();
  const handleSuccess = () => {
    setShowSignUpModal(false); // Close modal after successful authentication
  };

  return (
    <Modal
      showModal={showSignUpModal}
      setShowModal={setShowSignUpModal}
      title="Sign Up"
      fullscreenOnMobile={true}
    >
      <div className="w-full h-full flex flex-col">
        <div className="flex flex-col items-center justify-center space-y-3 border-b bg-background px-4 py-6 pt-8 text-center md:px-16 md:pt-8 relative">
          {isMobile && (
            <button
              onClick={() => setShowSignUpModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-accent transition-colors"
              aria-label="Close"
            >
              <Icons.close className="size-5" />
            </button>
          )}
          <a href={siteConfig.url}>
            <Icons.logo className="size-10" />
          </a>
          <h3 className="font-urban text-2xl font-bold">Sign Up</h3>
          <DialogDescription className="text-sm text-gray-500">
            Create an account with your email and password
          </DialogDescription>
        </div>

        <div className="flex flex-col space-y-4 bg-secondary/50 px-4 py-8 md:px-16 flex-1 justify-center">
          <UserAuthForm
            type="register"
            className="w-full"
            onSuccess={handleSuccess}
          />
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
