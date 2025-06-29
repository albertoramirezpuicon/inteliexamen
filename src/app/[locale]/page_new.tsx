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
  Grid,
  Card,
  CardContent,
  Chip
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
  Psychology as PsychologyIcon
} from '@mui/icons-material';
import LoginFormWrapper from '@/components/auth/LoginFormWrapper';

export default function LandingPage() {
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [loginModal, setLoginModal] = useState<{
    open: boolean;
    userType: 'admin' | 'teacher' | 'student' | null;
  }>({
    open: false,
    userType: null
  });

  const handleLanguageSwitch = () => {
    setLanguage(language === 'en' ? 'es' : 'en');
    // Here you would typically update the URL or use a router to change the locale
    // For now, we'll just update the state
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

  const getText = (key: string) => {
    const texts = {
      en: {
        title: "Inteliexamen",
        subtitle: "AI-Powered Educational Assessment Platform",
        description: "Experience the future of educational assessment with our intelligent platform that adapts to student needs and provides comprehensive analytics.",
        features: {
          title: "Key Features",
          ai: "AI-Powered Assessment",
          aiDesc: "Intelligent case generation and adaptive testing",
          analytics: "Advanced Analytics",
          analyticsDesc: "Detailed insights into student performance",
          security: "Secure Platform",
          securityDesc: "Enterprise-grade security and data protection",
          speed: "Fast & Efficient",
          speedDesc: "Quick assessment creation and evaluation",
          psychology: "Educational Psychology",
          psychologyDesc: "Based on proven learning methodologies"
        },
        admin: "Administrators",
        teacher: "Teachers",
        student: "Students",
        login: "Login",
        language: "Language",
        readyToStart: "Ready to get started?",
        chooseRole: "Choose your role and start using the platform"
      },
      es: {
        title: "Inteliexamen",
        subtitle: "Plataforma de Evaluación Educativa con IA",
        description: "Experimenta el futuro de la evaluación educativa con nuestra plataforma inteligente que se adapta a las necesidades de los estudiantes y proporciona analíticas completas.",
        features: {
          title: "Características Principales",
          ai: "Evaluación con IA",
          aiDesc: "Generación inteligente de casos y pruebas adaptativas",
          analytics: "Analíticas Avanzadas",
          analyticsDesc: "Información detallada sobre el rendimiento estudiantil",
          security: "Plataforma Segura",
          securityDesc: "Seguridad empresarial y protección de datos",
          speed: "Rápida y Eficiente",
          speedDesc: "Creación y evaluación rápida de evaluaciones",
          psychology: "Psicología Educativa",
          psychologyDesc: "Basada en metodologías de aprendizaje probadas"
        },
        admin: "Administración",
        teacher: "Docentes",
        student: "Estudiantes",
        login: "Iniciar Sesión",
        language: "Idioma",
        readyToStart: "¿Listo para comenzar?",
        chooseRole: "Elige tu rol y comienza a usar la plataforma"
      }
    };
    return texts[language][key as keyof typeof texts.en] || key;
  };

  const features = [
    {
      icon: <AIIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: getText('features.ai'),
      description: getText('features.aiDesc')
    },
    {
      icon: <AnalyticsIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: getText('features.analytics'),
      description: getText('features.analyticsDesc')
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: getText('features.security'),
      description: getText('features.securityDesc')
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: getText('features.speed'),
      description: getText('features.speedDesc')
    },
    {
      icon: <PsychologyIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: getText('features.psychology'),
      description: getText('features.psychologyDesc')
    }
  ];

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      {/* Navbar */}
      <AppBar position="static" elevation={0} sx={{ backgroundColor: 'transparent' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>
            {getText('title')}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Language Switcher */}
            <Button
              variant="outlined"
              startIcon={<LanguageIcon />}
              onClick={handleLanguageSwitch}
              sx={{ 
                color: 'var(--text-primary)', 
                borderColor: 'var(--border)',
                '&:hover': {
                  borderColor: 'var(--primary)',
                  backgroundColor: 'var(--hover)'
                }
              }}
            >
              {language.toUpperCase()}
            </Button>

            {/* Login Buttons */}
            <Button
              variant="outlined"
              startIcon={<AdminIcon />}
              onClick={() => handleLoginClick('admin')}
              sx={{ 
                color: 'var(--text-primary)', 
                borderColor: 'var(--border)',
                '&:hover': {
                  borderColor: 'var(--primary)',
                  backgroundColor: 'var(--hover)'
                }
              }}
            >
              {getText('admin')}
            </Button>

            <Button
              variant="outlined"
              startIcon={<TeacherIcon />}
              onClick={() => handleLoginClick('teacher')}
              sx={{ 
                color: 'var(--text-primary)', 
                borderColor: 'var(--border)',
                '&:hover': {
                  borderColor: 'var(--primary)',
                  backgroundColor: 'var(--hover)'
                }
              }}
            >
              {getText('teacher')}
            </Button>

            <Button
              variant="outlined"
              startIcon={<StudentIcon />}
              onClick={() => handleLoginClick('student')}
              sx={{ 
                color: 'var(--text-primary)', 
                borderColor: 'var(--border)',
                '&:hover': {
                  borderColor: 'var(--primary)',
                  backgroundColor: 'var(--hover)'
                }
              }}
            >
              {getText('student')}
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography 
            variant="h2" 
            component="h1" 
            gutterBottom
            sx={{ 
              color: 'var(--text-primary)',
              fontWeight: 'bold',
              mb: 3
            }}
          >
            {getText('title')}
          </Typography>
          
          <Typography 
            variant="h4" 
            component="h2" 
            gutterBottom
            sx={{ 
              color: 'var(--primary)',
              mb: 3
            }}
          >
            {getText('subtitle')}
          </Typography>
          
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'var(--text-secondary)',
              maxWidth: 800,
              mx: 'auto',
              mb: 4
            }}
          >
            {getText('description')}
          </Typography>

          <Chip 
            label="AI-Powered" 
            color="primary" 
            size="large"
            sx={{ fontSize: '1.1rem', px: 2, py: 1 }}
          />
        </Box>

        {/* Features Section */}
        <Box sx={{ mb: 8 }}>
          <Typography 
            variant="h3" 
            component="h2" 
            align="center" 
            gutterBottom
            sx={{ 
              color: 'var(--text-primary)',
              mb: 6
            }}
          >
            {getText('features.title')}
          </Typography>

          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card 
                  sx={{ 
                    height: '100%',
                    backgroundColor: 'var(--card-background)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                    }
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <Box sx={{ mb: 2 }}>
                      {feature.icon}
                    </Box>
                    <Typography 
                      variant="h6" 
                      component="h3" 
                      gutterBottom
                      sx={{ color: 'var(--text-primary)' }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ color: 'var(--text-secondary)' }}
                    >
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Call to Action */}
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography 
            variant="h4" 
            component="h2" 
            gutterBottom
            sx={{ color: 'var(--text-primary)', mb: 3 }}
          >
            {getText('readyToStart')}
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ color: 'var(--text-secondary)', mb: 4 }}
          >
            {getText('chooseRole')}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<AdminIcon />}
              onClick={() => handleLoginClick('admin')}
              sx={{ px: 4, py: 1.5 }}
            >
              {getText('admin')} {getText('login')}
            </Button>
            
            <Button
              variant="contained"
              size="large"
              startIcon={<TeacherIcon />}
              onClick={() => handleLoginClick('teacher')}
              sx={{ px: 4, py: 1.5 }}
            >
              {getText('teacher')} {getText('login')}
            </Button>
            
            <Button
              variant="contained"
              size="large"
              startIcon={<StudentIcon />}
              onClick={() => handleLoginClick('student')}
              sx={{ px: 4, py: 1.5 }}
            >
              {getText('student')} {getText('login')}
            </Button>
          </Box>
        </Box>
      </Container>

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
      >
        <Paper 
          sx={{ 
            p: 4, 
            maxWidth: 500, 
            width: '100%',
            position: 'relative',
            backgroundColor: 'var(--card-background)'
          }}
        >
          <IconButton
            onClick={handleCloseModal}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'var(--text-secondary)'
            }}
          >
            <CloseIcon />
          </IconButton>
          
          <Typography 
            variant="h5" 
            component="h2" 
            gutterBottom
            sx={{ color: 'var(--text-primary)', mb: 3 }}
          >
            {getText('login')} - {loginModal.userType && getText(loginModal.userType)}
          </Typography>
          
          {loginModal.userType && (
            <LoginFormWrapper userType={loginModal.userType} />
          )}
        </Paper>
      </Modal>
    </Box>
  );
}
