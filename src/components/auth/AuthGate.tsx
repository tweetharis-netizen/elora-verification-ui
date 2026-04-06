import React from 'react';
import { useAuthGate } from '../../hooks/useAuthGate';
import { AuthGateModal } from './AuthGateModal';

interface AuthGateProps {
  children: React.ReactElement;
  onAuthSuccess?: () => void;
  actionName?: string;
}

/**
 * A declarative wrapper that gates its children's onClick (or onFocus)
 * if the user is not authenticated or is a guest.
 */
export const AuthGate: React.FC<AuthGateProps> = ({
  children,
  onAuthSuccess,
  actionName
}) => {
  const { isGateOpen, gateActionName, closeGate, withGate } = useAuthGate();
  const gatedChild = children as React.ReactElement<{ onClick?: (event: React.MouseEvent) => unknown }>;

  // If children has an onClick, wrap it. Otherwise, use onAuthSuccess.
  const originalAction = gatedChild.props.onClick || onAuthSuccess || (() => { });

  // Create a gated action that will intercept the event.
  const gatedAction = withGate(originalAction, actionName || gateActionName);

  // Clone the child with the gated action.
  const clonedChild = React.cloneElement(gatedChild, {
    onClick: (e: React.MouseEvent) => {
      // Prevent original event if needed, but let withGate handle logic
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
