import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Card, 
  CardContent, 
  Divider,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';

interface CaseSection {
  title: string;
  content: string;
  order: number;
}

interface CaseSections {
  context: CaseSection;
  main_scenario: CaseSection;
  questions: CaseSection;
}

interface CaseSectionsMetadata {
  section_order: string[];
  section_titles: Record<string, string>;
  last_updated: string;
}

interface CaseSectionEditorProps {
  caseText: string;
  caseSections?: CaseSections;
  caseNavigationEnabled?: boolean;
  onSectionsChange: (sections: CaseSections, metadata: CaseSectionsMetadata) => void;
  onNavigationToggle: (enabled: boolean) => void;
  onGenerateQuestions: () => Promise<string>;
  isGeneratingQuestions?: boolean;
}

const defaultSections: CaseSections = {
  context: {
    title: 'Context',
    content: '',
    order: 1
  },
  main_scenario: {
    title: 'Main Scenario',
    content: '',
    order: 2
  },
  questions: {
    title: 'Questions',
    content: '',
    order: 3
  }
};

const defaultMetadata: CaseSectionsMetadata = {
  section_order: ['context', 'main_scenario', 'questions'],
  section_titles: {
    context: 'Context',
    main_scenario: 'Main Scenario',
    questions: 'Questions'
  },
  last_updated: new Date().toISOString()
};

export default function CaseSectionEditor({
  caseText,
  caseSections = defaultSections,
  caseNavigationEnabled = false,
  onSectionsChange,
  onNavigationToggle,
  onGenerateQuestions,
  isGeneratingQuestions = false
}: CaseSectionEditorProps) {
  const [sections, setSections] = useState<CaseSections>(caseSections || defaultSections);
  const [metadata, setMetadata] = useState<CaseSectionsMetadata>(defaultMetadata);

  // Initialize metadata from props when available
  useEffect(() => {
    // If we have case sections, we should also have metadata
    if (caseSections) {
      console.log('Sections initialized, ensuring metadata is set');
      // Keep the existing metadata or use default
    }
  }, [caseSections]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Initialize sections and metadata from props when they change
  useEffect(() => {
    if (caseSections) {
      console.log('Initializing sections from props:', caseSections);
      setSections(caseSections);
    }
  }, [caseSections]);

  // Initialize sections from case text only if no existing sections
  useEffect(() => {
    if (caseText && !caseSections && (!sections || (!sections.context.content && !sections.main_scenario.content && !sections.questions.content))) {
      console.log('No existing sections found, initializing from case text');
      const splitSections = splitCaseTextIntoSections(caseText);
      setSections(splitSections);
    }
  }, [caseText, caseSections, sections]);



  // Auto-populate sections when case navigation is enabled and there's case text (only if no existing sections)
  useEffect(() => {
    if (caseNavigationEnabled && caseText && !caseSections && (!sections || (!sections.context.content && !sections.main_scenario.content && !sections.questions.content))) {
      console.log('Auto-populating sections from case text due to navigation enabled');
      const splitSections = splitCaseTextIntoSections(caseText);
      setSections(splitSections);
      
      // Auto-save the sections immediately
      const updatedMetadata = {
        ...metadata,
        last_updated: new Date().toISOString()
      };
      onSectionsChange(splitSections, updatedMetadata);
    }
  }, [caseNavigationEnabled, caseText, caseSections, sections]);

  // Ensure sections is never null
  useEffect(() => {
    if (!sections) {
      setSections(defaultSections);
    }
  }, [sections]);

  // Debug logging
  useEffect(() => {
    console.log('CaseSectionEditor state:', {
      caseNavigationEnabled,
      hasCaseSections: !!caseSections,
      sectionsContent: sections ? {
        context: sections.context.content.length,
        main_scenario: sections.main_scenario.content.length,
        questions: sections.questions.content.length
      } : 'no sections'
    });
  }, [caseNavigationEnabled, caseSections, sections]);

  const splitCaseTextIntoSections = (text: string): CaseSections => {
    console.log('Splitting case text:', text.substring(0, 200) + '...');
    
    // Use intelligent pattern matching for different section types
    const sectionPatterns = {
      context: [
        /<<CONTEXT:?\s*>>/i,
        /<<CONTEXTO:?\s*>>/i,
        /<<ANTECEDENTES:?\s*>>/i,
        /<<BACKGROUND:?\s*>>/i,
        /<<SITUACIÓN:?\s*>>/i,
        /<<SITUATION:?\s*>>/i,
        /<<MARCO:?\s*>>/i,
        /<<FRAMEWORK:?\s*>>/i
      ],
      scenario: [
        /<<MAIN SCENARIO:?\s*>>/i,
        /<<CASE SCENARIO:?\s*>>/i,
        /<<ESCENARIO:?\s*>>/i,
        /<<ESCENARIO DEL CASO:?\s*>>/i,
        /<<ESCENARIO PRINCIPAL:?\s*>>/i,
        /<<SCENARIO:?\s*>>/i,
        /<<CASO:?\s*>>/i,
        /<<CASE:?\s*>>/i,
        /<<PROBLEMA:?\s*>>/i,
        /<<PROBLEM:?\s*>>/i,
        /<<DESCRIPCIÓN:?\s*>>/i,
        /<<DESCRIPTION:?\s*>>/i
      ],
      questions: [
        /<<QUESTIONS:?\s*>>/i,
        /<<PREGUNTAS:?\s*>>/i,
        /<<TU TAREA:?\s*>>/i,
        /<<YOUR TASK:?\s*>>/i,
        /<<TAREA:?\s*>>/i,
        /<<TASK:?\s*>>/i,
        /<<ACTIVIDAD:?\s*>>/i,
        /<<ACTIVITY:?\s*>>/i,
        /<<EJERCICIO:?\s*>>/i,
        /<<EXERCISE:?\s*>>/i,
        /<<CONSIGNA:?\s*>>/i,
        /<<INSTRUCTION:?\s*>>/i,
        /<<INSTRUCCIONES:?\s*>>/i,
        /<<INSTRUCTIONS:?\s*>>/i,
        /<<OBJETIVO:?\s*>>/i,
        /<<OBJECTIVE:?\s*>>/i,
        /<<OBJETIVOS:?\s*>>/i,
        /<<OBJECTIVES:?\s*>>/i
      ]
    };

    // Find all section markers in the text
    const allMarkers = text.match(/<<[^>]+:?\s*>>/gi) || [];
    console.log('All markers found in text:', allMarkers);

    // Categorize markers by type
    const categorizedMarkers = allMarkers.map(marker => {
      const markerLower = marker.toLowerCase();
      if (sectionPatterns.context.some(pattern => pattern.test(marker))) {
        return { type: 'context', marker, pattern: marker };
      } else if (sectionPatterns.scenario.some(pattern => pattern.test(marker))) {
        return { type: 'scenario', marker, pattern: marker };
      } else if (sectionPatterns.questions.some(pattern => pattern.test(marker))) {
        return { type: 'questions', marker, pattern: marker };
      } else {
        return { type: 'unknown', marker, pattern: marker };
      }
    });

    console.log('Categorized markers:', categorizedMarkers);

    // Extract content using the found markers
    let contextContent = '';
    let scenarioContent = '';
    let questionsContent = '';

    // Sort markers by their position in the text
    const sortedMarkers = categorizedMarkers
      .map(item => ({ ...item, position: text.indexOf(item.marker) }))
      .filter(item => item.position !== -1)
      .sort((a, b) => a.position - b.position);

    console.log('Sorted markers by position:', sortedMarkers);

    // Extract content between markers
    for (let i = 0; i < sortedMarkers.length; i++) {
      const currentMarker = sortedMarkers[i];
      const nextMarker = sortedMarkers[i + 1];
      
      const startPos = text.indexOf(currentMarker.marker) + currentMarker.marker.length;
      const endPos = nextMarker ? text.indexOf(nextMarker.marker) : text.length;
      
      const content = text.substring(startPos, endPos).trim();
      
      switch (currentMarker.type) {
        case 'context':
          contextContent = content;
          break;
        case 'scenario':
          scenarioContent = content;
          break;
        case 'questions':
          questionsContent = content;
          break;
      }
    }
    
    // If no explicit markers found, try to detect sections by academic headers
    if (!contextContent && !scenarioContent && !questionsContent) {
      console.log('No explicit markers found, trying to detect sections by academic headers');
      
      // Academic header patterns for different languages and contexts
      const academicHeaders = {
        context: [
          /^(?:contexto|context|antecedentes|background|situación|situation|marco|framework)/i
        ],
        scenario: [
          /^(?:escenario|scenario|caso|case|situación|situation|problema|problem|descripción|description)/i
        ],
        questions: [
          /^(?:preguntas|questions|tu tarea|your task|tarea|task|actividad|activity|ejercicio|exercise|consigna|instruction|instrucciones|instructions|objetivo|objective|objetivos|objectives)/i
        ]
      };

      // Split text into lines and look for headers
      const lines = text.split('\n');
      let currentSection = 'scenario'; // Default to scenario
      let currentContent = '';
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Check if this line looks like a header (all caps, bold, or followed by colon)
        const isHeader = /^[A-ZÁÉÍÓÚÑ\s]+$/.test(line) || 
                        /^[A-ZÁÉÍÓÚÑ\s]+:$/.test(line) ||
                        /^\*\*[^*]+\*\*$/.test(line) ||
                        /^[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ\s]+:$/.test(line);
        
        if (isHeader) {
          // Determine which section this header belongs to
          let detectedSection = 'scenario'; // Default
          
          for (const [sectionType, patterns] of Object.entries(academicHeaders)) {
            if (patterns.some(pattern => pattern.test(line))) {
              detectedSection = sectionType;
              break;
            }
          }
          
          // If we're switching sections, save the current content
          if (currentSection !== detectedSection && currentContent.trim()) {
            switch (currentSection) {
              case 'context':
                contextContent = currentContent.trim();
                break;
              case 'scenario':
                scenarioContent = currentContent.trim();
                break;
              case 'questions':
                questionsContent = currentContent.trim();
                break;
            }
            currentContent = '';
          }
          
          currentSection = detectedSection;
        } else {
          // Add line to current section content
          currentContent += (currentContent ? '\n' : '') + line;
        }
      }
      
      // Save the last section
      if (currentContent.trim()) {
        switch (currentSection) {
          case 'context':
            contextContent = currentContent.trim();
            break;
          case 'scenario':
            scenarioContent = currentContent.trim();
            break;
          case 'questions':
            questionsContent = currentContent.trim();
            break;
        }
      }
    }
    
    console.log('Content extraction results:', {
      contextLength: contextContent.length,
      scenarioLength: scenarioContent.length,
      questionsLength: questionsContent.length
    });
    
    // If still no sections found, fallback to putting everything in main scenario
    if (!contextContent && !scenarioContent && !questionsContent) {
      console.log('No sections found, putting everything in main scenario');
      scenarioContent = text.trim();
    }

    const result = {
      context: {
        title: 'Context',
        content: contextContent,
        order: 1
      },
      main_scenario: {
        title: 'Main Scenario',
        content: scenarioContent,
        order: 2
      },
      questions: {
        title: 'Questions',
        content: questionsContent,
        order: 3
      }
    };
    
    console.log('Final split result:', {
      contextLength: result.context.content.length,
      scenarioLength: result.main_scenario.content.length,
      questionsLength: result.questions.content.length
    });
    
    return result;
  };

  const handleSectionChange = (sectionId: keyof CaseSections, field: 'title' | 'content', value: string) => {
    setSections(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [field]: value
      }
    }));

    // Update metadata
    if (field === 'title') {
      setMetadata(prev => ({
        ...prev,
        section_titles: {
          ...prev.section_titles,
          [sectionId]: value
        },
        last_updated: new Date().toISOString()
      }));
    }
  };

  // Safety check to ensure sections is always defined
  if (!sections) {
    return (
      <Box sx={{ width: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Navigation Toggle */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Case Navigation</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  if (caseText) {
                    console.log('Manually regenerating sections from case text');
                    const splitSections = splitCaseTextIntoSections(caseText);
                    setSections(splitSections);
                    
                    // Auto-save the sections immediately
                    const updatedMetadata = {
                      ...metadata,
                      last_updated: new Date().toISOString()
                    };
                    onSectionsChange(splitSections, updatedMetadata);
                    
                    setSuccess('Sections have been regenerated from the case text.');
                    setTimeout(() => setSuccess(null), 4000);
                  } else {
                    setError('No case text available to regenerate sections from.');
                    setTimeout(() => setError(null), 4000);
                  }
                }}
                disabled={!caseText}
              >
                Regenerate Sections
              </Button>
              <FormControlLabel
                control={
                  <Switch
                    checked={caseNavigationEnabled}
                    onChange={(e) => {
                      console.log('Navigation toggle changed:', e.target.checked);
                      onNavigationToggle(e.target.checked);
                      
                      // Show success message when enabling navigation
                      if (e.target.checked && caseText) {
                        setSuccess('Case navigation enabled! Sections have been automatically populated from the case text.');
                        setTimeout(() => setSuccess(null), 4000);
                      }
                    }}
                    color="primary"
                  />
                }
                label="Enable case navigation for students"
              />
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary">
            When enabled, students will see a navigation menu to jump between different sections of the case.
          </Typography>
        </CardContent>
      </Card>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Section Editor */}
      {caseNavigationEnabled && (
        <Box>
          {/* Sections */}
          {(['context', 'main_scenario', 'questions'] as const).map((sectionId) => (
            <Accordion key={sectionId} defaultExpanded sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Chip 
                    label={sections[sectionId].order} 
                    size="small" 
                    color="primary" 
                  />
                  <Typography variant="h6">
                    {sections[sectionId].title}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Section Title"
                    value={sections[sectionId].title}
                    onChange={(e) => handleSectionChange(sectionId, 'title', e.target.value)}
                    size="small"
                  />
                  <TextField
                    fullWidth
                    label="Section Content"
                    value={sections[sectionId].content}
                    onChange={(e) => handleSectionChange(sectionId, 'content', e.target.value)}
                    multiline
                    rows={6}
                    placeholder={`Enter the ${sections[sectionId].title.toLowerCase()} content...`}
                  />
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}

      {/* Preview */}
      {caseNavigationEnabled && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Preview
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
              {(['context', 'main_scenario', 'questions'] as const).map((sectionId) => (
                <Box key={sectionId} sx={{ mb: 3 }}>
                  <Typography variant="h6" color="primary" gutterBottom>
                    {sections[sectionId].title}
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {sections[sectionId].content || 'No content yet...'}
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
} 