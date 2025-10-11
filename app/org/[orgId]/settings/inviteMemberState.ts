export type InviteMemberActionState = {
  status: 'idle' | 'success' | 'error';
  message: string | null;
};

export const inviteMemberInitialState: InviteMemberActionState = {
  status: 'idle',
  message: null,
};
