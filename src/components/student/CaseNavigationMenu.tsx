import React from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { 
  Book as BookIcon,
  Assignment as AssignmentIcon,
  QuestionAnswer as QuestionIcon
} from '@mui/icons-material';

interface CaseNavigationMenuProps {
  sections: {
    context: { title: string; content: string; order: number };
    main_scenario: { title: string; content: string; order: number };
    questions: { title: string; content: string; order: number };
  };
  activeSection: string;
  onSectionClick: (sectionId: string) => void;
}

const sectionIcons = {
  context: BookIcon,
  main_scenario: AssignmentIcon,
  questions: QuestionIcon
};

const sectionColors = {
  context: 'primary',
  main_scenario: 'secondary',
  questions: 'success'
} as const;

export default function CaseNavigationMenu({ 
  sections, 
  activeSection, 
  onSectionClick 
}: CaseNavigationMenuProps) {
  const sectionOrder = ['context', 'main_scenario', 'questions'];

  return (
    <Box sx={{ 
      mb: 2, 
      p: 2, 
      backgroundColor: 'grey.50', 
      borderRadius: 1,
      border: 1,
      borderColor: 'divider'
    }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 'bold' }}>
        Case Navigation
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {sectionOrder.map((sectionId) => {
          const section = sections[sectionId as keyof typeof sections];
          const IconComponent = sectionIcons[sectionId as keyof typeof sectionIcons];
          const color = sectionColors[sectionId as keyof typeof sectionColors];
          const isActive = activeSection === sectionId;

          return (
            <Chip
              key={sectionId}
              icon={<IconComponent />}
              label={section.title}
              color={color}
              variant={isActive ? 'filled' : 'outlined'}
              onClick={() => onSectionClick(sectionId)}
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: isActive ? undefined : 'grey.100'
                },
                fontWeight: isActive ? 'bold' : 'normal'
              }}
            />
          );
        })}
      </Box>
    </Box>
  );
} 