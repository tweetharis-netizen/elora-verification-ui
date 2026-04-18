import React from 'react';
import { useAuthGate } from '../../hooks/useAuthGate';
import { AuthGateModal } from './AuthGateModal';

interface AuthGateProps {
  children: React.ReactElement;
  onAuthSuccess?: () => void;
  actionName?: string;
  forceGate?: boolean;
}

/**
 * A declarative wrapper that gates its children's onClick (or onFocus)
 * if the user is not authenticated or is a guest.
 */
export const AuthGate: React.FC<AuthGateProps> = ({
  children,
  onAuthSuccess,
  actionName,
  forceGate = false,
}) => {
  const {
    isGateOpen,
    gateActionName,
    closeGate,
    withGate,
    isGuest,
    isVerified,
    openGate,
  } = useAuthGate();
  const gatedChild = children as React.ReactElement<{ onClick?: (event: React.MouseEvent) => unknown }>;

  // If children has an onClick, wrap it. Otherwise, use onAuthSuccess.
  const originalAction = gatedChild.props.onClick || onAuthSuccess || (() => { });

  // Create a gated action that will intercept the event.
  const gatedAction = withGate(originalAction, actionName || gateActionName);

  // Clone the child with the gated action.
  const clonedChild = React.cloneElement(gatedChild, {
    onClick: (e: React.MouseEvent) => {
      if (forceGate || !isVerified || isGuest) {
        // Block Link navigation when this action is gated.
        e.preventDefault();
        e.stopPropagation();
        openGate(actionName || gateActionName);
        return;
      }

      gatedAction(e);
    }
  });

  return (
    <>
      {clonedChild}
      <AuthGateModal
        isOpen={isGateOpen}
        onClose={closeGate}
        actionName={actionName || gateActionName}
      />
    </>
  );
};
