import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../api/api';
import { useModals } from '../hooks/useModals';
import Notification from '../components/ui/Notification';
import ErrorModal from '../components/ui/ErrorModal';
import ConfirmationModal from '../components/ui/ConfirmationModal';

interface CoachStats {
  teamCount: number;
  athleteCount: number;
  playersWithAccounts: number;
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ProfilePage() {
  const { firstName, lastName, email, userType } = useAuthStore();
  const [stats, setStats] = useState<CoachStats>({ teamCount: 0, athleteCount: 0, playersWithAccounts: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState<ChangePasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Use the custom hook for modals
  const {
    errorModal,
    notification,
    showNotification,
    hideNotification,
    showError,
    hideError,
  } = useModals();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      
      const [teamsRes, athletesRes] = await Promise.all([
        api.get('/teams/my-teams'),
        api.get('/athletes')
      ]);
      
      const teams = teamsRes.data;
      const athletes = athletesRes.data;
      
      const playersWithAccounts = athletes.filter((athlete: any) => athlete.HasUserAccount).length;
      
      setStats({
        teamCount: teams.length,
        athleteCount: athletes.length,
        playersWithAccounts
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      showError('Betöltési hiba', 'Nem sikerült betölteni a profil statisztikákat. Próbáld újra!');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showError('Jelszó eltérés', 'Az új jelszavak nem egyeznek meg. Próbáld újra!');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      showError('Érvénytelen jelszó', 'Az új jelszónak legalább 6 karakter hosszúnak kell lennie.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      showNotification('Jelszó sikeresen megváltoztatva!', 'success');
      setShowPasswordForm(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      console.error('Password change error:', error);
      const errorMessage = error.response?.data?.message || 'Jelszó változtatás sikertelen. Próbáld újra!';
      showError('Jelszó változtatás sikertelen', errorMessage);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const cancelPasswordChange = () => {
    setShowPasswordForm(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background lg:pl-64 flex items-center justify-center px-8 py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background lg:pl-64 px-8 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="relative inline-block w-16 h-16 mb-6">
              <div className="absolute inset-0 bg-primary rounded-lg"></div>
              <div className="absolute w-4 h-4 bg-primary-foreground rounded top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">
              Profil
            </h1>
            <p className="text-muted-foreground text-base">
              Fiók kezelése és coaching statisztikák
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Information */}
            <div className="lg:col-span-2 space-y-8">
              {/* Personal Info */}
              <div className="border border-border rounded-lg p-6 bg-background">
                <h3 className="text-lg font-semibold text-foreground mb-6">Személyes információk</h3>
                
                <div className="flex items-center space-x-6 mb-6">
                  <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary-foreground">
                      {firstName?.[0]}{lastName?.[0]}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">{firstName} {lastName}</h2>
                    <p className="text-muted-foreground">{email}</p>
                    <div className="mt-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                        {userType}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Settings */}
              <div className="border border-border rounded-lg p-6 bg-background">
                <h3 className="text-lg font-semibold text-foreground mb-6">Fiók beállítások</h3>
                
                {!showPasswordForm ? (
                  <button
                    onClick={() => setShowPasswordForm(true)}
                    className="inline-flex items-center px-6 py-3 border border-border text-sm font-medium rounded-lg text-foreground bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Jelszó változtatása
                  </button>
                ) : (
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <label htmlFor="currentPassword" className="block text-sm font-medium text-popover-foreground mb-2">
                        Jelenlegi jelszó
                      </label>
                      <input
                        type="password"
                        id="currentPassword"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordInputChange}
                        className="w-full h-12 px-4 border border-input rounded-lg focus:outline-none focus:border-primary transition-colors bg-background text-foreground"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-popover-foreground mb-2">
                        Új jelszó
                      </label>
                      <input
                        type="password"
                        id="newPassword"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordInputChange}
                        minLength={6}
                        className="w-full h-12 px-4 border border-input rounded-lg focus:outline-none focus:border-primary transition-colors bg-background text-foreground"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-popover-foreground mb-2">
                        Új jelszó megerősítése
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordInputChange}
                        minLength={6}
                        className="w-full h-12 px-4 border border-input rounded-lg focus:outline-none focus:border-primary transition-colors bg-background text-foreground"
                        required
                      />
                    </div>
                    <div className="flex space-x-3 pt-2">
                      <button
                        type="submit"
                        disabled={isChangingPassword}
                        className="px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 transition-colors"
                      >
                        {isChangingPassword ? 'Változtatás...' : 'Jelszó változtatása'}
                      </button>
                      <button
                        type="button"
                        onClick={cancelPasswordChange}
                        className="px-6 py-3 border border-border text-sm font-medium rounded-lg text-foreground bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
                      >
                        Mégse
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Statistics sidebar */}
            <div className="space-y-8">
              {/* Stats */}
              <div className="border border-border rounded-lg p-6 bg-background">
                <h3 className="text-lg font-semibold text-foreground mb-6">Statisztikák</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-border">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-popover-foreground">Csapatok</span>
                    </div>
                    <span className="text-xl font-bold text-foreground">{stats.teamCount}</span>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-border">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-popover-foreground">Sportolók</span>
                    </div>
                    <span className="text-xl font-bold text-foreground">{stats.athleteCount}</span>
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-popover-foreground">App felhasználók</span>
                    </div>
                    <span className="text-xl font-bold text-foreground">{stats.playersWithAccounts}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="border border-border rounded-lg p-6 bg-background">
                <h3 className="text-lg font-semibold text-foreground mb-6">Gyors műveletek</h3>
                <div className="space-y-3">
                  <a
                    href="/my-teams"
                    className="w-full flex items-center px-4 py-3 text-sm font-medium text-foreground bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Új csapat létrehozása
                  </a>
                  <a
                    href="/athletes"
                    className="w-full flex items-center px-4 py-3 text-sm font-medium text-foreground bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Összes sportoló megtekintése
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reusable Modal Components */}
      <ErrorModal
        isOpen={errorModal.isOpen}
        title={errorModal.title}
        message={errorModal.message}
        onClose={hideError}
      />

      <Notification
        isVisible={notification.isVisible}
        message={notification.message}
        type={notification.type}
        onClose={hideNotification}
      />
    </>
  );
}