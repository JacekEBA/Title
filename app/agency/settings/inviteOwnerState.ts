export type InviteOwnerActionState = {
  status: 'idle' | 'success' | 'error';
  message: string | null;
};

export const inviteOwnerInitialState: InviteOwnerActionState = {
  status: 'idle',
  message: null,
};
