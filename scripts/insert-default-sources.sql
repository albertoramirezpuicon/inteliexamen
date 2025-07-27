-- Insert Default Curated Sources
-- This script adds pre-curated sources for different skill categories

-- Leadership Sources
INSERT INTO inteli_sources (title, authors, publication_year, source_type, url, description, is_custom) VALUES
('The Leadership Challenge', 'James M. Kouzes, Barry Z. Posner', 2017, 'book', 'https://www.wiley.com/en-us/The+Leadership+Challenge%3A+How+to+Make+Extraordinary+Things+Happen+in+Organizations%2C+6th+Edition-p-9781119278962', 'Comprehensive framework for leadership development with five practices of exemplary leadership', FALSE),
('Harvard Business Review on Leadership', 'Various Authors', 2020, 'journal_article', 'https://hbr.org/topic/leadership', 'Collection of research-based articles on modern leadership practices', FALSE),
('Transformational Leadership Theory', 'Bernard M. Bass', 1985, 'framework', 'https://www.sciencedirect.com/science/article/abs/pii/1048984385900219', 'Framework for understanding transformational vs transactional leadership', FALSE),
('Servant Leadership: A Journey into the Nature of Legitimate Power and Greatness', 'Robert K. Greenleaf', 1977, 'book', 'https://www.greenleaf.org/books-resources/books/servant-leadership.html', 'Foundational work on servant leadership philosophy', FALSE),
('The 7 Habits of Highly Effective People', 'Stephen R. Covey', 1989, 'book', 'https://www.stephencovey.com/7habits/7habits.php', 'Personal and professional effectiveness framework', FALSE),
('Emotional Intelligence: Why It Can Matter More Than IQ', 'Daniel Goleman', 1995, 'book', 'https://www.danielgoleman.info/books/emotional-intelligence/', 'Framework for understanding emotional intelligence in leadership', FALSE),
('Good to Great: Why Some Companies Make the Leap...And Others Don\'t', 'Jim Collins', 2001, 'book', 'https://www.jimcollins.com/books.html', 'Research on what makes companies and leaders great', FALSE),
('Leadership and Performance Beyond Expectations', 'Bernard M. Bass', 1985, 'book', 'https://www.taylorfrancis.com/books/mono/10.4324/9781315124397/leadership-performance-beyond-expectations-bernard-bass', 'Research on leadership effectiveness and performance outcomes', FALSE);

-- Communication Sources
INSERT INTO inteli_sources (title, authors, publication_year, source_type, url, description, is_custom) VALUES
('Communication Theory: Media, Technology and Society', 'David Holmes', 2005, 'book', 'https://www.sagepub.com/en-gb/nam/communication-theory/book225456', 'Comprehensive overview of communication theories and models', FALSE),
('The Art of Public Speaking', 'Stephen E. Lucas', 2020, 'book', 'https://www.mheducation.com/highered/product/art-public-speaking-lucas/M9781260092400.html', 'Practical guide for effective public speaking and presentation', FALSE),
('Nonviolent Communication: A Language of Life', 'Marshall B. Rosenberg', 2015, 'book', 'https://www.cnvc.org/learn/nvc-foundations', 'Framework for compassionate communication and conflict resolution', FALSE),
('Communication in Organizations: Basic Skills and Conversation Models', 'Lunenburg, F. C., & Ornstein, A. C.', 2012, 'book', 'https://www.cengage.com/c/communication-in-organizations-1e-lunenburg/9781133049315/', 'Organizational communication strategies and models', FALSE),
('The Communication Process: Models and Theories', 'Shannon, C. E., & Weaver, W.', 1949, 'framework', 'https://www.taylorfrancis.com/books/mono/10.4324/9781315131846/mathematical-theory-communication-claude-shannon-warren-weaver', 'Foundational communication model and theory', FALSE),
('Interpersonal Communication: Everyday Encounters', 'Julia T. Wood', 2019, 'book', 'https://www.cengage.com/c/interpersonal-communication-everyday-encounters-9e-wood/9781337566509/', 'Practical guide for interpersonal communication skills', FALSE),
('Communication and Persuasion: Central and Peripheral Routes to Attitude Change', 'Petty, R. E., & Cacioppo, J. T.', 1986, 'framework', 'https://www.taylorfrancis.com/books/mono/10.4324/9781315661465/communication-persuasion-richard-petty-john-cacioppo', 'Elaboration likelihood model for persuasive communication', FALSE),
('The Presentation of Self in Everyday Life', 'Erving Goffman', 1959, 'book', 'https://www.penguinrandomhouse.com/books/291/the-presentation-of-self-in-everyday-life-by-erving-goffman/', 'Sociological perspective on communication and self-presentation', FALSE);

-- Problem Solving Sources
INSERT INTO inteli_sources (title, authors, publication_year, source_type, url, description, is_custom) VALUES
('Design Thinking: Understanding How Designers Think and Work', 'Nigel Cross', 2011, 'book', 'https://www.bloomsbury.com/uk/design-thinking-9781847886361/', 'Framework for creative problem solving and design thinking', FALSE),
('The Art and Science of Problem Solving', 'George Pólya', 1945, 'book', 'https://press.princeton.edu/books/paperback/9780691164076/how-to-solve-it', 'Classic framework for mathematical and general problem solving', FALSE),
('Creative Problem Solving: An Introduction', 'Donald J. Treffinger', 2000, 'framework', 'https://www.routledge.com/Creative-Problem-Solving-An-Introduction/Treffinger-Isaksen-Dorval/p/book/9781882664609', 'Systematic approach to creative problem solving', FALSE),
('Six Thinking Hats', 'Edward de Bono', 1985, 'framework', 'https://www.edwarddebono.com/six-thinking-hats', 'Parallel thinking framework for problem solving and decision making', FALSE),
('The 5 Whys Technique', 'Sakichi Toyoda', 1930, 'framework', 'https://www.lean.org/lexicon/5-whys', 'Root cause analysis technique for problem solving', FALSE),
('TRIZ: The Theory of Inventive Problem Solving', 'Genrich Altshuller', 1956, 'framework', 'https://www.triz-journal.com/triz-theory-of-inventive-problem-solving/', 'Systematic approach to inventive problem solving', FALSE),
('Critical Thinking: Tools for Taking Charge of Your Professional and Personal Life', 'Richard Paul, Linda Elder', 2014, 'book', 'https://rowman.com/ISBN/9781538139521/Critical-Thinking-Tools-for-Taking-Charge-of-Your-Professional-and-Personal-Life', 'Framework for critical thinking and problem solving', FALSE),
('The McKinsey Way: Using the Techniques of the World\'s Top Strategic Consultants', 'Ethan M. Rasiel', 1999, 'book', 'https://www.mheducation.com/highered/product/mckinsey-way-rasiel/9780070534483.html', 'Consulting approach to problem solving and analysis', FALSE);

-- Project Management Sources
INSERT INTO inteli_sources (title, authors, publication_year, source_type, url, description, is_custom) VALUES
('A Guide to the Project Management Body of Knowledge (PMBOK)', 'Project Management Institute', 2021, 'framework', 'https://www.pmi.org/pmbok-guide-standards/foundational/pmbok', 'Standard framework for project management best practices', FALSE),
('The Agile Manifesto', 'Kent Beck, Mike Beedle, Arie van Bennekum, Alistair Cockburn, Ward Cunningham, Martin Fowler, James Grenning, Jim Highsmith, Andrew Hunt, Ron Jeffries, Jon Kern, Brian Marick, Robert C. Martin, Steve Mellor, Ken Schwaber, Jeff Sutherland, Dave Thomas', 2001, 'framework', 'https://agilemanifesto.org/', 'Core values and principles of agile development', FALSE),
('Scrum: The Art of Doing Twice the Work in Half the Time', 'Jeff Sutherland', 2014, 'book', 'https://www.crownpublishing.com/book/scrum/', 'Practical guide to Scrum methodology and agile project management', FALSE),
('The Lean Startup: How Today\'s Entrepreneurs Use Continuous Innovation to Create Radically Successful Businesses', 'Eric Ries', 2011, 'book', 'https://theleanstartup.com/book', 'Lean methodology for project and product development', FALSE),
('Critical Chain Project Management', 'Eliyahu M. Goldratt', 1997, 'book', 'https://www.taylorfrancis.com/books/mono/10.4324/9781315270706/critical-chain-goldratt', 'Theory of constraints applied to project management', FALSE),
('Project Management: A Systems Approach to Planning, Scheduling, and Controlling', 'Harold Kerzner', 2022, 'book', 'https://www.wiley.com/en-us/Project+Management%3A+A+Systems+Approach+to+Planning%2C+Scheduling%2C+and+Controlling%2C+13th+Edition-p-9781119803493', 'Comprehensive guide to project management systems', FALSE),
('PRINCE2: Managing Successful Projects', 'AXELOS', 2017, 'framework', 'https://www.axelos.com/best-practice-solutions/prince2', 'Process-based project management methodology', FALSE),
('The Project Manager\'s Guide to Making Successful Decisions', 'Robert A. Powell, Dennis M. Buede', 2009, 'book', 'https://www.wiley.com/en-us/The+Project+Manager%27s+Guide+to+Making+Successful+Decisions-p-9780470181567', 'Decision-making framework for project managers', FALSE);

-- Innovation Sources
INSERT INTO inteli_sources (title, authors, publication_year, source_type, url, description, is_custom) VALUES
('The Innovator\'s Dilemma: When New Technologies Cause Great Firms to Fail', 'Clayton M. Christensen', 1997, 'book', 'https://www.harpercollins.com/products/the-innovators-dilemma-clayton-m-christensen', 'Framework for understanding disruptive innovation', FALSE),
('Design Thinking: A Method for Creative Problem Solving', 'Tim Brown', 2009, 'framework', 'https://hbr.org/2008/06/design-thinking', 'Human-centered approach to innovation and problem solving', FALSE),
('The Ten Faces of Innovation: IDEO\'s Strategies for Defeating the Devil\'s Advocate and Driving Creativity Throughout Your Organization', 'Tom Kelley, Jonathan Littman', 2005, 'book', 'https://www.penguinrandomhouse.com/books/291/the-ten-faces-of-innovation-by-tom-kelley-with-jonathan-littman/', 'Strategies for fostering innovation in organizations', FALSE),
('Blue Ocean Strategy: How to Create Uncontested Market Space and Make the Competition Irrelevant', 'W. Chan Kim, Renée Mauborgne', 2005, 'book', 'https://www.blueoceanstrategy.com/books/blue-ocean-strategy/', 'Strategy framework for creating new market spaces', FALSE),
('The Art of Innovation: Lessons in Creativity from IDEO, America\'s Leading Design Firm', 'Tom Kelley', 2001, 'book', 'https://www.penguinrandomhouse.com/books/290/the-art-of-innovation-by-tom-kelley-with-jonathan-littman/', 'Practical guide to fostering innovation and creativity', FALSE),
('Innovation and Entrepreneurship', 'Peter F. Drucker', 1985, 'book', 'https://www.harpercollins.com/products/innovation-and-entrepreneurship-peter-f-drucker', 'Classic work on innovation and entrepreneurial thinking', FALSE),
('Creative Confidence: Unleashing the Creative Potential Within Us All', 'Tom Kelley, David Kelley', 2013, 'book', 'https://www.penguinrandomhouse.com/books/292/creative-confidence-by-tom-kelley-david-kelley/', 'Framework for building creative confidence and innovation skills', FALSE);

-- Strategic Thinking Sources
INSERT INTO inteli_sources (title, authors, publication_year, source_type, url, description, is_custom) VALUES
('Competitive Strategy: Techniques for Analyzing Industries and Competitors', 'Michael E. Porter', 1980, 'book', 'https://www.harpercollins.com/products/competitive-strategy-michael-e-porter', 'Framework for competitive analysis and strategic positioning', FALSE),
('The Art of Strategy: A Game Theorist\'s Guide to Success in Business and Life', 'Avinash K. Dixit, Barry J. Nalebuff', 2008, 'book', 'https://www.penguinrandomhouse.com/books/293/the-art-of-strategy-by-avinash-k-dixit-barry-j-nalebuff/', 'Game theory approach to strategic thinking', FALSE),
('Strategy Safari: A Guided Tour Through The Wilds of Strategic Management', 'Henry Mintzberg, Bruce Ahlstrand, Joseph Lampel', 1998, 'book', 'https://www.pearson.com/en-us/subject-catalog/p/strategy-safari-a-guided-tour-through-the-wilds-of-strategic-management/P200000000456/9780273719588', 'Comprehensive overview of strategic management approaches', FALSE),
('The Balanced Scorecard: Translating Strategy into Action', 'Robert S. Kaplan, David P. Norton', 1996, 'framework', 'https://www.hbs.edu/faculty/Pages/item.aspx?num=127', 'Framework for strategic planning and performance measurement', FALSE),
('Thinking, Fast and Slow', 'Daniel Kahneman', 2011, 'book', 'https://www.penguinrandomhouse.com/books/294/thinking-fast-and-slow-by-daniel-kahneman/', 'Understanding cognitive biases in strategic decision making', FALSE),
('The Strategy Process: Concepts, Contexts, Cases', 'Henry Mintzberg, James Brian Quinn, John Voyer', 1995, 'book', 'https://www.pearson.com/en-us/subject-catalog/p/the-strategy-process-concepts-contexts-cases/P200000000457/9780132340304', 'Comprehensive guide to strategic thinking and planning', FALSE),
('Strategic Management: Concepts and Cases: Competitiveness and Globalization', 'Michael A. Hitt, R. Duane Ireland, Robert E. Hoskisson', 2020, 'book', 'https://www.cengage.com/c/strategic-management-concepts-cases-13e-hitt/9780357716301/', 'Modern approach to strategic management and thinking', FALSE); 