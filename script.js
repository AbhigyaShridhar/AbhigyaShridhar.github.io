// Background Image Rotation
const backgroundSlider = document.querySelector('.background-slider');
const images = backgroundSlider.querySelectorAll('img');
let currentImageIndex = 0;

// Timeline data
const experienceData = [
    {
        date: 'Oct 2023 - Present',
        title: 'Software Engineer | Payments',
        company: 'Spinny',
        description: '',
        projects: [
            {
                name: 'Payment gateway',
                description: 'Implemented a consumer facing payment gateway by integrating reconciliation flows with UPI "deep-linking". Added functionalities like refunds, encryption, webhook configurations and post status actions, and status checks.',
                technologies: ['Python', 'Django', 'REST APIs'],
                achievements: ['Achieved a drop in payment drop out rates by 31%.', 'Increased online payments by 12%.', 'Handling over 1 billion INR in transactions per month.', 'Directly saved 1% on transaction fee.', 'Implemented payment receipt generation logic.']
            },
            {
                name: 'Account management',
                description: 'The pre and post sales processes involve managing a lot of information around customers\' bank accounts. I got a chance to work on multiple flows around account status management and payment "permissions" across different flows.',
                technologies: ['Python', 'Django', 'MySQL'],
                achievements: ['Implemented account status management, handling over 20k accounts per month processing over 3 billion INR across different user journeys.']
            },
            {
                name: 'Database routers',
                description: 'The payments infrastructure was decoupled from the central monolith to reduce central dependencies and multiple points of failures. This involved code changes across the entire monolith to ensure support for cross database queries.',
                technologies: ['Python', 'Django', 'MySQL', 'GraphQL'],
                achievements: ['Reduced over 10% traffic on the monolith while reducing data redundancy.', 'Eliminated a significant AWS DMS induced lag due to data replication.', 'Extensively modified and optimized central ORM and GraphQL architectures.']
            },
            {
                name: 'Reconciliation flow centralization',
                description: 'Built a no code client on-boarding functionality, which enables different business units within the company to plug in their credentials and utilize payment gateway services without the need for additional development or schema changes.',
                technologies: ['Python', 'Django', 'MySQL'],
                achievements: ['Consolidated multiple gateway flows into a single generic process.', 'Reduced cross-pod development and onboarding times for new gateway integrations by over 90%.']
            },
            {
                name: 'Celery cost optimization',
                description: 'Built a custom bulk consumer for cron jobs pushed on celery workers to optimize API calls and manage costs.',
                technologies: ['Python', 'Celery', 'AWS'],
                achievements: ['Implemented long polling to SQS queues.', 'Wrote a reusable package with a built in consumer command to replace standard celery worker command.', 'Reduced calls to SQS service by over 50%.']
            }
        ]
    },
    {
        date: 'May 2023 - Oct 2023',
        title: 'Software Engineer | Demand',
        company: 'Spinny',
        description: '',
        projects: [
            {
                name: 'Demand aggregator',
                description: 'Worked extensively on the aggregator service responsible for providing data to multiple CRMs from different demand/consumer data sources.',
                technologies: ['Python', 'Django', 'MySQL', 'GraphQL'],
                achievements: ['Separated multiple flows from the central monolith to an independent micro-service.', 'Optimized APIs, achieving 2x to 8x faster response times.']
            },
            {
                name: 'IVR service',
                description: 'Worked on the organization\'s "phone call" service responsible for managing automated calls and their callback data.',
                technologies: ['NodeJS', 'Python', 'PostgreSQL'],
                achievements: ['Supported "Progressive Dialer", a demand generation tool which reaches out to multiple customers.', 'Handled over 20k calls per day.']
            }
        ]
    },
    {
        date: 'Oct 2022 - Apr 2023',
        title: 'Technology intern',
        company: 'Spinny',
        description: 'My primary project throughout this role involved automation of critical security audits across the company. I worked full stack and developed a CRM for audits and access management, working closely with the top leadership.',
        projects: [
            {
                name: 'Employee product access management',
                description: 'Being a large organization, the company utilizes services from many third party service providers for multiple roles. This leaves multiple data security vulnerabilities with employees constantly engaging in operations involving sensitive information. By the time this project was completed, security audits for over 20 third party vendors were automated and the access management/removal steps became completely configurable through the CRM.',
                technologies: ['Python', 'Django', 'MySQL', 'Docker', 'Google cloud', 'Jenkins', 'Selenium', 'RabbitMQ'],
                achievements: ['Flagged over 10k security vulnerabilities, piled up over the years.', 'Configured new service accounts and eliminated the need for privileged access via Google APIs integration.', 'Containerised the application, and managed database security and backups.', 'Implemented CI/CD pipeline', 'Designed a robust alerting and notification system for security threats.']
            }
        ]
    },
    {
        date: 'Dec 2021 - June 2022',
        title: 'Software development intern',
        company: 'Examarly',
        description: 'Worked at an early stage ed tech start up. My role was primarily focused on back-end architecture, and I got to implement a fresh back-end service from the ground up. Throughout my time at the organization, I was entrusted with the development of critical flows like authentication, database management and eventually new business logics on top of these fundamental units as the company kept scaling up.',
        projects: [
            {
                name: 'Auth',
                description: 'Implemented an OTP based authentication system, which uses a JWT based tokenisation and access control mechanism.',
                technologies: ['Python', 'JWT', 'MySQL', 'FastAPI'],
                achievements: ['Upgraded the existing password based authentication with a more secure 2 factor authentication, also providing multiple levels of user category based authorization on the platform.']
            },
            {
                name: 'Quizzes and daily content',
                description: 'The primary focus area of the company was providing study and practice material for students preparing for competitive exams. This project involved working along with front end developers to create flash cards, research pages and quizzes for various domains.',
                technologies: ['Python', 'FastAPI', 'MySQL', 'Pandas'],
                achievements: ['Created teacher to student interaction logic for quick query resolution.', 'Implemented a quiz creation framework for teachers to easily update course practice material.', 'Created scraping scripts to create daily current affairs quizzes with the help of partnering news vendors.']
            },
            {
                name: 'Groups and network',
                description: 'The second phase of development became more user focused. With self-learning flows established, the focus now shifted towards providing features like study groups and connections. Essentially, creating a learning and exam preparation focused social network.',
                technologies: ['Python', 'FastAPI', 'MySQL'],
                achievements: ['Development involved making major changes to the part of database schema relating to authentication, since that was the only legacy flow. Implemented backwards compatibility logic for social interactions to work with existing auth and user relations.']
            },
            {
                name: 'Unit testing',
                description: 'Once the frequency of deployments and feature releases went up, unit testing and QA became more and more important.',
                technologies: ['Python', 'Pytest'],
                achievements: ['Designed a unit testing framework built by abstracting features of the Pytest library for easy test creation and ordering logic.', 'Achieved 100% coverage to ensure bug free deployments.']
            }
        ]
    }
];

const otherProjectsData = [
    {
        date: '2025',
        title: 'Go state machines',
        description: 'A collection of interfaces and structs which allow developers to break sequential operations in "states"',
        projects: [
            {
                name: 'Project details',
                description: 'Being a Python developer, the reusability and abstraction features of the language and it\'s frameworks is very appealing to me. Although, Go is more focused on simplicity rather than functionality, this is an attempt to provide some standardization of code for sequential operations in large flows.',
                technologies: ['Go'],
                achievements: ['Implemented context propagation.', 'Provided an extensible and developer friendly interface.'],
                projectLink: 'https://github.com/AbhigyaShridhar/go-state-machine'
            }
        ]
    }
];

const educationData = [
    {
        date: '2019 - 2023',
        title: 'Bachelor of Technology',
        company: 'Indian Institute of Information Technology, Una',
        description: 'Computer Science and Engineering',
        projects: [
            {
                name: 'Crops and soil analysis with geo tagging',
                description: 'Studied data sets for various geographical divisions in India based on soil patterns and consolidated the data as an interactive map build with Python.',
                technologies: ['Python', 'GeoDjango', 'Javascript', 'PostGIS'],
                achievements: ['Built and deployed an interactive map showcasing various geographical divisions of India.', 'Implemented raw SQL to PostGIS conversion and mapped "multipolygon" data with SQL operations using PostgreSQL'],
                projectLink: 'https://docs.google.com/document/d/1MkZemq0z3S7qHMctEKDjJgrF89ZmLOo9/edit?usp=share_link&ouid=108493659250206306688&rtpof=true&sd=true'
            },
            {
                name: 'Sentiment analysis on data deficit languages',
                description: 'Studied multiple research papers on different language model architectures and implemented profanity filters on code-mixed content.',
                technologies: ['Python', 'Machine Learning', 'Data Analysis'],
                achievements: ['Consolidated findings and observations from multiple research papers into an academic study', 'Explored NLP and its use cases in social media moderation.'],
                projectLink: 'https://docs.google.com/document/d/1Z7mWcXkrcrifc-ahHoLYMMaV0xd7WIHq/edit?usp=share_link&ouid=108493659250206306688&rtpof=true&sd=true'
            },
            {
                name: 'Keep an eye',
                description: 'Built a browser extension which blocks all textual profane content from a web page.',
                technologies: ['Python', 'JavaScript', 'Browser extension'],
                achievements: ['Won prize in a global hackathon.', 'Tested the project in real time.'],
                projectLink: 'https://devfolio.co/projects/keep-an-eye-da3a'
            },
            {
                name: 'Crops+',
                description: 'Implemented an algorithm to determine the soil texture and composition with particle size.',
                technologies: ['Python', 'SciKitLearn'],
                achievements: ['Won prize in a global hackathon.'],
                projectLink: 'https://devpost.com/software/crops'
            },
            {
                name: 'How was your day',
                description: 'Built a social networking website which helps put together people of similar temperaments at any given time.',
                technologies: ['Python', 'Django', 'React'],
                achievements: ['Live demoed the project online at "Hack Harvard".', 'Vetted functionalities from engineers at AssemblyAI.'],
                projectLink: 'https://devpost.com/software/abc-yj3sw0'
            },
            {
                name: 'Block city',
                description: 'Designed a gamified sports community app which incentivizes team building.',
                technologies: ['Python', 'Figma'],
                achievements: ['Won prizes at a global hackathon.', 'Built a collaborative design along with back-end.'],
                projectLink: 'https://devpost.com/software/block-city'
            }
        ]
    }
];

// Function to create timeline items
function createTimeline() {
    const experienceContainer = document.querySelector('.timeline-section:nth-child(1)');
    const otherProjectsContainer = document.querySelector('.timeline-section:nth-child(2)');
    const educationContainer = document.querySelector('.timeline-section:nth-child(3)');
    
    if (!experienceContainer || !otherProjectsContainer || !educationContainer) return;
    
    // Create experience timeline
    experienceData.forEach(item => {
        const timelineItem = createTimelineItem(item, 'experience');
        experienceContainer.appendChild(timelineItem);
    });
    
    // Create other projects timeline
    otherProjectsData.forEach(item => {
        const timelineItem = createTimelineItem(item, 'projects');
        otherProjectsContainer.appendChild(timelineItem);
    });
    
    // Create education timeline
    educationData.forEach(item => {
        const timelineItem = createTimelineItem(item, 'education');
        educationContainer.appendChild(timelineItem);
    });
}

// Function to create a single timeline item
function createTimelineItem(item, sectionType) {
    const timelineItem = document.createElement('div');
    timelineItem.className = 'timeline-item';
    
    const projectsHTML = item.projects.map(project => `
        <div class="project">
            <div class="project-header">
                <h4>${project.name}</h4>
                <span class="project-toggle">
                    <i class="fas fa-chevron-down"></i>
                </span>
            </div>
            <p>${project.description}</p>
            <div class="project-details">
                <div class="technologies">
                    <strong>Technologies:</strong>
                    ${project.technologies.map(tech => `<span>${tech}</span>`).join('')}
                </div>
                <div class="achievements">
                    <strong>Key Achievements:</strong>
                    <ul>
                        ${project.achievements.map(achievement => `
                            <li>${achievement}</li>
                        `).join('')}
                    </ul>
                </div>
                ${(sectionType === 'education' || sectionType === 'projects') && project.projectLink ? `
                    <a href="${project.projectLink}" target="_blank" class="project-link">
                        <i class="fab fa-github"></i> View Project
                    </a>
                ` : ''}
            </div>
        </div>
    `).join('');
    
    timelineItem.innerHTML = `
        <div class="timeline-date">${item.date}</div>
        <div class="experience-header">
            <h3>${item.title}</h3>
            ${item.company ? `<h4>${item.company}</h4>` : ''}
            <p>${item.description}</p>
        </div>
        <div class="projects">
            ${projectsHTML}
        </div>
    `;
    
    return timelineItem;
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Background Image Rotation
    const backgroundSlider = document.querySelector('.background-slider');
    const images = Array.from(backgroundSlider.querySelectorAll('img'));
    let currentImageIndex = 0;

    function rotateImages() {
        images[currentImageIndex].classList.remove('active');
        currentImageIndex = (currentImageIndex + 1) % images.length;
        images[currentImageIndex].classList.add('active');
    }

    // Start image rotation
    setInterval(rotateImages, 3000);
    rotateImages();

    // Create timeline
    createTimeline();

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll <= 0) {
            navbar.classList.remove('scroll-up');
            return;
        }
        
        if (currentScroll > lastScroll && !navbar.classList.contains('scroll-down')) {
            navbar.classList.remove('scroll-up');
            navbar.classList.add('scroll-down');
        } else if (currentScroll < lastScroll && navbar.classList.contains('scroll-down')) {
            navbar.classList.remove('scroll-down');
            navbar.classList.add('scroll-up');
        }
        lastScroll = currentScroll;
    });
}); 