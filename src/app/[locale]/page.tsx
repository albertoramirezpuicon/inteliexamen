'use client';

import { useState } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  AppBar, 
  Toolbar, 
  IconButton, 
  Modal, 
  Paper,
  Card,
  CardContent,
  Chip,
  Stack
} from '@mui/material';
import { 
  Language as LanguageIcon,
  AdminPanelSettings as AdminIcon,
  School as TeacherIcon,
  Person as StudentIcon,
  Close as CloseIcon,
  SmartToy as AIIcon,
  Assessment as AssessmentIcon,
  Analytics as AnalyticsIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Psychology as PsychologyIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import LoginFormWrapper from '@/components/auth/LoginFormWrapper';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LandingPage() {
  const t = useTranslations('landing');
  const locale = useLocale();
  const router = useRouter();
  const [loginModal, setLoginModal] = useState<{
    open: boolean;
    userType: 'admin' | 'teacher' | 'student' | null;
  }>({
    open: false,
    userType: null
  });

  const handleLanguageSwitch = (newLocale: string) => {
    const currentPath = window.location.pathname;
    const newPath = currentPath.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  };

  const handleLoginClick = (userType: 'admin' | 'teacher' | 'student') => {
    setLoginModal({
      open: true,
      userType
    });
  };

  const handleCloseModal = () => {
    setLoginModal({
      open: false,
      userType: null
    });
  };

  const features = [
    {
      icon: <AIIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: t('features.ai'),
      description: t('features.aiDesc')
    },
    {
      icon: <AnalyticsIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: t('features.analytics'),
      description: t('features.analyticsDesc')
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: t('features.security'),
      description: t('features.securityDesc')
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: t('features.speed'),
      description: t('features.speedDesc')
    },
    {
      icon: <PsychologyIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: t('features.psychology'),
      description: t('features.psychologyDesc')
    }
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      {/* Fixed Top Navbar */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1300,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--border)',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <Typography variant="h5" sx={{ color: 'var(--text-primary)', fontWeight: 700, letterSpacing: '-0.5px' }}>
            {t('title')}
          </Typography>
          
          <Stack direction="row" spacing={2} alignItems="center">
            {/* Login Buttons */}
            <Button
              variant="outlined"
              size="small"
              startIcon={<AdminIcon />}
              onClick={() => handleLoginClick('admin')}
              sx={{ 
                color: 'var(--text-primary)', 
                borderColor: 'var(--border)',
                borderRadius: 2,
                '&:hover': {
                  borderColor: 'var(--primary)',
                  backgroundColor: 'var(--hover)'
                }
              }}
            >
              {t('admin')}
            </Button>

            <Button
              variant="outlined"
              size="small"
              startIcon={<TeacherIcon />}
              onClick={() => handleLoginClick('teacher')}
              sx={{ 
                color: 'var(--text-primary)', 
                borderColor: 'var(--border)',
                borderRadius: 2,
                '&:hover': {
                  borderColor: 'var(--primary)',
                  backgroundColor: 'var(--hover)'
                }
              }}
            >
              {t('teacher')}
            </Button>

            <Button
              variant="outlined"
              size="small"
              startIcon={<StudentIcon />}
              onClick={() => handleLoginClick('student')}
              sx={{ 
                color: 'var(--text-primary)', 
                borderColor: 'var(--border)',
                borderRadius: 2,
                '&:hover': {
                  borderColor: 'var(--primary)',
                  backgroundColor: 'var(--hover)'
                }
              }}
            >
              {t('student')}
            </Button>

            {/* Language Switcher - moved to rightmost */}
            <Button
              variant="outlined"
              size="small"
              onClick={() => handleLanguageSwitch(locale === 'en' ? 'es' : 'en')}
              sx={{ 
                color: 'var(--text-primary)', 
                borderColor: 'var(--border)',
                borderRadius: 2,
                px: 2,
                '&:hover': {
                  borderColor: 'var(--primary)',
                  backgroundColor: 'var(--hover)'
                }
              }}
            >
              {locale.toUpperCase()}
            </Button>
          </Stack>
        </div>
      </div>

      {/* Main Content with top padding for navbar */}
      <div style={{ paddingTop: '64px' }}>
        {/* Hero Section */}
        <Box sx={{ 
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          background: 'linear-gradient(135deg, var(--background) 0%, rgba(25, 118, 210, 0.05) 100%)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Background Pattern */}
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 80%, rgba(25, 118, 210, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(25, 118, 210, 0.1) 0%, transparent 50%)',
            zIndex: 0
          }} />
          
          <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: 'center',
              gap: 6
            }}>
              <Box sx={{ 
                flex: { xs: 'none', md: '0 0 58.33%' },
                width: '100%',
                textAlign: { xs: 'center', md: 'left' }
              }}>
                {/* Main Tagline */}
                <Typography 
                  variant="h1" 
                  component="h1" 
                  gutterBottom
                  sx={{ 
                    color: 'var(--text-primary)',
                    fontWeight: 800,
                    fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4rem' },
                    lineHeight: 1.1,
                    letterSpacing: '-0.02em',
                    mb: 3
                  }}
                >
                  {t('hero.tagline')}
                </Typography>
                
                {/* Subtitle */}
                <Typography 
                  variant="h3" 
                  component="h2" 
                  gutterBottom
                  sx={{ 
                    color: 'var(--primary)',
                    fontWeight: 600,
                    fontSize: { xs: '1.5rem', sm: '2rem', md: '2.25rem' },
                    mb: 4,
                    opacity: 0.9
                  }}
                >
                  {t('hero.subtitle')}
                </Typography>
                
                {/* Description */}
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: 'var(--text-secondary)',
                    maxWidth: 600,
                    mb: 6,
                    fontSize: { xs: '1rem', sm: '1.125rem' },
                    lineHeight: 1.6,
                    opacity: 0.8
                  }}
                >
                  {t('hero.description')}
                </Typography>

                {/* Call to Action Buttons */}
                <Stack 
                  direction={{ xs: 'column', sm: 'row' }} 
                  spacing={2} 
                  justifyContent={{ xs: 'center', md: 'flex-start' }}
                  sx={{ mb: 4 }}
                >
                  <Button
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => handleLoginClick('student')}
                    sx={{ 
                      px: 4, 
                      py: 1.5,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      borderRadius: 3,
                      boxShadow: 3,
                      '&:hover': {
                        boxShadow: 6,
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {t('hero.cta.primary')}
                  </Button>
                  
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => handleLoginClick('teacher')}
                    sx={{ 
                      px: 4, 
                      py: 1.5,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      borderRadius: 3,
                      borderWidth: 2,
                      '&:hover': {
                        borderWidth: 2,
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {t('hero.cta.secondary')}
                  </Button>
                </Stack>

                {/* Trust Indicators */}
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: { xs: 'center', md: 'flex-start' } }}>
                  <Chip 
                    label="AI-Powered" 
                    color="primary" 
                    size="medium"
                    sx={{ 
                      fontSize: '0.9rem', 
                      px: 2, 
                      py: 1,
                      fontWeight: 600
                    }}
                  />
                  <Chip 
                    label="Secure" 
                    variant="outlined"
                    size="medium"
                    sx={{ 
                      fontSize: '0.9rem', 
                      px: 2, 
                      py: 1,
                      fontWeight: 600
                    }}
                  />
                  <Chip 
                    label="Analytics" 
                    variant="outlined"
                    size="medium"
                    sx={{ 
                      fontSize: '0.9rem', 
                      px: 2, 
                      py: 1,
                      fontWeight: 600
                    }}
                  />
                </Box>
              </Box>
              
              <Box sx={{ 
                flex: { xs: 'none', md: '0 0 41.67%' },
                width: '100%',
                display: 'flex', 
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <Box sx={{
                  width: '100%',
                  maxWidth: 400,
                  height: 400,
                  background: 'linear-gradient(135deg, var(--primary) 0%, rgba(25, 118, 210, 0.8) 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  boxShadow: '0 20px 40px rgba(25, 118, 210, 0.3)',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: -20,
                    left: -20,
                    right: -20,
                    bottom: -20,
                    background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.2) 0%, transparent 100%)',
                    borderRadius: '50%',
                    zIndex: -1
                  }
                }}>
                  {/* Image */}
                  <Box
                    component="img"
                    src="http://localhost:3000/hombre-con-celular.png"
                    alt="Person with mobile phone"
                    sx={{
                      width: '100%',
                      height: '100%',
                      maxWidth: 400,
                      maxHeight: 400,
                      objectFit: 'cover',
                      borderRadius: '50%',
                      filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </Container>
        </Box>

        {/* Features Section */}
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography 
              variant="h2" 
              component="h2" 
              gutterBottom
              sx={{ 
                color: 'var(--text-primary)',
                fontWeight: 700,
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                mb: 3
              }}
            >
              {t('features.title')}
            </Typography>
            
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'var(--text-secondary)',
                maxWidth: 600,
                mx: 'auto',
                mb: 6,
                opacity: 0.8
              }}
            >
              {t('features.subtitle')}
            </Typography>
          </Box>

          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            gap: 4
          }}>
            {features.map((feature, index) => (
              <Box key={index}>
                <Card 
                  sx={{ 
                    height: '100%',
                    backgroundColor: 'var(--card-background)',
                    transition: 'all 0.3s ease',
                    borderRadius: 3,
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: 8
                    }
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', p: 4 }}>
                    <Box sx={{ mb: 3 }}>
                      {feature.icon}
                    </Box>
                    <Typography 
                      variant="h5" 
                      component="h3" 
                      gutterBottom
                      sx={{ 
                        color: 'var(--text-primary)',
                        fontWeight: 600,
                        mb: 2
                      }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: 'var(--text-secondary)',
                        lineHeight: 1.6
                      }}
                    >
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        </Container>
      </div>

      {/* Login Modal */}
      <Modal
        open={loginModal.open}
        onClose={handleCloseModal}
        aria-labelledby="login-modal-title"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2
        }}
        BackdropProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)'
          }
        }}
      >
        <Paper 
          sx={{ 
            p: 4, 
            maxWidth: 500, 
            width: '100%',
            position: 'relative',
            backgroundColor: 'transparent',
            borderRadius: 3,
            boxShadow: 'none',
            border: 'none'
          }}
        >
          <IconButton
            onClick={handleCloseModal}
            sx={{
              position: 'absolute',
              right: 12,
              top: 12,
              color: '#666666',
              backgroundColor: '#ffffff',
              border: '1px solid #e0e0e0',
              width: 32,
              height: 32,
              '&:hover': {
                backgroundColor: '#f5f5f5',
                color: '#333333'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
          
          {loginModal.userType && (
            <LoginFormWrapper userType={loginModal.userType} />
          )}
        </Paper>
      </Modal>
    </div>
  );
} 