/**
 * LANDING PAGE - MAIN ENTRY POINT
 * 
 * PURPOSE: Main landing page with role-based login options and platform introduction
 * 
 * CONNECTIONS:
 * - Links to /admin/login, /teacher/login, /student/login for role-based authentication
 * - Language switcher for internationalization (English/Spanish)
 * - Platform features showcase and introduction
 * 
 * KEY FEATURES:
 * - Role-based login buttons (Admin, Teacher, Student)
 * - Platform features and benefits presentation
 * - Language selection and switching
 * - Responsive design with modern UI
 * - Modal-based login forms for each role
 * 
 * NAVIGATION FLOW:
 * - Entry point for all users
 * - Role selection determines authentication path
 * - Language selection affects all subsequent pages
 * 
 * USER JOURNEY:
 * - User arrives at landing page
 * - Selects role (Admin/Teacher/Student)
 * - Chooses language preference
 * - Proceeds to role-specific login
 */

'use client';

import { useState } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  IconButton, 
  Modal, 
  Paper,
  Card,
  CardContent,
  Chip,
  Stack,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Link
} from '@mui/material';
import { 
  AdminPanelSettings as AdminIcon,
  School as TeacherIcon,
  Person as StudentIcon,
  Close as CloseIcon,
  SmartToy as AIIcon,
  Analytics as AnalyticsIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Psychology as PsychologyIcon,
  Menu as MenuIcon,
  Language as LanguageIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import {
  WhatsApp as WhatsAppIcon
} from '@mui/icons-material';
import LoginFormWrapper from '@/components/auth/LoginFormWrapper';
import ContactForm from '@/components/ContactForm';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLanguageSwitch = (newLocale: string) => {
    const currentPath = window.location.pathname;
    const newPath = currentPath.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
    setMobileMenuOpen(false);
  };

  const handleLoginClick = (userType: 'admin' | 'teacher' | 'student') => {
    setLoginModal({
      open: true,
      userType
    });
    setMobileMenuOpen(false);
  };

  const handleCloseModal = () => {
    setLoginModal({
      open: false,
      userType: null
    });
  };

  const handleContactDemo = () => {
    window.location.href = 'mailto:info@inteliexamen.com?subject=Demo Request&body=Hello, I would like to request a demo of the Inteliexamen platform.';
  };

  const handleWhatsAppContact = () => {
    const phoneNumber = '51949358364';
    const message = 'I am interested in know more about inteliexamen';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
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
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      {/* Fixed Top Navbar */}
      <Box sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1300,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #e0e0e0',
        height: { xs: '56px', sm: '64px' },
        display: 'flex',
        alignItems: 'center',
        px: { xs: 2, sm: 3 }
      }}>
        <Container maxWidth="lg" sx={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '100%'
        }}>
          {/* Logo/Title */}
          <Typography 
            variant="h5" 
            sx={{ 
              color: '#171717', 
              fontWeight: 700, 
              letterSpacing: '-0.5px',
              fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' }
            }}
          >
            {t('title')}
          </Typography>
          
          {/* Desktop Navigation */}
          <Stack 
            direction="row" 
            spacing={2} 
            alignItems="center"
            sx={{ display: { xs: 'none', md: 'flex' } }}
          >
            {/* Login Buttons */}
            <Button
              variant="outlined"
              size="small"
              startIcon={<AdminIcon />}
              onClick={() => handleLoginClick('admin')}
              sx={{ 
                color: '#171717', 
                borderColor: '#e0e0e0',
                borderRadius: 2,
                '&:hover': {
                  borderColor: '#0070f3',
                  backgroundColor: '#f5f5f5'
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
                color: '#171717', 
                borderColor: '#e0e0e0',
                borderRadius: 2,
                '&:hover': {
                  borderColor: '#0070f3',
                  backgroundColor: '#f5f5f5'
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
                color: '#171717', 
                borderColor: '#e0e0e0',
                borderRadius: 2,
                '&:hover': {
                  borderColor: '#0070f3',
                  backgroundColor: '#f5f5f5'
                }
              }}
            >
              {t('student')}
            </Button>

            {/* Language Switcher */}
            <Button
              variant="outlined"
              size="small"
              onClick={() => handleLanguageSwitch(locale === 'en' ? 'es' : 'en')}
              sx={{ 
                color: '#171717', 
                borderColor: '#e0e0e0',
                borderRadius: 2,
                px: 2,
                '&:hover': {
                  borderColor: '#0070f3',
                  backgroundColor: '#f5f5f5'
                }
              }}
            >
              {locale === 'en' ? 'ES' : 'EN'}
            </Button>
          </Stack>

          {/* Mobile Menu Button */}
          <IconButton
            onClick={() => setMobileMenuOpen(true)}
            sx={{ 
              display: { xs: 'flex', md: 'none' },
              color: '#171717',
              ml: 'auto'
            }}
          >
            <MenuIcon />
          </IconButton>
        </Container>
      </Box>

      {/* Mobile Navigation Drawer */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 280,
            backgroundColor: '#ffffff',
            borderLeft: '1px solid #e0e0e0'
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ color: '#171717', fontWeight: 600 }}>
              {t('title')}
            </Typography>
            <IconButton onClick={() => setMobileMenuOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Divider sx={{ mb: 2 }} />
          
          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={() => handleLoginClick('admin')}>
                <ListItemIcon>
                  <AdminIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary={t('admin')} />
              </ListItemButton>
            </ListItem>
            
            <ListItem disablePadding>
              <ListItemButton onClick={() => handleLoginClick('teacher')}>
                <ListItemIcon>
                  <TeacherIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary={t('teacher')} />
              </ListItemButton>
            </ListItem>
            
            <ListItem disablePadding>
              <ListItemButton onClick={() => handleLoginClick('student')}>
                <ListItemIcon>
                  <StudentIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary={t('student')} />
              </ListItemButton>
            </ListItem>
            
            <Divider sx={{ my: 2 }} />
            
            <ListItem disablePadding>
              <ListItemButton onClick={() => handleLanguageSwitch(locale === 'en' ? 'es' : 'en')}>
                <ListItemIcon>
                  <LanguageIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary={`${locale.toUpperCase()} → ${locale === 'en' ? 'ES' : 'EN'}`} />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>

      {/* Main Content with top padding for navbar */}
      <Box sx={{ pt: { xs: '56px', sm: '64px' } }}>
        {/* Hero Section */}
        <Box sx={{ 
          minHeight: { xs: '70vh', sm: '80vh' },
          display: 'flex',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #ffffff 0%, rgba(25, 118, 210, 0.05) 100%)',
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
              gap: { xs: 4, md: 6 }
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
                    color: '#171717',
                    fontWeight: 800,
                    fontSize: { xs: '2rem', sm: '2.5rem', md: '3.5rem', lg: '4rem' },
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
                    color: '#0070f3',
                    fontWeight: 600,
                    fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem', lg: '2.25rem' },
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
                    color: '#666666',
                    maxWidth: 600,
                    mb: 6,
                    fontSize: { xs: '0.9rem', sm: '1rem', md: '1.125rem' },
                    lineHeight: 1.6,
                    opacity: 0.8
                  }}
                >
                  {t('hero.description')}
                </Typography>

                {/* Demo Call to Action Button */}
                <Box sx={{ mb: 4 }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<EmailIcon />}
                    onClick={handleContactDemo}
                    sx={{ 
                      px: { xs: 3, sm: 4 }, 
                      py: { xs: 1.25, sm: 1.5 },
                      fontSize: { xs: '1rem', sm: '1.1rem' },
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
                    {t('hero.cta.demo')}
                  </Button>
                </Box>

                {/* Trust Indicators */}
                <Box sx={{ 
                  display: 'flex', 
                  gap: 1, 
                  flexWrap: 'wrap', 
                  justifyContent: { xs: 'center', md: 'flex-start' } 
                }}>
                  <Chip 
                    label="AI-Powered" 
                    color="primary" 
                    size="small"
                    sx={{ 
                      fontSize: { xs: '0.75rem', sm: '0.9rem' }, 
                      px: 1.5, 
                      py: 0.5,
                      fontWeight: 600
                    }}
                  />
                  <Chip 
                    label="Secure" 
                    variant="outlined"
                    size="small"
                    sx={{ 
                      fontSize: { xs: '0.75rem', sm: '0.9rem' }, 
                      px: 1.5, 
                      py: 0.5,
                      fontWeight: 600
                    }}
                  />
                  <Chip 
                    label="Analytics" 
                    variant="outlined"
                    size="small"
                    sx={{ 
                      fontSize: { xs: '0.75rem', sm: '0.9rem' }, 
                      px: 1.5, 
                      py: 0.5,
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
                alignItems: 'center',
                mt: { xs: 4, md: 0 }
              }}>
                <Box sx={{
                  width: '100%',
                  maxWidth: { xs: 300, sm: 350, md: 400 },
                  height: { xs: 300, sm: 350, md: 400 },
                  background: 'linear-gradient(135deg, #0070f3 0%, rgba(25, 118, 210, 0.8) 100%)',
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
                    src="/hombre-con-celular.png"
                    alt="Person with mobile phone"
                    sx={{
                      width: '100%',
                      height: '100%',
                      maxWidth: { xs: 300, sm: 350, md: 400 },
                      maxHeight: { xs: 300, sm: 350, md: 400 },
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

        {/* What is Inteliexamen Section */}
        <Box sx={{ 
          py: { xs: 8, sm: 10 },
          backgroundColor: '#ffffff'
        }}>
          <Container maxWidth="lg">
            {/* Section Header */}
            <Box sx={{ textAlign: 'center', mb: { xs: 6, sm: 8 } }}>
              <Typography 
                variant="h2" 
                component="h2" 
                gutterBottom
                sx={{ 
                  color: '#171717',
                  fontWeight: 700,
                  fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem', lg: '3rem' },
                  mb: 3
                }}
              >
                {t('whatIs.title')}
              </Typography>
              
              <Typography 
                variant="h5" 
                sx={{ 
                  color: '#666666',
                  maxWidth: 800,
                  mx: 'auto',
                  mb: 6,
                  opacity: 0.8,
                  fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
                  lineHeight: 1.6
                }}
              >
                {t('whatIs.subtitle')}
              </Typography>
            </Box>

            {/* Content Grid */}
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
              gap: { xs: 6, lg: 8 },
              alignItems: 'center',
              mb: { xs: 8, sm: 10 }
            }}>
              {/* Text Content */}
              <Box sx={{ order: { xs: 2, lg: 1 } }}>
                <Typography 
                  variant="h4" 
                  component="h3" 
                  gutterBottom
                  sx={{ 
                    color: '#171717',
                    fontWeight: 600,
                    mb: 3,
                    fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }
                  }}
                >
                  {t('whatIs.forWho.title')}
                </Typography>
                
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: '#444',
                    lineHeight: 1.7,
                    fontSize: { xs: '1rem', sm: '1.125rem' },
                    mb: 4
                  }}
                >
                  {t('whatIs.forWho.description')}
                </Typography>

                {/* Organization Types */}
                <Box sx={{ 
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 2,
                  mb: 4
                }}>
                  {[
                    { key: 'government', icon: '🏛️' },
                    { key: 'schools', icon: '🏫' },
                    { key: 'institutes', icon: '🎓' },
                    { key: 'corporations', icon: '🏢' }
                  ].map((org) => (
                    <Box 
                      key={org.key}
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        p: 2,
                        backgroundColor: '#f8f9fa',
                        borderRadius: 2,
                        border: '1px solid #e9ecef'
                      }}
                    >
                      <Typography sx={{ fontSize: '1.5rem', mr: 2 }}>
                        {org.icon}
                      </Typography>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 500,
                          color: '#495057'
                        }}
                      >
                        {t(`whatIs.organizations.${org.key}`)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* Organizations Image */}
              <Box sx={{ 
                order: { xs: 1, lg: 2 },
                display: 'flex',
                justifyContent: 'center'
              }}>
                <Box
                  component="img"
                  src="/images/what-is/organizations.png"
                  alt="Diverse organizations using Inteliexamen platform"
                  sx={{
                    width: '100%',
                    maxWidth: { xs: 300, sm: 400, md: 450 },
                    height: 'auto',
                    aspectRatio: '1/1',
                    borderRadius: 3,
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 32px rgba(0, 0, 0, 0.18)'
                    }
                  }}
                />
              </Box>
            </Box>

            {/* Ecosystem Features */}
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
              gap: { xs: 6, lg: 8 },
              alignItems: 'center',
              mb: { xs: 8, sm: 10 }
            }}>
              {/* Ecosystem Dashboard Image */}
              <Box sx={{ 
                display: 'flex',
                justifyContent: 'center'
              }}>
                <Box
                  component="img"
                  src="/images/what-is/ecosystem-dashboard.png"
                  alt="Assessment ecosystem dashboard interface"
                  sx={{
                    width: '100%',
                    maxWidth: { xs: 300, sm: 400, md: 450 },
                    height: 'auto',
                    aspectRatio: '1/1',
                    borderRadius: 3,
                    boxShadow: '0 8px 24px rgba(25, 118, 210, 0.2)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 32px rgba(25, 118, 210, 0.3)'
                    }
                  }}
                />
              </Box>

              {/* Text Content */}
              <Box>
                <Typography 
                  variant="h4" 
                  component="h3" 
                  gutterBottom
                  sx={{ 
                    color: '#171717',
                    fontWeight: 600,
                    mb: 3,
                    fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }
                  }}
                >
                  {t('whatIs.ecosystem.title')}
                </Typography>
                
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: '#444',
                    lineHeight: 1.7,
                    fontSize: { xs: '1rem', sm: '1.125rem' },
                    mb: 4
                  }}
                >
                  {t('whatIs.ecosystem.description')}
                </Typography>

                {/* Ecosystem Components */}
                <Box sx={{ 
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1.5,
                  mb: 4
                }}>
                  {['skills', 'levels', 'users', 'groups', 'assessments'].map((component) => (
                    <Chip
                      key={component}
                      label={t(`whatIs.ecosystem.components.${component}`)}
                      color="primary"
                      variant="outlined"
                      sx={{ 
                        fontSize: '0.9rem',
                        py: 0.5,
                        fontWeight: 500
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </Box>

            {/* Student Experience */}
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
              gap: { xs: 6, lg: 8 },
              alignItems: 'center'
            }}>
              {/* Text Content */}
              <Box sx={{ order: { xs: 2, lg: 1 } }}>
                <Typography 
                  variant="h4" 
                  component="h3" 
                  gutterBottom
                  sx={{ 
                    color: '#171717',
                    fontWeight: 600,
                    mb: 3,
                    fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }
                  }}
                >
                  {t('whatIs.studentExperience.title')}
                </Typography>
                
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: '#444',
                    lineHeight: 1.7,
                    fontSize: { xs: '1rem', sm: '1.125rem' },
                    mb: 4
                  }}
                >
                  {t('whatIs.studentExperience.description')}
                </Typography>

                {/* Key Benefits */}
                <Box sx={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2
                }}>
                  {['friendly', 'motivating', 'aiPowered'].map((benefit) => (
                    <Box 
                      key={benefit}
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        p: 2,
                        backgroundColor: '#f1f8e9',
                        borderRadius: 2,
                        border: '1px solid #c8e6c9'
                      }}
                    >
                      <Typography sx={{ fontSize: '1.2rem', mr: 2 }}>
                        ✨
                      </Typography>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 500,
                          color: '#2e7d32'
                        }}
                      >
                        {t(`whatIs.studentExperience.benefits.${benefit}`)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* Student Engagement Image */}
              <Box sx={{ 
                order: { xs: 1, lg: 2 },
                display: 'flex',
                justifyContent: 'center'
              }}>
                <Box
                  component="img"
                  src="/images/what-is/student-engagement.png"
                  alt="Students engaging with AI assessment platform"
                  sx={{
                    width: '100%',
                    maxWidth: { xs: 300, sm: 400, md: 450 },
                    height: 'auto',
                    aspectRatio: '1/1',
                    borderRadius: 3,
                    boxShadow: '0 8px 24px rgba(156, 39, 176, 0.2)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 32px rgba(156, 39, 176, 0.3)'
                    }
                  }}
                />
              </Box>
            </Box>
          </Container>
        </Box>

        {/* Features Section */}
        <Container maxWidth="lg" sx={{ py: { xs: 6, sm: 8 } }}>
          <Box sx={{ textAlign: 'center', mb: { xs: 6, sm: 8 } }}>
            <Typography 
              variant="h2" 
              component="h2" 
              gutterBottom
              sx={{ 
                color: '#171717',
                fontWeight: 700,
                fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem', lg: '3rem' },
                mb: 3
              }}
            >
              {t('features.title')}
            </Typography>
            
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#666666',
                maxWidth: 600,
                mx: 'auto',
                mb: 6,
                opacity: 0.8,
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }}
            >
              {t('features.subtitle')}
            </Typography>
          </Box>

          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            gap: { xs: 3, sm: 4 }
          }}>
            {features.map((feature, index) => (
              <Box key={index}>
                <Card 
                  sx={{ 
                    height: '100%',
                    backgroundColor: '#ffffff',
                    transition: 'all 0.3s ease',
                    borderRadius: 3,
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: 8
                    }
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', p: { xs: 3, sm: 4 } }}>
                    <Box sx={{ mb: 3 }}>
                      {feature.icon}
                    </Box>
                    <Typography 
                      variant="h5" 
                      component="h3" 
                      gutterBottom
                      sx={{ 
                        color: '#171717',
                        fontWeight: 600,
                        mb: 2,
                        fontSize: { xs: '1.25rem', sm: '1.5rem' }
                      }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: '#666666',
                        lineHeight: 1.6,
                        fontSize: { xs: '0.875rem', sm: '1rem' }
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
      </Box>

      {/* Contact Form Section */}
      <Box sx={{ 
        backgroundColor: '#f8f9fa',
        py: { xs: 6, sm: 8 }
      }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', mb: { xs: 4, sm: 6 } }}>
            <Typography 
              variant="h2" 
              component="h2" 
              gutterBottom
              sx={{ 
                color: '#171717',
                fontWeight: 700,
                fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
                mb: 3
              }}
            >
{t('contact.title')}
            </Typography>
            
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#666666',
                maxWidth: 500,
                mx: 'auto',
                mb: 4,
                opacity: 0.8,
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }}
            >
              {t('contact.subtitle')}
            </Typography>
          </Box>

          <ContactForm />
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ 
        backgroundColor: '#171717',
        color: 'white',
        py: { xs: 6, sm: 8 }
      }}>
        <Container maxWidth="lg">
          <Box sx={{ 
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'center', md: 'flex-start' },
            gap: { xs: 4, md: 6 }
          }}>
            {/* Company Info */}
            <Box sx={{ 
              textAlign: { xs: 'center', md: 'left' },
              flex: 1
            }}>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 700,
                  mb: 2,
                  color: 'white'
                }}
              >
                {t('title')}
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.8)',
                  maxWidth: 400,
                  lineHeight: 1.6
                }}
              >
                {t('subtitle')}
              </Typography>
            </Box>

            {/* Legal Links */}
            <Box sx={{ 
              textAlign: { xs: 'center', md: 'right' },
              flex: 1
            }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600,
                  mb: 2,
                  color: 'white'
                }}
              >
                {t('footer.legal')}
              </Typography>
              <Box sx={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: 1
              }}>
                <Link
                  href={`/${locale}/privacy`}
                  sx={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    textDecoration: 'none',
                    '&:hover': {
                      color: 'white',
                      textDecoration: 'underline'
                    }
                  }}
                >
                  {t('footer.privacyPolicy')}
                </Link>
              </Box>
            </Box>

            {/* Contact Info */}
            <Box sx={{ 
              textAlign: { xs: 'center', md: 'right' },
              flex: 1
            }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600,
                  mb: 2,
                  color: 'white'
                }}
              >
                {t('footer.contact')}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.8)',
                  lineHeight: 1.6
                }}
              >
                albertoramirezpuicon@gmail.com
              </Typography>
            </Box>
          </Box>

          {/* Copyright */}
          <Box sx={{ 
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            mt: 6,
            pt: 3,
            textAlign: 'center'
          }}>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.6)'
              }}
            >
              © 2025 Inteliexamen. {t('footer.allRightsReserved')}
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Login Modal */}
      <Modal
        open={loginModal.open}
        onClose={handleCloseModal}
        aria-labelledby="login-modal-title"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 1, sm: 2 }
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
            p: { xs: 3, sm: 4 }, 
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

      {/* Floating WhatsApp Button */}
      <IconButton
        onClick={handleWhatsAppContact}
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          backgroundColor: '#25D366',
          color: 'white',
          width: 60,
          height: 60,
          boxShadow: '0 4px 12px rgba(37, 211, 102, 0.4)',
          zIndex: 1000,
          '&:hover': {
            backgroundColor: '#20c05a',
            boxShadow: '0 6px 16px rgba(37, 211, 102, 0.6)',
            transform: 'scale(1.1)'
          },
          transition: 'all 0.3s ease'
        }}
        aria-label="Contact us on WhatsApp"
      >
        <WhatsAppIcon sx={{ fontSize: 30 }} />
      </IconButton>
    </div>
  );
} 