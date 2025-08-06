/**
 * PRIVACY POLICY PAGE - LEGAL COMPLIANCE
 * 
 * PURPOSE: Display privacy policy and data protection information
 * 
 * CONNECTIONS:
 * - Accessible from main landing page footer
 * - Legal compliance page for data protection regulations
 * - Available in both English and Spanish
 * 
 * KEY FEATURES:
 * - Comprehensive privacy policy
 * - Data collection and usage information
 * - User rights and contact information
 * - GDPR and data protection compliance
 * 
 * NAVIGATION FLOW:
 * - Accessible from footer links
 * - Standalone legal page
 * - Return to main site functionality
 */

'use client';

import { 
  Box, 
  Container, 
  Typography, 
  Paper,
  Breadcrumbs,
  Link,
  Divider,
  IconButton
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  WhatsApp as WhatsAppIcon
} from '@mui/icons-material';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';

export default function PrivacyPolicyPage() {
  const t = useTranslations('privacy');
  const tLanding = useTranslations('landing');
  const locale = useLocale();
  const router = useRouter();

  const handleBackToHome = () => {
    router.push(`/${locale}`);
  };

  const handleWhatsAppContact = () => {
    const phoneNumber = '51949358364';
    const message = 'I am interested in know more about inteliexamen';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      {/* Header */}
      <Box sx={{ 
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #e0e0e0',
        py: 3
      }}>
        <Container maxWidth="lg">
          <Breadcrumbs sx={{ mb: 2 }}>
            <Link 
              component="button" 
              onClick={handleBackToHome}
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                color: 'primary.main',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              <ArrowBackIcon sx={{ mr: 0.5, fontSize: 16 }} />
              {t('backToHome')}
            </Link>
            <Typography color="text.primary">{t('title')}</Typography>
          </Breadcrumbs>
          
          <Typography 
            variant="h3" 
            component="h1"
            sx={{ 
              color: '#171717',
              fontWeight: 700,
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
            }}
          >
            {t('title')}
          </Typography>
          
          <Typography 
            variant="h6" 
            sx={{ 
              color: '#666666',
              mt: 2,
              opacity: 0.8
            }}
          >
            {t('lastUpdated')}
          </Typography>
        </Container>
      </Box>

      {/* Content */}
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Paper sx={{ p: { xs: 3, sm: 4, md: 6 }, borderRadius: 3 }}>
          {/* Introduction */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, color: '#171717' }}>
              {t('sections.introduction.title')}
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.7, color: '#444' }}>
              {t('sections.introduction.content')}
            </Typography>
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* Information We Collect */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, color: '#171717' }}>
              {t('sections.dataCollection.title')}
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.7, color: '#444', mb: 2 }}>
              {t('sections.dataCollection.intro')}
            </Typography>
            
            <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600, color: '#171717', mt: 3 }}>
              {t('sections.dataCollection.personalInfo.title')}
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.7, color: '#444' }}>
              {t('sections.dataCollection.personalInfo.content')}
            </Typography>

            <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600, color: '#171717', mt: 3 }}>
              {t('sections.dataCollection.usageData.title')}
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.7, color: '#444' }}>
              {t('sections.dataCollection.usageData.content')}
            </Typography>
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* How We Use Information */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, color: '#171717' }}>
              {t('sections.dataUsage.title')}
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.7, color: '#444' }}>
              {t('sections.dataUsage.content')}
            </Typography>
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* Information Sharing */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, color: '#171717' }}>
              {t('sections.dataSharing.title')}
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.7, color: '#444' }}>
              {t('sections.dataSharing.content')}
            </Typography>
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* Data Security */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, color: '#171717' }}>
              {t('sections.dataSecurity.title')}
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.7, color: '#444' }}>
              {t('sections.dataSecurity.content')}
            </Typography>
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* Your Rights */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, color: '#171717' }}>
              {t('sections.userRights.title')}
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.7, color: '#444' }}>
              {t('sections.userRights.content')}
            </Typography>
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* Cookies */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, color: '#171717' }}>
              {t('sections.cookies.title')}
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.7, color: '#444' }}>
              {t('sections.cookies.content')}
            </Typography>
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* Changes to Policy */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, color: '#171717' }}>
              {t('sections.policyChanges.title')}
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.7, color: '#444' }}>
              {t('sections.policyChanges.content')}
            </Typography>
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* Contact Information */}
          <Box sx={{ 
            backgroundColor: '#f8f9fa', 
            p: 3, 
            borderRadius: 2,
            border: '1px solid #e0e0e0'
          }}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, color: '#171717' }}>
              {t('sections.contact.title')}
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.7, color: '#444', mb: 2 }}>
              {t('sections.contact.content')}
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.7, color: '#444' }}>
              <strong>{t('sections.contact.email')}</strong> albertoramirezpuicon@gmail.com
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.7, color: '#444' }}>
              <strong>{t('sections.contact.company')}</strong> Inteliexamen
            </Typography>
          </Box>
        </Paper>
      </Container>

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
                {tLanding('title')}
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.8)',
                  maxWidth: 400,
                  lineHeight: 1.6
                }}
              >
                {tLanding('subtitle')}
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
                {tLanding('footer.legal')}
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
                  {tLanding('footer.privacyPolicy')}
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
                {tLanding('footer.contact')}
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
              © 2025 Inteliexamen. {tLanding('footer.allRightsReserved')}
            </Typography>
          </Box>
        </Container>
      </Box>

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
    </Box>
  );
}
