"use client";

import {
  Dispatch,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from "react";

import { siteConfig } from "@/config/site";
import { useMediaQuery } from "@/hooks/use-media-query";
import { DialogDescription } from "@/components/ui/dialog";
import { Modal } from "@/components/ui/modal";
import { UserAuthForm } from "@/components/forms/user-auth-form";
import { Icons } from "@/components/shared/icons";

function SignInModal({
  showSignInModal,
  setShowSignInModal,
}: {
  showSignInModal: boolean;
  setShowSignInModal: Dispatch<SetStateAction<boolean>>;
}) {
  const { isMobile } = useMediaQuery();
  const handleSuccess = () => {
    setShowSignInModal(false); // Close modal after successful authentication
  };

  return (
    <Modal
      showModal={showSignInModal}
      setShowModal={setShowSignInModal}
      title="Sign In"
      fullscreenOnMobile={true}
    >
      <div className="w-full h-full flex flex-col">
        <div className="flex flex-col items-center justify-center space-y-3 border-b bg-background px-4 py-6 pt-8 text-center md:px-16 md:pt-8 relative">
          {isMobile && (
            <button
              onClick={() => setShowSignInModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-accent transition-colors"
              aria-label="Close"
            >
              <Icons.close className="size-5" />
            </button>
          )}
          <a href={siteConfig.url}>
            <Icons.logo className="size-10" />
          </a>
          <h3 className="font-urban text-2xl font-bold">Sign In</h3>
          <DialogDescription className="text-sm text-gray-500">
            Use your email and password to sign in to your account
          </DialogDescription>
        </div>

        <div className="flex flex-col space-y-4 bg-secondary/50 px-4 py-8 md:px-16 flex-1 justify-center">
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
