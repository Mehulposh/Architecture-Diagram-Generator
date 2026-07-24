import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useDiagramStore from '../store/useDiagramStore';

export default function Profile() {
  const { user, fetchProfile, updateProfile, changePassword, logout } = useDiagramStore();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [profileForm, setProfileForm] = useState({ name: '', email: '' });
  const [profileStatus, setProfileStatus] = useState('');
  const [profileError, setProfileError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordStatus, setPasswordStatus] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    fetchProfile()
      .then((freshUser) => setProfileForm({ name: freshUser.name, email: freshUser.email }))
      .catch(() => setProfileError('Could not load your account details.'))
      .finally(() => setLoading(false));
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileStatus('');
    setSavingProfile(true);
    try {
      await updateProfile(profileForm);
      setProfileStatus('Saved');
      setTimeout(() => setProfileStatus(''), 2000);
    } catch (err) {
      setProfileError(err.response?.data?.error || 'Could not update your profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordStatus('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New password and confirmation don't match.");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }

    setChangingPassword(true);
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordStatus('Password changed');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordStatus(''), 2500);
    } catch (err) {
      setPasswordError(err.response?.data?.error || 'Could not change your password.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="blueprint-canvas min-h-screen p-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="spec-plate text-blueprint-line">Profile</p>
            <h1 className="font-display text-2xl font-bold text-paper">Your account</h1>
          </div>
          <Link to="/editor" className="rounded-sm border border-blueprint-line/40 px-3 py-1.5 text-sm text-paper/90 hover:bg-blueprint-800">
            Back to editor
          </Link>
        </div>

        {loading && <p className="text-sm text-paper/50">Loading…</p>}

        {!loading && (
          <div className="flex flex-col gap-6">
            {/* Account summary */}
            <section className="rounded-md border border-blueprint-line/30 bg-blueprint-900/60 p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-amber/20 font-display text-xl font-bold text-amber">
                  {(user?.name || '?').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-display text-lg font-semibold text-paper">
                    {user?.name}
                    {user?.isAdmin && (
                      <span className="ml-2 rounded-sm bg-amber/20 px-1.5 py-0.5 align-middle text-[10px] uppercase text-amber">Admin</span>
                    )}
                  </p>
                  <p className="truncate text-sm text-paper/50">{user?.email}</p>
                  {user?.createdAt && (
                    <p className="mt-0.5 text-xs text-paper/30">
                      Member since {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Update name/email */}
            <section className="rounded-md border border-blueprint-line/30 bg-blueprint-900/60 p-5">
              <p className="spec-plate mb-3 text-blueprint-line">Account details</p>
              <form onSubmit={handleProfileSubmit} className="flex flex-col gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-paper/50">Name</span>
                  <input
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="rounded-sm border border-blueprint-line/30 bg-blueprint-800/70 px-3 py-2 text-sm text-paper focus:border-amber"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-paper/50">Email</span>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="rounded-sm border border-blueprint-line/30 bg-blueprint-800/70 px-3 py-2 text-sm text-paper focus:border-amber"
                  />
                </label>
                {profileError && <p className="text-xs text-node-cache">{profileError}</p>}
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="rounded-sm bg-amber px-4 py-2 font-display text-sm font-semibold text-blueprint-950 hover:opacity-90 disabled:opacity-40"
                  >
                    {savingProfile ? 'Saving…' : 'Save changes'}
                  </button>
                  {profileStatus && <span className="text-xs text-node-cloud">{profileStatus}</span>}
                </div>
              </form>
            </section>

            {/* Change password */}
            <section className="rounded-md border border-blueprint-line/30 bg-blueprint-900/60 p-5">
              <p className="spec-plate mb-3 text-blueprint-line">Change password</p>
              <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-paper/50">Current password</span>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="rounded-sm border border-blueprint-line/30 bg-blueprint-800/70 px-3 py-2 text-sm text-paper focus:border-amber"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-paper/50">New password (min. 8 characters)</span>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="rounded-sm border border-blueprint-line/30 bg-blueprint-800/70 px-3 py-2 text-sm text-paper focus:border-amber"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-paper/50">Confirm new password</span>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="rounded-sm border border-blueprint-line/30 bg-blueprint-800/70 px-3 py-2 text-sm text-paper focus:border-amber"
                  />
                </label>
                {passwordError && <p className="text-xs text-node-cache">{passwordError}</p>}
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="rounded-sm border border-blueprint-line/40 px-4 py-2 font-display text-sm font-semibold text-paper hover:bg-blueprint-800 disabled:opacity-40"
                  >
                    {changingPassword ? 'Changing…' : 'Change password'}
                  </button>
                  {passwordStatus && <span className="text-xs text-node-cloud">{passwordStatus}</span>}
                </div>
              </form>
            </section>

            <button onClick={handleLogout} className="self-start text-sm text-paper/50 hover:text-node-cache">
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}