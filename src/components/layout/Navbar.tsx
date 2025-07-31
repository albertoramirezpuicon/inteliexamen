'use client';

import { useState } from 'react';
import { AppBar, Toolbar, Typography, IconButton, Menu, MenuItem, Box } from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import LogoutIcon from '@mui/icons-material/Logout';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';

interface NavbarProps {
  userType: 'admin' | 'student' | 'teacher';
  userName?: string;
}

export default function Navbar({ userType, userName }: NavbarProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isUpdatingLanguage, setIsUpdatingLanguage] = useState(false);

  const handleLanguageMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleLanguageClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = async (newLocale: 'en' | 'es') => {
    if (isUpdatingLanguage) return;
    
    setIsUpdatingLanguage(true);
    
    try {
      // Get user ID from localStorage
      const userId = localStorage.getItem('userId');
      
      if (userId) {
        // Update language preference in database
        const response = await fetch('/api/auth/update-language', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: parseInt(userId),
            language: newLocale
          }),
        });

        if (response.ok) {
          // Update localStorage with new language
          localStorage.setItem('userLanguage', newLocale);
          
          // Get current path and replace locale
          const currentPath = window.location.pathname;
          const newPath = currentPath.replace(`/${locale}`, `/${newLocale}`);
          router.push(newPath);
        } else {
          console.error('Failed to update language preference');
          // Still navigate even if database update fails
          const currentPath = window.location.pathname;
          const newPath = currentPath.replace(`/${locale}`, `/${newLocale}`);
          router.push(newPath);
        }
      } else {
        // If no user ID, just navigate
        const currentPath = window.location.pathname;
        const newPath = currentPath.replace(`/${locale}`, `/${newLocale}`);
        router.push(newPath);
      }
    } catch (error) {
      console.error('Error updating language preference:', error);
      // Still navigate even if there's an error
      const currentPath = window.location.pathname;
      const newPath = currentPath.replace(`/${locale}`, `/${newLocale}`);
      router.push(newPath);
    } finally {
      setIsUpdatingLanguage(false);
      handleLanguageClose();
    }
  };

  const handleLogout = () => {
    // Clear all authentication data
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userLanguage');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    
    // Clear any cookies if they exist
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    // Redirect to main page
    router.push('/');
  };

  const getTitle = () => {
    switch (userType) {
      case 'admin':
        return t('dashboard');
      case 'student':
        return t('student.dashboard');
      case 'teacher':
        return t('teacher.dashboard');
      default:
        return 'Portal';
    }
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: '#0070f3' }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {getTitle()}
        </Typography>
        
        {userName && (
          <Typography variant="body1" sx={{ mr: 2 }}>
            {tCommon('welcome')}, {userName}
          </Typography>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            color="inherit"
            onClick={handleLanguageMenu}
            aria-label="language"
            disabled={isUpdatingLanguage}
          >
            <LanguageIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleLanguageClose}
          >
            <MenuItem 
              onClick={() => handleLanguageChange('en')}
              selected={locale === 'en'}
              disabled={isUpdatingLanguage}
            >
              English
            </MenuItem>
            <MenuItem 
              onClick={() => handleLanguageChange('es')}
              selected={locale === 'es'}
              disabled={isUpdatingLanguage}
            >
              Español
            </MenuItem>
          </Menu>

          <IconButton
            color="inherit"
            onClick={handleLogout}
            aria-label="logout"
          >
            <LogoutIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
} 