import React, { useRef, useEffect } from 'react';
import { Box, Typography, Divider, IconButton } from '@mui/material';
import { 
  Block as BlockIcon,
  KeyboardArrowUp as ArrowUpIcon
} from '@mui/icons-material';

interface CaseSectionViewerProps {
  sections: {
    context: { title: string; content: string; order: number };
    main_scenario: { title: string; content: string; order: number };
    questions: { title: string; content: string; order: number };
  };
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
}

export default function CaseSectionViewer({ 
  sections, 
  activeSection, 
  onSectionChange 
}: CaseSectionViewerProps) {
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  const sectionOrder = ['context', 'main_scenario', 'questions'];

  // Scroll to section when activeSection changes
  useEffect(() => {
    const targetRef = sectionRefs.current[activeSection];
    if (targetRef && containerRef.current) {
      const container = containerRef.current;
      const target = targetRef;
      
      const containerRect = container.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      
      const scrollTop = container.scrollTop + (targetRect.top - containerRect.top) - 20;
      
      container.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      });
    }
  }, [activeSection]);

  // Handle scroll to detect which section is currently visible
  const handleScroll = () => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const containerTop = containerRect.top;

    let currentSection = activeSection;
    let minDistance = Infinity;

    sectionOrder.forEach((sectionId) => {
      const sectionRef = sectionRefs.current[sectionId];
      if (sectionRef) {
        const sectionRect = sectionRef.getBoundingClientRect();
        const distance = Math.abs(sectionRect.top - containerTop);
        
        if (distance < minDistance) {
          minDistance = distance;
          currentSection = sectionId;
        }
      }
    });

    if (currentSection !== activeSection) {
      onSectionChange(currentSection);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [activeSection]);

  const scrollToTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  return (
    <Box sx={{ position: 'relative', height: '100%' }}>
      {/* Scroll to top button */}
      <IconButton
        onClick={scrollToTop}
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 10,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 1)'
          }
        }}
        size="small"
      >
        <ArrowUpIcon />
      </IconButton>

      {/* Case sections container */}
      <Box
        ref={containerRef}
        sx={{
          height: '100%',
          overflow: 'auto',
          pr: 1
        }}
      >
        {sectionOrder.map((sectionId) => {
          const section = sections[sectionId as keyof typeof sections];
          const isActive = activeSection === sectionId;

          return (
            <Box
              key={sectionId}
              ref={(el) => (sectionRefs.current[sectionId] = el)}
              sx={{
                mb: 3,
                p: 2,
                backgroundColor: isActive ? 'primary.light' : 'grey.50',
                borderRadius: 1,
                border: isActive ? 2 : 1,
                borderColor: isActive ? 'primary.main' : 'divider',
                transition: 'all 0.2s ease-in-out',
                position: 'relative'
              }}
            >
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  color: isActive ? 'primary.dark' : 'text.primary',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                {section.title}
              </Typography>
              
              <Divider sx={{ mb: 2 }} />
              
              <Typography
                variant="body1"
                sx={{
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.6,
                  color: isActive ? 'text.primary' : 'text.secondary'
                }}
              >
                {section.content}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* Copy protection overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 5
        }}
      >
        <IconButton
          size="small"
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: 'grey.500',
            pointerEvents: 'none'
          }}
          disabled
        >
          <BlockIcon />
        </IconButton>
      </Box>
    </Box>
  );
} 